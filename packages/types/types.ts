// Common TypeScript types for the platform
export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export type AccommodationType = 'PRIVATE_ROOM' | 'HALL';

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  description: string;
  capacity: { adults: number; children: number };
  pricePerDay: number;
  bathroomType: string;
  amenities: string[];
  images: string[];
  active: boolean;
}

export interface Bed {
  id: string;
  accommodationId: string;
  bedNumber: number;
  pricePerDay: number;
  active: boolean;
}

export type BookingStatus = 'PENDING_PAYMENT' | 'PAYMENT_SUBMITTED' | 'PAYMENT_VERIFIED' | 'CONFIRMATION_PENDING' | 'CONFIRMED' | 'COMPLETED' | 'PAYMENT_REJECTED' | 'BOOKING_REJECTED';

export interface Booking {
  id: string;
  bookingId: string;
  customerName: string;
  phone: string;
  address: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  childrenAges: number[];
  accommodationType: AccommodationType;
  accommodationId: string;
  bedIds: string[];
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentReference?: string;
  bookingStatus: BookingStatus;
  policyAccepted: boolean;
  policyAcceptedAt?: Date;
  createdAt: Date;
}
