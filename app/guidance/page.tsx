'use client';

import { useState } from 'react';
import { QUIZ_QUESTIONS } from '@/lib/quizData';
import { calculateGuidance, GuidanceResult } from '@/lib/guidancePlanner';
import Disclaimer from '@/components/Disclaimer';
import ar from '@/lib/ar.json';

const LIKERT_OPTIONS = [
  { value: 5, label: ar.quizOptions.agree },
  { value: 4, label: ar.quizOptions.somewhatAgree },
  { value: 3, label: ar.quizOptions.neutral },
  { value: 2, label: ar.quizOptions.somewhatDisagree },
  { value: 1, label: ar.quizOptions.disagree },
];

export default function GuidancePage() {
  const [averageInput, setAverageInput] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<GuidanceResult | null>(null);
  const [error, setError] = useState('');

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCalculate = () => {
    setError('');

    const avg = parseFloat(averageInput);
    if (isNaN(avg) || avg < 0 || avg > 100) {
      setError(ar.guidance.errorEnterAverage);
      return;
    }

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < QUIZ_QUESTIONS.length) {
      setError(
        `${ar.guidance.errorCompleteQuiz} (${answeredCount} ${ar.guidance.of} ${QUIZ_QUESTIONS.length})`,
      );
      return;
    }

    const res = calculateGuidance(avg, answers);
    setResult(res);

    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleReset = () => {
    setAverageInput('');
    setAnswers({});
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {ar.guidance.title}
      </h1>
      <p className="text-gray-500 mb-8">{ar.guidance.description}</p>

      {/* Results View */}
      {result ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {ar.guidance.yourResults}
            </h2>
            <button
              onClick={handleReset}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
            >
              إعادة الاختبار
            </button>
          </div>

          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <span className="text-gray-600 font-medium">
              {ar.guidance.enterAverage}:
            </span>
            <span className="text-xl font-bold text-blue-600">
              %{result.grade10Average}
            </span>
          </div>

          {!result.isScientificAllowed && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm font-medium">
              ⚠️ {ar.guidance.scientificBlocked}
            </div>
          )}

          <div className="space-y-4 mb-8">
            {result.rankedStreams.map((st, index) => {
              let badgeColor = 'bg-gray-100 text-gray-700';
              if (!st.allowed) {
                badgeColor = 'bg-red-100 text-red-700 border border-red-200';
              } else if (st.statusLabelAr === 'الأنسب لك') {
                badgeColor = 'bg-green-100 text-green-800 border border-green-200';
              } else if (st.statusLabelAr === 'مناسب') {
                badgeColor = 'bg-blue-100 text-blue-800 border border-blue-200';
              }

              return (
                <div
                  key={st.streamId}
                  className={`bg-white rounded-xl shadow-sm p-6 border transition ${
                    st.allowed && index === 0
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800">
                        الفرع {st.nameAr}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold self-start sm:self-auto ${badgeColor}`}
                    >
                      {st.statusLabelAr}
                    </span>
                  </div>

                  {st.allowed && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{ar.guidance.matchScore}</span>
                        <span className="font-semibold">%{st.score}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            st.score >= 75
                              ? 'bg-green-500'
                              : st.score >= 50
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                          }`}
                          style={{ width: `${st.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700 ml-1">
                      {ar.guidance.advice}:
                    </span>
                    {st.adviceAr}
                  </p>
                </div>
              );
            })}
          </div>

          <Disclaimer />
        </div>
      ) : (
        /* Form View */
        <div>
          {/* Average Input Section */}
          <section className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {ar.guidance.enterAverage}
            </label>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={averageInput}
                onChange={(e) => setAverageInput(e.target.value)}
                placeholder={ar.guidance.averagePlaceholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ملاحظة: يشترط الحصول على معدل 80% فأعلى في الصف العاشر للالتحاق بالفرع العلمي.
            </p>
          </section>

          {/* 15 Questions */}
          <section className="space-y-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {ar.guidance.startQuiz} (15 {ar.guidance.question})
            </h2>

            {QUIZ_QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
              >
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-blue-600 font-bold text-sm shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  <p className="text-gray-800 font-medium text-sm leading-relaxed">
                    {q.textAr}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {LIKERT_OPTIONS.map((opt) => {
                    const isSelected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleAnswerChange(q.id, opt.value)}
                        className={`py-2 px-2 text-xs rounded-lg font-medium transition text-center border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium mb-6">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl transition text-base shadow-sm"
          >
            {ar.guidance.showResults}
          </button>

          <Disclaimer />
        </div>
      )}
    </div>
  );
}
