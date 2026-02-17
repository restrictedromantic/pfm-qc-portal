/**
 * Transcription Web Worker: runs Whisper off the main thread so the UI stays responsive.
 * Receives WAV as ArrayBuffer, converts to Float32Array (16kHz mono) with wavefile,
 * passes raw audio to pipeline (no AudioContext needed).
 */

import { WaveFile } from 'wavefile';

function secondsToTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function formatChunks(
  chunks: Array<{ timestamp: [number | null, number | null]; text: string }>
): string {
  return chunks
    .map((c) => {
      const [start] = c.timestamp;
      const t = start != null ? start : 0;
      const text = (c.text ?? '').trim();
      return text ? `[${secondsToTimestamp(t)}] ${text}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Convert WAV ArrayBuffer to Float32Array mono 16kHz for Whisper. */
function wavToFloat32Mono16k(arrayBuffer: ArrayBuffer): Float32Array {
  const wav = new WaveFile(new Uint8Array(arrayBuffer));
  wav.toBitDepth('32f');
  wav.toSampleRate(16000);
  let samples = wav.getSamples(false, Float32Array) as Float32Array | Float32Array[];
  if (Array.isArray(samples)) {
    if (samples.length > 1) {
      const SCALING_FACTOR = Math.sqrt(2);
      const merged = new Float32Array(samples[0].length);
      for (let i = 0; i < samples[0].length; ++i) {
        merged[i] = (SCALING_FACTOR * (samples[0][i] + (samples[1]?.[i] ?? 0))) / 2;
      }
      return merged;
    }
    return samples[0];
  }
  return samples;
}

self.onmessage = async (
  e: MessageEvent<{ type: 'transcribe'; arrayBuffer: ArrayBuffer; fileSizeMB: number }>
) => {
  if (e.data.type !== 'transcribe') return;
  const { arrayBuffer, fileSizeMB } = e.data;

  try {
    const audioData = wavToFloat32Mono16k(arrayBuffer);

    const { pipeline } = await import('@huggingface/transformers');

    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      progress_callback: () => {},
    });

    const chunkLength = fileSizeMB > 50 ? 20 : fileSizeMB > 20 ? 25 : 30;
    const strideLength = Math.max(2, chunkLength / 6);

    const output = await transcriber(audioData, {
      return_timestamps: true,
      chunk_length_s: chunkLength,
      stride_length_s: strideLength,
    });

    if (output?.chunks && Array.isArray(output.chunks) && output.chunks.length > 0) {
      self.postMessage({ type: 'result', transcript: formatChunks(output.chunks) });
    } else if (output?.text && typeof output.text === 'string') {
      self.postMessage({ type: 'result', transcript: `[00:00.000] ${output.text.trim()}` });
    } else {
      self.postMessage({ type: 'error', message: 'No transcription output received' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown transcription error';
    self.postMessage({ type: 'error', message: `Transcription failed: ${message}` });
  }
};
