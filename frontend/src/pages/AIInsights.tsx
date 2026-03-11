import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import {
  BrainCircuit, ShieldCheck, ShieldAlert, ShieldX,
  TrendingUp, Activity, FileText, UploadCloud, RefreshCw,
  AlertTriangle,
} from 'lucide-react';

/* Types */
interface DayEntry   { date: string; count: number; highRisk: number }
interface ClassStat  { classId: number; count: number; avgConfidence: number; avgRiskScore: number }
interface InsightsData {
  total: number;
  distribution: { no_risk: number; potential_risk: number; high_risk: number };
  timeline: DayEntry[];
  classStats: ClassStat[];
  sourceBreakdown: { text: number; file: number };
}

/*  Helpers */
const RISK = [
  { key: 'no_risk',       label: 'No Risk',        color: '#10b981', bar: 'bg-emerald-500', text: 'text-emerald-400', icon: ShieldCheck  },
  { key: 'potential_risk',label: 'Potential Risk',  color: '#f59e0b', bar: 'bg-amber-500',   text: 'text-amber-400',   icon: ShieldAlert  },
  { key: 'high_risk',     label: 'High Risk',       color: '#ef4444', bar: 'bg-red-500',     text: 'text-red-400',     icon: ShieldX      },
] as const;

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/* Donut Chart */
function DonutChart({ values, colors, size = 140 }: { values: number[]; colors: string[]; size?: number }) {
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size * 0.38} fill="none" stroke="#1e293b" strokeWidth={size * 0.18} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize={size * 0.12}>No data</text>
      </svg>
    );
  }
  const cx = size / 2, cy = size / 2, r = size * 0.38, strokeWidth = size * 0.18;
  const circumference = 2 * Math.PI * r;

  // Pre-compute cumulative offsets to avoid mutating a variable inside map
  const cumulativeOffsets = values.map((_, i) =>
    values.slice(0, i).reduce((s, v) => s + v / total, 0)
  );

  const slices = values.map((v, i) => {
    const pct      = v / total;
    const dash     = pct * circumference;
    const gap      = circumference - dash;
    const rotation = cumulativeOffsets[i] * 360 - 90;
    return { dash, gap, rotation, color: colors[i] };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={0}
          transform={`rotate(${s.rotation} ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      ))}
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize={size * 0.15} fontWeight="bold">
        {total}
      </text>
      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize={size * 0.1}>
        total
      </text>
    </svg>
  );
}

/* Bar / Timeline Chart */
function TimelineChart({ data }: { data: DayEntry[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartH = 100;

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: 560 }}>
        <svg width="100%" viewBox={`0 0 ${data.length * 38} ${chartH + 28}`} preserveAspectRatio="none">
          {data.map((d, i) => {
            const barH    = (d.count   / maxCount) * chartH;
            const hrH     = (d.highRisk / maxCount) * chartH;
            const x       = i * 38 + 4;
            const barW    = 30;
            return (
              <g key={d.date}>
                {/* Total bar */}
                <rect
                  x={x} y={chartH - barH} width={barW} height={barH || 1}
                  rx={3} fill="#7c3aed" opacity={0.45}
                />
                {/* High-risk overlay */}
                {hrH > 0 && (
                  <rect
                    x={x} y={chartH - hrH} width={barW} height={hrH}
                    rx={3} fill="#ef4444" opacity={0.75}
                  />
                )}
                {/* Count label on top */}
                {d.count > 0 && (
                  <text x={x + barW / 2} y={chartH - barH - 4} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                    {d.count}
                  </text>
                )}
                {/* Date label */}
                <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="#475569" fontSize={7.5}>
                  {fmtDate(d.date)}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Legend */}
        <div className="flex gap-4 mt-1 justify-end pr-1">
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-600 opacity-60" />Analyses</span>
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500 opacity-75" />High Risk</span>
        </div>
      </div>
    </div>
  );
}

/* Main Page */
export const AIInsights = () => {
  const [data, setData]       = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get<InsightsData>('/reports/insights');
      setData(r.data);
    } catch {
      setError('Could not load insights. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* derived values */
  const highRiskPct = data && data.total > 0
    ? ((data.distribution.high_risk / data.total) * 100).toFixed(1)
    : '0';

  const avgConf = data && data.total > 0
    ? (data.classStats.reduce((s, c) => s + c.avgConfidence * c.count, 0) / data.total).toFixed(1)
    : '—';

  const dominantClass = data
    ? RISK.reduce((best, r) =>
        data.distribution[r.key] > data.distribution[best.key] ? r : best
      , RISK[0])
    : null;

  /* skeleton */
  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-slate-800" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-800" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-xl bg-slate-800" />
        <div className="h-64 rounded-xl bg-slate-800" />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-violet-400" /> AI Insights
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Analytics & performance metrics across all your analyses</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-violet-500/50 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Total Analyses',   value: data.total,     icon: Activity,    extra: '' },
              { label: 'High Risk Rate',   value: `${highRiskPct}%`,icon: ShieldX,  extra: `${data.distribution.high_risk} flagged` },
              { label: 'Avg Confidence',   value: avgConf === '—' ? '—' : `${avgConf}%`, icon: TrendingUp, extra: 'across all classes' },
              { label: 'Dominant Class',   value: dominantClass?.label ?? '—', icon: BrainCircuit, extra: dominantClass ? `${data.distribution[dominantClass.key]} entries` : '' },
            ].map(({ label, value, icon: Icon, extra }) => (
              <Card key={label} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <Icon className="h-4 w-4 text-violet-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                {extra && <p className="text-xs text-slate-500 mt-0.5">{extra}</p>}
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Donut – 2 cols */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-300 mb-6">Risk Distribution</h2>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <DonutChart
                  values={[data.distribution.no_risk, data.distribution.potential_risk, data.distribution.high_risk]}
                  colors={['#10b981', '#f59e0b', '#ef4444']}
                  size={150}
                />
                <div className="flex flex-col gap-3 w-full">
                  {RISK.map(r => {
                    const count = data.distribution[r.key];
                    const pct   = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : '0';
                    return (
                      <div key={r.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={r.text}>{r.label}</span>
                          <span className="text-slate-400">{count} <span className="text-slate-600">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${r.bar} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Timeline – 3 cols */}
            <Card className="p-6 lg:col-span-3">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Analyses — Last 14 Days</h2>
              {data.total === 0 ? (
                <div className="flex h-36 items-center justify-center text-slate-600 text-sm">No data yet</div>
              ) : (
                <TimelineChart data={data.timeline} />
              )}
            </Card>
          </div>

          {/* Per-Class Stats */}
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Per-Class Breakdown</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {RISK.map((r, i) => {
                const cs  = data.classStats[i];
                const Icon = r.icon;
                return (
                  <Card key={r.key} className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800`}>
                        <Icon className={`h-5 w-5 ${r.text}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${r.text}`}>{r.label}</p>
                        <p className="text-xs text-slate-500">{cs.count} analyses</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Avg Confidence</span>
                          <span className="text-slate-300">{cs.avgConfidence.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800">
                          <div className={`h-full rounded-full ${r.bar} opacity-80`} style={{ width: `${cs.avgConfidence}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Avg Risk Score</span>
                          <span className="text-slate-300">{cs.avgRiskScore} / 100</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800">
                          <div className={`h-full rounded-full ${r.bar} opacity-60`} style={{ width: `${cs.avgRiskScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Source Breakdown + Model Info */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Source */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-5">Input Source Breakdown</h2>
              {data.total === 0 ? (
                <div className="flex h-20 items-center justify-center text-slate-600 text-sm">No data yet</div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Text Input', count: data.sourceBreakdown.text,  icon: FileText,    bar: 'bg-violet-500' },
                    { label: 'File Upload', count: data.sourceBreakdown.file, icon: UploadCloud, bar: 'bg-sky-500'    },
                  ].map(({ label, count, icon: Icon, bar }) => {
                    const pct = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : '0';
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Icon className="h-4 w-4 text-slate-500" />
                            {label}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{count}</span>
                            <span className="text-xs text-slate-600">({pct}%)</span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800">
                          <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Model info */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-5">Model Information</h2>
              <div className="space-y-3">
                {[
                  { label: 'Architecture',   value: 'Bidirectional LSTM' },
                  { label: 'Classes',         value: '3  (No Risk · Potential · High Risk)' },
                  { label: 'Accuracy',        value: '~91%' },
                  { label: 'Avg Latency',     value: '< 1 s' },
                  { label: 'Input',           value: 'Free-form text / uploaded files' },
                  { label: 'Framework',       value: 'TensorFlow / Keras' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
                    <span className="text-sm text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Empty state when no data and no error */}
      {!data && !error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 p-20 text-center">
          <BrainCircuit className="h-12 w-12 text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">No insights yet</p>
          <p className="text-sm text-slate-600 mt-1">Run some analyses on the Dashboard to see data here.</p>
        </div>
      )}
    </div>
  );
};
