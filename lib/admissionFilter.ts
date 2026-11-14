export type TawjihiStream = 'علمي' | 'أدبي' | 'شرعي' | 'مهني';

export type ChanceLevel = 'high' | 'possible' | 'hard';

export interface AdmissionRecord {
  id: number;
  universityId: string;
  majorAr: string;
  field: string;
  allowedStreams?: string[];
  campus: string | null;
  technicalProgram: boolean;
  gender: string | null;
  cutoff2026: number;
  change: number;
  cutoff2025Derived: number;
  year: string;
}

export interface UniversityInfo {
  id: string;
  nameAr: string;
  nameEn?: string;
  city: string;
  type?: string;
}

export interface UniversityOption {
  universityId: string;
  universityNameAr: string;
  city: string;
  cutoff2026: number;
  cutoff2025Derived: number;
  change: number;
  gender: string | null;
  chance: ChanceLevel;
  diff: number; // studentAverage - cutoff2026
}

export interface FilteredMajor {
  majorAr: string;
  field: string;
  fieldAr: string;
  allowedStreams: string[];
  universities: UniversityOption[];
  bestChance: ChanceLevel;
  bestUniversity: UniversityOption;
  lowestCutoff: number;
  highestCutoff: number;
  isPreferredSector: boolean;
}

export interface AdmissionFilterResult {
  studentAverage: number;
  stream: TawjihiStream;
  preferredSector: string; // 'all' or field key
  majors: FilteredMajor[];
  totalMajorsCount: number;
  highChanceCount: number;
  possibleChanceCount: number;
  hardChanceCount: number;
  hasFittingOptions: boolean; // true if at least 1 high or possible chance major exists
}

export const SECTOR_NAMES_AR: Record<string, string> = {
  health: 'صحي / طبي',
  engineering: 'هندسي',
  science_tech: 'علوم وتكنولوجيا (حاسوب، علوم، زراعة)',
  business: 'أعمال وسياحة',
  humanities: 'لغات وعلوم اجتماعية وآداب وفنون',
  education: 'تربية',
  law: 'قانون',
  sharia: 'علوم شرعية',
};

/**
 * Computes chance label according to:
 * - High: studentAverage >= cutoff + 3
 * - Possible: within ±3 (cutoff - 3 <= studentAverage < cutoff + 3)
 * - Hard: studentAverage < cutoff - 3
 */
export function calculateChance(studentAverage: number, cutoff: number): ChanceLevel {
  const diff = studentAverage - cutoff;
  if (diff >= 3) {
    return 'high';
  }
  if (diff >= -3) {
    return 'possible';
  }
  return 'hard';
}

const CHANCE_RANK: Record<ChanceLevel, number> = {
  high: 3,
  possible: 2,
  hard: 1,
};

