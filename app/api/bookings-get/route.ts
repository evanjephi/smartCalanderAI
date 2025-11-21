import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { TimeSlot } from '@/types';
import admin from 'firebase-admin';

export async function GET() {
  try {
    const db = getFirestore();
    const snap = await db.collection('bookings').get();
    const bookings = snap.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp back to ISO string for client
      return {
        ...data,
        date: data.date instanceof admin.firestore.Timestamp ? data.date.toDate().toISOString() : data.date,
      } as TimeSlot;
    });
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error('bookings GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
