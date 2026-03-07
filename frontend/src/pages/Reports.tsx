import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import {
  FileText, ShieldCheck, ShieldAlert, ShieldX, Trash2,
  Eye, Search, ChevronLeft, ChevronRight, X, Activity,
  RefreshCw, AlertTriangle,
} from 'lucide-react';

// Types
interface Report {
  _id: string;
  textSnippet: string;
  label: string;
  classId: number;
  riskScore: number;
  confidence: number;
  probabilities: { no_risk: number; low_risk: number; high_risk: number };
  source: 'text' | 'file';
  createdAt: string;
}

interface ReportFull extends Report {
  fullText: string;
}

interface Stats {
  total: number;
  highRisk: number;
  potentialRisk: number;
  noRisk: number;
}

// Helpers
const RISK_CONFIG = {
  0: {
    label: 'No Risk',
    icon: ShieldCheck,
    badgeVariant: 'success' as const,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  1: {
    label: 'Potential Risk',
    icon: ShieldAlert,
    badgeVariant: 'warning' as const,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  2: {
    label: 'High Risk',
    icon: ShieldX,
    badgeVariant: 'danger' as const,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
} as const;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// Detail Modal
function ReportModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [report, setReport] = useState<ReportFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ReportFull>(`/reports/${id}`)
      .then(r => setReport(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const cfg = report ? RISK_CONFIG[report.classId as 0 | 1 | 2] : null;
  const Icon = cfg?.icon ?? FileText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-400" />
            Report Detail
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="h-6 w-6 text-violet-400 animate-spin" />
            </div>
          ) : report && cfg ? (
            <>
              {/* Risk badge */}
              <div className={`flex items-center gap-3 rounded-xl p-4 ${cfg.bg} border border-slate-700/50`}>
                <Icon className={`h-7 w-7 ${cfg.color}`} />
                <div>
                  <p className={`font-semibold ${cfg.color}`}>{report.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Risk Score: {report.riskScore.toFixed(3)} · Confidence: {pct(report.confidence)}
                  </p>
                </div>
              </div>

              {/* Probabilities */}
              {report.probabilities && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Class Probabilities</p>
                  {(
                    [
                      { key: 'no_risk', label: 'No Risk', bar: 'bg-emerald-500' },
                      { key: 'low_risk', label: 'Potential Risk', bar: 'bg-amber-500' },
                      { key: 'high_risk', label: 'High Risk', bar: 'bg-red-500' },
                    ] as const
                  ).map(({ key, label, bar }) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{label}</span>
                        <span>{pct(report.probabilities[key])}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar} transition-all duration-500`}
                          style={{ width: pct(report.probabilities[key]) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full text */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Analysed Text</p>
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
                  {report.fullText}
                </div>
              </div>

              {/* Meta */}
              <div className="flex gap-4 text-xs text-slate-500">
                <span>Source: <span className="text-slate-400 capitalize">{report.source}</span></span>
                <span>·</span>
                <span>Analysed: <span className="text-slate-400">{fmt(report.createdAt)}</span></span>
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Could not load report.</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// Main Page
export const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, highRisk: 0, potentialRisk: 0, noRisk: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Filters */
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<'' | '0' | '1' | '2'>('');

  /* Pagination */
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  /* Modal */
  const [modalId, setModalId] = useState<string | null>(null);

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<'all' | string | null>(null);

  const fetchStats = async () => {
    try {
      const r = await api.get<Stats>('/reports/stats');
      setStats(r.data);
    } catch { /* silent */ }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (classFilter !== '') params.classId = classFilter;
      if (search.trim()) params.search = search.trim();

      const r = await api.get('/reports', { params });
      setReports(r.data.reports);
      setTotalPages(r.data.pages);
      setTotal(r.data.total);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [page, classFilter, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* Reset to page 1 when filter/search changes */
  useEffect(() => {
    setPage(1);
  }, [classFilter, search]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/reports/${id}`);
      setDeleteTarget(null);
      fetchReports();
      fetchStats();
    } catch { /* silent */ }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete('/reports');
      setDeleteTarget(null);
      setPage(1);
      fetchReports();
      fetchStats();
    } catch { /* silent */ }
  };

  // Stat cards
  const statCards = [
    { label: 'Total Reports', value: stats.total, icon: Activity, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'High Risk', value: stats.highRisk, icon: ShieldX, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Potential Risk', value: stats.potentialRisk, icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'No Risk', value: stats.noRisk, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analysis Reports</h1>
          <p className="text-sm text-slate-400 mt-1">History of all past risk assessments</p>
        </div>
        {stats.total > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget('all')}
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} shrink-0`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{s.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search text snippets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          {/* Risk filter */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value as '' | '0' | '1' | '2')}
            className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors cursor-pointer"
          >
            <option value="">All Risk Levels</option>
            <option value="0">No Risk</option>
            <option value="1">Potential Risk</option>
            <option value="2">High Risk</option>
          </select>

          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setClassFilter(''); }}>
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 text-violet-400 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <FileText className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No reports found</p>
            <p className="text-xs mt-1">
              {classFilter !== '' || search ? 'Try clearing the filters.' : 'Run an analysis from the Dashboard to create a report.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3 w-8">#</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">Text Snippet</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Risk Level</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Confidence</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Date & Time</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, idx) => {
                    const cfg = RISK_CONFIG[r.classId as 0 | 1 | 2];
                    const rowNum = (page - 1) * LIMIT + idx + 1;
                    return (
                      <tr
                        key={r._id}
                        className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{rowNum}</td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="text-slate-300 truncate">{r.textSnippet}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge variant={cfg.badgeVariant}>
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-slate-300 font-medium">{pct(r.confidence)}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-xs">
                          {fmt(r.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModalId(r._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(r._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete report"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} reports
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  return p <= totalPages ? (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-violet-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Report detail modal */}
      {modalId && <ReportModal id={modalId} onClose={() => setModalId(null)} />}

      {/* Delete confirm dialog */}
      {deleteTarget !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-semibold text-white">
                {deleteTarget === 'all' ? 'Delete all reports?' : 'Delete this report?'}
              </h3>
            </div>
            <p className="text-sm text-slate-400">
              {deleteTarget === 'all'
                ? 'This will permanently delete all your analysis reports. This action cannot be undone.'
                : 'This report will be permanently removed. This action cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  deleteTarget === 'all' ? handleDeleteAll() : handleDelete(deleteTarget)
                }
              >
                <Trash2 className="h-4 w-4" />
                {deleteTarget === 'all' ? 'Delete All' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
