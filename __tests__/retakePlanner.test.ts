import {
  calculateRetake,
  buildScientificSubjects,
  buildLiterarySubjects,
  TOTAL_MAX,
} from '../lib/retakePlanner';
import type { SubjectInput } from '../lib/types';

/* ------------------------------------------------------------------ */
/*  helpers                                                           */
/* ------------------------------------------------------------------ */
const makeSubjects = (currents: number[], max = 200): SubjectInput[] =>
  currents.map((c, i) => ({ key: `s${i}`, current: c, max }));

/* ================================================================== */
/*  calculateRetake                                                   */
/* ================================================================== */
describe('calculateRetake', () => {
  it('returns already_achieved when current average meets target', () => {
    // 8 × 160 = 1280 → 80 %
    const result = calculateRetake(makeSubjects(Array(8).fill(160)), 80);
    expect(result.status).toBe('already_achieved');
    expect(result.currentAverage).toBe(80);
    expect(result.subjectsToRetake).toHaveLength(0);
  });

  it('returns already_achieved when current average exceeds target', () => {
    // 8 × 180 = 1440 → 90 %
    const result = calculateRetake(makeSubjects(Array(8).fill(180)), 85);
    expect(result.status).toBe('already_achieved');
    expect(result.currentAverage).toBe(90);
  });

  it('returns already_achieved at boundary (current == target exactly)', () => {
    // 8 × 160 = 1280 → 80 %  target 80 %
    const result = calculateRetake(makeSubjects(Array(8).fill(160)), 80);
    expect(result.status).toBe('already_achieved');
  });

  it('returns impossible when target exceeds 100 %', () => {
    // all maxed → room = 0, target 101 impossible
    const result = calculateRetake(makeSubjects(Array(8).fill(200)), 101);
    expect(result.status).toBe('impossible');
    expect(result.maxAchievableAverage).toBe(100);
  });

  it('selects the single subject with most room when one suffices', () => {
    const subjects: SubjectInput[] = [
      { key: 'a', current: 190, max: 200 }, // room 10
      { key: 'b', current: 100, max: 200 }, // room 100  ← best
      { key: 'c', current: 180, max: 200 }, // room 20
      { key: 'd', current: 200, max: 200 },
      { key: 'e', current: 200, max: 200 },
      { key: 'f', current: 200, max: 200 },
      { key: 'g', current: 200, max: 200 },
      { key: 'h', current: 200, max: 200 },
    ];
    // total = 1470, avg ≈ 91.88 %  target 95 % → need 50
    const result = calculateRetake(subjects, 95);
    expect(result.status).toBe('achievable');
    expect(result.subjectsToRetake).toHaveLength(1);
    expect(result.subjectsToRetake[0].key).toBe('b');
    expect(result.subjectsToRetake[0].gain).toBe(50);
    expect(result.subjectsToRetake[0].target).toBe(150);
  });

  it('selects multiple subjects when one is not enough', () => {
    // 8 × 100 = 800 → 50 %  target 75 % → gap = 400
    // each has room 100 → need 4 subjects fully maxed
    const result = calculateRetake(makeSubjects(Array(8).fill(100)), 75);
    expect(result.status).toBe('achievable');
    expect(result.subjectsToRetake).toHaveLength(4);
    result.subjectsToRetake.forEach((s) => expect(s.gain).toBe(100));
  });

  it('handles all-zero marks', () => {
    // total = 0, target 50 % → gap = 800, room per subject = 200
    // need 4 subjects (4 × 200 = 800)
    const result = calculateRetake(makeSubjects(Array(8).fill(0)), 50);
    expect(result.status).toBe('achievable');
    expect(result.subjectsToRetake).toHaveLength(4);
  });

  it('picks subjects greedily by room descending', () => {
    const subjects: SubjectInput[] = [
      { key: 'a', current: 50, max: 200 },  // room 150
      { key: 'b', current: 150, max: 200 }, // room 50
      { key: 'c', current: 170, max: 200 }, // room 30
      { key: 'd', current: 160, max: 200 }, // room 40
      { key: 'e', current: 200, max: 200 },
      { key: 'f', current: 200, max: 200 },
      { key: 'g', current: 200, max: 200 },
      { key: 'h', current: 200, max: 200 },
    ];
    // total = 1330, avg = 83.125 %  target 90 % → gap = 110
    // Subject a (room 150) alone covers it → gain = 110
    const result = calculateRetake(subjects, 90);
    expect(result.status).toBe('achievable');
    expect(result.subjectsToRetake).toHaveLength(1);
    expect(result.subjectsToRetake[0].key).toBe('a');
    expect(result.subjectsToRetake[0].gain).toBe(110);
  });

  it('correctly computes currentAverage', () => {
    // 120+140+160+180+200+100+150+150 = 1200 → 75 %
    const result = calculateRetake(
      makeSubjects([120, 140, 160, 180, 200, 100, 150, 150]),
      70,
    );
    expect(result.currentAverage).toBe(75);
    expect(result.status).toBe('already_achieved');
  });

  it('caps individual subject gain at room', () => {
    // One subject nearly full, one with room
    const subjects: SubjectInput[] = [
      { key: 'a', current: 195, max: 200 }, // room 5
      { key: 'b', current: 195, max: 200 }, // room 5
      { key: 'c', current: 100, max: 200 }, // room 100
      { key: 'd', current: 200, max: 200 },
      { key: 'e', current: 200, max: 200 },
      { key: 'f', current: 200, max: 200 },
      { key: 'g', current: 200, max: 200 },
      { key: 'h', current: 200, max: 200 },
    ];
    // total = 1490, target 97 % → targetTotal = 1552, gap = 62
    // Sort by room: c(100), a(5), b(5)
    // Take c: gain = 62 → done
    const result = calculateRetake(subjects, 97);
    expect(result.status).toBe('achievable');
    expect(result.subjectsToRetake).toHaveLength(1);
    expect(result.subjectsToRetake[0].key).toBe('c');
  });
});

