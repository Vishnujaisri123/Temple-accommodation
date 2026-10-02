import { Router } from 'express';
import { createBooking } from '../controllers/bookingController';
import { AvailabilityService } from '../services/availabilityService';
import { Booking } from '../models/Booking';

const router = Router();

// Get Availability
router.get('/availability', async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'checkIn and checkOut dates are required' });
    }
    const availability = await AvailabilityService.checkAvailability(checkIn as string, checkOut as string);
    res.json({ success: true, data: availability });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Booking
router.post('/', createBooking);

// Get Booking Status
router.get('/status/:bookingId', async (req, res) => {
  try {
    const searchParam = req.params.bookingId;
    const query = searchParam.startsWith('VAD-') 
      ? { bookingId: searchParam } 
      : { phone: searchParam };
      
    // Sort by createdAt -1 to get the most recent if multiple exist for a phone number
    const booking = await Booking.findOne(query).sort({ createdAt: -1 }).select('-adminNotes');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit Payment UTR
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentReference } = req.body;
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.paymentReference = paymentReference;
    booking.paymentStatus = 'SUBMITTED';
    booking.bookingStatus = 'PAYMENT_SUBMITTED';
    booking.paymentSubmittedAt = new Date();
    await booking.save();

    res.json({ success: true, message: 'Payment submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
