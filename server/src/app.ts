import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import bookingRoutes from './routes/bookingRoutes';
import adminRoutes from './routes/adminRoutes';
import accommodationRoutes from './routes/accommodationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { Accommodation } from './models/Accommodation';
import { Bed } from './models/Bed';
import { Owner } from './models/Owner';
import { Settings } from './models/Settings';

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Seed Database if empty
const seedDB = async () => {
  const count = await Accommodation.countDocuments();
  if (count === 0) {
    console.log('Seeding initial accommodations...');
    const room1 = await Accommodation.create({ name: 'Room 1', type: 'PRIVATE_ROOM', description: 'Large private room with attached bathroom. Maximum 2 adults and up to 2 children below 15.', capacity: { adults: 2, children: 2 }, pricePerDay: 1000, bathroomType: 'Attached', active: true });
    const room2 = await Accommodation.create({ name: 'Room 2', type: 'PRIVATE_ROOM', description: 'Large private room with attached bathroom. Maximum 2 adults and up to 2 children below 15.', capacity: { adults: 2, children: 2 }, pricePerDay: 1000, bathroomType: 'Attached', active: true });
    const hall = await Accommodation.create({ name: 'Hall', type: 'HALL', description: 'Clean shared hall with normal/shared bathroom. 5 independent single beds.', capacity: { adults: 5, children: 0 }, pricePerDay: 300, bathroomType: 'Shared', active: true });
    
    // Seed beds for the hall
    for(let i=1; i<=5; i++) {
      await Bed.create({ accommodationId: hall._id, bedNumber: i, pricePerDay: 300, active: true });
    }
    console.log('Accommodations seeding complete.');
  }

  // Seed default Owner account if not existing
  const ownerCount = await Owner.countDocuments();
  if (ownerCount === 0) {
    console.log('Seeding initial default Owner account...');
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Vadapalli@2026';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    await Owner.create({
      username: (process.env.ADMIN_USERNAME || 'owner').toLowerCase(),
      email: (process.env.ADMIN_EMAIL || 'owner@vadapallitemple.com').toLowerCase(),
      passwordHash,
      role: 'OWNER'
    });
    console.log(`Default owner created: username="${process.env.ADMIN_USERNAME || 'owner'}"`);
  }

  // Seed default Settings if not existing
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.create({
      propertyName: 'Vadapalli Sri Venkateswara Swamy Accommodation',
      phone: '+91 8555085539',
      whatsapp: '+91 8555085539',
      address: 'Near Sri Venkateswara Swamy Temple, Vadapalli, Dr. B.R. Ambedkar Konaseema District, Andhra Pradesh 533237',
      mapUrl: 'https://maps.google.com/?q=Vadapalli+Venkateswara+Swamy+Temple',
      gstEnabled: false,
      gstPercent: 0,
      upiId: 'vadapalli@upi',
      upiName: 'Vadapalli Temple Accommodation'
    });
    console.log('Default settings seeded.');
  }
};

// Connect to MongoDB and seed
connectDB().then(() => seedDB());

// Routes
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
