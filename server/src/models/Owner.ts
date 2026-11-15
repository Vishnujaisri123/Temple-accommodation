import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IOwner extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'OWNER';
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  loginHistory: Array<{
    ip: string;
    timestamp: Date;
    userAgent?: string;
  }>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementFailedAttempts(): Promise<void>;
  resetLock(): Promise<void>;
}

const ownerSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['OWNER'], default: 'OWNER' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  loginHistory: [{
    ip: { type: String },
    timestamp: { type: Date, default: Date.now },
    userAgent: { type: String }
  }]
}, { timestamps: true });

// Check if account is currently locked
ownerSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Compare candidate password against stored hash
ownerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Increment failed attempts and apply lockout if threshold reached (5 attempts -> 15 min lock)
ownerSchema.methods.incrementFailedAttempts = async function(): Promise<void> {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
  }
  await this.save();
};

// Reset failed attempts upon successful login
ownerSchema.methods.resetLock = async function(): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save();
};

export const Owner = mongoose.model<IOwner>('Owner', ownerSchema);
