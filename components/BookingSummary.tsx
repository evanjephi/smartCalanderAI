'use client';

import { BookingResult } from '@/types';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface BookingSummaryProps {
  result: BookingResult;
}

export default function BookingSummary({ result }: BookingSummaryProps) {
  return (
    <div
      className={`rounded-lg p-6 shadow-lg ${
        result.success
          ? 'border-l-4 border-green-500 bg-green-50'
          : 'border-l-4 border-red-500 bg-red-50'
      }`}
    >
      <div className="mb-3 flex items-start gap-3">
        {result.success ? (
          <CheckCircle size={24} className="mt-0.5 flex-shrink-0 text-green-600" />
        ) : (
          <AlertCircle size={24} className="mt-0.5 flex-shrink-0 text-red-600" />
        )}
        <div className="flex-1">
          <h3
            className={`text-lg font-semibold ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {result.success ? 'Bookings Created' : 'Booking Failed'}
          </h3>
          <p className={`mt-1 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
        </div>
      </div>

      {result.bookings.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Booked dates:</p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {result.bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded bg-white p-2 text-sm text-gray-700"
              >
                  <div>
                    <div className="text-sm">
                      {booking.date instanceof Date
                        ? booking.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : new Date(String(booking.date)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {booking.startTime} - {booking.endTime}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {/* Prefer explicit fields from booking if present */}
                      {('workerName' in booking) && ('clientName' in booking) ? (
                        <span>P: {(booking as any).workerName} - C: {(booking as any).clientName}</span>
                      ) : booking.title ? (
                        <span>{booking.title}</span>
                      ) : null}
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
