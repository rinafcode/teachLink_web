'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  FileText,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CertificateStats } from '@/services/certificate-service';
import type { CertificateRecord } from '@/schemas/certificate.schema';

export default function CertificateAnalyticsDashboard() {
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/certificates/stats', {
        headers: {
          'x-user-id': 'admin-user-id', // Mock admin user identification
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load statistics: status ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch certificate statistics.');
      toast.error('Could not load certificate metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRevoke = async (certId: string) => {
    if (
      !confirm(
        'Are you sure you want to revoke this certificate? This action soft-deletes the certificate and marks it invalid.',
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/certificates/${certId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': 'admin-user-id',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to revoke certificate');
      }

      toast.success('Certificate successfully revoked.');
      // Refetch stats to update charts and list immediately
      fetchStats();
    } catch (err: any) {
      toast.error(err?.message || 'Error occurred while revoking.');
    }
  };

  const handleVerify = async (certId: string) => {
    try {
      const res = await fetch(`/api/certificates/verify/${certId}`);
      if (!res.ok) {
        throw new Error('Certificate is invalid or revoked.');
      }
      const data = await res.json();
      if (data.valid) {
        toast.success(`Authentic Certificate! Student: ${data.name}`);
      } else {
        toast.error('Invalid Verification signature!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Verification check failed.');
    }
  };

  // Filtered certificates list
  const filteredCertificates = useMemo(() => {
    if (!stats) return [];
    return stats.recentCertificates.filter((cert) => {
      const matchesSearch =
        cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.courseName.toLowerCase().includes(searchQuery.toLowerCase());

      const isRevoked = !!cert.revokedAt;
      if (statusFilter === 'active') return matchesSearch && !isRevoked;
      if (statusFilter === 'revoked') return matchesSearch && isRevoked;
      return matchesSearch;
    });
  }, [stats, searchQuery, statusFilter]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading certificate analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-lg text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Failed to Load Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" role="main">
        {/* SEO Header structure */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight flex items-center gap-2"
              id="dashboard-heading"
            >
              <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400" aria-hidden />
              Certificate generation analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor course completion credentials, analyze award distributions, and audit
              verification states.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Refresh Data
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        {stats && (
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total Issued
                </span>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {stats.totalIssued}
                </p>
                <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3 inline" /> +100% lifetime authenticity
                </span>
              </div>
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Active Credentials
                </span>
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.totalActive}
                </p>
                <span className="text-[10px] text-gray-400">Verifiable by 3rd parties</span>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Revoked/Fraudulent
                </span>
                <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {stats.totalRevoked}
                </p>
                <span className="text-[10px] text-rose-500">Soft-deleted from indexing</span>
              </div>
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Recharts Visualizations */}
        {stats && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Completions Trend over Time */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Monthly Completions Trend
                </h2>
              </div>
              <div className="h-64 w-full" role="img" aria-label="Completions trend monthly chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.completionsByMonth}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-100 dark:stroke-gray-800"
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Completions"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCompletions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Completions by Course */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Certificate Volume by Course
                </h2>
              </div>
              <div
                className="h-64 w-full"
                role="img"
                aria-label="Certificate volume by course bar chart"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.completionsByCourse}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-100 dark:stroke-gray-800"
                    />
                    <XAxis
                      dataKey="courseName"
                      tick={{ fontSize: 8 }}
                      interval={0}
                      tickFormatter={(value) =>
                        value.length > 15 ? `${value.slice(0, 15)}...` : value
                      }
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="count" name="Certificates" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Audit Search List */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Certificate Audit Trail
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Search generated certificates, verify signatures, or soft-revoke invalid
                credentials.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-850 p-1 border border-gray-200 dark:border-gray-800 rounded-lg">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'revoked', label: 'Revoked' },
                ] as const
              ).map((filterItem) => (
                <button
                  key={filterItem.key}
                  type="button"
                  onClick={() => setStatusFilter(filterItem.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === filterItem.key
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {filterItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search by student name, course name, or certificate UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>

          {/* List Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-850">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-850 text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student / Course</th>
                  <th className="px-4 py-3">Certificate ID</th>
                  <th className="px-4 py-3">Issued Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                      No certificates match your active search filter.
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map((cert) => {
                    const isRevoked = !!cert.revokedAt;
                    return (
                      <tr
                        key={cert.certificateId}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-gray-900 dark:text-white">{cert.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{cert.courseName}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {cert.certificateId}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isRevoked
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}
                          >
                            {isRevoked ? 'Revoked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleVerify(cert.certificateId)}
                            className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                          >
                            Verify
                          </button>
                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(cert.certificateId)}
                              className="inline-flex items-center justify-center p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                              title="Revoke Certificate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
