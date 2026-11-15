import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Booking } from '../models/Booking';
import { Accommodation } from '../models/Accommodation';
import { Bed } from '../models/Bed';
import { Settings } from '../models/Settings';
import { Owner } from '../models/Owner';
import { requireOwnerAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vadapalli-temple-secure-secret-key-2026';

// ----------------------------------------------------
// 1. OWNER AUTHENTICATION
// ----------------------------------------------------

// POST /api/admin/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.'
      });
    }

    const query = username.toLowerCase().trim();
    const owner = await Owner.findOne({
      $or: [{ username: query }, { email: query }]
    });

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Access denied.'
      });
    }

    // Check account lockout
    if (owner.isLocked()) {
      const remainingMinutes = Math.ceil((owner.lockUntil!.getTime() - Date.now()) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed logins. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      await owner.incrementFailedAttempts();
      const remainingAttempts = Math.max(0, 5 - owner.failedLoginAttempts);
      return res.status(401).json({
        success: false,
        message: remainingAttempts > 0 
          ? `Invalid credentials. ${remainingAttempts} attempt(s) remaining before temporary lockout.`
          : 'Account locked for 15 minutes due to too many failed attempts.'
      });
    }

    // Login successful: reset lockout and record audit log
    await owner.resetLock();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    owner.loginHistory.push({
      ip: clientIp,
      timestamp: new Date(),
      userAgent: req.headers['user-agent']
    });
    // Keep last 30 login events
    if (owner.loginHistory.length > 30) {
      owner.loginHistory.shift();
    }
    await owner.save();

    // Issue JWT token (valid for 12 hours)
    const token = jwt.sign(
      { id: owner._id, username: owner.username, role: owner.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Set secure HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    res.json({
      success: true,
      message: 'Owner authenticated successfully.',
      token,
      owner: {
        id: owner._id,
        username: owner.username,
        email: owner.email,
        role: owner.role,
        lastLogin: owner.lastLogin
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/me
router.get('/me', requireOwnerAuth, (req: AuthenticatedRequest, res: Response) => {
  const owner = req.owner!;
  res.json({
    success: true,
    owner: {
      id: owner._id,
      username: owner.username,
      email: owner.email,
      role: owner.role,
      lastLogin: owner.lastLogin
    }
  });
});

// POST /api/admin/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/admin/change-password
router.post('/change-password', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const owner = req.owner!;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const isMatch = await owner.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    owner.passwordHash = await bcrypt.hash(newPassword, 12);
    await owner.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 2. DASHBOARD METRICS & OVERVIEW
// ----------------------------------------------------

// GET /api/admin/dashboard
router.get('/dashboard', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalBookings,
      checkInsToday,
      checkOutsToday,
      pendingPayments,
      paymentVerifiedAwaitingConfirm,
      confirmedBookings,
      accommodations,
      beds
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ checkIn: { $gte: startOfToday, $lte: endOfToday } }),
      Booking.countDocuments({ checkOut: { $gte: startOfToday, $lte: endOfToday } }),
      Booking.countDocuments({ bookingStatus: 'PENDING_PAYMENT' }),
      Booking.countDocuments({ bookingStatus: { $in: ['PAYMENT_SUBMITTED', 'CONFIRMATION_PENDING'] } }),
      Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
      Accommodation.find(),
      Bed.find()
    ]);

    // Check active availability for Room 1, Room 2, and Hall
    const activeConfirmedCurrent = await Booking.find({
      bookingStatus: 'CONFIRMED',
      checkIn: { $lte: now },
      checkOut: { $gte: now }
    });

    const occupiedAccomIds = new Set(activeConfirmedCurrent.map(b => b.accommodationId.toString()));
    const occupiedBedIds = new Set(activeConfirmedCurrent.flatMap(b => (b.bedIds || []).map(id => id.toString())));

    const room1 = accommodations.find(a => a.name.toLowerCase().includes('room 1'));
    const room2 = accommodations.find(a => a.name.toLowerCase().includes('room 2'));

    const room1Available = room1 ? !occupiedAccomIds.has(room1._id.toString()) && room1.active : false;
    const room2Available = room2 ? !occupiedAccomIds.has(room2._id.toString()) && room2.active : false;
    const hallBedsAvailable = beds.filter(b => b.active && !occupiedBedIds.has(b._id.toString())).length;

    res.json({
      success: true,
      data: {
        totalBookings,
        checkIns: checkInsToday,
        checkOuts: checkOutsToday,
        pendingPayments,
        pendingConfirmations: paymentVerifiedAwaitingConfirm,
        confirmedBookings,
        room1Available,
        room2Available,
        hallBedsAvailable,
        totalHallBeds: beds.length || 5
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 3. BOOKINGS MANAGEMENT
// ----------------------------------------------------

// GET /api/admin/bookings
router.get('/bookings', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') {
      query.bookingStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { customerName: searchRegex },
        { phone: searchRegex },
        { bookingId: searchRegex },
        { paymentReference: searchRegex }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('accommodationId', 'name type pricePerDay')
      .populate('bedIds', 'bedNumber pricePerDay')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/bookings/:id/confirm
router.patch('/bookings/:id/confirm', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Atomic double-booking prevention check
    const overlappingConfirmed = await Booking.findOne({
      _id: { $ne: booking._id },
      bookingStatus: 'CONFIRMED',
      accommodationId: booking.accommodationId,
      $or: [
        { checkIn: { $lt: booking.checkOut, $gte: booking.checkIn } },
        { checkOut: { $gt: booking.checkIn, $lte: booking.checkOut } },
        { checkIn: { $lte: booking.checkIn }, checkOut: { $gte: booking.checkOut } }
      ]
    });

    if (overlappingConfirmed && booking.accommodationType === 'PRIVATE_ROOM') {
      return res.status(409).json({
        success: false,
        message: `Conflict detected: This room is already confirmed for another booking (${overlappingConfirmed.bookingId}) during this stay interval.`
      });
    }

    booking.bookingStatus = 'CONFIRMED';
    booking.paymentStatus = 'VERIFIED';
    booking.confirmedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Booking successfully confirmed! Room/bed is now locked for this customer.',
      data: booking
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/bookings/:id/verify-payment
router.patch('/bookings/:id/verify-payment', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { utrReference } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.paymentStatus = 'VERIFIED';
    booking.bookingStatus = 'CONFIRMATION_PENDING';
    booking.paymentVerifiedAt = new Date();
    if (utrReference) {
      booking.paymentReference = utrReference;
    }
    await booking.save();

    res.json({
      success: true,
      message: 'Payment verified successfully. Booking is now awaiting customer call and confirmation.',
      data: booking
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/bookings/:id/reject
router.patch('/bookings/:id/reject', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.bookingStatus = 'REJECTED';
    booking.paymentStatus = 'REJECTED';
    booking.adminNotes = reason || 'Rejected by owner';
    await booking.save();

    res.json({ success: true, message: 'Booking marked as rejected.', data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/bookings/:id
router.delete('/bookings/:id', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json({ success: true, message: 'Booking permanently deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 4. ROOM & BED INVENTORY MANAGEMENT
// ----------------------------------------------------

// GET /api/admin/inventory
router.get('/inventory', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [accommodations, beds] = await Promise.all([
      Accommodation.find(),
      Bed.find().populate('accommodationId', 'name')
    ]);

    res.json({
      success: true,
      data: {
        accommodations,
        beds
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/inventory/toggle
router.patch('/inventory/toggle', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, id } = req.body; // type: 'accommodation' | 'bed'

    if (type === 'accommodation') {
      const item = await Accommodation.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Room not found.' });
      item.active = !item.active;
      await item.save();
      return res.json({ success: true, message: `${item.name} availability toggled to ${item.active ? 'Active' : 'Disabled'}.`, data: item });
    } else if (type === 'bed') {
      const item = await Bed.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Bed not found.' });
      item.active = !item.active;
      await item.save();
      return res.json({ success: true, message: `Bed ${item.bedNumber} availability toggled to ${item.active ? 'Active' : 'Disabled'}.`, data: item });
    }

    res.status(400).json({ success: false, message: 'Invalid item type.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 5. PROPERTY SETTINGS
// ----------------------------------------------------

// GET /api/admin/settings
router.get('/settings', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/settings
router.put('/settings', requireOwnerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    // Also update room prices if provided in request
    if (req.body.room1Price) {
      await Accommodation.updateOne({ name: /Room 1/i }, { pricePerDay: Number(req.body.room1Price) });
    }
    if (req.body.room2Price) {
      await Accommodation.updateOne({ name: /Room 2/i }, { pricePerDay: Number(req.body.room2Price) });
    }
    if (req.body.hallBedPrice) {
      await Accommodation.updateOne({ type: 'HALL' }, { pricePerDay: Number(req.body.hallBedPrice) });
      await Bed.updateMany({}, { pricePerDay: Number(req.body.hallBedPrice) });
    }

    res.json({ success: true, message: 'Property settings updated successfully.', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
