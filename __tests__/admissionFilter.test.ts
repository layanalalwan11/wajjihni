import {
  calculateChance,
  filterAdmissions,
  AdmissionRecord,
  UniversityInfo,
} from '../lib/admissionFilter';

describe('calculateChance', () => {
  it('returns high when average >= cutoff + 3', () => {
    expect(calculateChance(93, 90)).toBe('high');
    expect(calculateChance(95, 90)).toBe('high');
  });

  it('returns possible when within ±3', () => {
    expect(calculateChance(92.9, 90)).toBe('possible');
    expect(calculateChance(90, 90)).toBe('possible');
    expect(calculateChance(87.0, 90)).toBe('possible');
  });

  it('returns hard when average < cutoff - 3', () => {
    expect(calculateChance(86.9, 90)).toBe('hard');
    expect(calculateChance(70, 90)).toBe('hard');
  });
});

describe('filterAdmissions', () => {
  const mockUniversities: UniversityInfo[] = [
    { id: 'uj', nameAr: 'الجامعة الأردنية', city: 'عمان' },
    { id: 'yu', nameAr: 'جامعة اليرموك', city: 'إربد' },
    { id: 'hu', nameAr: 'الجامعة الهاشمية', city: 'الزرقاء' },
  ];

  const mockRecords: AdmissionRecord[] = [
    {
      id: 1,
      universityId: 'uj',
      majorAr: 'الطب البشري',
      field: 'health',
      allowedStreams: ['علمي'],
      campus: null,
      technicalProgram: false,
      gender: null,
      cutoff2026: 98.0,
      change: 0.5,
      cutoff2025Derived: 97.5,
      year: '2026/2027',
    },
    {
      id: 2,
      universityId: 'yu',
      majorAr: 'الطب البشري',
      field: 'health',
      allowedStreams: ['علمي'],
      campus: null,
      technicalProgram: false,
      gender: null,
      cutoff2026: 96.0,
      change: 0.2,
      cutoff2025Derived: 95.8,
      year: '2026/2027',
    },
    {
      id: 3,
      universityId: 'uj',
      majorAr: 'المحاسبة',
      field: 'business',
      allowedStreams: ['علمي', 'أدبي'],
      campus: null,
      technicalProgram: false,
      gender: null,
      cutoff2026: 88.0,
      change: 1.0,
      cutoff2025Derived: 87.0,
      year: '2026/2027',
    },
    {
      id: 4,
      universityId: 'yu',
      majorAr: 'المحاسبة',
      field: 'business',
      allowedStreams: ['علمي', 'أدبي'],
      campus: null,
      technicalProgram: false,
      gender: null,
      cutoff2026: 82.0,
      change: 0.5,
      cutoff2025Derived: 81.5,
      year: '2026/2027',
    },
    {
      id: 5,
      universityId: 'hu',
      majorAr: 'الشريعة والدراسات الإسلامية',
      field: 'sharia',
      allowedStreams: ['علمي', 'أدبي', 'شرعي'],
      campus: null,
      technicalProgram: false,
      gender: null,
      cutoff2026: 78.0,
      change: 0.0,
      cutoff2025Derived: 78.0,
      year: '2026/2027',
    },
  ];

  it('filters out scientific-only majors for literary students', () => {
    const result = filterAdmissions(
      mockRecords,
      mockUniversities,
      85,
      'أدبي',
      'all',
    );

    // Literary cannot enter 'الطب البشري'
    const hasMedicine = result.majors.some((m) => m.majorAr === 'الطب البشري');
    expect(hasMedicine).toBe(false);

    // Can enter 'المحاسبة' and 'الشريعة والدراسات الإسلامية'
    const majors = result.majors.map((m) => m.majorAr);
    expect(majors).toContain('المحاسبة');
    expect(majors).toContain('الشريعة والدراسات الإسلامية');
  });

  it('groups multiple universities under the same major and finds the best university', () => {
    // Student average 86 in scientific
    const result = filterAdmissions(
      mockRecords,
      mockUniversities,
      86,
      'علمي',
      'all',
    );

    const accounting = result.majors.find((m) => m.majorAr === 'المحاسبة')!;
    expect(accounting).toBeDefined();
    expect(accounting.universities).toHaveLength(2);

    // At YU cutoff 82 -> student avg 86 >= 82+3 (diff +4) -> high chance
    // At UJ cutoff 88 -> student avg 86 within ±3 (diff -2) -> possible chance
    expect(accounting.bestChance).toBe('high');
    expect(accounting.bestUniversity.universityId).toBe('yu');
    expect(accounting.bestUniversity.chance).toBe('high');
  });

  it('prioritizes preferred sector when selected', () => {
    // Student with avg 85 prefers 'sharia'
    const result = filterAdmissions(
      mockRecords,
      mockUniversities,
      85,
      'علمي',
      'sharia',
    );

    // Sharia should appear first because it matches preferredSector
    expect(result.majors[0].field).toBe('sharia');
    expect(result.majors[0].isPreferredSector).toBe(true);
  });

  it('reports hasFittingOptions as false when student average is too low', () => {
    // Student with average 50
    const result = filterAdmissions(
      mockRecords,
      mockUniversities,
      50,
      'علمي',
      'all',
    );

    expect(result.hasFittingOptions).toBe(false);
    expect(result.highChanceCount).toBe(0);
    expect(result.possibleChanceCount).toBe(0);
    expect(result.hardChanceCount).toBeGreaterThan(0);
  });

  it('handles vocational stream by returning empty results for public admission table', () => {
    const result = filterAdmissions(
      mockRecords,
      mockUniversities,
      85,
      'مهني',
      'all',
    );

    expect(result.majors).toHaveLength(0);
    expect(result.hasFittingOptions).toBe(false);
  });
});