/* ================================================================== */
/*  buildScientificSubjects                                           */
/* ================================================================== */
describe('buildScientificSubjects', () => {
  it('creates 8 subjects and combines math papers', () => {
    const marks = {
      arabic: 180,
      english: 170,
      jordanHistory: 160,
      religion: 150,
      mathP1: 80,
      mathP2: 70,
      biology: 140,
      chemistry: 130,
      physics: 120,
    };
    const subjects = buildScientificSubjects(marks, [
      'biology',
      'chemistry',
      'physics',
    ]);
    expect(subjects).toHaveLength(8);

    const math = subjects.find((s) => s.key === 'math')!;
    expect(math.current).toBe(150); // 80 + 70
    expect(math.max).toBe(200);

    const total = subjects.reduce((sum, s) => sum + s.current, 0);
    expect(total).toBe(180 + 170 + 160 + 150 + 150 + 140 + 130 + 120);
  });

  it('defaults missing marks to 0', () => {
    const subjects = buildScientificSubjects({}, [
      'biology',
      'chemistry',
      'physics',
    ]);
    expect(subjects).toHaveLength(8);
    expect(subjects.every((s) => s.current === 0)).toBe(true);
  });
});

/* ================================================================== */
/*  buildLiterarySubjects                                             */
/* ================================================================== */
describe('buildLiterarySubjects', () => {
  it('creates 8 subjects with the chosen elective', () => {
    const marks = {
      english: 180,
      arabicSkills: 170,
      arabicSpec: 160,
      jordanHistory: 150,
      financialCulture: 140,
      religion: 130,
      computer: 120,
      geography: 110,
    };
    const subjects = buildLiterarySubjects(marks, 'geography');
    expect(subjects).toHaveLength(8);

    const geo = subjects.find((s) => s.key === 'geography')!;
    expect(geo.current).toBe(110);
    expect(geo.max).toBe(200);
  });

  it('defaults missing marks to 0', () => {
    const subjects = buildLiterarySubjects({}, 'islamicStudies');
    expect(subjects).toHaveLength(8);
    expect(subjects.every((s) => s.current === 0)).toBe(true);
  });
});
