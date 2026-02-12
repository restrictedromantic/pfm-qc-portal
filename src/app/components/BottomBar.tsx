import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface BottomBarProps {
  audioFile: File | null;
}

export function BottomBar({ audioFile }: BottomBarProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00.000');
  const [duration, setDuration] = useState('00:00.000');
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#831843',
        progressColor: '#ec4899',
        cursorColor: '#f9a8d4',
        barWidth: 3,
        barGap: 1,
        barRadius: 3,
        height: 60,
        normalize: true,
        backend: 'WebAudio',
      });

      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
      
      // Fixed: Ensure audio resumes on any waveform interaction
      wavesurferRef.current.on('interaction', () => {
        const audioCtx = wavesurferRef.current?.getAudioContext();
        if (audioCtx?.state === 'suspended') {
          audioCtx.resume();
        }
      });

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

  const togglePlayPause = async () => {
    if (wavesurferRef.current) {
      // 2026 Security Fix: Force resume context on button click
      const audioCtx = wavesurferRef.current.getAudioContext();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
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
    <div className="bg-pink-950/30 border-t border-pink-900/40 px-6 py-3">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={skipBackward}
            className="p-2 hover:bg-pink-900/30 rounded transition-colors text-pink-300 hover:text-pink-100"
            disabled={!audioFile}
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-3 rounded-full bg-pink-600 hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!audioFile}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>
          <button
            onClick={skipForward}
            className="p-2 hover:bg-pink-900/30 rounded transition-colors text-pink-300 hover:text-pink-100"
            disabled={!audioFile}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-pink-200 flex-shrink-0" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          <span>{currentTime}</span>
          <span className="text-pink-400 mx-2">/</span>
          <span className="text-pink-400">{duration}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div ref={waveformRef} className="w-full" />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Volume2 className="w-5 h-5 text-pink-300" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 accent-pink-500"
          />
          <span className="text-xs text-pink-400 w-8 text-right" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}