import { Accommodation, IAccommodation } from '../models/Accommodation';
import { Bed, IBed } from '../models/Bed';
import { Booking } from '../models/Booking';

export class AvailabilityService {
  /**
   * Check availability for all accommodations between checkIn and checkOut dates.
   */
  static async checkAvailability(checkInStr: string, checkOutStr: string) {
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    // Get all active accommodations
    const accommodations = await Accommodation.find({ active: true });
    const beds = await Bed.find({ active: true });

    // Find all bookings that overlap with this date range
    // Overlap condition: booking.checkIn < requestedCheckOut && booking.checkOut > requestedCheckIn
    // AND booking status is either CONFIRMED or PAYMENT_SUBMITTED (locked)
    const overlappingBookings = await Booking.find({
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
      bookingStatus: { $in: ['PAYMENT_SUBMITTED', 'CONFIRMATION_PENDING', 'CONFIRMED'] }
    });

    const bookedAccommodationIds = overlappingBookings
      .filter(b => b.accommodationType === 'PRIVATE_ROOM')
      .map(b => b.accommodationId.toString());

    const bookedBedIds = overlappingBookings
      .filter(b => b.accommodationType === 'HALL')
      .flatMap(b => b.bedIds.map(id => id.toString()));

    const result = accommodations.map(acc => {
      if (acc.type === 'PRIVATE_ROOM') {
        const isBooked = bookedAccommodationIds.includes(acc._id.toString());
        return {
          ...acc.toObject(),
          available: !isBooked
        };
      } else {
        // It's a hall
        const hallBeds = beds.filter(b => b.accommodationId.toString() === acc._id.toString());
        const availableBeds = hallBeds.filter(b => !bookedBedIds.includes(b._id.toString()));
        return {
          ...acc.toObject(),
          totalBeds: hallBeds.length,
          availableBeds: availableBeds.length,
          availableBedIds: availableBeds.map(b => b._id.toString())
        };
      }
    });

    return result;
  }
}
