import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface WaveformVisualizerProps {
  audioFile: File | null;
  transcription: string;
}

export function WaveformVisualizer({ audioFile, transcription }: WaveformVisualizerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00.000');
  const [duration, setDuration] = useState('00:00.000');
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#3d3d4d',
        progressColor: '#00ff88',
        cursorColor: '#00ff88',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 120,
        normalize: true,
        backend: 'WebAudio',
      });

      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
      wavesurferRef.current.on('audioprocess', (time) => {
        setCurrentTime(formatTime(time));
      });
      wavesurferRef.current.on('ready', () => {
        const dur = wavesurferRef.current?.getDuration() || 0;
        setDuration(formatTime(dur));
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioFile && wavesurferRef.current) {
      const url = URL.createObjectURL(audioFile);
      wavesurferRef.current.load(url);
    }
  }, [audioFile]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
    }
  }, [volume]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const skipBackward = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.skip(-5);
    }
  };

  const skipForward = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.skip(5);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--qc-panel)' }}>
      {/* Waveform Section */}
      <div className="border-b" style={{ borderColor: 'var(--qc-panel-border)' }}>
        <div className="px-6 py-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Waveform Analysis
          </h3>
          <div ref={waveformRef} className="mb-4" />
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={skipBackward}
                className="p-2 hover:bg-accent rounded transition-colors"
                disabled={!audioFile}
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full transition-colors"
                style={{ backgroundColor: 'var(--qc-success)' }}
                disabled={!audioFile}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" />
                )}
              </button>
              <button
                onClick={skipForward}
                className="p-2 hover:bg-accent rounded transition-colors"
                disabled={!audioFile}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <span className="text-foreground">{currentTime}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-muted-foreground">{duration}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-[var(--qc-success)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-3 border-b" style={{ borderColor: 'var(--qc-panel-border)' }}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Real-Time Transcription
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {transcription ? (
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {transcription}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transcription available. Upload an audio file to begin analysis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
