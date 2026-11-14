import { SubjectInput, RetakeResult, RetakeSubject } from './types';

export const TOTAL_MAX = 1600;

/**
 * Core retake-planning algorithm.
 *
 * 1. If the student already meets the target → status "already_achieved".
 * 2. If even maxing every subject can't reach the target → status "impossible",
 *    with the best possible average reported.
 * 3. Otherwise → status "achievable": greedily pick the fewest subjects whose
 *    room-to-improve covers the gap (most room first).
 */
export function calculateRetake(
  subjects: SubjectInput[],
  targetAverage: number,
): RetakeResult {
  const currentTotal = subjects.reduce((s, sub) => s + sub.current, 0);
  const currentAverage = Number(((currentTotal / TOTAL_MAX) * 100).toFixed(2));
  const targetTotal = (targetAverage / 100) * TOTAL_MAX;

  /* ---------- already achieved ---------- */
  if (currentTotal >= targetTotal) {
    return {
      status: 'already_achieved',
      currentTotal,
      currentAverage,
      targetTotal,
      targetAverage,
      maxAchievableAverage: currentAverage,
      subjectsToRetake: [],
    };
  }

  const gap = targetTotal - currentTotal;
  const totalRoom = subjects.reduce(
    (s, sub) => s + Math.max(0, sub.max - sub.current),
    0,
  );

  /* ---------- impossible ---------- */
  if (gap > totalRoom) {
    return {
      status: 'impossible',
      currentTotal,
      currentAverage,
      targetTotal,
      targetAverage,
      maxAchievableAverage: Number(
        (((currentTotal + totalRoom) / TOTAL_MAX) * 100).toFixed(2),
      ),
      subjectsToRetake: [],
    };
  }

  /* ---------- achievable – greedy by most room ---------- */
  const sorted = subjects
    .map((sub) => ({ ...sub, room: Math.max(0, sub.max - sub.current) }))
    .filter((s) => s.room > 0)
    .sort((a, b) => b.room - a.room);

  let remaining = gap;
  const toRetake: RetakeSubject[] = [];

  for (const s of sorted) {
    if (remaining <= 0) break;
    const gain = Math.min(s.room, Math.ceil(remaining));
    toRetake.push({
      key: s.key,
      current: s.current,
      target: s.current + gain,
      gain,
    });
    remaining -= gain;
  }

  return {
    status: 'achievable',
    currentTotal,
    currentAverage,
    targetTotal,
    targetAverage,
    maxAchievableAverage: 100,
    subjectsToRetake: toRetake,
  };
}

/* ------------------------------------------------------------------ */
/*  Subject builders – turn raw form marks into the canonical 8-item  */
/*  array that calculateRetake expects.                               */
/* ------------------------------------------------------------------ */

/** Scientific stream: 4 mandatory + math (2 papers combined) + 3 elective sciences = 8 × /200 */
export function buildScientificSubjects(
  marks: Record<string, number>,
  selectedSciences: string[],
): SubjectInput[] {
  const mandatory: SubjectInput[] = [
    { key: 'arabic',       current: marks.arabic       ?? 0, max: 200 },
    { key: 'english',      current: marks.english      ?? 0, max: 200 },
    { key: 'jordanHistory', current: marks.jordanHistory ?? 0, max: 200 },
    { key: 'religion',     current: marks.religion     ?? 0, max: 200 },
  ];

  const math: SubjectInput = {
    key: 'math',
    current: (marks.mathP1 ?? 0) + (marks.mathP2 ?? 0),
    max: 200,
  };

  const sciences: SubjectInput[] = selectedSciences.map((sci) => ({
    key: sci,
    current: marks[sci] ?? 0,
    max: 200,
  }));

  return [...mandatory, math, ...sciences];
}

/** Literary stream: 7 mandatory + 1 elective = 8 × /200 */
export function buildLiterarySubjects(
  marks: Record<string, number>,
  selectedElective: string,
): SubjectInput[] {
  const mandatory: SubjectInput[] = [
    { key: 'english',          current: marks.english          ?? 0, max: 200 },
    { key: 'arabicSkills',     current: marks.arabicSkills     ?? 0, max: 200 },
    { key: 'arabicSpec',       current: marks.arabicSpec       ?? 0, max: 200 },
    { key: 'jordanHistory',    current: marks.jordanHistory    ?? 0, max: 200 },
    { key: 'financialCulture', current: marks.financialCulture ?? 0, max: 200 },
    { key: 'religion',         current: marks.religion         ?? 0, max: 200 },
    { key: 'computer',         current: marks.computer         ?? 0, max: 200 },
  ];

  const elective: SubjectInput = {
    key: selectedElective,
    current: marks[selectedElective] ?? 0,
    max: 200,
  };

  return [...mandatory, elective];
}
