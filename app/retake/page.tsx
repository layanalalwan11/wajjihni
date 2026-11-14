'use client';

import { useState } from 'react';
import {
  calculateRetake,
  buildScientificSubjects,
  buildLiterarySubjects,
} from '@/lib/retakePlanner';
import type { RetakeResult } from '@/lib/types';
import Disclaimer from '@/components/Disclaimer';
import ar from '@/lib/ar.json';

const SCIENCE_OPTIONS = ['biology', 'chemistry', 'physics', 'earthScience'] as const;
const LITERARY_ELECTIVE_OPTIONS = ['islamicStudies', 'geography'] as const;

type Stream = 'scientific' | 'literary';

export default function RetakePage() {
  const [stream, setStream] = useState<Stream | ''>('');
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [selectedSciences, setSelectedSciences] = useState<string[]>([]);
  const [selectedElective, setSelectedElective] = useState('');
  const [targetAverage, setTargetAverage] = useState('');
  const [result, setResult] = useState<RetakeResult | null>(null);
  const [error, setError] = useState('');

  /* ---------- helpers ---------- */
  const subjectName = (key: string): string =>
    (ar.subjects as Record<string, string>)[key] ?? key;

  const reset = () => {
    setMarks({});
    setSelectedSciences([]);
    setSelectedElective('');
    setResult(null);
    setError('');
    setTargetAverage('');
  };

  const handleStreamChange = (s: Stream) => {
    setStream(s);
    reset();
  };

  const handleMarkChange = (key: string, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    setMarks((prev) => ({ ...prev, [key]: num }));
  };

  const toggleScience = (sci: string) => {
    setSelectedSciences((prev) =>
      prev.includes(sci)
        ? prev.filter((s) => s !== sci)
        : prev.length < 3
          ? [...prev, sci]
          : prev,
    );
  };

  /* ---------- validation & calculation ---------- */
  const handleCalculate = () => {
    setError('');
    if (!stream) {
      setError(ar.retake.errorSelectStream);
      return;
    }
    if (stream === 'scientific' && selectedSciences.length !== 3) {
      setError(ar.retake.errorSelectSciences);
      return;
    }
    if (stream === 'literary' && !selectedElective) {
      setError(ar.retake.errorSelectElective);
      return;
    }
    const t = parseFloat(targetAverage);
    if (!t || t <= 0 || t > 100) {
      setError(ar.retake.errorInvalidTarget);
      return;
    }

    const subjects =
      stream === 'scientific'
        ? buildScientificSubjects(marks, selectedSciences)
        : buildLiterarySubjects(marks, selectedElective);

    setResult(calculateRetake(subjects, t));
  };

  /* ---------- reusable input row ---------- */
  const markInput = (key: string, max: number) => (
    <div
      key={key}
      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-3"
    >
      <label className="sm:w-44 text-sm font-medium text-gray-700 shrink-0">
        {subjectName(key)}
      </label>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="number"
          min={0}
          max={max}
          step={1}
          value={marks[key] ?? ''}
          onChange={(e) => handleMarkChange(key, e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder={`${ar.retake.outOf} ${max}`}
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">/ {max}</span>
      </div>
    </div>
  );

  /* ---------- render ---------- */
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {ar.retake.title}
      </h1>
      <p className="text-gray-500 mb-8">{ar.retake.description}</p>

      {/* ── Stream selector ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{ar.retake.selectStream}</h2>
        <div className="flex gap-4">
          {(['scientific', 'literary'] as Stream[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStreamChange(s)}
              className={`flex-1 py-3 rounded-lg font-semibold transition text-base
                ${
                  stream === s
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {ar.streams[s]}
            </button>
          ))}
        </div>
      </section>

      {/* ── Subject marks ── */}
      {stream && (
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar.retake.enterMarks}
          </h2>

          {stream === 'scientific' && (
            <>
              {markInput('arabic', 200)}
              {markInput('english', 200)}
              {markInput('jordanHistory', 200)}
              {markInput('religion', 200)}
              {markInput('mathP1', 100)}
              {markInput('mathP2', 100)}

              <div className="mt-5 mb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {ar.retake.selectSciences}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SCIENCE_OPTIONS.map((sci) => (
                    <button
                      key={sci}
                      onClick={() => toggleScience(sci)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition
                        ${
                          selectedSciences.includes(sci)
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {subjectName(sci)}
                    </button>
                  ))}
                </div>
                {selectedSciences.map((sci) => markInput(sci, 200))}
              </div>
            </>
          )}

          {stream === 'literary' && (
            <>
              {markInput('english', 200)}
              {markInput('arabicSkills', 200)}
              {markInput('arabicSpec', 200)}
              {markInput('jordanHistory', 200)}
              {markInput('financialCulture', 200)}
              {markInput('religion', 200)}
              {markInput('computer', 200)}

              <div className="mt-5 mb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {ar.retake.selectElective}
                </h3>
                <div className="flex gap-2 mb-4">
                  {LITERARY_ELECTIVE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedElective(opt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition
                        ${
                          selectedElective === opt
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {subjectName(opt)}
                    </button>
                  ))}
                </div>
                {selectedElective && markInput(selectedElective, 200)}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Target + calculate ── */}
      {stream && (
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5">
            <label className="text-sm font-semibold text-gray-700 sm:w-44 shrink-0">
              {ar.retake.targetAverage}
            </label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="number"
                min={1}
                max={100}
                step={0.1}
                value={targetAverage}
                onChange={(e) => setTargetAverage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder={ar.retake.targetPlaceholder}
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>
          )}

          <button
            onClick={handleCalculate}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold
                       hover:bg-blue-700 active:bg-blue-800 transition text-base"
          >
            {ar.retake.calculate}
          </button>
        </section>
      )}

      {/* ── Results ── */}
      {result && (
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{ar.retake.results}</h2>

          {/* Current average badge */}
          <div className="mb-5 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {ar.retake.currentAverage}
            </span>
            <span className="text-2xl font-bold text-gray-800">
              %{result.currentAverage}
            </span>
          </div>

          {/* Status: already achieved */}
          {result.status === 'already_achieved' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">
                ✅ {ar.retake.alreadyAchieved}
              </p>
            </div>
          )}

          {/* Status: impossible */}
          {result.status === 'impossible' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <p className="text-red-700 font-semibold">
                ❌ {ar.retake.impossible}
              </p>
              <p className="text-red-600 text-sm">
                {ar.retake.maxAchievable}:{' '}
                <span className="font-bold">%{result.maxAchievableAverage}</span>
              </p>
            </div>
          )}

          {/* Status: achievable */}
          {result.status === 'achievable' && (
            <>
              <p className="text-green-700 font-semibold mb-4">
                ✅ {ar.retake.achievable}
              </p>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-start py-3 px-4 font-semibold text-gray-700">
                        {ar.retake.subject}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        {ar.retake.currentMark}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        {ar.retake.targetMark}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        {ar.retake.pointsToGain}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subjectsToRetake.map((s) => (
                      <tr
                        key={s.key}
                        className="border-t border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4 font-medium">
                          {subjectName(s.key)}
                        </td>
                        <td className="text-center py-3 px-4">{s.current}</td>
                        <td className="text-center py-3 px-4 text-blue-600 font-bold">
                          {s.target}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
                            +{s.gain}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <Disclaimer />
    </div>
  );
}
