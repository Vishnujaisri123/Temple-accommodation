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
});
