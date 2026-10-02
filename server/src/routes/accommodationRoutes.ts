import { Router } from 'express';
import { Accommodation } from '../models/Accommodation';

const router = Router();

// Get all active accommodations
router.get('/', async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ active: true });
    res.json({ success: true, data: accommodations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
