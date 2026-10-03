import { Router } from 'express';
import { Booking } from '../models/Booking';
import { Accommodation } from '../models/Accommodation';
import { Bed } from '../models/Bed';

const router = Router();

// Auth is mocked for now as per simple requirements, in production use JWT.
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'mock-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIns = await Booking.countDocuments({ checkIn: { $gte: today, $lt: tomorrow } });
    const checkOuts = await Booking.countDocuments({ checkOut: { $gte: today, $lt: tomorrow } });
    const pendingConfirmations = await Booking.countDocuments({ bookingStatus: 'PAYMENT_SUBMITTED' });
    const pendingPayments = await Booking.countDocuments({ bookingStatus: 'PENDING_PAYMENT' });

    res.json({
      success: true,
      data: {
        checkIns,
        checkOuts,
        pendingConfirmations,
        pendingPayments
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Confirm Booking
router.patch('/bookings/:id/confirm', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.bookingStatus = 'CONFIRMED';
    booking.confirmedAt = new Date();
    await booking.save();

    res.json({ success: true, message: 'Booking confirmed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Delete Booking
router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
