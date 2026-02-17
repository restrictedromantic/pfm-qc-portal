import React from 'react';
import { ClipboardList } from 'lucide-react';

export type CreativeQCCategory = 'SFX' | 'Music' | 'Dialogue';
export type CreativeQCUrgency = 'MUST FIX' | 'Can be fixed' | 'Good job';

export interface CreativeQCLogEntry {
  id: string;
  startTimecode: string;
  endTimecode: string;
  category: CreativeQCCategory;
  urgency: CreativeQCUrgency;
  feedback: string;
  /** Marker color from waveform (e.g. rgba(239,68,68,0.3)); row background syncs to this. */
  color: string;
}

const URGENCY_STYLES: Record<CreativeQCUrgency, string> = {
  'MUST FIX': 'bg-red-500/25 text-red-200 border-red-500/50',
  'Can be fixed': 'bg-amber-500/25 text-amber-200 border-amber-500/50',
  'Good job': 'bg-green-500/25 text-green-200 border-green-500/50',
};

const CATEGORY_OPTIONS: CreativeQCCategory[] = ['SFX', 'Music', 'Dialogue'];
const URGENCY_OPTIONS: CreativeQCUrgency[] = ['MUST FIX', 'Can be fixed', 'Good job'];

/** Convert rgba marker color to a light background (same hue, low opacity). */
function markerColorToRowBg(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 'rgba(255,255,255,0.06)';
  const [, r, g, b] = match;
  return `rgba(${r},${g},${b},0.2)`;
}

interface CreativeQCLogProps {
  entries: CreativeQCLogEntry[];
  onUpdateEntry: (id: string, patch: Partial<Omit<CreativeQCLogEntry, 'id' | 'color'>>) => void;
}

export function CreativeQCLog({ entries, onUpdateEntry }: CreativeQCLogProps) {
  return (
    <div className="h-full flex flex-col bg-[var(--qc-panel)] border-l border-[var(--qc-panel-border)]">
      <div className="px-4 py-3 border-b border-[var(--qc-panel-border)] flex items-center gap-2 flex-shrink-0">
        <ClipboardList className="w-4 h-4 text-[var(--qc-success)]" />
        <h3 className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Creative QC Log
        </h3>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm border border-[var(--qc-panel-border)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          <thead className="sticky top-0 bg-[var(--qc-panel)] z-10">
            <tr>
              <th className="text-left text-xs uppercase tracking-wider text-white/60 px-3 py-2 font-medium whitespace-nowrap border-b border-r border-[var(--qc-panel-border)]">
                Start
              </th>
              <th className="text-left text-xs uppercase tracking-wider text-white/60 px-3 py-2 font-medium whitespace-nowrap border-b border-r border-[var(--qc-panel-border)]">
                End
              </th>
              <th className="text-left text-xs uppercase tracking-wider text-white/60 px-3 py-2 font-medium whitespace-nowrap border-b border-r border-[var(--qc-panel-border)]">
                Category
              </th>
              <th className="text-left text-xs uppercase tracking-wider text-white/60 px-3 py-2 font-medium whitespace-nowrap border-b border-r border-[var(--qc-panel-border)]">
                Urgency
              </th>
              <th className="text-left text-xs uppercase tracking-wider text-white/60 px-3 py-2 font-medium min-w-[120px] border-b border-[var(--qc-panel-border)]">
                Feedback
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-white/40 text-xs border-r border-b border-[var(--qc-panel-border)]">
                  Drag on the waveform to select a range; Start/End will populate the new log row.
                </td>
              </tr>
            ) : (
              entries.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors"
                  style={{ backgroundColor: markerColorToRowBg(row.color) }}
                >
                  <td className="px-3 py-2 text-white/90 text-xs whitespace-nowrap align-top border-b border-r border-[var(--qc-panel-border)]">
                    {row.startTimecode}
                  </td>
                  <td className="px-3 py-2 text-white/90 text-xs whitespace-nowrap align-top border-b border-r border-[var(--qc-panel-border)]">
                    {row.endTimecode}
                  </td>
                  <td className="px-3 py-2 align-top border-b border-r border-[var(--qc-panel-border)]">
                    <select
                      value={row.category}
                      onChange={(e) => onUpdateEntry(row.id, { category: e.target.value as CreativeQCCategory })}
                      className="w-full bg-black/20 border border-white/20 rounded px-2 py-1.5 text-xs text-white/90 focus:outline-none focus:ring-1 focus:ring-[var(--qc-success)]"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top border-b border-r border-[var(--qc-panel-border)]">
                    <select
                      value={row.urgency}
                      onChange={(e) => onUpdateEntry(row.id, { urgency: e.target.value as CreativeQCUrgency })}
                      className={`w-full border rounded px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-white/50 ${URGENCY_STYLES[row.urgency]}`}
                    >
                      {URGENCY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top border-b border-[var(--qc-panel-border)]">
                    <input
                      type="text"
                      value={row.feedback}
                      onChange={(e) => onUpdateEntry(row.id, { feedback: e.target.value })}
                      placeholder="Notes…"
                      className="w-full bg-black/20 border border-white/20 rounded px-2 py-1.5 text-xs text-white/90 placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--qc-success)]"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
