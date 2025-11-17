'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface NaturalLanguageInputProps {
  onSubmit: (input: string) => void;
}

export default function NaturalLanguageInput({ onSubmit }: NaturalLanguageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Book a Meeting</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="input" className="mb-2 block text-sm font-medium text-gray-700">
            Enter your booking request:
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., book meetings with Evan, Efrem, Charlie for Mondays and Wednesdays at 10:00-12:00 for December"
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            rows={4}
          />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <Send size={18} />
          Submit Request
        </button>

        <div className="rounded-lg bg-blue-50 p-3 text-xs text-gray-700">
          <p className="mb-2 font-semibold">Example formats:</p>
          <ul className="space-y-1">
            <li>• &quot;Book meetings with Evan for Monday at 14:00-15:00&quot;</li>
            <li>• &quot;Schedule sync with Efrem and Charlie for Mondays, Wednesdays, Fridays 09:00-10:00 in December&quot;</li>
            <li>• &quot;Book team standup with Diana for weekdays 10:00-10:30 December 2025&quot;</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
