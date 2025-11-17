'use client';

import { useState } from 'react';
import NaturalLanguageInput from '@/components/NaturalLanguageInput';
import CalendarView from '@/components/CalendarView';
import BookingSummary from '@/components/BookingSummary';
import UserList from '@/components/UserList';
import { useCalendarStore } from '@/lib/store';
import { parseBookingRequest } from '@/lib/aiParser';
import { createBookingSlots } from '@/lib/bookingEngine';
import { BookingResult } from '@/types';

export default function Home() {
  const { users, timeSlots, addTimeSlot } = useCalendarStore();
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleBookingRequest = (input: string) => {
    // Parse the natural language input
    const parsed = parseBookingRequest(input);

    if (!parsed) {
      setBookingResult({
        success: false,
        bookings: [],
        message: 'Could not parse your request. Please try: "book meetings with Evan, Efrem for Mondays and Wednesdays at 10:00-12:00 for December"',
      });
      return;
    }

    // Create booking slots
    const result = createBookingSlots(parsed, users);

    // Add slots to store if successful
    if (result.success) {
      result.bookings.forEach((slot) => {
        addTimeSlot(slot);
      });
    }

    setBookingResult(result);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">Smart Calendar AI</h1>
          <p className="text-lg text-gray-600">
            Book meetings using simple English commands
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Input Section */}
              <NaturalLanguageInput onSubmit={handleBookingRequest} />

              {/* User List */}
              <UserList users={users} />
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Booking Result */}
            {bookingResult && <BookingSummary result={bookingResult} />}

            {/* Calendar View */}
            <CalendarView
              timeSlots={timeSlots}
              month={selectedMonth}
              year={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
