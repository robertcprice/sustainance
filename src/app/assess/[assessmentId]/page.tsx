'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

interface Question {
  id: string;
  text: string;
  scenarioText: string;
  orderIndex: number;
  skillMaps: {
    skill: {
      name: string;
      family: { name: string; color: string };
    };
  }[];
}

const SCORE_OPTIONS = [
  { value: 1, label: 'Curious Explorer', description: 'I have little awareness in this area' },
  { value: 2, label: 'Informed Practitioner', description: 'I understand the basics but need guidance' },
  { value: 3, label: 'Applied Advocate', description: 'I can independently apply this in my work' },
  { value: 4, label: 'Conscious Changemaker', description: 'I lead initiatives and teach others' },
];

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roleName, setRoleName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/assessments/${assessmentId}`)
      .then(r => r.json())
      .then(data => {
        setQuestions(data.questions);
        setRoleName(data.assessment.role.title);
        const existing: Record<string, number> = {};
        for (const ans of data.assessment.answers) {
          existing[ans.questionId] = ans.score;
        }
        setAnswers(existing);
      });
  }, [assessmentId]);

  function setAnswer(questionId: string, score: number) {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  }

  async function submit() {
    setSubmitting(true);
    const answerList = Object.entries(answers).map(([questionId, score]) => ({
      questionId,
      score,
    }));

    await fetch(`/api/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answerList }),
    });

    router.push('/dashboard');
  }

  if (questions.length === 0) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading assessment...</p>
        </div>
      </AppShell>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <AppShell>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Assessment: {roleName}</h1>
          <p className="text-slate-500">Question {currentIndex + 1} of {questions.length}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="panel rounded-xl shadow-sm p-8 mb-6">
          <div className="mb-4">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Scenario</span>
            <p className="text-sm text-slate-500 mt-1 italic">{currentQuestion.scenarioText}</p>
          </div>

          <p className="text-lg text-slate-900 font-medium mb-2">{currentQuestion.text}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {currentQuestion.skillMaps.map((sm, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded-md"
                style={{
                  backgroundColor: sm.skill.family.color + '15',
                  color: sm.skill.family.color,
                  border: `1px solid ${sm.skill.family.color}30`,
                }}
              >
                {sm.skill.name}
              </span>
            ))}
          </div>

          {/* Score Selector */}
          <div className="space-y-3">
            {SCORE_OPTIONS.map(opt => {
              const isSelected = answers[currentQuestion.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAnswer(currentQuestion.id, opt.value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-gray-300 text-slate-400'
                    }`}>
                      {opt.value}
                    </div>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-emerald-500 scale-125'
                    : answers[q.id]
                    ? 'bg-emerald-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-5 py-2.5 text-sm text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!allAnswered || submitting}
              className="px-6 py-2.5 text-sm bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {submitting ? 'Submitting...' : `Submit Assessment (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
