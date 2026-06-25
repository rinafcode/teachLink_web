'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, BookOpen, TrendingUp } from 'lucide-react';

export interface CourseCertCount {
  course: string;
  count: number;
}

export interface CertificateStatsProps {
  /** Per-course certificate counts shown in the bar chart */
  data: CourseCertCount[];
  /** Total certificates generated this session */
  totalGenerated: number;
  /** Number of distinct courses with at least one certificate */
  distinctCourses: number;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p
          className="text-2xl font-bold text-gray-900 dark:text-white"
          aria-label={`${label}: ${value}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function CertificateStats({ data, totalGenerated, distinctCourses }: CertificateStatsProps) {
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0;

  return (
    <section aria-label="Certificate generation statistics" className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generation Statistics</h2>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Award size={20} aria-hidden="true" />}
          label="Certificates Generated"
          value={totalGenerated}
        />
        <StatCard
          icon={<BookOpen size={20} aria-hidden="true" />}
          label="Courses Covered"
          value={distinctCourses}
        />
        <StatCard
          icon={<TrendingUp size={20} aria-hidden="true" />}
          label="Peak Course Count"
          value={maxCount}
        />
      </div>

      {/* Bar chart */}
      {data.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Certificates per Course
          </h3>
          <div aria-label="Bar chart: certificates per course" role="img">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="course"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [value, 'Certificates']}
                />
                <Bar dataKey="count" name="Certificates" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
