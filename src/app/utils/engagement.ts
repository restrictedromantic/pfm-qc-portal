/**
 * Engagement tracking: heatmap, interaction logs, and listener score.
 * Used by BottomBar and AdminDashboard; payload ready for backend.
 */

export type EngagementEventType =
  | 'pause'
  | 'skip_back_5'
  | 'skip_back_10'
  | 'skip_forward_5'
  | 'skip_forward_10'
  | 'volume_change'
  | 'mark';

export interface EngagementLogEntry {
  type: EngagementEventType;
  timestamp: number;
  playbackTime: number;
  value?: number;
}

export interface EngagementData {
  playSegments: number[];
  engagementLogs: EngagementLogEntry[];
  uniqueSecondsPlayed: number;
  totalDurationSeconds: number;
  totalMarks: number;
  listenerScore: number;
}

/** Turn playSegments (each = end of 5s block) into merged [start, end] segments for heatmap/mini-waveform. */
export function getPlayedSegments(playSegments: number[]): [number, number][] {
  if (playSegments.length === 0) return [];
  const sorted = [...playSegments].sort((a, b) => a - b);
  const segments: [number, number][] = sorted.map((t) => [Math.max(0, t - 5), t]);
  const merged: [number, number][] = [];
  for (const [start, end] of segments) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/** Merge 5-second windows from playSegments (each entry = end of a 5s block) and return total unique seconds. */
export function computeUniqueSecondsPlayed(playSegments: number[]): number {
  return getPlayedSegments(playSegments).reduce((sum, [a, b]) => sum + (b - a), 0);
}

/**
 * Listener Score = (Unique Seconds Played / Total Duration) + (Total Marks × 0.1)
 */
export function computeListenerScore(
  uniqueSecondsPlayed: number,
  totalDurationSeconds: number,
  totalMarks: number
): number {
  if (totalDurationSeconds <= 0) return totalMarks * 0.1;
  const coverage = uniqueSecondsPlayed / totalDurationSeconds;
  const markBonus = totalMarks * 0.1;
  return Math.min(1, coverage) + markBonus;
}

export function buildEngagementPayload(data: EngagementData): string {
  return JSON.stringify({
    playSegments: data.playSegments,
    engagementLogs: data.engagementLogs,
    uniqueSecondsPlayed: data.uniqueSecondsPlayed,
    totalDurationSeconds: data.totalDurationSeconds,
    totalMarks: data.totalMarks,
    listenerScore: data.listenerScore,
  });
}
