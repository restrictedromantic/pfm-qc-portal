/**
 * Mock data for Admin Dashboard table.
 * Replace with real API/database when backend is connected.
 */

import type { EngagementLogEntry } from '../app/utils/engagement';

/** Per-pillar episode progress: current count / total (e.g. 15/50). Each pillar is independent. */
export type PillarProgress = { current: number; total: number };

/** Production status per show: one progress object per pillar. No derived/auto-moving logic. */
export type ShowStatus = {
  scripting: PillarProgress;
  raw: PillarProgress;
  mastering: PillarProgress;
  creativeQC: PillarProgress;
  technicalQC: PillarProgress;
};

export type PillarKey = keyof ShowStatus;

/** One row in the Production Status Matrix: show name, status per pillar, and which pillar is active (for live pulse). */
export interface ProductionStatusRow {
  id: string;
  showName: string;
  status: ShowStatus;
  /** Pillar being worked on right now (from recent activity logs); null if none. */
  activePillar: PillarKey | null;
}

export const PILLAR_LABELS: Record<PillarKey, string> = {
  scripting: 'Scripting',
  raw: 'Raw',
  mastering: 'Mastering',
  creativeQC: 'Creative QC',
  technicalQC: 'Technical QC',
};

export const mockProductionStatusRows: ProductionStatusRow[] = [
  {
    id: 'ps-1',
    showName: 'Weakest Beast Tamer',
    status: {
      scripting: { current: 24, total: 50 },
      raw: { current: 18, total: 50 },
      mastering: { current: 12, total: 50 },
      creativeQC: { current: 8, total: 50 },
      technicalQC: { current: 5, total: 50 },
    },
    activePillar: 'raw',
  },
  {
    id: 'ps-2',
    showName: 'Infinite Mana in the Apocalypse',
    status: {
      scripting: { current: 50, total: 50 },
      raw: { current: 42, total: 50 },
      mastering: { current: 38, total: 50 },
      creativeQC: { current: 30, total: 50 },
      technicalQC: { current: 28, total: 50 },
    },
    activePillar: 'creativeQC',
  },
  {
    id: 'ps-3',
    showName: 'Voiceover Masters',
    status: {
      scripting: { current: 12, total: 24 },
      raw: { current: 10, total: 24 },
      mastering: { current: 6, total: 24 },
      creativeQC: { current: 4, total: 24 },
      technicalQC: { current: 2, total: 24 },
    },
    activePillar: null,
  },
  {
    id: 'ps-4',
    showName: 'Podcast Hour',
    status: {
      scripting: { current: 8, total: 20 },
      raw: { current: 5, total: 20 },
      mastering: { current: 2, total: 20 },
      creativeQC: { current: 0, total: 20 },
      technicalQC: { current: 0, total: 20 },
    },
    activePillar: 'mastering',
  },
];

export interface AdminTableRow {
  id: string;
  producerName: string;
  showName: string;
  episode: string;
  totalTimeLogged: string;
  qcStatus: 'Pass' | 'Fail' | 'In Progress';
  totalDurationSeconds: number;
  playSegments: number[];
  engagementLogs: EngagementLogEntry[];
  listenerScore: number;
}

function mockLog(type: EngagementLogEntry['type'], playbackTime: number, value?: number): EngagementLogEntry {
  return { type, timestamp: Date.now() - Math.random() * 86400000, playbackTime, ...(value != null && { value }) };
}

export const mockAdminTableData: AdminTableRow[] = [
  {
    id: '1',
    producerName: 'userA@producer.com',
    showName: 'Weakest Beast Tamer',
    episode: 'EP 1 - The Ceremony of Fate',
    totalTimeLogged: '00:42:18',
    qcStatus: 'Pass',
    totalDurationSeconds: 2538,
    playSegments: Array.from({ length: 120 }, (_, i) => 5 + i * 5),
    engagementLogs: [
      mockLog('pause', 60),
      mockLog('skip_forward_5', 120),
      mockLog('mark', 300),
      mockLog('mark', 450),
      mockLog('volume_change', 200, 0.5),
    ],
    listenerScore: 0.26,
  },
  {
    id: '2',
    producerName: 'userB@producer.com',
    showName: 'Infinite Mana in the Apocalypse',
    episode: '12 - Trial',
    totalTimeLogged: '01:15:33',
    qcStatus: 'In Progress',
    totalDurationSeconds: 4533,
    playSegments: [...Array.from({ length: 40 }, (_, i) => 5 + i * 5), ...Array.from({ length: 60 }, (_, i) => 600 + 5 + i * 5)],
    engagementLogs: [mockLog('pause', 200), mockLog('skip_forward_10', 610), mockLog('mark', 900)],
    listenerScore: 0.23,
  },
  {
    id: '3',
    producerName: 'userA@producer.com',
    showName: 'Voiceover Masters',
    episode: 'S2 E4',
    totalTimeLogged: '00:28:05',
    qcStatus: 'Pass',
    totalDurationSeconds: 1685,
    playSegments: Array.from({ length: 200 }, (_, i) => 5 + i * 5),
    engagementLogs: [mockLog('pause', 100), mockLog('mark', 500), mockLog('mark', 700)],
    listenerScore: 0.62,
  },
  {
    id: '4',
    producerName: 'userB@producer.com',
    showName: 'Podcast Hour',
    episode: '042',
    totalTimeLogged: '00:00:00',
    qcStatus: 'Fail',
    totalDurationSeconds: 3600,
    playSegments: [],
    engagementLogs: [],
    listenerScore: 0,
  },
  {
    id: '5',
    producerName: 'userA@producer.com',
    showName: 'Weakest Beast Tamer',
    episode: 'EP 2 - First Battle',
    totalTimeLogged: '00:55:12',
    qcStatus: 'In Progress',
    totalDurationSeconds: 3312,
    playSegments: Array.from({ length: 400 }, (_, i) => 5 + i * 5),
    engagementLogs: [
      mockLog('pause', 500),
      mockLog('skip_back_5', 1000),
      mockLog('mark', 1500),
      mockLog('mark', 2000),
      mockLog('volume_change', 2500, 0.8),
    ],
    listenerScore: 0.65,
  },
];
