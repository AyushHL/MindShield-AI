import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';
import {
  AlertTriangle, Activity, FileText, Brain, TrendingUp,
  ShieldCheck, ShieldAlert, ShieldX, Sparkles, X, Upload, File as FileIcon
} from 'lucide-react';

interface Prediction {
  riskScore: number;
  label: string;
  classId: number;
  confidence: number;
  probabilities?: { no_risk: number; low_risk: number; high_risk: number };
}

const RISK_CONFIG = [
  {
    classId: 0,
    label: 'No Risk',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    bar: 'bg-emerald-500',
    badgeVariant: 'success' as const,
    description: 'No indicators of suicidal ideation or mental health crisis detected in the submitted content.',
    recommendation: 'No immediate action required. Continue standard monitoring protocols.',
  },
  {
    classId: 1,
    label: 'Potential Risk',
    icon: ShieldAlert,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    bar: 'bg-amber-500',
    badgeVariant: 'warning' as const,
    description: 'Language patterns suggest potential distress signals. Does not confirm crisis but warrants attention.',
    recommendation: 'Flag for follow-up. Schedule an empathetic check-in within 24 hours and document findings.',
  },
  {
    classId: 2,
    label: 'High Risk — Urgent',
    icon: ShieldX,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    bar: 'bg-red-500',
    badgeVariant: 'danger' as const,
    description: 'Strong indicators of suicidal ideation or severe mental health crisis detected. Immediate attention required.',
    recommendation: 'Immediate intervention required. Escalate to a mental health professional and provide crisis hotline resources without delay.',
  },
];

export const Dashboard = () => {
  const [tab, setTab] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Live stats */
  const [totalAnalyses, setTotalAnalyses] = useState<string | number>('—');
  const [highRiskFlags, setHighRiskFlags] = useState<string | number>('—');
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshStats = async () => {
    setStatsLoading(true);
    try {
      const r = await api.get('/reports/stats');
      setTotalAnalyses(r.data.total ?? 0);
      setHighRiskFlags(r.data.highRisk ?? 0);
    } catch {
      setTotalAnalyses(0);
      setHighRiskFlags(0);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => { refreshStats(); }, []);

  const statCards = [
    { label: 'Total Analyses', value: totalAnalyses, icon: Activity },
    { label: 'High Risk Flags', value: highRiskFlags, icon: ShieldX },
    { label: 'Model Accuracy', value: '~91%', icon: TrendingUp },
    { label: 'Avg. Latency', value: '<1s', icon: Brain },
  ];

  const handlePredict = async () => {
    if (tab === 'text' && !text.trim()) return;
    if (tab === 'file' && !file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let response;
      if (tab === 'file' && file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await api.post('/ml/predict', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/ml/predict', { text });
      }
      setResult(response.data);
      window.dispatchEvent(new Event('analysis-complete'));
      refreshStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyse. Is the model service running?');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const riskConfig = result != null ? (RISK_CONFIG[result.classId] ?? RISK_CONFIG[0]) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Crisis Analysis Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">Powered by Bi-LSTM neural network · Three-tier risk classification</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Icon className="h-4 w-4 text-violet-400" />
              </div>
            </div>
            {statsLoading && (label === 'Total Analyses' || label === 'High Risk Flags') ? (
              <div className="h-8 w-16 rounded-md bg-slate-800 animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">{value}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-400" /> Text Analysis
            </h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 p-1 bg-slate-800/60 rounded-lg w-fit">
              {(['text', 'file'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setResult(null); setError(''); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {t === 'text' ? 'Plain Text' : 'Upload File'}
                </button>
              ))}
            </div>

            {tab === 'text' ? (
              <textarea
                className="w-full h-52 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none font-mono"
                placeholder="Paste text, social media content, or messages for risk assessment..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${dragging ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/30 hover:border-violet-500/50 hover:bg-slate-800/50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/30">
                      <FileIcon className="h-6 w-6 text-violet-400" />
                    </div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                      className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 mt-1"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
                      <Upload className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">Drop a file or click to browse</p>
                      <p className="text-xs text-slate-500 mt-1">PDF or DOCX · Max 5 MB</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {tab === 'text' ? `${text.length} characters` : (file ? '1 file selected' : 'No file selected')}
              </span>
              <div className="flex gap-2">
                {tab === 'text' && text && (
                  <Button variant="ghost" size="sm" onClick={() => { setText(''); setResult(null); setError(''); }}>
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
                <Button onClick={handlePredict} isLoading={loading} disabled={tab === 'text' ? !text.trim() : !file}>
                  <Sparkles className="h-4 w-4 mr-2" /> Analyse Risk
                </Button>
              </div>
            </div>
          </Card>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Guidelines */}
          <Card className="p-5 bg-slate-900/50">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Risk Classification Guide</h3>
            <div className="space-y-2">
              {RISK_CONFIG.map(rc => (
                <div key={rc.classId} className={`flex items-center gap-3 rounded-lg border ${rc.border} ${rc.bg} px-3 py-2`}>
                  <rc.icon className={`h-4 w-4 shrink-0 ${rc.color}`} />
                  <div>
                    <span className={`text-xs font-semibold ${rc.color}`}>{rc.label}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {rc.classId === 0 ? 'Score 0–25' : rc.classId === 1 ? 'Score 26–69' : 'Score 70–100'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Result */}
        <div>
          {result && riskConfig ? (
            <div className="space-y-4">
              {/* Primary classification */}
              <Card className={`p-6 border-2 ${riskConfig.border} ${riskConfig.bg}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${riskConfig.bg} border ${riskConfig.border}`}>
                      <riskConfig.icon className={`h-6 w-6 ${riskConfig.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Classification Result</p>
                      <h3 className={`text-xl font-bold ${riskConfig.color}`}>{riskConfig.label}</h3>
                    </div>
                  </div>
                  <Badge variant={riskConfig.badgeVariant}>Class {result.classId}</Badge>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{riskConfig.description}</p>
              </Card>

              {/* Score & Confidence */}
              <Card className="p-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Risk Score</span>
                      <span className={`font-semibold ${riskConfig.color}`}>{Math.round(result.riskScore)} / 100</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${riskConfig.bar}`}
                        style={{ width: `${result.riskScore}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Model Confidence</span>
                      <span className="font-semibold text-slate-300">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-700"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {result.probabilities && (
                    <div className="pt-2 border-t border-slate-800">
                      <p className="text-xs text-slate-500 mb-3 font-medium">Class Probabilities</p>
                      {RISK_CONFIG.map(rc => {
                        const probKey = rc.classId === 0 ? 'no_risk' : rc.classId === 1 ? 'low_risk' : 'high_risk';
                        const prob = (result.probabilities![probKey as keyof typeof result.probabilities] * 100);
                        return (
                          <div key={rc.classId} className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className={rc.color}>{rc.label}</span>
                              <span className="text-slate-400">{prob.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800">
                              <div className={`h-full rounded-full ${rc.bar} transition-all duration-700`} style={{ width: `${prob}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              {/* AI Recommendation */}
              <Card className="p-5 border-violet-500/20 bg-violet-500/5">
                <h3 className="text-sm font-semibold text-violet-300 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Recommendation
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{riskConfig.recommendation}</p>
              </Card>
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 text-center p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 mb-4">
                <Brain className="h-8 w-8 text-slate-600" />
              </div>
              <p className="font-medium text-slate-400">Ready to Analyse</p>
              <p className="text-sm text-slate-600 mt-1">Submit text to see the AI risk classification result.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};