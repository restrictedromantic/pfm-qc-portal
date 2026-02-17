import React, { useEffect, useMemo, useRef } from 'react';
import { FileText, CheckCircle, AlertCircle, Mic, Loader2 } from 'lucide-react';
import { parseTranscript, getActiveSegmentIndex, type TranscriptSegment } from '../utils/transcript';
import { crossCheckScriptVsTranscription } from '../utils/scriptCrossCheck';
import type { Selection } from './BottomBar';

interface CenterPanelProps {
  transcription: string;
  playbackTime: number;
  scriptText: string;
  scriptFileName: string;
  durationSeconds: number;
  selections?: Selection[];
  error?: string | null;
  transcriptionOn?: boolean;
  onTranscriptionToggle?: () => void;
  isTranscribing?: boolean;
  canTranscribe?: boolean;
}

export function CenterPanel({ transcription, playbackTime, scriptText, scriptFileName, durationSeconds, selections = [], error, transcriptionOn = false, onTranscriptionToggle, isTranscribing = false, canTranscribe = false }: CenterPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Primary content is always transcription (what's actually in the audio)
  const displaySegments = useMemo(() => parseTranscript(transcription), [transcription]);

  const activeIndex = getActiveSegmentIndex(displaySegments, playbackTime);

  const crossCheck = useMemo(() => {
    if (!scriptText.trim() || !transcription.trim()) return null;
    return crossCheckScriptVsTranscription(scriptText, transcription);
  }, [scriptText, transcription]);

  // Check if a segment overlaps with any selection
  const segmentHasSelection = (segmentIndex: number) => {
    const seg = displaySegments[segmentIndex];
    if (!seg) return false;
    const nextSeg = displaySegments[segmentIndex + 1];
    const segEnd = nextSeg ? nextSeg.startTime : Infinity;
    return selections.some((sel) => sel.start < segEnd && sel.end > seg.startTime);
  };

  useEffect(() => {
    const activeId = displaySegments[activeIndex]?.id;
    if (!activeId) return;
    const el = segmentRefsRef.current.get(activeId);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeIndex, displaySegments]);

  const setSegmentRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) segmentRefsRef.current.set(id, el);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--qc-panel)] border-r border-[var(--qc-panel-border)]">
      <div className="px-6 py-3 border-b border-[var(--qc-panel-border)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--qc-fail)]" />
            <h3 className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Transcription
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onTranscriptionToggle && (
              <button
                type="button"
                role="switch"
                aria-checked={transcriptionOn}
                onClick={onTranscriptionToggle}
                disabled={!canTranscribe}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${transcriptionOn ? 'border-[var(--qc-success)] bg-[var(--qc-success-bg)] text-[var(--qc-success)]' : 'border-white/30 text-white/70 hover:bg-white/10 hover:text-white'}`}
                title={transcriptionOn ? 'Transcription on' : 'Turn on to transcribe audio'}
              >
                {isTranscribing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
                {isTranscribing ? 'Loading…' : transcriptionOn ? 'On' : 'Off'}
              </button>
            )}
            {crossCheck && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono ${
                crossCheck.allFound
                  ? 'bg-[var(--qc-success-bg)] text-[var(--qc-success)]'
                  : 'bg-[var(--qc-fail-bg)]/50 text-[var(--qc-fail)]'
              }`}
              title={crossCheck.allFound ? 'All script phrases found in audio' : `${crossCheck.missingPhrases.length} phrase(s) not found`}
            >
              {crossCheck.allFound ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {crossCheck.found}/{crossCheck.total} found
            </div>
            )}
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--qc-fail-bg)] border border-[var(--qc-fail)]/50">
            <p className="text-xs text-[var(--qc-fail)] font-mono mb-1">TRANSCRIPTION ERROR</p>
            <p className="text-sm text-white/80">{error}</p>
            <p className="text-xs text-white/60 mt-2">Audio playback is still available.</p>
          </div>
        )}
        {transcription ? (
          displaySegments.length > 0 ? (
            <div className="space-y-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {displaySegments.map((seg: TranscriptSegment, i: number) => (
                <div
                  key={seg.id}
                  ref={setSegmentRef(seg.id)}
                  className={`text-sm leading-relaxed py-2 px-3 rounded-lg transition-colors duration-150 flex items-start gap-2 ${
                    i === activeIndex
                      ? 'bg-[var(--qc-fail)]/20 text-white border-l-2 border-[var(--qc-fail)]'
                      : 'text-white/80'
                  }`}
                  style={
                    segmentHasSelection(i)
                      ? {
                          backgroundColor: selections.find(
                            (sel) => sel.start < (displaySegments[i + 1]?.startTime ?? Infinity) && sel.end > seg.startTime
                          )?.color || 'transparent',
                        }
                      : undefined
                  }
                >
                  <span>{seg.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {transcription}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center min-h-[280px]">
            <FileText className="w-16 h-16 text-[var(--qc-fail)] mb-4 opacity-80" />
            <p className="text-sm text-[var(--qc-fail)]">
              No transcription yet.
            </p>
            <p className="text-xs text-white/50 mt-2">
              Upload audio, then turn Transcribe On to see what’s in the file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
