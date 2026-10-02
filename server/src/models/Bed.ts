import mongoose, { Schema, Document } from 'mongoose';

export interface IBed extends Document {
  accommodationId: mongoose.Types.ObjectId;
  bedNumber: number;
  pricePerDay: number;
  active: boolean;
}

const bedSchema = new Schema({
  accommodationId: { type: Schema.Types.ObjectId, ref: 'Accommodation', required: true },
  bedNumber: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Bed = mongoose.model<IBed>('Bed', bedSchema);
