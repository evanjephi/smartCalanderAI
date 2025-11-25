// app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { generateSampleData, convertClientsForFirestore, convertPSWWorkersForFirestore } from '@/lib/seedDatabase';
import { getFirestore } from '@/lib/firebaseAdmin';

export async function POST() {
  try {
    // Generate sample data
    const { clients, pswWorkers } = generateSampleData();

    // Get Firestore instance
    const db = getFirestore();

    // Clear existing collections (optional - for testing)
    // You can comment this out to preserve existing data
    const clientSnapshots = await db.collection('clients').get();
    const pswSnapshots = await db.collection('psw_workers').get();

    const batch = db.batch();

    // Clear old data
    clientSnapshots.forEach((doc) => batch.delete(doc.ref));
    pswSnapshots.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    // Add clients to Firestore
    const clientsForDb = convertClientsForFirestore(clients);
    const clientBatch = db.batch();
    clientsForDb.forEach((client) => {
      const docRef = db.collection('clients').doc(client.id);
      clientBatch.set(docRef, client);
    });
    await clientBatch.commit();

    // Add PSW workers to Firestore
    const workersForDb = convertPSWWorkersForFirestore(pswWorkers);
    const workerBatch = db.batch();
    workersForDb.forEach((worker) => {
      const docRef = db.collection('psw_workers').doc(worker.id);
      workerBatch.set(docRef, worker);
    });
    await workerBatch.commit();

    return NextResponse.json(
      {
        success: true,
        message: `Seeded ${clients.length} clients and ${pswWorkers.length} PSW workers`,
        data: {
          clientsCount: clients.length,
          workersCount: pswWorkers.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'POST to /api/seed to populate the database with sample data (50 clients, 30 PSW workers)',
    },
    { status: 200 }
  );
}
