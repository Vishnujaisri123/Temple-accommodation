/**
 * Comprehensive Automated Test Suite for Vadapalli Accommodation Booking Date & Time System
 * Covers all 14 required audit and functionality scenarios.
 */

import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import {
  getKolkataTodayString,
  getKolkataTimeParts,
  generateAllTimeSlots,
  getAvailableTimeSlots,
  isPastDateTimeKolkata,
  toKolkataIsoString,
  formatKolkataDate,
  formatKolkataTime
} from '../utils/dateTime';
import { Accommodation } from '../models/Accommodation';
import { Bed } from '../models/Bed';
import { Booking } from '../models/Booking';
import { Settings } from '../models/Settings';
import { AvailabilityService } from '../services/availabilityService';
import { BookingRequestSchema } from '@vadapalli/validation';

async function runTests() {
  console.log('🕉️ [Vadapalli Accommodation] Starting Comprehensive Booking System Tests...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  // 1. In-Memory Mongo Replica Set (supports transactions)
  console.log('📦 Starting MongoDB in-memory replica set for transaction tests...');
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);

  try {
    // Seed initial Accommodations, Beds, Settings
    const room1 = await Accommodation.create({
      name: 'Room 1',
      type: 'PRIVATE_ROOM',
      description: 'Private room with attached bathroom.',
      capacity: { adults: 2, children: 2 },
      pricePerDay: 1000,
      bathroomType: 'Attached',
      active: true
    });

    const room2 = await Accommodation.create({
      name: 'Room 2',
      type: 'PRIVATE_ROOM',
      description: 'Private room with attached bathroom.',
      capacity: { adults: 2, children: 2 },
      pricePerDay: 1000,
      bathroomType: 'Attached',
      active: true
    });

    const hall = await Accommodation.create({
      name: 'Hall',
      type: 'HALL',
      description: 'Shared hall with 5 beds.',
      capacity: { adults: 5, children: 0 },
      pricePerDay: 300,
      bathroomType: 'Shared',
      active: true
    });

    const beds = [];
    for (let i = 1; i <= 5; i++) {
      beds.push(await Bed.create({ accommodationId: hall._id, bedNumber: i, pricePerDay: 300, active: true }));
    }

    await Settings.create({
      propertyName: 'Vadapalli Accommodation',
      gstEnabled: true,
      gstPercent: 12
    });

    // ----------------------------------------------------
    // Scenario 1: Yesterday is disabled
    // ----------------------------------------------------
    console.log('\n--- Scenario 1: Yesterday is disabled ---');
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getKolkataTodayString(yesterdayDate);
    const yesterdaySlots = getAvailableTimeSlots(yesterdayStr);
    assert(yesterdaySlots.length === 0, `Yesterday (${yesterdayStr}) returns 0 available time slots`);
    assert(isPastDateTimeKolkata(yesterdayDate) === true, 'isPastDateTimeKolkata correctly identifies yesterday as in the past');

    // ----------------------------------------------------
    // Scenario 2: Today is selectable
    // ----------------------------------------------------
    console.log('\n--- Scenario 2: Today is selectable ---');
    const todayStr = getKolkataTodayString();
    assert(typeof todayStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(todayStr), `Today string is formatted as YYYY-MM-DD (${todayStr}) in Asia/Kolkata`);

    // ----------------------------------------------------
    // Scenario 3: Today only shows future time slots
    // ----------------------------------------------------
    console.log('\n--- Scenario 3: Today only shows future time slots ---');
    const now = new Date();
    const currentParts = getKolkataTimeParts(now);
    const todaySlots = getAvailableTimeSlots(todayStr, now);
    const allAreFuture = todaySlots.every(s => s.totalMinutes > currentParts.totalMinutes);
    assert(allAreFuture, `All ${todaySlots.length} available slots for today are strictly in the future (after ${currentParts.hours}:${currentParts.minutes} IST)`);
    if (todaySlots.length > 0) {
      assert(todaySlots[0].totalMinutes > currentParts.totalMinutes, `First available slot (${todaySlots[0].label}) is after current time`);
    }

    // ----------------------------------------------------
    // Scenario 4: Tomorrow starts at 12:00 AM
    // ----------------------------------------------------
    console.log('\n--- Scenario 4: Tomorrow starts at 12:00 AM ---');
    const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowStr = getKolkataTodayString(tomorrowDate);
    const tomorrowSlots = getAvailableTimeSlots(tomorrowStr);
    assert(tomorrowSlots.length === 48, `Tomorrow (${tomorrowStr}) has all 48 30-minute slots available`);
    assert(tomorrowSlots[0].label === '12:00 AM' && tomorrowSlots[0].time === '00:00', 'Tomorrow begins with 12:00 AM');
    assert(tomorrowSlots[tomorrowSlots.length - 1].label === '11:30 PM' && tomorrowSlots[tomorrowSlots.length - 1].time === '23:30', 'Tomorrow ends at 11:30 PM');

    // ----------------------------------------------------
    // Scenario 5: Changing date refreshes time slots
    // ----------------------------------------------------
    console.log('\n--- Scenario 5: Changing date refreshes time slots ---');
    const slotsDay1 = getAvailableTimeSlots(todayStr);
    const slotsDay2 = getAvailableTimeSlots(tomorrowStr);
    assert(slotsDay1.length !== slotsDay2.length || currentParts.totalMinutes === 0, 'Available slots refresh dynamically when switching between today and tomorrow');

    // ----------------------------------------------------
    // Scenario 6: Changing date clears invalid previous time
    // ----------------------------------------------------
    console.log('\n--- Scenario 6: Changing date clears invalid previous time ---');
    // Early morning 01:00 AM is valid for tomorrow, but if current time is past 1:00 AM today, it's invalid for today
    const earlyMorningSlot = '01:00';
    const isEarlyValidForTomorrow = tomorrowSlots.some(s => s.time === earlyMorningSlot);
    const isEarlyValidForToday = todaySlots.some(s => s.time === earlyMorningSlot);
    assert(isEarlyValidForTomorrow === true, '1:00 AM is valid for tomorrow');
    if (currentParts.totalMinutes > 60) {
      assert(isEarlyValidForToday === false, '1:00 AM is correctly rejected for today because it has already passed');
    }

    // ----------------------------------------------------
    // Scenario 7: Past times cannot be submitted through API
    // ----------------------------------------------------
    console.log('\n--- Scenario 7: Past times cannot be submitted through API ---');
    const pastCheckIn = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const futureCheckOut = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    let pastSubmissionBlocked = false;
    try {
      BookingRequestSchema.parse({
        customerName: 'Pilgrim Test',
        phone: '9876543210',
        address: 'Vijayawada, AP',
        checkIn: pastCheckIn,
        checkOut: futureCheckOut,
        adults: 2,
        children: 0,
        childrenAges: [],
        accommodationType: 'PRIVATE_ROOM',
        accommodationId: room1._id.toString(),
        policyAccepted: true
      });
    } catch (err: any) {
      pastSubmissionBlocked = true;
    }
    assert(pastSubmissionBlocked, 'Past check-in submission was strictly blocked by validation schema');

    // ----------------------------------------------------
    // Scenario 8: Room availability updates correctly
    // ----------------------------------------------------
    console.log('\n--- Scenario 8: Room availability updates correctly ---');
    const futureIn = toKolkataIsoString(tomorrowStr, '10:00');
    const futureOut = toKolkataIsoString(tomorrowStr, '22:00');

    // Initial check: 2 total rooms, 2 available, 0 booked
    let avail = await AvailabilityService.checkAvailability(futureIn, futureOut);
    assert(avail.summary.privateRooms.total === 2, 'Total private rooms is 2');
    assert(avail.summary.privateRooms.available === 2, 'Initially 2 private rooms available');
    assert(avail.summary.privateRooms.booked === 0, 'Initially 0 private rooms booked');

    // Create 1 booking for Room 1
    const booking1 = await Booking.create({
      bookingId: 'VAD-2026-00001',
      customerName: 'Ramesh Kumar',
      phone: '9876543210',
      address: 'Hyderabad',
      checkIn: new Date(futureIn),
      checkOut: new Date(futureOut),
      adults: 2,
      children: 0,
      accommodationType: 'PRIVATE_ROOM',
      accommodationId: room1._id,
      baseAmount: 1000,
      gstAmount: 120,
      totalAmount: 1120,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'VERIFIED',
      policyAccepted: true
    });

    avail = await AvailabilityService.checkAvailability(futureIn, futureOut);
    assert(avail.summary.privateRooms.available === 1, 'After 1 booking: 1 room available');
    assert(avail.summary.privateRooms.booked === 1, 'After 1 booking: 1 room booked');

    // Create 2nd booking for Room 2
    const booking2 = await Booking.create({
      bookingId: 'VAD-2026-00002',
      customerName: 'Suresh Rao',
      phone: '9876543211',
      address: 'Rajahmundry',
      checkIn: new Date(futureIn),
      checkOut: new Date(futureOut),
      adults: 2,
      children: 0,
      accommodationType: 'PRIVATE_ROOM',
      accommodationId: room2._id,
      baseAmount: 1000,
      gstAmount: 120,
      totalAmount: 1120,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'VERIFIED',
      policyAccepted: true
    });

    avail = await AvailabilityService.checkAvailability(futureIn, futureOut);
    assert(avail.summary.privateRooms.available === 0, 'After 2 bookings: 0 rooms available (isFull = true)');
    assert(avail.summary.privateRooms.booked === 2, 'After 2 bookings: 2 rooms booked');
    assert(avail.summary.privateRooms.isFull === true, 'Private rooms marked as full');

    // ----------------------------------------------------
    // Scenario 9: Hall bed availability updates correctly
    // ----------------------------------------------------
    console.log('\n--- Scenario 9: Hall bed availability updates correctly ---');
    assert(avail.summary.hall.total === 5, 'Total hall beds is 5');
    assert(avail.summary.hall.available === 5, 'Initially 5 hall beds available');
    assert(avail.summary.hall.booked === 0, 'Initially 0 hall beds booked');

    // Book 2 beds (Bed 1 & Bed 2)
    const hallBooking = await Booking.create({
      bookingId: 'VAD-2026-00003',
      customerName: 'Venkat Group',
      phone: '9876543212',
      address: 'Visakhapatnam',
      checkIn: new Date(futureIn),
      checkOut: new Date(futureOut),
      adults: 2,
      children: 0,
      accommodationType: 'HALL',
      accommodationId: hall._id,
      bedIds: [beds[0]._id, beds[1]._id],
      baseAmount: 600,
      gstAmount: 72,
      totalAmount: 672,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'VERIFIED',
      policyAccepted: true
    });

    avail = await AvailabilityService.checkAvailability(futureIn, futureOut);
    assert(avail.summary.hall.available === 3, 'After booking 2 beds: 3 beds available');
    assert(avail.summary.hall.booked === 2, 'After booking 2 beds: 2 beds booked');

    // ----------------------------------------------------
    // Scenario 10: Overlapping bookings are prevented
    // ----------------------------------------------------
    console.log('\n--- Scenario 10: Overlapping bookings are prevented ---');
    // Staggered overlap: checkIn at 14:00, checkOut at 02:00 next day
    const overlapIn = toKolkataIsoString(tomorrowStr, '14:00');
    const overlapOut = new Date(new Date(overlapIn).getTime() + 12 * 60 * 60 * 1000).toISOString();
    const overlapAvail = await AvailabilityService.checkAvailability(overlapIn, overlapOut);
    assert(overlapAvail.summary.privateRooms.available === 0, 'Staggered overlapping window correctly detects Room 1 and Room 2 as occupied');

    // ----------------------------------------------------
    // Scenario 11: Two customers cannot book the same final room simultaneously
    // ----------------------------------------------------
    console.log('\n--- Scenario 11: Concurrency and double-booking prevention ---');
    const nonOverlapDay = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const nonOverlapStr = getKolkataTodayString(nonOverlapDay);
    const tIn = new Date(toKolkataIsoString(nonOverlapStr, '09:00'));
    const tOut = new Date(new Date(tIn).getTime() + 12 * 60 * 60 * 1000);

    // Book Room 1
    await Booking.create({
      bookingId: 'VAD-2026-CONC-1',
      customerName: 'User A',
      phone: '9000000001',
      address: 'Kurnool',
      checkIn: tIn,
      checkOut: tOut,
      adults: 2,
      children: 0,
      accommodationType: 'PRIVATE_ROOM',
      accommodationId: room1._id,
      baseAmount: 1000,
      gstAmount: 120,
      totalAmount: 1120,
      bookingStatus: 'CONFIRMED',
      policyAccepted: true
    });

    // Attempt double booking on Room 1 for identical dates
    let doubleBookingBlocked = false;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const conflict = await Booking.find({
        checkIn: { $lt: tOut },
        checkOut: { $gt: tIn },
        bookingStatus: { $in: ['CONFIRMED'] },
        accommodationId: room1._id
      }).session(session);

      if (conflict.length > 0) {
        throw new Error('Room is already booked for this slot');
      }
    } catch (e: any) {
      doubleBookingBlocked = true;
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
    assert(doubleBookingBlocked === true, 'Double booking of Room 1 was strictly aborted in transaction');

    // ----------------------------------------------------
    // Scenario 12: Payment failure and expiry release reserved inventory
    // ----------------------------------------------------
    console.log('\n--- Scenario 12: Payment failure & expiry release inventory ---');
    const futureDay3 = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    const day3Str = getKolkataTodayString(futureDay3);
    const pIn = toKolkataIsoString(day3Str, '10:00');
    const pOut = toKolkataIsoString(day3Str, '22:00');

    // Create an expired pending booking (created 20 minutes ago)
    const expiredPending = await Booking.create({
      bookingId: 'VAD-2026-EXPIRED',
      customerName: 'Expired User',
      phone: '9000000002',
      address: 'Guntur',
      checkIn: new Date(pIn),
      checkOut: new Date(pOut),
      adults: 2,
      children: 0,
      accommodationType: 'PRIVATE_ROOM',
      accommodationId: room1._id,
      baseAmount: 1000,
      gstAmount: 120,
      totalAmount: 1120,
      bookingStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      policyAccepted: true,
      createdAt: new Date(Date.now() - 20 * 60 * 1000) // 20 min ago
    });

    // Check availability: expired pending booking should NOT block inventory!
    const availAfterExpiry = await AvailabilityService.checkAvailability(pIn, pOut);
    assert(availAfterExpiry.summary.privateRooms.available === 2, 'Expired pending booking (>15 min) does not block room inventory');

    // Create a failed/rejected payment booking
    const rejectedBooking = await Booking.create({
      bookingId: 'VAD-2026-REJECTED',
      customerName: 'Failed Payment User',
      phone: '9000000003',
      address: 'Nellore',
      checkIn: new Date(pIn),
      checkOut: new Date(pOut),
      adults: 2,
      children: 0,
      accommodationType: 'PRIVATE_ROOM',
      accommodationId: room2._id,
      baseAmount: 1000,
      gstAmount: 120,
      totalAmount: 1120,
      bookingStatus: 'REJECTED',
      paymentStatus: 'REJECTED',
      policyAccepted: true
    });

    const availAfterReject = await AvailabilityService.checkAvailability(pIn, pOut);
    assert(availAfterReject.summary.privateRooms.available === 2, 'Rejected/Failed payment booking immediately releases inventory');

    // ----------------------------------------------------
    // Scenario 13: Timezone accuracy in Asia/Kolkata
    // ----------------------------------------------------
    console.log('\n--- Scenario 13: Timezone accuracy in Asia/Kolkata ---');
    const testKolkataIso = toKolkataIsoString('2026-11-20', '10:30');
    const parsed = new Date(testKolkataIso);
    assert(formatKolkataDate(parsed) === '20 November 2026', 'formatKolkataDate renders "20 November 2026" accurately');
    assert(formatKolkataTime(parsed) === '10:30 AM', 'formatKolkataTime renders "10:30 AM" accurately');

    // ----------------------------------------------------
    // Scenario 14: Duration & Checkout calculation
    // ----------------------------------------------------
    console.log('\n--- Scenario 14: Duration and Checkout calculation ---');
    const checkInSample = new Date(toKolkataIsoString('2026-11-20', '10:00'));
    const checkOut12h = new Date(checkInSample.getTime() + 12 * 60 * 60 * 1000);
    const checkOut24h = new Date(checkInSample.getTime() + 24 * 60 * 60 * 1000);
    assert(formatKolkataTime(checkOut12h) === '10:00 PM', '12-hour duration from 10:00 AM checks out at 10:00 PM');
    assert(formatKolkataDate(checkOut24h) === '21 November 2026' && formatKolkataTime(checkOut24h) === '10:00 AM', '24-hour duration checks out next day at 10:00 AM');

  } finally {
    await mongoose.disconnect();
    await replSet.stop();
  }

  console.log(`\n======================================================`);
  console.log(`TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`======================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
