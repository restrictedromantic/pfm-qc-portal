import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronDown, ChevronUp, PenTool } from 'lucide-react';
import {
  type EngagementLogEntry,
  type EngagementData,
  computeUniqueSecondsPlayed,
  computeListenerScore,
} from '../utils/engagement';
import { useSystemConsole } from '../context/SystemConsoleContext';

const SKIP_5 = 5;
const SKIP_10 = 10;
const PLAY_SAMPLE_INTERVAL_MS = 5000;

/** Draw a mock sine waveform into the container when real load fails – proves container is visible */
function drawMockWaveform(container: HTMLElement | null) {
  if (!container) return;
  const width = Math.max(container.offsetWidth || 400, 400);
  const height = Math.max(container.offsetHeight || 128, 128);
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const midY = height / 2;
  for (let x = 0; x <= width; x += 2) {
    const t = (x / width) * Math.PI * 8;
    const y = midY + Math.sin(t) * (height * 0.35);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export interface Selection {
  id: string;
  start: number;
  end: number;
  color: string;
}

// Color palette for selections - each new selection gets next color
const SELECTION_COLORS = [
  'rgba(0, 255, 136, 0.3)', // green
  'rgba(59, 130, 246, 0.3)', // blue
  'rgba(168, 85, 247, 0.3)', // purple
  'rgba(236, 72, 153, 0.3)', // pink
  'rgba(251, 191, 36, 0.3)', // yellow
  'rgba(34, 197, 94, 0.3)', // emerald
  'rgba(249, 115, 22, 0.3)', // orange
  'rgba(239, 68, 68, 0.3)', // red
];

interface BottomBarProps {
  audioFile: File | null;
  onTimeUpdate?: (timeSeconds: number) => void;
  onDurationChange?: (durationSeconds: number) => void;
  onTotalActivePlayTimeChange?: (totalSeconds: number) => void;
  onEngagementDataChange?: (data: EngagementData) => void;
  selections?: Selection[];
  onAddSelection?: (selection: Selection) => void;
  /** When a region is resized or moved, sync Start/End to CreativeQCLog (id = selection id, start/end in seconds) */
  onSelectionUpdate?: (id: string, params: { start: number; end: number }) => void;
}

export function BottomBar({ audioFile, onTimeUpdate, onDurationChange, onTotalActivePlayTimeChange, onEngagementDataChange, selections = [], onAddSelection, onSelectionUpdate }: BottomBarProps) {
  const { systemLog } = useSystemConsole();
  const systemLogRef = useRef(systemLog);
  systemLogRef.current = systemLog;

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<InstanceType<typeof RegionsPlugin> | null>(null);
  const disableDragSelectionRef = useRef<(() => void) | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragEndRef = useRef<number | null>(null);
  const mockDrawnRef = useRef(false);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationChangeRef = useRef(onDurationChange);
  const onTotalActivePlayTimeChangeRef = useRef(onTotalActivePlayTimeChange);
  const onEngagementDataChangeRef = useRef(onEngagementDataChange);
  const onAddSelectionRef = useRef(onAddSelection);
  const onSelectionUpdateRef = useRef(onSelectionUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  onDurationChangeRef.current = onDurationChange;
  onTotalActivePlayTimeChangeRef.current = onTotalActivePlayTimeChange;
  onEngagementDataChangeRef.current = onEngagementDataChange;
  onAddSelectionRef.current = onAddSelection;
  onSelectionUpdateRef.current = onSelectionUpdate;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00.000');
  const [duration, setDuration] = useState('00:00.000');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [markingMode, setMarkingMode] = useState(false);

  /** Total time the audio has been physically playing (accumulated on each pause). Ready to send to DB. */
  const [totalActivePlayTime, setTotalActivePlayTime] = useState(0);
  const playStartPositionRef = useRef<number>(0);

  /** Engagement: heatmap of which parts were played (currentTime pushed every 5s while playing). */
  const [playSegments, setPlaySegments] = useState<number[]>([]);
  /** Engagement: log of pauses, skips, volume changes, marks. */
  const [engagementLogs, setEngagementLogs] = useState<EngagementLogEntry[]>([]);
  const playSampleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Smart magnifier: locked start on first click, live end during drag
  const [magnifierLockedStart, setMagnifierLockedStart] = useState<number | null>(null);
  const [dragEndTime, setDragEndTime] = useState<number | null>(null);
  const isMagnifierDragRef = useRef(false);

  // Hover magnify: ±5s zoomed view for precise marker placement
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const waveformWrapperRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);
  const magnifierWsRef = useRef<WaveSurfer | null>(null);
  const magnifierScrollRef = useRef<HTMLDivElement | null>(null);

  const pushEngagementLog = (entry: Omit<EngagementLogEntry, 'timestamp'>) => {
    setEngagementLogs((prev) => {
      const next = [...prev, { ...entry, timestamp: Date.now() }];
      return next;
    });
  };

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      try {
        const regionsPlugin = RegionsPlugin.create();
        regionsPluginRef.current = regionsPlugin;

        regionsPlugin.on('region-created', (region) => {
          pushEngagementLog({ type: 'mark', playbackTime: (region.start + region.end) / 2 });
          onAddSelectionRef.current?.({
            id: region.id,
            start: region.start,
            end: region.end,
            color: region.color,
          });
          // Update CreativeQCLog only when drag/resize ends (not during)
          region.on('update-end', () => {
            onSelectionUpdateRef.current?.(region.id, { start: region.start, end: region.end });
          });
        });

        // Main-thread only: MediaElement backend (no Web Worker decode); no pre-computed peaks
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#831843',
          progressColor: '#ec4899',
          cursorColor: '#f9a8d4',
          barWidth: 2,
          barGap: 0,
          barRadius: 1,
          height: 128,
          normalize: true,
          backend: 'MediaElement',
          minPxPerSec: 20,
          plugins: [regionsPlugin],
          sampleRate: 8000,
        });

        wavesurferRef.current.on('play', () => {
          setIsPlaying(true);
          playStartPositionRef.current = wavesurferRef.current?.getCurrentTime() ?? 0;
        });
        wavesurferRef.current.on('pause', () => {
          setIsPlaying(false);
          const now = wavesurferRef.current?.getCurrentTime() ?? 0;
          pushEngagementLog({ type: 'pause', playbackTime: now });
          const elapsed = Math.max(0, now - playStartPositionRef.current);
          setTotalActivePlayTime((prev) => {
            const next = prev + elapsed;
            onTotalActivePlayTimeChangeRef.current?.(next);
            return next;
          });
        });

        wavesurferRef.current.on('timeupdate', (time) => {
          setCurrentTime(formatTime(time));
          onTimeUpdateRef.current?.(time);
        });

        wavesurferRef.current.on('audioprocess', (time) => {
          setCurrentTime(formatTime(time));
          onTimeUpdateRef.current?.(time);
        });

        wavesurferRef.current.on('ready', () => {
          mockDrawnRef.current = false;
          const dur = wavesurferRef.current?.getDuration() ?? 0;
          setDuration(formatTime(dur));
          setDurationSeconds(dur);
          onDurationChangeRef.current?.(dur);
          setIsReady(true);
          systemLogRef.current?.('Region Plugin Initialization', 'milestone', 'success');
        });

        wavesurferRef.current.on('load', () => {
          setIsReady(false);
          setMarkingMode(false);
          setMagnifierLockedStart(null);
          setDragEndTime(null);
          setTotalActivePlayTime(0);
          onTotalActivePlayTimeChangeRef.current?.(0);
          setPlaySegments([]);
          setEngagementLogs([]);
          isDraggingRef.current = false;
          dragStartRef.current = null;
          dragEndRef.current = null;
        });

        wavesurferRef.current.on('error', () => {
          setIsReady(false);
          systemLogRef.current?.('WaveSurfer error – showing mock waveform', 'error', 'error');
          mockDrawnRef.current = true;
          drawMockWaveform(waveformRef.current);
        });
      } catch {
        // WaveSurfer init failed; component may unmount or retry
      }
    }

    return () => {
      disableDragSelectionRef.current?.();
      disableDragSelectionRef.current = null;
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch {
          // ignore destroy errors on teardown
        }
        wavesurferRef.current = null;
      }
      regionsPluginRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!wavesurferRef.current) return;
    
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    
    setIsReady(false);
    setCurrentTime('00:00.000');
    setDuration('00:00.000');
    setDurationSeconds(0);
    setTotalActivePlayTime(0);
    setPlaySegments([]);
    setEngagementLogs([]);
    onDurationChangeRef.current?.(0);
    onTotalActivePlayTimeChangeRef.current?.(0);
    setMarkingMode(false);

    // Always load local file / blob URL when present (Offline mode does not skip – waveform always uses local source)
    if (audioFile) {
      if (mockDrawnRef.current && waveformRef.current) {
        waveformRef.current.innerHTML = '';
        mockDrawnRef.current = false;
      }
      try {
        const url = URL.createObjectURL(audioFile);
        objectUrlRef.current = url;
        console.log('BLOB URL CREATED:', url);
        systemLogRef.current?.('BLOB URL CREATED: ' + url, 'log');
        wavesurferRef.current.load(url).catch((err) => {
          systemLogRef.current?.(`WaveSurfer load failed: ${err instanceof Error ? err.message : String(err)} – showing mock waveform`, 'error', 'error');
          mockDrawnRef.current = true;
          drawMockWaveform(waveformRef.current);
        });
      } catch (e) {
        setIsReady(false);
        systemLogRef.current?.(`Blob URL creation failed: ${e instanceof Error ? e.message : String(e)}`, 'error', 'error');
        mockDrawnRef.current = true;
        drawMockWaveform(waveformRef.current);
      }
    }
  }, [audioFile]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
    }
  }, [volume]);

  // Sync selections to Regions plugin: update existing regions in place (setOptions) so positions stay locked to timeline; only add/remove when needed
  useEffect(() => {
    const regionsPlugin = regionsPluginRef.current;
    const ws = wavesurferRef.current;
    if (!regionsPlugin || !ws || !isReady || durationSeconds <= 0) return;
    const existing = regionsPlugin.getRegions();
    const selectionIds = new Set(selections.map((s) => s.id));
    existing.forEach((region) => {
      if (!selectionIds.has(region.id)) region.remove();
    });
    selections.forEach((sel) => {
      const existingRegion = regionsPlugin.getRegions().find((r) => r.id === sel.id);
      if (existingRegion) {
        existingRegion.setOptions({ start: sel.start, end: sel.end });
      } else {
        const region = regionsPlugin.addRegion({
          id: sel.id,
          start: sel.start,
          end: sel.end,
          color: sel.color,
          drag: true,
          resize: true,
          resizeStart: true,
          resizeEnd: true,
          minLength: 0.1,
        });
        region.on('update-end', () => {
          onSelectionUpdateRef.current?.(region.id, { start: region.start, end: region.end });
        });
      }
    });
  }, [selections, isReady, durationSeconds]);

  // When marking mode turns off, clear magnifier lock
  useEffect(() => {
    if (!markingMode) {
      setMagnifierLockedStart(null);
      setDragEndTime(null);
    }
  }, [markingMode]);

  // When marking mode is on, enable drag-to-create region; when off, disable
  useEffect(() => {
    disableDragSelectionRef.current?.();
    disableDragSelectionRef.current = null;
    const regions = regionsPluginRef.current;
    if (!regions || !markingMode || !isReady) return;
    const nextColor = SELECTION_COLORS[selections.length % SELECTION_COLORS.length];
    disableDragSelectionRef.current = regions.enableDragSelection(
      {
        id: `sel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        color: nextColor,
        drag: true,
        resize: true,
      },
      5
    );
    return () => {
      disableDragSelectionRef.current?.();
      disableDragSelectionRef.current = null;
    };
  }, [markingMode, isReady, selections.length]);

  // Every 5s of active playback, push currentTime into playSegments
  useEffect(() => {
    if (!isPlaying || !wavesurferRef.current) {
      if (playSampleIntervalRef.current) {
        clearInterval(playSampleIntervalRef.current);
        playSampleIntervalRef.current = null;
      }
      return;
    }
    const tick = () => {
      const t = wavesurferRef.current?.getCurrentTime();
      if (t != null) setPlaySegments((prev) => [...prev, t]);
    };
    playSampleIntervalRef.current = setInterval(tick, PLAY_SAMPLE_INTERVAL_MS);
    return () => {
      if (playSampleIntervalRef.current) {
        clearInterval(playSampleIntervalRef.current);
        playSampleIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  // Notify parent with full engagement data when heatmap or logs change
  useEffect(() => {
    if (durationSeconds <= 0) return;
    const uniqueSeconds = computeUniqueSecondsPlayed(playSegments);
    const totalMarks = engagementLogs.filter((e) => e.type === 'mark').length;
    const listenerScore = computeListenerScore(uniqueSeconds, durationSeconds, totalMarks);
    const data: EngagementData = {
      playSegments: [...playSegments],
      engagementLogs: [...engagementLogs],
      uniqueSecondsPlayed: uniqueSeconds,
      totalDurationSeconds: durationSeconds,
      totalMarks,
      listenerScore,
    };
    onEngagementDataChangeRef.current?.(data);
  }, [playSegments, engagementLogs, durationSeconds]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const togglePlayPause = async () => {
    if (!wavesurferRef.current || !isReady) return;
    // Resume Web Audio context if present (WebAudio backend); no-op for MediaElement
    const audioCtx = (wavesurferRef.current as { getAudioContext?: () => AudioContext | undefined }).getAudioContext?.();
    if (audioCtx?.state === 'suspended') {
      await audioCtx.resume();
    }
    wavesurferRef.current.playPause();
  };

  const skip = (seconds: number) => {
    if (!wavesurferRef.current || !isReady) return;
    const playbackTime = wavesurferRef.current.getCurrentTime();
    const type =
      seconds === -10 ? 'skip_back_10' : seconds === -5 ? 'skip_back_5' : seconds === 5 ? 'skip_forward_5' : 'skip_forward_10';
    pushEngagementLog({ type, playbackTime });
    wavesurferRef.current.skip(seconds);
  };

  // Convert pixel X to time in seconds
  const pixelToTime = (x: number, containerWidth: number): number => {
    if (!durationSeconds || !containerWidth) return 0;
    const percent = Math.max(0, Math.min(1, x / containerWidth));
    return percent * durationSeconds;
  };

  const MAGNIFY_WINDOW_SEC = 10; // ±5s = 10s total
  const MAGNIFIER_WIDTH_PX = 280;

  // Create magnifier WaveSurfer when main waveform is ready (same audio, zoomed to 10s)
  useEffect(() => {
    if (!isReady || !magnifierRef.current || !objectUrlRef.current || !durationSeconds) return;
    const url = objectUrlRef.current;
    let mounted = true;
    const ws = WaveSurfer.create({
      container: magnifierRef.current,
      waveColor: '#831843',
      progressColor: '#ec4899',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 0,
      barRadius: 1,
      height: 56,
      normalize: true,
      backend: 'MediaElement',
      minPxPerSec: MAGNIFIER_WIDTH_PX / MAGNIFY_WINDOW_SEC,
      interact: false,
    });
    magnifierWsRef.current = ws;
    ws.load(url).then(() => {
      if (!mounted || !magnifierRef.current) return;
      const container = magnifierRef.current;
      const scrollEl = container.querySelector('[style*="overflow"]') as HTMLElement
        ?? (container.firstElementChild as HTMLElement)
        ?? container;
      magnifierScrollRef.current = scrollEl;
    });
    return () => {
      mounted = false;
      try { ws.destroy(); } catch { /* noop */ }
      magnifierWsRef.current = null;
      magnifierScrollRef.current = null;
    };
  }, [isReady, durationSeconds]);

  // Magnifier scroll: center on locked start (first click) or hover time
  const magnifierCenter = magnifierLockedStart ?? hoverTime ?? 0;
  useEffect(() => {
    if (!magnifierScrollRef.current || !durationSeconds) return;
    const center = Math.max(5, Math.min(durationSeconds - 5, magnifierCenter));
    const startSec = center - 5;
    const pxPerSec = MAGNIFIER_WIDTH_PX / MAGNIFY_WINDOW_SEC;
    const scrollLeft = Math.max(0, startSec * pxPerSec);
    magnifierScrollRef.current.scrollLeft = scrollLeft;
  }, [magnifierCenter, durationSeconds]);

  // Smart magnifier: on first click lock start; during drag show end live
  useEffect(() => {
    const container = waveformWrapperRef.current;
    if (!container || !durationSeconds) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const t = pixelToTime(x, rect.width);
      if (markingMode) {
        setMagnifierLockedStart(t);
        isMagnifierDragRef.current = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMagnifierDragRef.current) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setDragEndTime(pixelToTime(x, rect.width));
    };

    const handleMouseUp = () => {
      isMagnifierDragRef.current = false;
      setMagnifierLockedStart(null);
      setDragEndTime(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [markingMode, durationSeconds]);

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = waveformWrapperRef.current;
    if (!el || !durationSeconds) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = pixelToTime(x, rect.width);
    setHoverTime(t);
  };

  const handleWaveformMouseLeave = () => setHoverTime(null);

  const magnifierStart = magnifierCenter > 0 ? Math.max(0, magnifierCenter - 5) : 0;
  const magnifierEnd = magnifierCenter > 0 ? Math.min(durationSeconds, magnifierCenter + 5) : 0;
  const showMagnifier = (hoverTime != null || magnifierLockedStart != null) && isReady && durationSeconds > 0;

  return (
    <div className="bg-[var(--qc-panel)] border-t border-[var(--qc-panel-border)] px-6 py-3 flex flex-col gap-3">
      {/* Pro waveform row + hover magnify */}
      <div
        ref={waveformWrapperRef}
        onMouseMove={handleWaveformMouseMove}
        onMouseLeave={handleWaveformMouseLeave}
        className={`w-full min-h-[128px] rounded overflow-visible bg-black/20 relative ${
          markingMode ? 'cursor-crosshair' : ''
        }`}
        style={{ minHeight: 128 }}
      >
        <div ref={waveformRef} className="w-full h-full min-h-[128px]" style={{ minHeight: 128, width: '100%' }} />
        {/* Smart magnifier: hover = timestamp; first click = lock Start; during drag = live End */}
        <div
          className={`absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] rounded-lg border border-white/30 bg-black/95 shadow-xl overflow-hidden pointer-events-none transition-opacity ${
            showMagnifier ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ height: 72 }}
        >
          <div className="absolute top-0 left-0 right-0 px-2 py-1 text-[10px] text-white/80 font-mono bg-black/50 flex flex-col gap-0.5">
            {magnifierLockedStart != null && (
              <span>Start: {formatTime(magnifierLockedStart)}</span>
            )}
            {dragEndTime != null && (
              <span>End: {formatTime(dragEndTime)}</span>
            )}
            {hoverTime != null && magnifierLockedStart == null && dragEndTime == null && (
              <span>Time: {formatTime(hoverTime)}</span>
            )}
            <span>{formatTime(magnifierStart)} → {formatTime(magnifierEnd)}</span>
          </div>
          <div ref={magnifierRef} className="absolute inset-0 top-8 w-full h-[56px]" />
        </div>
        {/* Timestamp inside waveform window */}
        <div
          className="absolute bottom-1 left-2 text-xs text-white/80 font-mono pointer-events-none z-20"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {currentTime} / {duration}
        </div>
        {markingMode && (
          <div className="absolute top-1 right-2 text-xs text-white/60 font-mono pointer-events-none z-20">
            Drag to select
          </div>
        )}
      </div>

      {/* Centered control box: play/pause, skip, collapsible volume */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-4 px-6 py-3 rounded-xl border border-[var(--qc-panel-border)] bg-black/30 shadow-lg">
          <div className="flex items-center gap-1">
            <button
              onClick={() => skip(-SKIP_10)}
              className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!audioFile}
              title="Skip back 10s"
            >
              <SkipBack className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">10s</span>
            </button>
            <button
              onClick={() => skip(-SKIP_5)}
              className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!audioFile}
              title="Skip back 5s"
            >
              <SkipBack className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">5s</span>
            </button>
          </div>

          <button
            onClick={togglePlayPause}
            className="p-3 rounded-full bg-[#ec4899] hover:bg-[#f472b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md"
            disabled={!audioFile || !isReady}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => skip(SKIP_5)}
              className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!audioFile}
              title="Skip forward 5s"
            >
              <SkipForward className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">5s</span>
            </button>
            <button
              onClick={() => skip(SKIP_10)}
              className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!audioFile}
              title="Skip forward 10s"
            >
              <SkipForward className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">10s</span>
            </button>
          </div>

          <div className="w-px h-8 bg-white/20" />

          <button
            type="button"
            onClick={() => setMarkingMode((m) => !m)}
            disabled={!audioFile || !isReady}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-mono ${
              markingMode
                ? 'border-[var(--qc-success)] bg-[var(--qc-success-bg)] text-[var(--qc-success)]'
                : 'border-white/30 text-white/70 hover:bg-white/10 hover:text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={markingMode ? 'Exit marking mode' : 'Enable marking tool - drag on waveform to create selections'}
          >
            <PenTool className="w-4 h-4" />
            {markingMode ? 'Marking' : 'Mark'}
          </button>

          <div className="w-px h-8 bg-white/20" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVolumeOpen((v) => !v)}
              className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              title={volumeOpen ? 'Hide volume' : 'Show volume'}
            >
              <Volume2 className="w-5 h-5" />
              {volumeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {volumeOpen && (
              <div className="flex items-center gap-2 transition-opacity duration-200">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    pushEngagementLog({
                      type: 'volume_change',
                      playbackTime: wavesurferRef.current?.getCurrentTime() ?? 0,
                      value: v,
                    });
                  }}
                  className="w-24 h-2 rounded-full appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ec4899]"
                />
                <span className="text-xs text-white/60 w-8" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
