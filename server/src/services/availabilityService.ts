import { Accommodation } from '../models/Accommodation';
import { Bed } from '../models/Bed';
import { Booking } from '../models/Booking';
import { isPastDateTimeKolkata, formatKolkataDate, formatKolkataTime } from '../utils/dateTime';

export interface AvailabilitySummary {
  selectedCheckIn: string;
  selectedCheckOut: string;
  formattedCheckIn: string;
  formattedCheckOut: string;
  durationHours: number;
  privateRooms: {
    total: number;
    booked: number;
    available: number;
    availableIds: string[];
    isFull: boolean;
  };
  hall: {
    total: number;
    booked: number;
    available: number;
    availableBedIds: string[];
    isFull: boolean;
  };
  hasAvailability: boolean;
  allUnavailable: boolean;
}

export class AvailabilityService {
  /**
   * Check availability for all accommodations between checkIn and checkOut dates.
   * Considers confirmed bookings, pending verification, and non-expired pending payments (<15 mins).
   * Expired or rejected bookings do not block inventory.
   */
  static async checkAvailability(checkInStr: string, checkOutStr: string) {
    if (!checkInStr || !checkOutStr) {
      throw new Error('Both checkIn and checkOut are required.');
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new Error('Invalid checkIn or checkOut date format.');
    }

    // Backend validation: checkIn cannot be in the past in Asia/Kolkata (5-minute grace buffer)
    if (isPastDateTimeKolkata(checkIn, 5)) {
      throw new Error('Check-in date and time cannot be in the past.');
    }

    if (checkOut.getTime() <= checkIn.getTime()) {
      throw new Error('Checkout date and time must be after check-in date and time.');
    }

    // Auto-clean expired pending bookings older than 15 minutes so they don't linger
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await Booking.updateMany(
      {
        bookingStatus: 'PENDING_PAYMENT',
        createdAt: { $lt: fifteenMinutesAgo }
      },
      {
        $set: {
          bookingStatus: 'REJECTED',
          paymentStatus: 'REJECTED',
          adminNotes: 'Expired: payment not submitted within 15-minute reservation window.'
        }
      }
    ).catch(() => {});

    // Get all active accommodations and beds
    const accommodations = await Accommodation.find({ active: true });
    const beds = await Bed.find({ active: true });

    // Find all bookings that overlap with requested duration [checkIn, checkOut]
    // Overlap formula: booking.checkIn < checkOut && booking.checkOut > checkIn
    // Inventory blocking statuses:
    // 1. PAYMENT_SUBMITTED, CONFIRMATION_PENDING, CONFIRMED
    // 2. PENDING_PAYMENT created within the last 15 minutes
    const overlappingBookings = await Booking.find({
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
      $or: [
        { bookingStatus: { $in: ['PAYMENT_SUBMITTED', 'CONFIRMATION_PENDING', 'CONFIRMED'] } },
        { bookingStatus: 'PENDING_PAYMENT', createdAt: { $gte: fifteenMinutesAgo } }
      ]
    });

    // Booked Private Rooms
    const bookedAccommodationIds = new Set(
      overlappingBookings
        .filter(b => b.accommodationType === 'PRIVATE_ROOM')
        .map(b => b.accommodationId.toString())
    );

    // Booked Hall Beds
    const bookedBedIds = new Set(
      overlappingBookings
        .filter(b => b.accommodationType === 'HALL')
        .flatMap(b => (b.bedIds || []).map(id => id.toString()))
    );

    // Filter private rooms
    const privateRoomsList = accommodations.filter(acc => acc.type === 'PRIVATE_ROOM');
    const totalPrivateRooms = privateRoomsList.length || 2;
    const bookedPrivateRoomsCount = privateRoomsList.filter(acc => bookedAccommodationIds.has(acc._id.toString())).length;
    const availablePrivateRoomsCount = Math.max(0, totalPrivateRooms - bookedPrivateRoomsCount);
    const availablePrivateRoomIds = privateRoomsList
      .filter(acc => !bookedAccommodationIds.has(acc._id.toString()))
      .map(acc => acc._id.toString());

    // Filter hall beds
    const totalHallBeds = beds.length || 5;
    const bookedHallBedsCount = beds.filter(b => bookedBedIds.has(b._id.toString())).length;
    const availableHallBedsCount = Math.max(0, totalHallBeds - bookedHallBedsCount);
    const availableBedIds = beds
      .filter(b => !bookedBedIds.has(b._id.toString()))
      .map(b => b._id.toString());

    const durationHours = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));

    const summary: AvailabilitySummary = {
      selectedCheckIn: checkInStr,
      selectedCheckOut: checkOutStr,
      formattedCheckIn: `${formatKolkataDate(checkIn)}, ${formatKolkataTime(checkIn)}`,
      formattedCheckOut: `${formatKolkataDate(checkOut)}, ${formatKolkataTime(checkOut)}`,
      durationHours,
      privateRooms: {
        total: totalPrivateRooms,
        booked: bookedPrivateRoomsCount,
        available: availablePrivateRoomsCount,
        availableIds: availablePrivateRoomIds,
        isFull: availablePrivateRoomsCount === 0
      },
      hall: {
        total: totalHallBeds,
        booked: bookedHallBedsCount,
        available: availableHallBedsCount,
        availableBedIds,
        isFull: availableHallBedsCount === 0
      },
      hasAvailability: availablePrivateRoomsCount > 0 || availableHallBedsCount > 0,
      allUnavailable: availablePrivateRoomsCount === 0 && availableHallBedsCount === 0
    };

    const accommodationsData = accommodations.map(acc => {
      if (acc.type === 'PRIVATE_ROOM') {
        const isBooked = bookedAccommodationIds.has(acc._id.toString());
        return {
          ...acc.toObject(),
          available: !isBooked
        };
      } else {
        const hallBeds = beds.filter(b => b.accommodationId.toString() === acc._id.toString());
        const availableBeds = hallBeds.filter(b => !bookedBedIds.has(b._id.toString()));
        return {
          ...acc.toObject(),
          totalBeds: hallBeds.length,
          availableBeds: availableBeds.length,
          availableBedIds: availableBeds.map(b => b._id.toString()),
          beds: hallBeds.map(b => ({
            _id: b._id.toString(),
            bedNumber: b.bedNumber,
            pricePerDay: b.pricePerDay,
            available: !bookedBedIds.has(b._id.toString())
          }))
        };
      }
    });

    return {
      accommodations: accommodationsData,
      summary
    };
  }
}
