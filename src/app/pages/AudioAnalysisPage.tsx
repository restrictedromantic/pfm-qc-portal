import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import WaveSurfer from 'wavesurfer.js';
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Music,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export interface AudioAnalysis {
  format: string;
  duration: number;
  durationFormatted: string;
  size: number;
  sizeFormatted: string;
  codec: string;
  channels: number;
  channelsFormatted: string;
  bitrate: string;
  sampleRate: number;
  sampleRateFormatted: string;
}

const CODEC_MAP: Record<string, string> = {
  wav: 'PCM',
  mp3: 'MPEG-1 Layer 3',
  flac: 'FLAC',
  aac: 'AAC-LC',
  m4a: 'AAC',
  ogg: 'Vorbis',
  opus: 'Opus',
  webm: 'Vorbis/Opus',
};

function getCodec(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return CODEC_MAP[ext] || 'Unknown';
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

function analyzeAudioFile(file: File): Promise<AudioAnalysis> {
  const format = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  const size = file.size;
  const sizeFormatted = formatSize(size);
  const codec = getCodec(file.name);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const onError = (err: Error) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => {
        audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            URL.revokeObjectURL(url);
            const duration = buffer.duration;
            const channels = buffer.numberOfChannels;
            const sampleRate = buffer.sampleRate;
            const bitrateKbps = duration > 0 ? Math.round((size * 8) / duration / 1000) : 0;
            resolve({
              format,
              duration,
              durationFormatted: formatDuration(duration),
              size,
              sizeFormatted,
              codec,
              channels,
              channelsFormatted: channels === 1 ? 'Mono (1)' : channels === 2 ? 'Stereo (2)' : `${channels} channels`,
              bitrate: `${bitrateKbps} kbps`,
              sampleRate,
              sampleRateFormatted: sampleRate >= 1000 ? `${(sampleRate / 1000).toFixed(1)} kHz` : `${sampleRate} Hz`,
            });
          },
          () => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
              const duration = audio.duration;
              URL.revokeObjectURL(url);
              resolve({
                format,
                duration,
                durationFormatted: formatDuration(duration),
                size,
                sizeFormatted,
                codec,
                channels: 2,
                channelsFormatted: 'Stereo (2)',
                bitrate: duration > 0 ? `${Math.round((size * 8) / duration / 1000)} kbps` : '—',
                sampleRate: 44100,
                sampleRateFormatted: '44.1 kHz',
              });
            };
            audio.onerror = () => onError(new Error('Failed to load audio'));
            audio.src = url;
          }
        );
      })
      .catch(onError);
  });
}

