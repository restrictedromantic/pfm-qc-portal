/**
 * Transcription service: turn an audio file into timestamped transcript text.
 * Uses Hugging Face Transformers.js with Whisper in the browser (no API key).
 * Expected format: one line per segment, "[MM:SS.mmm] Text"
 */

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

/** Mock transcript for fallback when Whisper fails or is loading */
export function getMockTranscript(): string {
  return `[00:00.000] Hello and welcome to today's audio production quality control session. This is a test recording designed to demonstrate the capabilities of our QC portal.

[00:15.234] The system performs real-time analysis of audio characteristics including bitrate, sample rate, codec validation, and VOA compliance standards.

[00:32.567] Our automated transcription service provides millisecond-accurate timestamps for every spoken segment, making it easier to identify and correct issues during post-production.

[01:02.891] Technical specifications are validated against industry standards to ensure broadcast-ready output. The portal supports multiple audio formats including WAV, MP3, FLAC, AAC, and OGG.

[01:45.123] Quality assurance metrics include signal-to-noise ratio, dynamic range analysis, peak level detection, and frequency response validation.

[02:18.456] Thank you for using the Audio Production QC Portal. This concludes the demonstration transcript.`;
}

export async function transcribeAudioFile(file: File): Promise<string> {
  let objectUrl: string | null = null;
  try {
    // Increase limit to 100MB and use adaptive chunking for large files
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 100) {
      throw new Error('File too large for browser transcription (>100MB). Use a smaller file or an external API.');
    }

    objectUrl = URL.createObjectURL(file);
    
    // Dynamic import with timeout for model loading
    const importPromise = import('@huggingface/transformers');
    const importTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Model loading timeout')), 20000)
    );
    const { pipeline } = await Promise.race([importPromise, importTimeout]);

    // Pipeline creation with timeout
    const pipelinePromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      progress_callback: () => {},
    });
    const pipelineTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Pipeline initialization timeout')), 30000)
    );
    const transcriber = await Promise.race([pipelinePromise, pipelineTimeout]);

    // Adaptive chunking: larger files get smaller chunks to avoid memory issues
    const chunkLength = fileSizeMB > 50 ? 20 : fileSizeMB > 20 ? 25 : 30;
    const strideLength = Math.max(2, chunkLength / 6);

    // Transcription with longer timeout for large files
    const timeoutMs = fileSizeMB > 50 ? 120000 : fileSizeMB > 20 ? 90000 : 60000;
    const transcribePromise = transcriber(objectUrl, {
      return_timestamps: true,
      chunk_length_s: chunkLength,
      stride_length_s: strideLength,
    });
    const transcribeTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Transcription processing timeout')), timeoutMs)
    );
    const output = await Promise.race([transcribePromise, transcribeTimeout]);

    if (output?.chunks && Array.isArray(output.chunks) && output.chunks.length > 0) {
      return formatChunks(output.chunks);
    }
    if (output?.text && typeof output.text === 'string') {
      return `[00:00.000] ${output.text.trim()}`;
    }
    throw new Error('No transcription output received');
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown transcription error';
    throw new Error(`Transcription failed: ${errorMsg}`);
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Run transcription in a Web Worker so the UI stays responsive. Passes raw WAV buffer (no AudioContext). */
export function transcribeAudioFileInWorker(file: File): Promise<string> {
  return (async () => {
    try {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 100) {
        throw new Error('File too large for browser transcription (>100MB).');
      }

      const arrayBuffer = await file.arrayBuffer();

      return await new Promise<string>((resolve, reject) => {
        let worker: Worker;
        try {
          worker = new Worker(
            new URL('../workers/transcription.worker.ts', import.meta.url),
            { type: 'module' }
          );
        } catch (err) {
          reject(
            new Error(
              err instanceof Error ? err.message : 'Transcription worker could not start. Try refreshing the page.'
            )
          );
          return;
        }

        const timeoutMs = fileSizeMB > 50 ? 120000 : fileSizeMB > 20 ? 90000 : 60000;
        const timeoutId = setTimeout(() => {
          worker.terminate();
          reject(new Error('Transcription timeout. Try a shorter file.'));
        }, timeoutMs);

        worker.onmessage = (e: MessageEvent<{ type: string; transcript?: string; message?: string }>) => {
          clearTimeout(timeoutId);
          worker.terminate();
          if (e.data.type === 'result' && e.data.transcript != null) {
            resolve(e.data.transcript);
          } else if (e.data.type === 'error') {
            reject(new Error(e.data.message ?? 'Transcription failed'));
          }
        };

        worker.onerror = (err) => {
          clearTimeout(timeoutId);
          worker.terminate();
          reject(new Error(err.message || 'Transcription worker error. Audio playback is still available.'));
        };

        worker.postMessage({ type: 'transcribe', arrayBuffer, fileSizeMB }, [arrayBuffer]);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      throw new Error(msg);
    }
  })();
}
