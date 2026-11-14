import { calculateGuidance } from '../lib/guidancePlanner';
import { QUIZ_QUESTIONS } from '../lib/quizData';

describe('calculateGuidance', () => {
  it('blocks scientific stream if grade-10 average is below 80', () => {
    // Grade 10 average = 79.9
    const answers: Record<number, number> = {};
    QUIZ_QUESTIONS.forEach((q) => (answers[q.id] = 5)); // max interest in everything

    const result = calculateGuidance(79.9, answers);
    expect(result.isScientificAllowed).toBe(false);

    const scientific = result.rankedStreams.find((s) => s.streamId === 'scientific')!;
    expect(scientific.allowed).toBe(false);
    expect(scientific.statusLabelAr).toBe('غير متاح');
    expect(scientific.adviceAr).toContain('الفرع العلمي يتطلب معدل 80% أو أعلى');
    // Blocked stream should be pushed to the bottom
    expect(result.rankedStreams[result.rankedStreams.length - 1].streamId).toBe('scientific');
  });

  it('allows scientific stream if grade-10 average is exactly 80.0', () => {
    const answers: Record<number, number> = {};
    QUIZ_QUESTIONS.forEach((q) => (answers[q.id] = 3));

    const result = calculateGuidance(80.0, answers);
    expect(result.isScientificAllowed).toBe(true);

    const scientific = result.rankedStreams.find((s) => s.streamId === 'scientific')!;
    expect(scientific.allowed).toBe(true);
  });

  it('allows scientific stream if grade-10 average is above 80', () => {
    const answers: Record<number, number> = {};
    QUIZ_QUESTIONS.forEach((q) => (answers[q.id] = 5));

    const result = calculateGuidance(92.5, answers);
    expect(result.isScientificAllowed).toBe(true);
    const scientific = result.rankedStreams.find((s) => s.streamId === 'scientific')!;
    expect(scientific.allowed).toBe(true);
  });

  it('ranks scientific as top stream when scientific questions receive highest scores and average >= 80', () => {
    const answers: Record<number, number> = {};
    // Rate scientific questions 5, others 1
    QUIZ_QUESTIONS.forEach((q) => {
      answers[q.id] = q.weights.scientific ? 5 : 1;
    });

    const result = calculateGuidance(85, answers);
    expect(result.rankedStreams[0].streamId).toBe('scientific');
    expect(result.rankedStreams[0].statusLabelAr).toBe('الأنسب لك');
    expect(result.rankedStreams[0].score).toBe(100);
  });

  it('ranks literary as top stream when literary questions receive highest scores', () => {
    const answers: Record<number, number> = {};
    QUIZ_QUESTIONS.forEach((q) => {
      answers[q.id] = q.weights.literary ? 5 : 1;
    });

    const result = calculateGuidance(85, answers);
    expect(result.rankedStreams[0].streamId).toBe('literary');
    expect(result.rankedStreams[0].statusLabelAr).toBe('الأنسب لك');
    expect(result.rankedStreams[0].score).toBe(100);
  });

  it('ranks sharia as top stream when sharia questions receive highest scores', () => {
    const answers: Record<number, number> = {};
    QUIZ_QUESTIONS.forEach((q) => {
      answers[q.id] = q.weights.sharia ? 5 : 1;
    });

    const result = calculateGuidance(85, answers);
    expect(result.rankedStreams[0].streamId).toBe('sharia');
    expect(result.rankedStreams[0].statusLabelAr).toBe('الأنسب لك');
  });

  it('ranks vocational as top stream when vocational questions receive highest scores', () => {
    const answers: Record<number, number> = {};
    QUIZ_QUESTIONS.forEach((q) => {
      answers[q.id] = q.weights.vocational ? 5 : 1;
    });

    const result = calculateGuidance(85, answers);
    expect(result.rankedStreams[0].streamId).toBe('vocational');
    expect(result.rankedStreams[0].statusLabelAr).toBe('الأنسب لك');
  });

  it('promotes next best allowed stream when student has high scientific score but average < 80', () => {
    const answers: Record<number, number> = {};
    // High scientific & moderate literary
    QUIZ_QUESTIONS.forEach((q) => {
      if (q.weights.scientific) answers[q.id] = 5;
      else if (q.weights.literary) answers[q.id] = 4;
      else answers[q.id] = 2;
    });

    const result = calculateGuidance(75, answers); // average 75 < 80
    // First ranked should NOT be scientific
    expect(result.rankedStreams[0].streamId).not.toBe('scientific');
    expect(result.rankedStreams[0].allowed).toBe(true);
    expect(result.rankedStreams[0].streamId).toBe('literary');

    // Scientific should be at the bottom and marked not allowed
    const scientific = result.rankedStreams.find((s) => s.streamId === 'scientific')!;
    expect(scientific.allowed).toBe(false);
  });
});
