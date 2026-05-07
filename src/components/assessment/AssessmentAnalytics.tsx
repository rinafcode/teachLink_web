'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, BarChart3, Clock3, ShieldCheck } from 'lucide-react';

const scoreByTopic = [
  { topic: 'Math', score: 82 },
  { topic: 'Science', score: 76 },
  { topic: 'Reading', score: 91 },
  { topic: 'Coding', score: 68 },
  { topic: 'Essay', score: 74 },
];

const completionTimeline = [
  { name: 'Week 1', value: 52 },
  { name: 'Week 2', value: 64 },
  { name: 'Week 3', value: 78 },
  { name: 'Week 4', value: 84 },
];

const proctoringCoverage = [
  { name: 'Secure', value: 63 },
  { name: 'Flagged', value: 21 },
  { name: 'Inactive', value: 16 },
];

const COLORS = ['#3B82F6', '#6366F1', '#0EA5E9'];

export function AssessmentAnalytics() {
  const averageScore = useMemo(
    () => Math.round(scoreByTopic.reduce((sum, item) => sum + item.score, 0) / scoreByTopic.length),
    [],
  );

  const passRate = useMemo(() => 88, []);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Assessment analytics</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Detailed performance data, question-level insights, and exam integrity reports.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-slate-900">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Avg. score</div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{averageScore}%</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-slate-900">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Pass rate</div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{passRate}%</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-slate-900">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Risk flags</div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">21%</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <BarChart3 size={18} /> Topic performance
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreByTopic} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis dataKey="topic" tick={{ fill: '#64748B' }} />
                <YAxis tick={{ fill: '#64748B' }} />
                <Tooltip />
                <Bar dataKey="score" fill="#3B82F6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Clock3 size={18} /> Completion timeline
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionTimeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                  <XAxis dataKey="name" tick={{ fill: '#64748B' }} />
                  <YAxis tick={{ fill: '#64748B' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck size={18} /> Proctoring risk summary
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={proctoringCoverage} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {proctoringCoverage.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Average accuracy</div>
            <div className="mt-2 text-3xl font-semibold">{averageScore}%</div>
          </div>
          <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Review rate</div>
            <div className="mt-2 text-3xl font-semibold">{passRate}%</div>
          </div>
          <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Risk detection</div>
            <div className="mt-2 text-3xl font-semibold">21%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
