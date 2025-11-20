import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { TimeSlot } from '@/types';
import admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookings: TimeSlot[] = body?.bookings;
    if (!bookings || !Array.isArray(bookings)) {
      return NextResponse.json({ error: 'Invalid bookings payload' }, { status: 400 });
    }

    const db = getFirestore();
    const batch = db.batch();
    const collection = db.collection('bookings');

    for (const b of bookings) {
      const docRef = collection.doc(b.id);
      // Firestore doesn't accept Date objects in JSON directly — convert to timestamp
      const payload = {
        ...b,
        date: admin.firestore.Timestamp.fromDate(new Date(b.date)),
      } as any;
      batch.set(docRef, payload);
    }

    await batch.commit();
    return NextResponse.json({ success: true, count: bookings.length });
  } catch (err) {
    console.error('bookings API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// helper removed; using admin.firestore.Timestamp.fromDate above
