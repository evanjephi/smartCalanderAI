// app/api/book-with-worker/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseBookingRequestWithAI } from '@/lib/openaiParser';
import { getFirestore } from '@/lib/firebaseAdmin';
import { PSWWorker, Client } from '@/types';
import { format, getDay } from 'date-fns';

interface WorkerWithId extends PSWWorker {
  id: string;
}

/**
 * Parse natural language booking request and create booking with PSW worker
 * Example: "book a meeting with Barbara Johnson at 9am-12pm on december 10"
 * 
 * Request body:
 * {
 *   input: string,          // Natural language booking request
 *   clientId: string        // ID of the client making the booking
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   booking?: { clientId, pswWorkerId, date, startTime, endTime },
 *   message: string,
 *   errors?: Array
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { input, clientId } = await req.json();

    if (!input || !clientId) {
      return NextResponse.json(
        { success: false, message: 'Missing input or clientId' },
        { status: 400 }
      );
    }

    // Step 1: Parse the natural language request
    const { parsed, errors } = await parseBookingRequestWithAI(input);

    if (!parsed) {
      return NextResponse.json(
        { success: false, message: 'Failed to parse booking request', errors },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // Step 2: Verify client exists
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Client not found' },
        { status: 404 }
      );
    }
    const client = clientDoc.data() as Client;

    // Step 3: Find PSW worker by name (from attendees list)
    if (!parsed.attendees || parsed.attendees.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No worker name found in booking request' },
        { status: 400 }
      );
    }

    const workerName = parsed.attendees[0]; // First attendee is the PSW worker
    const workersSnapshot = await db.collection('psw_workers').get();
    
    let matchedWorker: WorkerWithId | null = null;
    workersSnapshot.forEach((doc) => {
      const worker = doc.data() as PSWWorker;
      const fullName = `${worker.firstName} ${worker.lastName}`.toLowerCase();
      
      if (
        fullName.includes(workerName.toLowerCase()) ||
        workerName.toLowerCase().includes(worker.firstName.toLowerCase()) ||
        workerName.toLowerCase().includes(worker.lastName.toLowerCase())
      ) {
        matchedWorker = { ...worker, id: doc.id };
      }
    });

    if (!matchedWorker) {
      return NextResponse.json(
        { success: false, message: `PSW worker "${workerName}" not found in database` },
        { status: 404 }
      );
    }

    // Type guard: ensure matchedWorker is not null for the rest of the function
    const worker: WorkerWithId = matchedWorker;

    // Step 4: Build booking date
    const now = new Date();
    const year = parsed.year || now.getFullYear();
    const month = parsed.month || now.getMonth() + 1;
    
    let bookingDate: Date | null = null;
    
    if (parsed.daysOfWeek && parsed.daysOfWeek.length > 0) {
      // Find the next matching day of week
      const targetDayName = parsed.daysOfWeek[0].toLowerCase();
      const dayMap: Record<string, number> = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
      };
      const targetDayNum = dayMap[targetDayName];
      
      // Try to find a date in the specified month matching the day of week
      for (let day = 1; day <= 31; day++) {
        try {
          const testDate = new Date(year, month - 1, day);
          if (getDay(testDate) === targetDayNum) {
            bookingDate = testDate;
            break;
          }
        } catch {
          break;
        }
      }
    }
    
    // Default to first day of specified month if no day of week matched
    if (!bookingDate) {
      bookingDate = new Date(year, month - 1, 1);
    }

    if (!bookingDate) {
      return NextResponse.json(
        { success: false, message: 'Could not determine booking date' },
        { status: 400 }
      );
    }

    // Step 5: Check worker availability
    const dayOfWeek = getDay(bookingDate); // 0 = Sunday, 1 = Monday, etc.
    const isAvailable = worker.availability.some((avail: any) => 
      avail.dayOfWeek === dayOfWeek || avail.dayOfWeek === (dayOfWeek === 0 ? 7 : dayOfWeek)
    );

    if (!isAvailable) {
      return NextResponse.json(
        { success: false, message: `${worker.firstName} ${worker.lastName} is not available on ${format(bookingDate, 'EEEE')}` },
        { status: 400 }
      );
    }

    // Step 6: Check for time conflicts
    const startTime = parsed.startTime || '09:00';
    const endTime = parsed.endTime || '10:00';
    
    // Check against existing bookings for this worker
    const existingBookings = worker.bookings || [];
    const hasConflict = existingBookings.some((booking: any) => {
      if (booking.date !== format(bookingDate!, 'yyyy-MM-dd')) return false;
      
      const existingStart = parseInt(booking.startTime.replace(':', ''));
      const existingEnd = parseInt(booking.endTime.replace(':', ''));
      const newStart = parseInt(startTime.replace(':', ''));
      const newEnd = parseInt(endTime.replace(':', ''));
      
      return !(newEnd <= existingStart || newStart >= existingEnd);
    });

    if (hasConflict) {
      return NextResponse.json(
        { success: false, message: `${worker.firstName} ${worker.lastName} has a conflict at that time` },
        { status: 400 }
      );
    }

    // Step 7: Create the booking
    const bookingId = `${format(bookingDate, 'yyyy-MM-dd')}_${startTime.replace(':', '-')}_UTC`;
    const booking = {
      id: bookingId,
      clientId,
      pswWorkerId: worker.id,
      clientName: `${client.firstName} ${client.lastName}`,
      workerName: `${worker.firstName} ${worker.lastName}`,
      date: format(bookingDate, 'yyyy-MM-dd'),
      startTime,
      endTime,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    // Save to bookings collection
    await db.collection('bookings').doc(bookingId).set(booking);

    return NextResponse.json(
      {
        success: true,
        message: `Booking confirmed with ${worker.firstName} ${worker.lastName}`,
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'POST to /api/book-with-worker with { input: string, clientId: string } to book with a PSW worker',
      example: {
        input: 'book a meeting with Barbara Johnson at 9am-12pm on monday',
        clientId: 'client_1'
      }
    },
    { status: 200 }
  );
}
