export type StreamId = 'scientific' | 'literary';

export interface SubjectInput {
  key: string;
  current: number;
  max: number;
}

export interface RetakeSubject {
  key: string;
  current: number;
  target: number;
  gain: number;
}

export interface RetakeResult {
  status: 'already_achieved' | 'achievable' | 'impossible';
  currentTotal: number;
  currentAverage: number;
  targetTotal: number;
  targetAverage: number;
  maxAchievableAverage: number;
  subjectsToRetake: RetakeSubject[];
}
