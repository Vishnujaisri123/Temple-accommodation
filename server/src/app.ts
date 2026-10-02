import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import bookingRoutes from './routes/bookingRoutes';
import adminRoutes from './routes/adminRoutes';
import accommodationRoutes from './routes/accommodationRoutes';
import { Accommodation } from './models/Accommodation';
import { Bed } from './models/Bed';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Seed Database if empty
const seedDB = async () => {
  const count = await Accommodation.countDocuments();
  if (count === 0) {
    console.log('Seeding initial accommodations...');
    const room1 = await Accommodation.create({ name: 'Room 1', type: 'PRIVATE_ROOM', description: 'Large private room', capacity: { adults: 2, children: 2 }, pricePerDay: 1000, bathroomType: 'Attached', active: true });
    const room2 = await Accommodation.create({ name: 'Room 2', type: 'PRIVATE_ROOM', description: 'Large private room', capacity: { adults: 2, children: 2 }, pricePerDay: 1000, bathroomType: 'Attached', active: true });
    const hall = await Accommodation.create({ name: 'Hall', type: 'HALL', description: 'Shared hall', capacity: { adults: 5, children: 0 }, pricePerDay: 300, bathroomType: 'Shared', active: true });
    
    // Seed beds for the hall
    for(let i=1; i<=5; i++) {
      await Bed.create({ accommodationId: hall._id, bedNumber: i, pricePerDay: 300, active: true });
    }
    console.log('Seeding complete.');
  }
};

// Connect to MongoDB and seed
connectDB().then(() => seedDB());

// Routes
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
