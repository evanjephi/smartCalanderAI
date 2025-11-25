'use client';

import React from 'react';
import { TimeSlot } from '@/types';
import { X, Clock } from 'lucide-react';

interface Props {
  date: Date;
  bookings: TimeSlot[];
  onClose: () => void;
}

export default function BookingDetailsModal({ date, bookings, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Bookings on {date.toLocaleDateString()}</h2>
            <p className="text-sm text-gray-600">{bookings.length} booking(s)</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{('workerName' in b) ? (b as any).workerName : b.title}</p>
                  <p className="text-sm text-gray-600">{('clientName' in b) ? (b as any).clientName : ''}</p>
                </div>
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {b.startTime} - {b.endTime}
                </div>
              </div>
              {b.description && <p className="mt-2 text-sm text-gray-600">{b.description}</p>}
            </div>
          ))}
        </div>

        <div className="mt-6 text-right">
          <button onClick={onClose} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
