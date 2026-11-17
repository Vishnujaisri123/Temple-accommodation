import { Router } from 'express';
import crypto from 'crypto';
import { Booking } from '../models/Booking';

const router = Router();

// Configure PhonePe Environment (Use environment variables in production)
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_HOST_URL = process.env.PHONEPE_ENV === 'PROD' 
  ? 'https://api.phonepe.com/apis/hermes' 
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// The URL where your frontend is hosted so PhonePe knows where to redirect back to
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; 
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

router.post('/initiate', async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({ bookingId });
    
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Reject payment if booking was already cancelled or expired
    if (booking.bookingStatus === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'This booking has expired or was cancelled. Please make a new reservation.'
      });
    }

    // Recheck availability immediately before initiating payment to prevent race conditions
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const hasConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      checkIn: { $lt: booking.checkOut },
      checkOut: { $gt: booking.checkIn },
      bookingStatus: { $in: ['PAYMENT_SUBMITTED', 'CONFIRMATION_PENDING', 'CONFIRMED'] },
      $or: [
        { accommodationId: booking.accommodationId },
        { bedIds: { $in: booking.bedIds || [] } }
      ]
    });

    if (hasConflict) {
      booking.bookingStatus = 'REJECTED';
      booking.adminNotes = 'Double-booking prevented: another customer completed payment for these dates.';
      await booking.save();
      return res.status(400).json({
        success: false,
        message: 'Sorry, this accommodation was just booked by another devotee. Please select another slot.'
      });
    }

    // PhonePe expects amount in paise (multiply by 100)
    const amountInPaise = Math.round(booking.totalAmount * 100);

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: bookingId,
      merchantUserId: booking.phone,
      amount: amountInPaise,
      redirectUrl: `${FRONTEND_URL}/payment/status?id=${bookingId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${BACKEND_URL}/api/payments/callback`,
      mobileNumber: booking.phone,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Encode Payload to Base64
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Generate Checksum (SHA256(base64Payload + "/pg/v1/pay" + saltKey) + "###" + saltIndex)
    const stringToHash = base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + '###' + PHONEPE_SALT_INDEX;

    // Send Request to PhonePe API
    const response = await fetch(`${PHONEPE_HOST_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const data = await response.json();

    if (data.success) {
      // Save that we initiated payment
      booking.paymentStatus = 'PENDING';
      booking.bookingStatus = 'PENDING_PAYMENT';
      await booking.save();

      // Return the redirect URL to the frontend
      res.json({ success: true, url: data.data.instrumentResponse.redirectInfo.url });
    } else {
      res.status(400).json({ success: false, message: data.message });
    }

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PhonePe Server-to-Server Callback Webhook
router.post('/callback', async (req, res) => {
  try {
    const { response } = req.body;
    
    // The response is base64 encoded
    const decodedResponse = Buffer.from(response, 'base64').toString('utf-8');
    const responseData = JSON.parse(decodedResponse);

    const { merchantTransactionId, code, transactionId } = responseData;

    const booking = await Booking.findOne({ bookingId: merchantTransactionId });
    if (!booking) {
      return res.status(200).send(); // Always return 200 OK to webhooks
    }

    if (code === 'PAYMENT_SUCCESS') {
      // Re-verify no conflicting confirmed booking before confirming
      const hasConflict = await Booking.findOne({
        _id: { $ne: booking._id },
        checkIn: { $lt: booking.checkOut },
        checkOut: { $gt: booking.checkIn },
        bookingStatus: 'CONFIRMED',
        $or: [
          { accommodationId: booking.accommodationId },
          { bedIds: { $in: booking.bedIds || [] } }
        ]
      });

      if (hasConflict) {
        booking.paymentStatus = 'VERIFIED';
        booking.bookingStatus = 'CONFIRMATION_PENDING';
        booking.adminNotes = 'WARNING: Overlapping confirmed booking detected. Owner manual intervention required.';
      } else {
        booking.paymentStatus = 'VERIFIED';
        booking.bookingStatus = 'CONFIRMED';
        booking.paymentReference = transactionId;
        booking.paymentVerifiedAt = new Date();
        booking.confirmedAt = new Date();
      }
    } else {
      // Payment failure: mark REJECTED so reserved inventory is immediately released!
      booking.paymentStatus = 'REJECTED';
      booking.bookingStatus = 'REJECTED';
      booking.adminNotes = `Payment failed or rejected via webhook with code: ${code}`;
    }

    await booking.save();
    res.status(200).send();

  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send();
  }
});

export default router;
