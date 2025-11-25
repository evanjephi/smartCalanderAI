// app/api/psw-workers/route.ts
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { PSWWorker } from '@/types';
import { searchWorkers, WorkerSearchFilters } from '@/lib/clientSearchEngine';

export async function GET(request: Request) {
  try {
    const db = getFirestore();
    const url = new URL(request.url);

    // Get all workers from Firebase
    const snapshot = await db.collection('psw_workers').get();
    const allWorkers: PSWWorker[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      allWorkers.push({
        ...data,
        createdAt: new Date(data.createdAt),
      } as PSWWorker);
    });

    // Parse filter query params
    const filters: WorkerSearchFilters = {
      keyword: url.searchParams.get('keyword') || undefined,
      minRate: url.searchParams.get('minRate')
        ? parseInt(url.searchParams.get('minRate')!)
        : undefined,
      maxRate: url.searchParams.get('maxRate')
        ? parseInt(url.searchParams.get('maxRate')!)
        : undefined,
      location: url.searchParams.get('location') || undefined,
      specialty: url.searchParams.get('specialty') || undefined,
      sortBy: (url.searchParams.get('sortBy') as any) || 'name',
    };

    // Parse available days
    const daysParam = url.searchParams.get('availableDays');
    if (daysParam) {
      filters.availableDaysOfWeek = daysParam.split(',').map((d) => parseInt(d));
    }

    // Apply filters
    const filteredWorkers = searchWorkers(allWorkers, filters);

    return NextResponse.json(
      { workers: filteredWorkers, total: filteredWorkers.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get PSW workers error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workerId } = body;

    if (!workerId) {
      return NextResponse.json(
        { error: 'workerId is required' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const doc = await db.collection('psw_workers').doc(workerId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const data = doc.data();
    const worker = {
      ...data,
      createdAt: new Date(data!.createdAt),
    } as PSWWorker;

    return NextResponse.json({ worker }, { status: 200 });
  } catch (error) {
    console.error('Get PSW worker error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
