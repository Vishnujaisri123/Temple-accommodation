import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Accommodation } from '../models/Accommodation';
import { Bed } from '../models/Bed';
import { Settings } from '../models/Settings';
import { BookingRequestSchema } from '@vadapalli/validation';

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

    // Business Rules:
    // Calculate number of days
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (numberOfDays < 1) {
      throw new Error("Checkout date must be after checkin date");
    }

    // 2. Double-Booking Prevention Check
    const overlappingBookings = await Booking.find({
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      bookingStatus: { $in: ['PAYMENT_SUBMITTED', 'CONFIRMATION_PENDING', 'CONFIRMED'] },
      $or: [
        { accommodationId: validatedData.accommodationId },
        { bedIds: { $in: validatedData.bedIds || [] } }
      ]
    }).session(session);

    if (overlappingBookings.length > 0) {
      throw new Error("Accommodation or beds are already booked for these dates.");
    }

    // 3. Verify Capacity & Pricing Rules
    const accommodation = await Accommodation.findById(validatedData.accommodationId).session(session);
    if (!accommodation) throw new Error("Accommodation not found");

    let baseAmount = 0;
    if (accommodation.type === 'PRIVATE_ROOM') {
      if (validatedData.adults > 2) throw new Error("Maximum 2 adults allowed in private room");
      if (validatedData.children > 2) throw new Error("Maximum 2 children allowed in private room");
      baseAmount = accommodation.pricePerDay * numberOfDays;
    } else if (accommodation.type === 'HALL') {
      if (!validatedData.bedIds || validatedData.bedIds.length === 0) throw new Error("Must select at least one bed");
      
      const beds = await Bed.find({ _id: { $in: validatedData.bedIds } }).session(session);
      if (beds.length !== validatedData.bedIds.length) throw new Error("Some selected beds are invalid");

      const pricePerBed = beds[0].pricePerDay;
      baseAmount = pricePerBed * validatedData.bedIds.length * numberOfDays;
    }

    // 4. GST Calculation
    let settings = await Settings.findOne().session(session);
    if (!settings) {
       settings = new Settings();
    }
    
    let gstAmount = 0;
    if (settings.gstEnabled) {
      gstAmount = (baseAmount * settings.gstPercent) / 100;
    }

    const totalAmount = baseAmount + gstAmount;

    // 5. Create Booking
    const bookingId = await generateBookingId();

    const booking = new Booking({
      ...validatedData,
      bookingId,
      baseAmount,
      gstRate: settings.gstEnabled ? settings.gstPercent : 0,
      gstAmount,
      totalAmount,
      policyAcceptedAt: new Date()
    });

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Booking initialized successfully",
      data: { bookingId, totalAmount }
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message || 'Error processing booking' });
  }
};
