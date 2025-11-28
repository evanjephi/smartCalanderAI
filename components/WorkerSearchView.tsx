// components/WorkerSearchView.tsx
'use client';

import { useState, useEffect } from 'react';
import { PSWWorker } from '@/types';
import { Search, MapPin, DollarSign } from 'lucide-react';

interface WorkerSearchViewProps {
  onWorkerSelect: (worker: PSWWorker) => void;
}

export default function WorkerSearchView({ onWorkerSelect }: WorkerSearchViewProps) {
  const [workers, setWorkers] = useState<PSWWorker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<PSWWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minRate, setMinRate] = useState(0);
  const [maxRate, setMaxRate] = useState(50);
  const [selectedLocation, setSelectedLocation] = useState('');

  // Fetch workers on mount
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/psw-workers');
        if (!res.ok) throw new Error('Failed to fetch workers');
        const data = await res.json();
        setWorkers(data.workers || []);
        setFilteredWorkers(data.workers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // Apply filters
  useEffect(() => {
    let results = workers;

    // Keyword search
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      results = results.filter((w) => {
        const fullName = `${w.firstName} ${w.lastName}`.toLowerCase();
        const specialties = (w.specialties || []).join(' ').toLowerCase();
        return fullName.includes(keyword) || specialties.includes(keyword);
      });
    }

    // Location filter
    if (selectedLocation) {
      results = results.filter((w) =>
        w.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Specialty filter
    if (selectedSpecialty) {
      results = results.filter((w) =>
        w.specialties?.some((s) =>
          s.toLowerCase().includes(selectedSpecialty.toLowerCase())
        )
      );
    }

    // Rate filter
    results = results.filter(
      (w) => w.hourlyRate >= minRate && w.hourlyRate <= maxRate
    );

    setFilteredWorkers(results);
  }, [searchKeyword, selectedLocation, selectedSpecialty, minRate, maxRate, workers]);

  const specialties = Array.from(
    new Set(workers.flatMap((w) => w.specialties || []))
  );

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-lg text-center">
        <p className="text-gray-600">Loading workers...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Find PSW Workers</h2>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Keyword Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Location Filter */}
          <input
            type="text"
            placeholder="Location..."
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          />

          {/* Specialty Filter */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Specialties</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>

          {/* Min Rate */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Min Rate: ${minRate}
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={minRate}
              onChange={(e) => setMinRate(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Max Rate */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Max Rate: ${maxRate}
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={maxRate}
              onChange={(e) => setMaxRate(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="mb-4 text-sm text-gray-600">
        Showing {filteredWorkers.length} of {workers.length} workers
      </p>

      {/* Workers Grid */}
      {filteredWorkers.length === 0 ? (
        <p className="py-8 text-center text-gray-500">
          No workers found matching your criteria
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              className="rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onWorkerSelect(worker)}
            >
              {/* Name */}
              <h3 className="text-lg font-semibold text-gray-800">
                {worker.firstName} {worker.lastName}
              </h3>

              {/* Location */}
              <div className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 flex-shrink-0 text-indigo-600 mt-0.5" />
                <span>{worker.location}</span>
              </div>

              {/* Rate */}
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>{worker.hourlyRate}/hour</span>
              </div>

              {/* Specialties */}
              {worker.specialties && worker.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {worker.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-block rounded-full bg-indigo-200 px-2 py-1 text-xs text-indigo-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              {/* Availability */}
              <div className="mt-3 text-xs text-gray-600">
                Available: {worker.availability.length} days/week
              </div>

              {/* View Button */}
              <button className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
          Error: {error}
        </div>
      )}
    </div>
  );
}
