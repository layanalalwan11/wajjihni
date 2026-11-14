import { QUIZ_QUESTIONS, QuizQuestion } from './quizData';

export type GuidanceStreamId = 'scientific' | 'literary' | 'sharia' | 'vocational';

export interface StreamGuidanceResult {
  streamId: GuidanceStreamId;
  nameAr: string;
  score: number; // 0 - 100 percentage
  allowed: boolean;
  statusLabelAr: string; // "الأنسب لك", "مناسب", "غير مُوصى به", "غير متاح"
  adviceAr: string;
}

export interface GuidanceResult {
  grade10Average: number;
  isScientificAllowed: boolean;
  rankedStreams: StreamGuidanceResult[];
}

const STREAM_NAMES: Record<GuidanceStreamId, string> = {
  scientific: 'علمي',
  literary: 'أدبي',
  sharia: 'شرعي',
  vocational: 'مهني',
};

const DEFAULT_ADVICE: Record<
  GuidanceStreamId,
  { high: string; medium: string; low: string; blocked?: string }
> = {
  scientific: {
    high: 'قدراتك واهتماماتك تتناسب بقوة مع المسار العلمي والتخصصات الهندسية والطبية والتكنولوجية.',
    medium: 'لديك اهتمام جيد بالعلوم والرياضيات، والفرع العلمي خيار متاح أمامك مع بذل جهد إضافي.',
    low: 'اهتماماتك العلمية والرياضية منخفضة نسبياً، قد تجد مجالك الأنسب في فرع آخر.',
    blocked: 'الفرع العلمي يتطلب معدل 80% أو أعلى في الصف العاشر (معدلك الحالي لا يؤهلك له).',
  },
  literary: {
    high: 'تمتلك مهارات لغوية واجتماعية مميزة تناسب مجالات الآداب، اللغات، القانون، الصحافة، وإدارة الأعمال.',
    medium: 'الفرع الأدبي خيار متوازن يمنحك فرصاً واسعة في تخصصات العلوم الإنسانية والإدارية والتربوية.',
    low: 'اهتماماتك الأدبية واللغوية محدودة، يُفضل التركيز على الفروع التي تتطابق أكثر مع ميولك.',
  },
  sharia: {
    high: 'لديك شغف كبير بالعلوم الشرعية والفقه وأصول الدين، مما يؤهلك للتميز في القضاء الشرعي والتعليم والدراسات الإسلامية.',
    medium: 'الفرع الشرعي مناسب لمن يرغب في التخصص الأكاديمي الديني والتربوي واللغوي.',
    low: 'ميولك للعلوم الشرعية المتخصصة أقل مقارنة بالفروع الأخرى.',
  },
  vocational: {
    high: 'ميولك التطبيقية والعملية تجعل التعليم المهني مساراً مثالياً يمنحك مهارات احترافية وفرصاً مباشرة في سوق العمل.',
    medium: 'التعليم المهني خيار عملي قيّم إذا كنت تفضل المشاريع اليدوية والتقنية على النظريات.',
    low: 'تفضيلك للتعليم التطبيقي الميداني منخفض مقارنة بالمسارات الأكاديمية النظرية.',
  },
};

export function calculateGuidance(
  grade10Average: number,
  answers: Record<number, number>, // questionId -> value from 1 to 5
): GuidanceResult {
  const isScientificAllowed = grade10Average >= 80;

  // Max score calculation for normalization
  const maxPossible: Record<GuidanceStreamId, number> = {
    scientific: 0,
    literary: 0,
    sharia: 0,
    vocational: 0,
  };

  const rawScores: Record<GuidanceStreamId, number> = {
    scientific: 0,
    literary: 0,
    sharia: 0,
    vocational: 0,
  };

  for (const q of QUIZ_QUESTIONS) {
    const ans = answers[q.id] ?? 3; // default neutral
    for (const [st, weight] of Object.entries(q.weights) as [GuidanceStreamId, number][]) {
      maxPossible[st] += weight * 5;
      rawScores[st] += weight * ans;
    }
  }

  const streams: GuidanceStreamId[] = ['scientific', 'literary', 'sharia', 'vocational'];

  const scoredStreams: StreamGuidanceResult[] = streams.map((st) => {
    const max = maxPossible[st] || 1;
    const raw = rawScores[st];
    const pct = Math.round((raw / max) * 100);

    const allowed = st === 'scientific' ? isScientificAllowed : true;

    let statusLabelAr = '';
    let adviceAr = '';

    if (!allowed) {
      statusLabelAr = 'غير متاح';
      adviceAr = DEFAULT_ADVICE.scientific.blocked!;
    } else if (pct >= 75) {
      statusLabelAr = 'الأنسب لك';
      adviceAr = DEFAULT_ADVICE[st].high;
    } else if (pct >= 50) {
      statusLabelAr = 'مناسب';
      adviceAr = DEFAULT_ADVICE[st].medium;
    } else {
      statusLabelAr = 'غير مُوصى به';
      adviceAr = DEFAULT_ADVICE[st].low;
    }

    return {
      streamId: st,
      nameAr: STREAM_NAMES[st],
      score: pct,
      allowed,
      statusLabelAr,
      adviceAr,
    };
  });

  // Rank streams: allowed streams come first, sorted by score descending; blocked streams at bottom
  scoredStreams.sort((a, b) => {
    if (a.allowed && !b.allowed) return -1;
    if (!a.allowed && b.allowed) return 1;
    return b.score - a.score;
  });

  // If top allowed stream exists and has highest score, make sure its label reflects top fit
  const topAllowed = scoredStreams.find((s) => s.allowed);
  if (topAllowed && topAllowed.score >= 50) {
    topAllowed.statusLabelAr = 'الأنسب لك';
  }

  return {
    grade10Average,
    isScientificAllowed,
    rankedStreams: scoredStreams,
  };
}
