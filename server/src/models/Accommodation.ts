import mongoose, { Schema, Document } from 'mongoose';

export interface IAccommodation extends Document {
  name: string;
  type: 'PRIVATE_ROOM' | 'HALL';
  description: string;
  capacity: {
    adults: number;
    children: number;
  };
  pricePerDay: number;
  bathroomType: string;
  amenities: string[];
  images: string[];
  active: boolean;
}

const accommodationSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['PRIVATE_ROOM', 'HALL'], required: true },
  description: { type: String, required: true },
  capacity: {
    adults: { type: Number, required: true },
    children: { type: Number, required: true }
  },
  pricePerDay: { type: Number, required: true },
  bathroomType: { type: String, required: true },
  amenities: [{ type: String }],
  images: [{ type: String }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Accommodation = mongoose.model<IAccommodation>('Accommodation', accommodationSchema);
