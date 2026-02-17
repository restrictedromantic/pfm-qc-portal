import React from 'react';
import { useAuth } from '../context/AuthContext';
import { mockAdminTableData, type AdminTableRow } from '../../data/mockData';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getPlayedSegments } from '../utils/engagement';

const QC_STATUS_STYLES: Record<AdminTableRow['qcStatus'], string> = {
  Pass: 'bg-[var(--qc-success-bg)] text-[var(--qc-success)]',
  Fail: 'bg-[var(--qc-fail-bg)] text-[var(--qc-fail)]',
  'In Progress': 'bg-amber-500/20 text-amber-400',
};

function MiniWaveform({
  totalDurationSeconds,
  playSegments,
  engagementLogs,
}: {
  totalDurationSeconds: number;
  playSegments: number[];
  engagementLogs: AdminTableRow['engagementLogs'];
}) {
  if (totalDurationSeconds <= 0) return <span className="text-white/40 text-xs">—</span>;
  const segments = getPlayedSegments(playSegments);
  const pinTimes = engagementLogs.map((e) => e.playbackTime);
  return (
    <div className="relative h-5 w-full min-w-[120px] max-w-[200px] rounded bg-white/10" title="Green = played, red = interaction/mark">
      {segments.map(([start, end], i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 rounded-sm bg-green-500/80"
          style={{
            left: `${(start / totalDurationSeconds) * 100}%`,
            width: `${((end - start) / totalDurationSeconds) * 100}%`,
          }}
        />
      ))}
      {pinTimes.map((t, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${(t / totalDurationSeconds) * 100}%` }}
          title={`Event at ${t.toFixed(1)}s`}
        />
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user || !isAdmin) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dark min-h-screen bg-[var(--background)] flex flex-col">
      <header className="bg-black border-b border-[var(--qc-panel-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-[var(--qc-success)]" />
          <h1 className="text-lg font-semibold text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {user.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 text-sm"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-[var(--qc-panel-border)] bg-[var(--qc-panel)] overflow-hidden">
          <table className="w-full" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            <thead>
              <tr className="border-b border-[var(--qc-panel-border)] bg-black/30">
                <th className="text-left text-xs uppercase tracking-wider text-white/60 px-6 py-4 font-medium">
                  Producer Name
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-white/60 px-6 py-4 font-medium">
                  Show Name
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-white/60 px-6 py-4 font-medium">
                  Episode
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-white/60 px-6 py-4 font-medium">
                  Total Time Logged
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-white/60 px-6 py-4 font-medium">
                  QC Status
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-white/60 px-6 py-4 font-medium">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody>
              {mockAdminTableData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--qc-panel-border)] last:border-b-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-white/90">{row.producerName}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{row.showName}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{row.episode}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{row.totalTimeLogged}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-medium ${QC_STATUS_STYLES[row.qcStatus]}`}
                    >
                      {row.qcStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <MiniWaveform
                        totalDurationSeconds={row.totalDurationSeconds}
                        playSegments={row.playSegments}
                        engagementLogs={row.engagementLogs}
                      />
                      <span className="text-xs text-white/60">
                        Score: {row.listenerScore.toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-white/40 mt-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Mock data. Connect a database to load real producer logs.
        </p>
      </main>
    </div>
  );
}
