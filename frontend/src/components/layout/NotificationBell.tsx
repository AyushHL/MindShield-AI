import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShieldX, ShieldAlert, ShieldCheck, AlertCircle } from 'lucide-react';

// Helpers
const SEEN_KEY = 'notif_seen_ids';
const readSeen = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; } };
const writeSeen = (ids: string[]) => localStorage.setItem(SEEN_KEY, JSON.stringify(ids));

const RISK_NOTIF: Record<number, { icon: React.ElementType; color: string; label: string }> = {
    0: { icon: ShieldCheck, color: 'text-emerald-400', label: 'No Risk' },
    1: { icon: ShieldAlert, color: 'text-amber-400', label: 'Potential Risk' },
    2: { icon: ShieldX, color: 'text-red-400', label: 'High Risk — Urgent' },
};

function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// Cmponent
export const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState<any[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                if (open) markAllSeen();
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, notifs]);

    const fetchNotifs = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/reports?limit=5`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const list: any[] = Array.isArray(data) ? data.slice(0, 5) : (data.reports ?? []).slice(0, 5);
            const seen = readSeen();
            setNotifs(list);
            setUnread(list.filter((r: any) => !seen.includes(r._id)).length);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    const markAllSeen = () => {
        writeSeen(notifs.map((r: any) => r._id));
        setUnread(0);
    };

    // Fetch on mount + poll every 30 s to show badge without clicking
    useEffect(() => {
        fetchNotifs();
        const id = setInterval(fetchNotifs, 30_000);
        // Also re-fetch instantly whenever an analysis completes
        window.addEventListener('analysis-complete', fetchNotifs);
        return () => {
            clearInterval(id);
            window.removeEventListener('analysis-complete', fetchNotifs);
        };
    }, [fetchNotifs]);

    const toggle = () => {
        if (!open) {
            fetchNotifs();
        } else {
            markAllSeen();
        }
        setOpen(v => !v);
    };

    return (
        <div ref={ref} className="relative">
            {/* Bell button */}
            <button
                onClick={toggle}
                className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                ) : (
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-72 sm:w-80 rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/40 animate-scale-in z-50 origin-top-right">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <p className="text-sm font-semibold text-white">Notifications</p>
                        {unread > 0 && (
                            <button onClick={markAllSeen} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-64 sm:max-h-72 overflow-y-auto">
                        {loading ? (
                            <div className="space-y-3 p-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-slate-800 animate-pulse" />)}
                            </div>
                        ) : notifs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                                <AlertCircle className="h-6 w-6 text-slate-600" />
                                <p className="text-sm text-slate-500">No recent analyses</p>
                            </div>
                        ) : (
                            notifs.map((r: any) => {
                                const seen = readSeen().includes(r._id);
                                const cfg = RISK_NOTIF[r.classId] ?? RISK_NOTIF[0];
                                const Icon = cfg.icon;
                                return (
                                    <button
                                        key={r._id}
                                        onClick={() => { markAllSeen(); setOpen(false); navigate('/dashboard/reports'); }}
                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/60 border-b border-slate-800/50 last:border-0 ${!seen ? 'bg-slate-800/30' : ''}`}
                                    >
                                        <div className={`mt-0.5 shrink-0 ${cfg.color}`}><Icon className="h-4 w-4" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">{r.textSnippet || 'File upload analysis'}</p>
                                            <p className="text-xs text-slate-600 mt-1">{timeAgo(r.createdAt)}</p>
                                        </div>
                                        {!seen && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-800 px-4 py-2.5">
                        <button
                            onClick={() => { setOpen(false); navigate('/dashboard/reports'); }}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            View all reports →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
