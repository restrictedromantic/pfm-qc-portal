import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronDown, ChevronUp, PenTool } from 'lucide-react';
import {
  type EngagementLogEntry,
  type EngagementData,
  computeUniqueSecondsPlayed,
  computeListenerScore,
} from '../utils/engagement';

const SKIP_5 = 5;
const SKIP_10 = 10;
const PLAY_SAMPLE_INTERVAL_MS = 5000;

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
}

export function BottomBar({ audioFile, onTimeUpdate, onDurationChange, onTotalActivePlayTimeChange, onEngagementDataChange, selections = [], onAddSelection }: BottomBarProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationChangeRef = useRef(onDurationChange);
  const onTotalActivePlayTimeChangeRef = useRef(onTotalActivePlayTimeChange);
  const onEngagementDataChangeRef = useRef(onEngagementDataChange);
  onTimeUpdateRef.current = onTimeUpdate;
  onDurationChangeRef.current = onDurationChange;
  onTotalActivePlayTimeChangeRef.current = onTotalActivePlayTimeChange;
  onEngagementDataChangeRef.current = onEngagementDataChange;
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

  // Custom drag selection state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragEndRef = useRef<number | null>(null);
  const selectionOverlayRef = useRef<HTMLDivElement | null>(null);

  const pushEngagementLog = (entry: Omit<EngagementLogEntry, 'timestamp'>) => {
    setEngagementLogs((prev) => {
      const next = [...prev, { ...entry, timestamp: Date.now() }];
      return next;
    });
  };

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      try {
        // MediaElement backend uses HTML5 audio - reliable play/pause and seeker sync
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#831843',
          progressColor: '#ec4899',
          cursorColor: '#f9a8d4',
          barWidth: 3,
          barGap: 1,
          barRadius: 3,
          height: 72,
          normalize: true,
          backend: 'MediaElement',
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
          const dur = wavesurferRef.current?.getDuration() ?? 0;
          setDuration(formatTime(dur));
          setDurationSeconds(dur);
          onDurationChangeRef.current?.(dur);
          setIsReady(true);
        });

        wavesurferRef.current.on('load', () => {
          setIsReady(false);
          setMarkingMode(false);
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
        });
      } catch {
        // WaveSurfer init failed; component may unmount or retry
      }
    }

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch {
          // ignore destroy errors on teardown
        }
        wavesurferRef.current = null;
      }
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

    if (audioFile) {
      try {
        const url = URL.createObjectURL(audioFile);
        objectUrlRef.current = url;
        wavesurferRef.current.load(url);
      } catch {
        setIsReady(false);
      }
    }
  }, [audioFile]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
    }
  }, [volume]);

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

  // Custom drag selection handlers - only attach when marking mode is active
  useEffect(() => {
    if (!markingMode || !isReady || !waveformRef.current || !wavesurferRef.current || !durationSeconds) {
      // Clean up if marking mode is off
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
      return;
    }

    // Use the parent container, not the waveform div itself (which WaveSurfer controls)
    const container = waveformRef.current.parentElement;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start drag if clicking on the waveform area (not on controls)
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.selection-overlay')) return;
      
      isDraggingRef.current = true;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      dragStartRef.current = pixelToTime(x, rect.width);
      dragEndRef.current = dragStartRef.current;
      
      // Show overlay
      if (selectionOverlayRef.current) {
        selectionOverlayRef.current.style.display = 'block';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || dragStartRef.current === null) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      dragEndRef.current = pixelToTime(x, rect.width);
      
      // Update visual overlay
      if (selectionOverlayRef.current && dragStartRef.current !== null && dragEndRef.current !== null) {
        const start = Math.min(dragStartRef.current, dragEndRef.current);
        const end = Math.max(dragStartRef.current, dragEndRef.current);
        const leftPercent = (start / durationSeconds) * 100;
        const widthPercent = ((end - start) / durationSeconds) * 100;
        selectionOverlayRef.current.style.left = `${leftPercent}%`;
        selectionOverlayRef.current.style.width = `${widthPercent}%`;
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current || dragStartRef.current === null || dragEndRef.current === null) return;
      
      const start = Math.min(dragStartRef.current, dragEndRef.current);
      const end = Math.max(dragStartRef.current, dragEndRef.current);
      
      if (end - start > 0.1 && onAddSelection) {
        const colorIndex = selections.length % SELECTION_COLORS.length;
        const color = SELECTION_COLORS[colorIndex];
        const selection: Selection = {
          id: `sel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          start,
          end,
          color,
        };
        pushEngagementLog({ type: 'mark', playbackTime: (start + end) / 2 });
        onAddSelection(selection);
      }
      
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
      if (selectionOverlayRef.current) {
        selectionOverlayRef.current.style.display = 'none';
      }
    };

    container.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [markingMode, isReady, durationSeconds, selections.length, onAddSelection]);

  return (
    <div className="bg-[var(--qc-panel)] border-t border-[var(--qc-panel-border)] px-6 py-3 flex flex-col gap-3">
      {/* Waveform row - timestamp inside, custom drag selection */}
      <div
        className={`w-full min-h-[72px] rounded overflow-hidden bg-black/20 relative ${
          markingMode ? 'cursor-crosshair' : ''
        }`}
      >
        <div ref={waveformRef} className="w-full h-full" />
        {/* Selection overlays */}
        {durationSeconds > 0 && selections.map((sel) => (
          <div
            key={sel.id}
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{
              left: `${(sel.start / durationSeconds) * 100}%`,
              width: `${((sel.end - sel.start) / durationSeconds) * 100}%`,
              backgroundColor: sel.color,
            }}
          />
        ))}
        {/* Temporary drag overlay */}
        {markingMode && (
          <div
            ref={selectionOverlayRef}
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{ display: 'none', backgroundColor: SELECTION_COLORS[selections.length % SELECTION_COLORS.length] }}
          />
        )}
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
