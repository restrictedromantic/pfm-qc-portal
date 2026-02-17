/**
 * Parse transcript text with [MM:SS.mmm] timestamps into segments.
 * Used for live scroll and highlight during playback.
 */
export interface TranscriptSegment {
  startTime: number; // seconds
  text: string;
  id: string;
}

const LINE_REGEX = /^\[(\d{1,2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/;

function timestampToSeconds(m: number, s: number, ms: number): number {
  return m * 60 + s + ms / 1000;
}

export function parseTranscript(transcription: string): TranscriptSegment[] {
  if (!transcription.trim()) return [];
  const segments: TranscriptSegment[] = [];
  const lines = transcription.split('\n');
  let id = 0;
  for (const line of lines) {
    const match = line.match(LINE_REGEX);
    if (match) {
      const m = parseInt(match[1], 10);
      const s = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const text = match[4].trim();
      if (text) {
        segments.push({
          startTime: timestampToSeconds(m, s, ms),
          text,
          id: `seg-${id++}`,
        });
      }
    }
  }
  return segments;
}

/** Get the segment index that contains the given time (seconds) */
export function getActiveSegmentIndex(segments: TranscriptSegment[], timeSeconds: number): number {
  for (let i = segments.length - 1; i >= 0; i--) {
    if (timeSeconds >= segments[i].startTime) return i;
  }
  return 0;
}

/** Parse script (timestamped or plain) into segments for real-time scroll. */
export function parseScriptToSegments(
  script: string,
  durationSeconds: number
): TranscriptSegment[] {
  if (!script.trim()) return [];
  const segments: TranscriptSegment[] = [];
  const lines = script.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const hasTimestamps = lines.some((l) => LINE_REGEX.test(l));

  if (hasTimestamps) {
    let id = 0;
    for (const line of lines) {
      const match = line.match(LINE_REGEX);
      if (match) {
        const m = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0'), 10);
        const text = match[4].trim();
        if (text) {
          segments.push({
            startTime: timestampToSeconds(m, s, ms),
            text,
            id: `script-${id++}`,
          });
        }
      }
    }
    return segments;
  }

  // Plain text: distribute lines evenly by duration
  if (lines.length === 0 || durationSeconds <= 0) return [];
  const step = durationSeconds / lines.length;
  return lines.map((text, i) => ({
    startTime: i * step,
    text,
    id: `script-${i}`,
  }));
}

/** Check if a marker time falls within a segment (by index). */
export function isMarkerInSegment(
  segments: TranscriptSegment[],
  segmentIndex: number,
  markerTime: number
): boolean {
  const seg = segments[segmentIndex];
  if (!seg) return false;
  const endTime =
    segmentIndex < segments.length - 1 ? segments[segmentIndex + 1].startTime : Infinity;
  return markerTime >= seg.startTime && markerTime < endTime;
}
