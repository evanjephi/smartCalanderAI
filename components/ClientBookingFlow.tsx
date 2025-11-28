// components/ClientBookingFlow.tsx
'use client';

import { useState } from 'react';
import { PSWWorker, Client } from '@/types';
import { Calendar, Clock, Check, AlertCircle } from 'lucide-react';

interface ClientBookingFlowProps {
  worker: PSWWorker | null;
  clients: Client[];
  onBookingComplete: () => void;
  onCancel: () => void;
}

export default function ClientBookingFlow({
  worker,
  clients,
  onBookingComplete,
  onCancel,
}: ClientBookingFlowProps) {
  const [step, setStep] = useState<'select-client' | 'select-date-time' | 'confirm'>('select-client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!worker) return null;

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setStep('select-date-time');
    setError(null);
  };

  const handleAddDate = (date: string) => {
    if (!selectedDates.includes(date)) {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleRemoveDate = (date: string) => {
    setSelectedDates(selectedDates.filter((d) => d !== date));
  };

  const handleProceedToConfirm = () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    setStep('confirm');
    setError(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedClient || selectedDates.length === 0) {
      setError('Invalid booking data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create bookings for each date
      const bookings = selectedDates.map((date) => ({
        clientId: selectedClient.id,
        clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        pswWorkerId: worker.id,
        pswWorkerName: `${worker.firstName} ${worker.lastName}`,
        date: new Date(date),
        startTime,
        endTime,
        status: 'confirmed' as const,
        createdAt: new Date(),
      }));

      // Save to Firebase (POST to a new endpoint or update existing bookings)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookings }),
      });

      if (!res.ok) {
        throw new Error('Failed to create bookings');
      }

      // Also update the client's booking list (optional - if you have a dedicated endpoint)
      // And update the PSW worker's booking list

      onBookingComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Select Client
  if (step === 'select-client') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Select Client</h2>
          <p className="mt-2 text-gray-600">
            Booking for: <strong>{worker.firstName} {worker.lastName}</strong>
          </p>

          <div className="mt-6 space-y-3">
            {clients.length === 0 ? (
              <p className="text-gray-600">No clients available</p>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <p className="font-semibold text-gray-800">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{client.location}</p>
                  <p className="text-xs text-gray-500">Age: {client.age}</p>
                </button>
              ))
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Select Date & Time
  if (step === 'select-date-time') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Select Dates & Time</h2>
          <p className="mt-2 text-gray-600">
            Client: <strong>{selectedClient?.firstName} {selectedClient?.lastName}</strong>
          </p>

          <div className="mt-6 space-y-4">
            {/* Time Selection */}
            <div className="rounded-lg bg-gray-50 p-4">
              <label className="block text-sm font-semibold text-gray-700">
                <Clock className="mb-2 inline-block h-4 w-4" /> Time Slot
              </label>
              <div className="mt-3 flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="rounded-lg bg-gray-50 p-4">
              <label className="block text-sm font-semibold text-gray-700">
                <Calendar className="mb-2 inline-block h-4 w-4" /> Select Dates
              </label>
              <input
                type="date"
                multiple
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddDate(e.target.value);
                  }
                }}
                className="mt-3 w-full rounded border border-gray-300 px-3 py-2"
              />

              {/* Selected Dates */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Selected Dates:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDates.length === 0 ? (
                    <p className="text-xs text-gray-500">No dates selected</p>
                  ) : (
                    selectedDates.map((date) => (
                      <div
                        key={date}
                        className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                      >
                        {new Date(date).toLocaleDateString()}
                        <button
                          onClick={() => handleRemoveDate(date)}
                          className="font-bold text-indigo-700 hover:text-indigo-900"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                setStep('select-client');
                setError(null);
              }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleProceedToConfirm}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={selectedDates.length === 0}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirm Booking
  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Confirm Booking</h2>

          {/* Summary */}
          <div className="mt-6 space-y-4">
            {/* Worker Info */}
            <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-200">
              <p className="font-semibold text-indigo-900">PSW Worker</p>
              <p className="text-indigo-800">
                {worker.firstName} {worker.lastName}
              </p>
              <p className="text-sm text-indigo-700">${worker.hourlyRate}/hour</p>
            </div>

            {/* Client Info */}
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <p className="font-semibold text-blue-900">Client</p>
              <p className="text-blue-800">
                {selectedClient?.firstName} {selectedClient?.lastName}
              </p>
            </div>

            {/* Booking Details */}
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="font-semibold text-green-900">Booking Details</p>
              <p className="text-green-800 mt-2">
                <strong>Time:</strong> {startTime} - {endTime}
              </p>
              <p className="text-green-800">
                <strong>Dates:</strong> {selectedDates.length} day(s)
              </p>
              {selectedDates.length <= 5 ? (
                <ul className="mt-2 ml-4 text-green-800">
                  {selectedDates.map((date) => (
                    <li key={date}>{new Date(date).toLocaleDateString()}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-700 mt-2">
                  From {new Date(selectedDates[0]).toLocaleDateString()} to{' '}
                  {new Date(selectedDates[selectedDates.length - 1]).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Cost Estimate */}
            <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
              <p className="font-semibold text-yellow-900">Estimated Cost</p>
              <p className="text-xl font-bold text-yellow-800 mt-2">
                ${(worker.hourlyRate * 3 * selectedDates.length).toFixed(2)}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {worker.hourlyRate}/hour × 3 hours × {selectedDates.length} day(s)
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                setStep('select-date-time');
                setError(null);
              }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Back
            </button>
            <button
              onClick={handleConfirmBooking}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : <><Check className="h-4 w-4" /> Confirm & Book</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
