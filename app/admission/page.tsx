'use client';

import { useState, useEffect } from 'react';
import {
  AdmissionRecord,
  UniversityInfo,
  TawjihiStream,
  ChanceLevel,
  filterAdmissions,
  AdmissionFilterResult,
  SECTOR_NAMES_AR,
} from '@/lib/admissionFilter';
import Disclaimer from '@/components/Disclaimer';
import ar from '@/lib/ar.json';

const STREAMS: TawjihiStream[] = ['علمي', 'أدبي', 'شرعي', 'مهني'];

export default function AdmissionPage() {
  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [universities, setUniversities] = useState<UniversityInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [averageInput, setAverageInput] = useState('');
  const [selectedStream, setSelectedStream] = useState<TawjihiStream | ''>('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [chanceFilter, setChanceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Result state
  const [result, setResult] = useState<AdmissionFilterResult | null>(null);
  const [error, setError] = useState('');
  const [expandedMajor, setExpandedMajor] = useState<string | null>(null);

  // Load JSON data at runtime from /data/
  useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const [admRes, uniRes] = await Promise.all([
          fetch(`${basePath}/data/admissions.json`),
          fetch(`${basePath}/data/universities.json`),
        ]);
        const admData = await admRes.json();
        const uniData = await uniRes.json();

        setRecords(admData.records || []);
        setUniversities(uniData || []);
      } catch (err) {
        console.error('Failed to load admission data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = () => {
    setError('');
    const avg = parseFloat(averageInput);
    if (isNaN(avg) || avg < 50 || avg > 100) {
      setError(ar.admission.errorEnterAverage + ' (بين 50 و 100)');
      return;
    }
    if (!selectedStream) {
      setError(ar.admission.errorSelectStream);
      return;
    }

    const res = filterAdmissions(
      records,
      universities,
      avg,
      selectedStream,
      selectedSector,
      chanceFilter,
      searchQuery,
    );
    setResult(res);
  };

  // Re-filter when chanceFilter or searchQuery changes if already calculated
  useEffect(() => {
    if (result && selectedStream && averageInput) {
      const avg = parseFloat(averageInput);
      if (!isNaN(avg)) {
        const res = filterAdmissions(
          records,
          universities,
          avg,
          selectedStream,
          selectedSector,
          chanceFilter,
          searchQuery,
        );
        setResult(res);
      }
    }
  }, [chanceFilter, searchQuery, selectedSector]);

  const toggleExpand = (majorName: string) => {
    setExpandedMajor((prev) => (prev === majorName ? null : majorName));
  };

  const chanceBadge = (chance: ChanceLevel) => {
    if (chance === 'high') {
      return (
        <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-2.5 py-1 rounded-full font-bold">
          {ar.admission.chanceHigh}
        </span>
      );
    }
    if (chance === 'possible') {
      return (
        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-bold">
          {ar.admission.chancePossible}
        </span>
      );
    }
    return (
      <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-1 rounded-full font-bold">
        {ar.admission.chanceHard}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">جاري تحميل بيانات القبول الموحد...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {ar.admission.title}
      </h1>
      <p className="text-gray-500 mb-8">{ar.admission.description}</p>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Average */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {ar.admission.enterAverage}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={100}
                step={0.01}
                value={averageInput}
                onChange={(e) => setAverageInput(e.target.value)}
                placeholder={ar.admission.averagePlaceholder}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          {/* Stream */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {ar.admission.selectStream}
            </label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value as TawjihiStream)}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              <option value="">{ar.retake.selectStream}</option>
              {STREAMS.map((s) => (
                <option key={s} value={s}>
                  الفرع {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {ar.admission.selectSector}
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              <option value="all">{ar.admission.allSectors}</option>
              {Object.entries(SECTOR_NAMES_AR).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>
        )}

        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-lg transition text-base shadow-sm"
        >
          {ar.admission.search}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div>
          {/* Vocational Notice */}
          {result.stream === 'مهني' ? (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 text-amber-900 mb-8 space-y-2">
              <h3 className="font-bold text-lg">ملاحظة لطلبة المسار المهني:</h3>
              <p className="text-sm leading-relaxed">
                يتم قبول طلبة المسار المهني بمعدلات تنافسية مستقلة ومقاعد مخصصة بنسبة 20%، وتختلف التخصصات المتاحة حسب المسار المهني المعتمد. بيانات القبول الموحد الحالية تغطي التنافس الأكاديمي العام فقط.
              </p>
              <p className="text-sm font-semibold">
                {ar.admission.parallelNote}
              </p>
            </div>
          ) : (
            <>
              {/* Stats & Filters */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 ml-2">
                    {ar.admission.filterByChance}:
                  </span>
                  <button
                    onClick={() => setChanceFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      chanceFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ar.admission.all} ({result.totalMajorsCount})
                  </button>
                  <button
                    onClick={() => setChanceFilter('high')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      chanceFilter === 'high'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-800 hover:bg-green-100'
                    }`}
                  >
                    {ar.admission.chanceHigh} ({result.highChanceCount})
                  </button>
                  <button
                    onClick={() => setChanceFilter('possible')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      chanceFilter === 'possible'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {ar.admission.chancePossible} ({result.possibleChanceCount})
                  </button>
                  <button
                    onClick={() => setChanceFilter('hard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      chanceFilter === 'hard'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-800 hover:bg-red-100'
                    }`}
                  >
                    {ar.admission.chanceHard} ({result.hardChanceCount})
                  </button>
                </div>

                {/* Search input */}
                <div className="w-full md:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن تخصص أو جامعة..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Parallel Program / Private Note if no high or possible fitting options */}
              {!result.hasFittingOptions && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-blue-900">
                  <p className="font-semibold text-sm mb-1">
                    ℹ️ لا تتوفر فرص قبول تنافسي مرتفعة أو ممكنة بهذا المعدل في القبول الموحد للجامعات الرسمية.
                  </p>
                  <p className="text-xs leading-relaxed text-blue-800">
                    {ar.admission.parallelNote}
                  </p>
                </div>
              )}

              {/* Majors List */}
              {result.majors.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100 mb-8">
                  <p className="text-gray-500 font-medium mb-3">
                    {ar.admission.noResults}
                  </p>
                  <p className="text-sm text-blue-600">
                    {ar.admission.parallelNote}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {result.majors.map((major) => {
                    const isExpanded = expandedMajor === major.majorAr;
                    return (
                      <div
                        key={major.majorAr}
                        className={`bg-white rounded-xl shadow-sm border transition overflow-hidden ${
                          major.isPreferredSector
                            ? 'border-blue-400 ring-1 ring-blue-100'
                            : 'border-gray-200'
                        }`}
                      >
                        {/* Major Header Card */}
                        <div
                          onClick={() => toggleExpand(major.majorAr)}
                          className="p-5 cursor-pointer hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="text-lg font-bold text-gray-800">
                                {major.majorAr}
                              </h3>
                              {major.isPreferredSector && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">
                                  قطاعك المفضل
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span>القطاع: {major.fieldAr}</span>
                              <span>•</span>
                              <span>
                                أفضل جامعة تناسبك: {major.bestUniversity.universityNameAr} (أدنى معدل: {major.lowestCutoff})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            {chanceBadge(major.bestChance)}
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-1"
                              aria-label="عرض الجامعات"
                            >
                              {isExpanded ? '▲ إخفاء' : `▼ الجامعات (${major.universities.length})`}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Universities Table */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4">
                            <h4 className="text-xs font-bold text-gray-700 mb-3">
                              الجامعات الرسمية التي تطرح تخصص ({major.majorAr}) ومعدلات القبول التنافسي 2026:
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200 text-gray-600">
                                    <th className="text-start py-2 px-3 font-semibold">
                                      {ar.admission.university}
                                    </th>
                                    <th className="text-start py-2 px-3 font-semibold">
                                      {ar.admission.city}
                                    </th>
                                    <th className="text-center py-2 px-3 font-semibold">
                                      {ar.admission.cutoff}
                                    </th>
                                    <th className="text-center py-2 px-3 font-semibold">
                                      الفرق عن معدلك
                                    </th>
                                    <th className="text-center py-2 px-3 font-semibold">
                                      {ar.admission.chance}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {major.universities.map((u) => (
                                    <tr
                                      key={`${u.universityId}-${u.gender || 'all'}`}
                                      className="border-b border-gray-100 hover:bg-white transition"
                                    >
                                      <td className="py-2.5 px-3 font-medium text-gray-800">
                                        {u.universityNameAr}
                                        {u.gender && (
                                          <span className="text-gray-400 mr-1">
                                            ({u.gender})
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-gray-500">
                                        {u.city}
                                      </td>
                                      <td className="text-center py-2.5 px-3 font-bold text-gray-800">
                                        %{u.cutoff2026}
                                      </td>
                                      <td className="text-center py-2.5 px-3 font-semibold">
                                        <span
                                          className={
                                            u.diff >= 0
                                              ? 'text-green-600'
                                              : 'text-red-500'
                                          }
                                        >
                                          {u.diff >= 0 ? `+${u.diff}` : u.diff}
                                        </span>
                                      </td>
                                      <td className="text-center py-2.5 px-3">
                                        {chanceBadge(u.chance)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <Disclaimer />
        </div>
      )}

      {/* When no search has been submitted yet */}
      {!result && <Disclaimer />}
    </div>
  );
}
