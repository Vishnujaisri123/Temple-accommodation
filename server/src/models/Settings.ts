import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  propertyName: string;
  phone: string;
  whatsapp: string;
  address: string;
  locationLat: number;
  locationLng: number;
  mapUrl: string;
  gstEnabled: boolean;
  gstPercent: number;
  upiId: string;
  upiName: string;
}

const settingsSchema = new Schema({
  propertyName: { type: String, default: 'Vadapalli Temple Accommodation' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  address: { type: String, default: '' },
  locationLat: { type: Number, default: 0 },
  locationLng: { type: Number, default: 0 },
  mapUrl: { type: String, default: '' },
  gstEnabled: { type: Boolean, default: false },
  gstPercent: { type: Number, default: 0 },
  upiId: { type: String, default: '' },
  upiName: { type: String, default: '' }
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
