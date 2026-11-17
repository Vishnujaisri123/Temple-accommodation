import { z } from 'zod';

export const BookingRequestSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  address: z.string().min(5, "Address is required"),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid check-in date" }),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid check-out date" }),
  adults: z.number().int().min(1, "At least one adult is required"),
  children: z.number().int().min(0),
  childrenAges: z.array(z.number().int().min(0).max(14)),
  accommodationType: z.enum(['PRIVATE_ROOM', 'HALL']),
  accommodationId: z.string(),
  bedIds: z.array(z.string()).optional(),
  policyAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the booking policy" })
  }),
}).refine((data) => {
  const checkInTime = new Date(data.checkIn).getTime();
  // 5-minute safety buffer for network delay/clock skew
  return checkInTime >= Date.now() - 5 * 60 * 1000;
}, {
  message: "Check-in date and time cannot be in the past",
  path: ["checkIn"]
}).refine((data) => {
  const checkInTime = new Date(data.checkIn).getTime();
  const checkOutTime = new Date(data.checkOut).getTime();
  return checkOutTime > checkInTime;
}, {
  message: "Check-out date and time must be after check-in date and time",
  path: ["checkOut"]
});