export function AudioAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00.000');
  const [durationDisplay, setDurationDisplay] = useState('00:00.000');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setFile(f);
    setAnalysis(null);
    setError(null);
    setAnalyzing(true);
    analyzeAudioFile(f)
      .then((a) => {
        setAnalysis(a);
        setDurationDisplay(a.durationFormatted);
      })
      .catch((e) => setError(e?.message || 'Analysis failed'))
      .finally(() => setAnalyzing(false));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.wav', '.mp3', '.flac', '.aac', '.m4a', '.ogg', '.opus', '.webm'],
    },
    multiple: false,
    disabled: analyzing,
  });

  useEffect(() => {
    if (!waveformRef.current || wavesurferRef.current) return;
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#831843',
      progressColor: '#ec4899',
      cursorColor: '#f9a8d4',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 72,
      normalize: true,
      backend: 'WebAudio',
    });
    wavesurferRef.current.on('play', () => setIsPlaying(true));
    wavesurferRef.current.on('pause', () => setIsPlaying(false));
    wavesurferRef.current.on('interaction', () => {
      const ctx = wavesurferRef.current?.getAudioContext();
      if (ctx?.state === 'suspended') ctx.resume();
    });
    wavesurferRef.current.on('audioprocess', (time) => setCurrentTime(formatDuration(time)));
    wavesurferRef.current.on('ready', () => {
      const d = wavesurferRef.current?.getDuration();
      if (d != null) setDurationDisplay(formatDuration(d));
    });
    return () => {
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!file || !wavesurferRef.current) return;
    const url = URL.createObjectURL(file);
    wavesurferRef.current.load(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const togglePlayPause = async () => {
    if (!wavesurferRef.current) return;
    const ctx = wavesurferRef.current.getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    wavesurferRef.current.playPause();
  };

  const skip = (seconds: number) => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.skip(seconds);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-foreground dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Music className="w-6 h-6 text-[var(--qc-success)]" />
            <h1 className="text-xl font-semibold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Audio Analysis
            </h1>
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-8 ${
            isDragActive
              ? 'border-[var(--qc-success)] bg-[var(--qc-success-bg)]'
              : analyzing
                ? 'border-muted-foreground/30 cursor-wait'
                : 'border-[var(--qc-panel-border)] hover:border-[var(--qc-success)]/50 bg-[var(--qc-panel)]'
          }`}
        >
          <input {...getInputProps()} />
          {analyzing ? (
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-[var(--qc-success)] animate-spin" />
          ) : (
            <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--qc-success)]" />
          )}
          <p className="text-sm text-foreground mb-1">
            {analyzing ? 'Analyzing…' : isDragActive ? 'Drop audio here' : 'Drag & drop an audio file'}
          </p>
          <p className="text-xs text-muted-foreground">
            {analyzing ? file?.name : 'or click to browse (WAV, MP3, FLAC, AAC, M4A, OGG, Opus, WebM)'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--qc-fail-bg)] border border-[var(--qc-fail)]/50 text-[var(--qc-fail)] text-sm">
            {error}
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <section className="rounded-xl border border-[var(--qc-panel-border)] bg-[var(--qc-panel)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--qc-panel-border)]">
                <h2 className="text-xs uppercase tracking-wider text-[var(--qc-success)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  Analysis
                </h2>
              </div>
              <div className="p-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Format</dt>
                    <dd className="font-mono text-foreground">{analysis.format}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Duration</dt>
                    <dd className="font-mono text-foreground">{analysis.durationFormatted}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Size</dt>
                    <dd className="font-mono text-foreground">{analysis.sizeFormatted}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Codec</dt>
                    <dd className="font-mono text-foreground">{analysis.codec}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Channels</dt>
                    <dd className="font-mono text-foreground">{analysis.channelsFormatted}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Bitrate</dt>
                    <dd className="font-mono text-foreground">{analysis.bitrate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Sample rate</dt>
                    <dd className="font-mono text-foreground">{analysis.sampleRateFormatted}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--qc-panel-border)] bg-[var(--qc-panel)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--qc-panel-border)]">
                <h2 className="text-xs uppercase tracking-wider text-[var(--qc-success)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  Player
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div ref={waveformRef} className="w-full rounded-lg overflow-hidden bg-white/5" />
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <Button variant="outline" size="sm" onClick={() => skip(-10)} className="border-[var(--qc-panel-border)] gap-1.5" title="Skip 10s backward">
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-xs">-10s</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => skip(-5)} className="border-[var(--qc-panel-border)] gap-1.5" title="Skip 5s backward">
                    <SkipBack className="w-4 h-4" />
                    <span className="text-xs">-5s</span>
                  </Button>
                  <Button
                    size="icon"
                    onClick={togglePlayPause}
                    className="rounded-full bg-[var(--qc-success)] hover:bg-[var(--qc-success)]/90 text-[var(--background)] h-12 w-12"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => skip(5)} className="border-[var(--qc-panel-border)] gap-1.5" title="Skip 5s forward">
                    <SkipForward className="w-4 h-4" />
                    <span className="text-xs">+5s</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => skip(10)} className="border-[var(--qc-panel-border)] gap-1.5" title="Skip 10s forward">
                    <RotateCw className="w-4 h-4" />
                    <span className="text-xs">+10s</span>
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  <span className="text-foreground">{currentTime}</span>
                  <span className="mx-2">/</span>
                  <span>{durationDisplay}</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
