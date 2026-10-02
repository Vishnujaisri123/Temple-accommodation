import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  customerName: string;
  phone: string;
  address: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  childrenAges: number[];
  accommodationType: 'PRIVATE_ROOM' | 'HALL';
  accommodationId: mongoose.Types.ObjectId;
  bedIds: mongoose.Types.ObjectId[];
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  paymentReference?: string;
  bookingStatus: 'PENDING_PAYMENT' | 'PAYMENT_SUBMITTED' | 'CONFIRMATION_PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED';
  policyAccepted: boolean;
  policyAcceptedAt?: Date;
  paymentSubmittedAt?: Date;
  paymentVerifiedAt?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  adminNotes?: string;
}

const bookingSchema = new Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  adults: { type: Number, required: true },
  children: { type: Number, required: true },
  childrenAges: [{ type: Number }],
  accommodationType: { type: String, enum: ['PRIVATE_ROOM', 'HALL'], required: true },
  accommodationId: { type: Schema.Types.ObjectId, ref: 'Accommodation', required: true },
  bedIds: [{ type: Schema.Types.ObjectId, ref: 'Bed' }],
  baseAmount: { type: Number, required: true },
  gstRate: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  paymentReference: { type: String },
  bookingStatus: { type: String, enum: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'CONFIRMATION_PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED'], default: 'PENDING_PAYMENT' },
  policyAccepted: { type: Boolean, required: true },
  policyAcceptedAt: { type: Date },
  paymentSubmittedAt: { type: Date },
  paymentVerifiedAt: { type: Date },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  adminNotes: { type: String }
}, { timestamps: true });

// Prevent double bookings: a specific accommodation or bed cannot be 'CONFIRMED' for overlapping dates
// We handle this via application logic using transactions and atomic updates, but indexing checkIn and checkOut helps performance.
bookingSchema.index({ accommodationId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ bedIds: 1, checkIn: 1, checkOut: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
