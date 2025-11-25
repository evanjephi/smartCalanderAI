'use client';

import { useState, useEffect } from 'react';
import NaturalLanguageInput from '@/components/NaturalLanguageInput';
import CalendarView from '@/components/CalendarView';
import BookingSummary from '@/components/BookingSummary';
import BookingDetailsModal from '@/components/BookingDetailsModal';
import UserList from '@/components/UserList';
import WorkerSearchView from '@/components/WorkerSearchView';
import WorkerProfileModal from '@/components/WorkerProfileModal';
import ClientBookingFlow from '@/components/ClientBookingFlow';
import BookWithWorkerInput from '@/components/BookWithWorkerInput';
import { useCalendarStore } from '@/lib/store';
import { createBookingSlots } from '@/lib/bookingEngine';
import { BookingResult, TimeSlot, PSWWorker, Client } from '@/types';
import { Calendar, Briefcase, Users, BookOpen } from 'lucide-react';

type TabType = 'calendar' | 'book-meeting' | 'find-workers' | 'my-bookings';

export default function Home() {
  const { users, timeSlots, addTimeSlot, setTimeSlots } = useCalendarStore();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  
  // Worker search & booking state
  const [selectedWorker, setSelectedWorker] = useState<PSWWorker | null>(null);
  const [showWorkerProfile, setShowWorkerProfile] = useState(false);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateSlots, setSelectedDateSlots] = useState<TimeSlot[] | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data.clients || []);
      } catch (err) {
        console.warn('Error fetching clients:', err);
      }
    };

    fetchClients();
  }, []);

  // Fetch bookings from Firebase on page load
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings-get', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          console.warn('Failed to fetch bookings:', res.status);
          return;
        }

        const data = await res.json();
        const bookings: TimeSlot[] = data.bookings || [];

        if (bookings.length > 0) {
          // Convert ISO date strings back to Date objects
          const convertedBookings = bookings.map((b) => ({
            ...b,
            date: new Date(b.date),
          }));
          setTimeSlots(convertedBookings);
        }
      } catch (error) {
        console.warn('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, [setTimeSlots]);

  const handleBookingRequest = async (input: string) => {
    setIsLoading(true);
    try {
      // Call server-side AI parser
      const res = await fetch('/api/parse-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const body = await res.json();

      if (!res.ok) {
        setBookingResult({
          success: false,
          bookings: [],
          message: body.error || 'Failed to parse request. Check API key in .env.local',
        });
        return;
      }

      const parsed = body?.parsed;

      if (!parsed) {
        setBookingResult({
          success: false,
          bookings: [],
          message: 'Failed to parse your request. Please ensure OPENAI_API_KEY or ANTHROPIC_API_KEY is set.',
        });
        return;
      }

      // Create booking slots
      const result = createBookingSlots(parsed, users);

      // Add slots to store if successful
      if (result.success) {
        result.bookings.forEach((slot) => addTimeSlot(slot));

        // Persist bookings server-side (non-blocking)
        try {
          fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookings: result.bookings }),
          }).catch((e) => console.warn('Failed to persist bookings:', e));
        } catch (e) {
          console.warn('Error sending bookings to server:', e);
        }
      }

      setBookingResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkerSelected = (worker: PSWWorker) => {
    setSelectedWorker(worker);
    setShowWorkerProfile(true);
  };

  const handleWorkerBook = (worker: PSWWorker) => {
    setSelectedWorker(worker);
    setShowWorkerProfile(false);
    setShowBookingFlow(true);
  };

  const handleBookingComplete = () => {
    setShowBookingFlow(false);
    setSelectedWorker(null);
    setActiveTab('my-bookings');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">Smart Calendar AI</h1>
          <p className="text-lg text-gray-600">
            Book meetings and manage PSW workers
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-lg bg-white p-2 shadow-lg">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors ${
              activeTab === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar size={18} />
            Calendar
          </button>

          <button
            onClick={() => setActiveTab('book-meeting')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors ${
              activeTab === 'book-meeting'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Briefcase size={18} />
            Book Meeting
          </button>

          <button
            onClick={() => setActiveTab('find-workers')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors ${
              activeTab === 'find-workers'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} />
            Find PSW Workers
          </button>

          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors ${
              activeTab === 'my-bookings'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BookOpen size={18} />
            My Bookings
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Show relevant sidebar based on tab */}
              {activeTab === 'book-meeting' && (
                <>
                  <div className="rounded-lg bg-white p-6 shadow-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Select Client</h3>
                    <select
                      value={selectedClient?.id || ''}
                      onChange={(e) => {
                        const client = clients.find(c => c.id === e.target.value);
                        setSelectedClient(client || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a client...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClient && (
                    <div className="rounded-lg bg-white p-6 shadow-lg">
                      <h3 className="font-semibold text-gray-800 mb-4">Book with Worker</h3>
                      <BookWithWorkerInput 
                        selectedClient={selectedClient}
                        onBookingSuccess={() => {
                          // Refresh bookings after successful booking
                          setActiveTab('my-bookings');
                        }}
                      />
                    </div>
                  )}

                  <NaturalLanguageInput onSubmit={handleBookingRequest} isLoading={isLoading} />
                  <UserList users={users} />
                </>
              )}

              {activeTab === 'find-workers' && (
                <div className="rounded-lg bg-white p-6 shadow-lg">
                  <h3 className="font-semibold text-gray-800">Search Tip</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Use filters to find PSW workers matching your needs. View their profiles to see availability and rates.
                  </p>
                </div>
              )}

              {activeTab === 'my-bookings' && (
                <div className="rounded-lg bg-white p-6 shadow-lg">
                    <h3 className="font-semibold text-gray-800">Bookings Summary</h3>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Total Bookings:</strong> {timeSlots.length}
                      </p>
                      <div className="mt-2 space-y-1">
                        {timeSlots.slice(0, 4).map((s) => (
                          <div key={s.id} className="text-sm text-gray-700">
                            {('workerName' in s) && ('clientName' in s) ? (
                              <span>P: {(s as any).workerName} - C: {(s as any).clientName}</span>
                            ) : s.title ? (
                              <span>{s.title}</span>
                            ) : (
                              <span>{new Date(String(s.date)).toLocaleDateString()}</span>
                            )}
                          </div>
                        ))}
                        {timeSlots.length > 4 && (
                          <div className="text-xs text-gray-500">+{timeSlots.length - 4} more</div>
                        )}
                      </div>
                    </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <UserList users={users} />
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <>
                <CalendarView
                  timeSlots={timeSlots}
                  month={selectedMonth}
                  year={selectedYear}
                  onMonthChange={setSelectedMonth}
                  onYearChange={setSelectedYear}
                  onDateClick={(date, slots) => {
                    setSelectedDate(date);
                    setSelectedDateSlots(slots);
                    setShowDateModal(true);
                  }}
                />
              </>
            )}

            {/* Book Meeting Tab */}
            {activeTab === 'book-meeting' && (
              <>
                {bookingResult && <BookingSummary result={bookingResult} />}

                <CalendarView
                  timeSlots={timeSlots}
                  month={selectedMonth}
                  year={selectedYear}
                  onMonthChange={setSelectedMonth}
                  onYearChange={setSelectedYear}
                  onDateClick={(date, slots) => {
                    setSelectedDate(date);
                    setSelectedDateSlots(slots);
                    setShowDateModal(true);
                  }}
                />
              </>
            )}

            {/* Find PSW Workers Tab */}
            {activeTab === 'find-workers' && (
              <WorkerSearchView onWorkerSelect={handleWorkerSelected} />
            )}

            {/* My Bookings Tab */}
            {activeTab === 'my-bookings' && (
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">My Bookings</h2>
                {timeSlots.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No bookings yet. Start by booking a meeting or a PSW worker.</p>
                ) : (
                  <div className="space-y-3">
                    {timeSlots.map((slot) => {
                      const slotDate = typeof slot.date === 'string' ? new Date(slot.date) : slot.date;
                      return (
                        <div
                          key={slot.id}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-indigo-900">{slot.title || ((slot as any).workerName ?? 'Booking')}</h3>
                              <p className="text-sm text-indigo-700">
                                {slotDate.toLocaleDateString()} from {slot.startTime} to {slot.endTime}
                              </p>
                              <div className="text-sm text-indigo-800 mt-1">
                                {('workerName' in slot) && ('clientName' in slot) ? (
                                  <span>P: {(slot as any).workerName} - C: {(slot as any).clientName}</span>
                                ) : slot.attendees && slot.attendees.length > 0 ? (
                                  <span>Attendees: {slot.attendees.join(', ')}</span>
                                ) : null}
                              </div>
                              {('status' in slot) && (slot as any).status && (
                                <p className="text-xs text-gray-600 mt-2">Status: {(slot as any).status}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Worker Profile Modal */}
      {showWorkerProfile && (
        <WorkerProfileModal
          worker={selectedWorker}
          onClose={() => setShowWorkerProfile(false)}
          onBook={handleWorkerBook}
        />
      )}

      {/* Booking Flow Modal */}
      {showBookingFlow && (
        <ClientBookingFlow
          worker={selectedWorker}
          clients={clients}
          onBookingComplete={handleBookingComplete}
          onCancel={() => {
            setShowBookingFlow(false);
            setSelectedWorker(null);
          }}
        />
      )}
      {/* Booking Details Modal (date click) */}
      {showDateModal && selectedDate && selectedDateSlots && (
        <BookingDetailsModal
          date={selectedDate}
          bookings={selectedDateSlots}
          onClose={() => {
            setShowDateModal(false);
            setSelectedDate(null);
            setSelectedDateSlots(null);
          }}
        />
      )}
    </main>
  );
}