export function filterAdmissions(
  records: AdmissionRecord[],
  universities: UniversityInfo[],
  studentAverage: number,
  stream: TawjihiStream,
  preferredSector: string = 'all',
  chanceFilter: string = 'all', // 'all' | 'high' | 'possible' | 'hard'
  searchQuery: string = '',
): AdmissionFilterResult {
  const uniMap = new Map<string, UniversityInfo>();
  universities.forEach((u) => uniMap.set(u.id, u));

  // If student is vocational (مهني), this competitive table does not cover it
  if (stream === 'مهني') {
    return {
      studentAverage,
      stream,
      preferredSector,
      majors: [],
      totalMajorsCount: 0,
      highChanceCount: 0,
      possibleChanceCount: 0,
      hardChanceCount: 0,
      hasFittingOptions: false,
    };
  }

  // 1. Filter records by stream access
  const eligibleRecords = records.filter((r) => {
    if (!r.allowedStreams || r.allowedStreams.length === 0) return true;
    return r.allowedStreams.includes(stream);
  });

  // 2. Group by majorAr
  const majorGroups = new Map<string, AdmissionRecord[]>();
  eligibleRecords.forEach((r) => {
    const list = majorGroups.get(r.majorAr) || [];
    list.push(r);
    majorGroups.set(r.majorAr, list);
  });

  // 3. Transform to FilteredMajor
  const groupedMajors: FilteredMajor[] = [];

  for (const [majorAr, recs] of majorGroups.entries()) {
    const field = recs[0].field;
    const fieldAr = SECTOR_NAMES_AR[field] || field;
    const allowedStreams = recs[0].allowedStreams || [];

    const uniOptions: UniversityOption[] = recs.map((r) => {
      const uInfo = uniMap.get(r.universityId);
      const diff = Number((studentAverage - r.cutoff2026).toFixed(2));
      const chance = calculateChance(studentAverage, r.cutoff2026);

      return {
        universityId: r.universityId,
        universityNameAr: uInfo ? uInfo.nameAr : r.universityId,
        city: uInfo ? uInfo.city : '',
        cutoff2026: r.cutoff2026,
        cutoff2025Derived: r.cutoff2025Derived,
        change: r.change,
        gender: r.gender,
        chance,
        diff,
      };
    });

    // Sort universities for this major: best chance first (high -> possible -> hard), then lowest cutoff
    uniOptions.sort((a, b) => {
      const rankDiff = CHANCE_RANK[b.chance] - CHANCE_RANK[a.chance];
      if (rankDiff !== 0) return rankDiff;
      return a.cutoff2026 - b.cutoff2026;
    });

    const cutoffs = uniOptions.map((u) => u.cutoff2026);
    const lowestCutoff = Math.min(...cutoffs);
    const highestCutoff = Math.max(...cutoffs);

    // Best chance for this major across universities offering it
    const bestChance = uniOptions[0].chance;
    const bestUniversity = uniOptions[0];

    groupedMajors.push({
      majorAr,
      field,
      fieldAr,
      allowedStreams,
      universities: uniOptions,
      bestChance,
      bestUniversity,
      lowestCutoff,
      highestCutoff,
      isPreferredSector: preferredSector !== 'all' && field === preferredSector,
    });
  }

  // Counts before search/chance filtering
  let highCount = 0;
  let possibleCount = 0;
  let hardCount = 0;

  groupedMajors.forEach((m) => {
    if (m.bestChance === 'high') highCount++;
    else if (m.bestChance === 'possible') possibleCount++;
    else hardCount++;
  });

  const hasFittingOptions = highCount + possibleCount > 0;

  // 4. Apply Sector Prioritization & Filtering
  let filtered = groupedMajors;

  // Filter by search query if any
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.majorAr.toLowerCase().includes(q) ||
        m.fieldAr.toLowerCase().includes(q) ||
        m.universities.some((u) => u.universityNameAr.toLowerCase().includes(q)),
    );
  }

  // Filter by Chance if selected
  if (chanceFilter !== 'all') {
    filtered = filtered.filter((m) => m.bestChance === chanceFilter);
  }

  // Sort: Preferred sector first, then chance rank descending, then lowest cutoff
  filtered.sort((a, b) => {
    // 1. Preferred sector first
    if (a.isPreferredSector && !b.isPreferredSector) return -1;
    if (!a.isPreferredSector && b.isPreferredSector) return 1;

    // 2. Best chance rank (high -> possible -> hard)
    const rankDiff = CHANCE_RANK[b.bestChance] - CHANCE_RANK[a.bestChance];
    if (rankDiff !== 0) return rankDiff;

    // 3. Lowest cutoff
    return a.lowestCutoff - b.lowestCutoff;
  });

  return {
    studentAverage,
    stream,
    preferredSector,
    majors: filtered,
    totalMajorsCount: groupedMajors.length,
    highChanceCount: highCount,
    possibleChanceCount: possibleCount,
    hardChanceCount: hardCount,
    hasFittingOptions,
  };
}
