import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Accommodation } from '../models/Accommodation';
import { Bed } from '../models/Bed';
import { Settings } from '../models/Settings';
import { BookingRequestSchema } from '@vadapalli/validation';
import { isPastDateTimeKolkata } from '../utils/dateTime';

const generateBookingId = async () => {
  const count = await Booking.countDocuments();
  const year = new Date().getFullYear();
  return `VAD-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const createBooking = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Validate Input using Zod Schema
    const validatedData = BookingRequestSchema.parse(req.body);

    const checkInDate = new Date(validatedData.checkIn);
    const checkOutDate = new Date(validatedData.checkOut);

    // Strict Backend Validation: Check-in cannot be in the past in Asia/Kolkata (5-minute buffer)
    if (isPastDateTimeKolkata(checkInDate, 5)) {
      throw new Error("Check-in date and time cannot be in the past. Please select a valid future date and time.");
    }

    if (checkOutDate.getTime() <= checkInDate.getTime()) {
      throw new Error("Checkout date/time must be strictly after checkin date/time.");
    }

    // Calculate number of 12-hour slots
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const numberOfSlots = Math.ceil(diffTime / (1000 * 60 * 60 * 12));

    if (numberOfSlots < 1) {
      throw new Error("Checkout date/time must be at least one 12-hour slot after checkin date/time.");
    }

    // 2. Clean up expired pending bookings (>15 minutes old)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await Booking.updateMany(
      {
        bookingStatus: 'PENDING_PAYMENT',
        createdAt: { $lt: fifteenMinutesAgo }
      },
      {
        $set: {
          bookingStatus: 'REJECTED',
          paymentStatus: 'REJECTED',
          adminNotes: 'Expired: payment not completed within 15 minutes.'
        }
      }
    ).session(session);

    // 3. Double-Booking Prevention Check with Concurrency Lock
    // Any confirmed, submitted, or active pending reservation (<15 min) blocks inventory
    const overlappingBookings = await Booking.find({
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      $or: [
        { bookingStatus: { $in: ['PAYMENT_SUBMITTED', 'CONFIRMATION_PENDING', 'CONFIRMED'] } },
        { bookingStatus: 'PENDING_PAYMENT', createdAt: { $gte: fifteenMinutesAgo } }
      ],
      $and: [
        {
          $or: [
            { accommodationId: validatedData.accommodationId },
            { bedIds: { $in: validatedData.bedIds || [] } }
          ]
        }
      ]
    }).session(session);

    if (overlappingBookings.length > 0) {
      throw new Error("Sorry, the selected accommodation or beds are already booked for this date and time. Please choose another date or time.");
    }

    // 4. Verify Capacity & Inventory Rules
    const accommodation = await Accommodation.findById(validatedData.accommodationId).session(session);
    if (!accommodation) throw new Error("Selected accommodation was not found.");

    let baseAmount = 0;
    if (accommodation.type === 'PRIVATE_ROOM') {
      if (validatedData.adults > 2) throw new Error("Maximum 2 adults allowed in private room.");
      if (validatedData.children > 2) throw new Error("Maximum 2 children allowed in private room.");
      baseAmount = accommodation.pricePerDay * numberOfSlots;
    } else if (accommodation.type === 'HALL') {
      if (!validatedData.bedIds || validatedData.bedIds.length === 0) throw new Error("Must select at least one bed in the hall.");
      
      const beds = await Bed.find({ _id: { $in: validatedData.bedIds } }).session(session);
      if (beds.length !== validatedData.bedIds.length) throw new Error("Some selected beds are invalid or inactive.");

      const pricePerBed = beds[0].pricePerDay;
      baseAmount = pricePerBed * validatedData.bedIds.length * numberOfSlots;
    }

    // 5. GST Calculation from Settings (12% standard GST on temple accommodation)
    let settings = await Settings.findOne().session(session);
    if (!settings) {
       settings = new Settings({ gstEnabled: true, gstPercent: 12 });
    }
    
    // Ensure GST is applied (standard 12% if unconfigured or 0)
    const isGstEnabled = settings.gstEnabled !== false;
    const gstRate = (settings.gstPercent && settings.gstPercent > 0) ? settings.gstPercent : 12;
    
    let gstAmount = 0;
    if (isGstEnabled) {
      gstAmount = Math.round(((baseAmount * gstRate) / 100) * 100) / 100;
    }

    const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;

    // 6. Create Booking
    const bookingId = await generateBookingId();

    const booking = new Booking({
      ...validatedData,
      bookingId,
      baseAmount,
      gstRate: isGstEnabled ? gstRate : 0,
      gstAmount,
      totalAmount,
      bookingStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      policyAcceptedAt: new Date()
    });

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Booking initialized successfully",
      data: { 
        bookingId, 
        baseAmount,
        gstRate: isGstEnabled ? gstRate : 0,
        gstAmount,
        totalAmount 
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message || 'Error processing booking' });
  }
};
