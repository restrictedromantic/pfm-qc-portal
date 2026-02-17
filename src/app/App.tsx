import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { CenterPanel } from './components/CenterPanel';
import { CreativeQCLog, type CreativeQCLogEntry } from './components/CreativeQCLog';
import { BottomBar, type Selection } from './components/BottomBar';
import { SystemConsole } from './components/SystemConsole';
import { useSystemConsole } from './context/SystemConsoleContext';
import { transcribeAudioFileInWorker } from './services/transcription';
import mammoth from 'mammoth';
import type { EngagementData } from './utils/engagement';
import { formatTimecodeMMSS } from './utils/timecode';

const SUPABASE_OFFLINE_TIMEOUT_MS = 3000;

interface AudioFile {
  id: string;
  name: string;
  timestamp: string;
  status: 'pass' | 'fail';
}

interface Metadata {
  fileSize?: string;
  duration?: string;
  format?: string;
  codec?: string;
  bitrate?: string;
  sampleRate?: string;
  channels?: string;
  voaStatus: 'pass' | 'fail' | 'pending';
}

export default function App() {
  const { systemLog, clear: clearConsole } = useSystemConsole();

  // Top Bar State (parsed from filename)
  const [showName, setShowName] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [showTitle, setShowTitle] = useState('');

  // File Management State
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');

  // Content State
  const [transcription, setTranscription] = useState('');
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState<string>('');
  const [scriptFileName, setScriptFileName] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionOn, setTranscriptionOn] = useState(false);
  const transcribeAbortRef = useRef(false);
  const [totalActivePlayTimeSeconds, setTotalActivePlayTimeSeconds] = useState(0);
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [creativeQCLogEntries, setCreativeQCLogEntries] = useState<CreativeQCLogEntry[]>([]);

  // Previous Uploads (new uploads prepended when processed)
  const [previousUploads, setPreviousUploads] = useState<AudioFile[]>([
    {
      id: '1',
      name: 'interview_final_v3.wav',
      timestamp: '14:23:45',
      status: 'pass',
    },
    {
      id: '2',
      name: 'podcast_episode_042.wav',
      timestamp: '13:18:22',
      status: 'pass',
    },
    {
      id: '3',
      name: 'voiceover_master.wav',
      timestamp: '12:05:11',
      status: 'fail',
    },
    {
      id: '4',
      name: 'recording_session_01.wav',
      timestamp: '11:42:33',
      status: 'pass',
    },
    {
      id: '5',
      name: 'audio_mix_final.wav',
      timestamp: '10:15:08',
      status: 'pass',
    },
  ]);

  // Parse filename to extract show information
  // Expected format examples:
  // "Infinite Mana in the Apocalypse - 12 - trial.wav"
  // "ShowName - EpNum - EpisodeTitle.wav"
  const parseFilename = (filename: string) => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Try to parse with " - " separator
    const parts = nameWithoutExt.split(' - ');
    
    if (parts.length >= 3) {
      setShowName(parts[0].trim());
      setEpisodeNumber(parts[1].trim());
      setShowTitle(parts.slice(2).join(' - ').trim());
    } else if (parts.length === 2) {
      setShowName(parts[0].trim());
      setEpisodeNumber('');
      setShowTitle(parts[1].trim());
    } else {
      // Fallback: try to extract episode number with regex
      const epMatch = nameWithoutExt.match(/(.+?)\s*[-_\s]?\s*(?:ep|episode)?\s*(\d+)\s*[-_\s]?\s*(.*)$/i);
      if (epMatch) {
        setShowName(epMatch[1].trim());
        setEpisodeNumber(epMatch[2].trim());
        setShowTitle(epMatch[3].trim());
      } else {
        // Just use the filename as show name
        setShowName(nameWithoutExt);
        setEpisodeNumber('');
        setShowTitle('');
      }
    }
  };

  const handleFileSelect = (file: File) => {
    clearConsole();
    systemLog('Upload Triggered', 'milestone', 'processing');

    systemLog(`File passed to BottomBar: ${file.name}, size: ${file.size} bytes`, 'log');
    setCurrentFile(file);
    setSelectedFileId(null);
    setIsProcessing(true);
    setCurrentFileName(file.name);
    setMetadata(null);
    setTranscription('');
    setPlaybackTime(0);
    setSelections([]);
    setCreativeQCLogEntries([]);
    setTranscriptionError(null);
    setScriptText('');
    setScriptFileName('');

    parseFilename(file.name);

    try {
      const qcStatus: 'pass' | 'fail' = Math.random() > 0.3 ? 'pass' : 'fail';
      const mockMetadata: Metadata = {
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        duration: '00:03:24.567',
        format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        codec: getCodecForFormat(file.name),
        voaStatus: qcStatus,
        bitrate: '320 kbps',
        sampleRate: '48 kHz',
        channels: 'Stereo (2)',
      };
      setMetadata(mockMetadata);

      const now = new Date();
      const ts = now.toTimeString().slice(0, 8);
      setPreviousUploads((prev) => [
        { id: `upload-${Date.now()}`, name: file.name, timestamp: ts, status: qcStatus },
        ...prev,
      ]);

      setTranscription('');
      setTranscriptionError(null);

      systemLog('File locally processed', 'milestone', 'success');

      // Unblock UI immediately so the player works (Offline Mode: never wait on backend)
      setIsProcessing(false);

      // Backend attempt in background – never blocks; log only
      systemLog('Supabase Connection Attempt', 'milestone', 'processing');
      const offlineTimer = setTimeout(() => {
        systemLog('Offline mode – backend unavailable or skipped; player ready', 'milestone', 'success');
      }, SUPABASE_OFFLINE_TIMEOUT_MS);
      (async () => {
        try {
          // Future: await supabase.storage.upload(...); clearTimeout(offlineTimer) on success
          clearTimeout(offlineTimer);
          systemLog('Offline mode – no backend configured; player ready', 'milestone', 'success');
        } catch (e) {
          clearTimeout(offlineTimer);
          systemLog(`Backend error: ${e instanceof Error ? e.message : 'Unknown'} – using offline mode`, 'milestone', 'error');
        }
      })();
    } catch (e) {
      systemLog(`File processing error: ${e instanceof Error ? e.message : 'Unknown'}`, 'error', 'error');
      setTranscriptionError('Failed to process file. Please try again.');
      setIsProcessing(false);
    }
  };

  const runTranscription = async () => {
    if (!currentFile || isTranscribing) return;
    transcribeAbortRef.current = false;
    setIsTranscribing(true);
    setTranscriptionError(null);
    try {
      const transcript = await transcribeAudioFileInWorker(currentFile);
      if (!transcribeAbortRef.current) {
        setTranscription(transcript);
        setTranscriptionError(null);
      }
      } catch (e) {
        if (!transcribeAbortRef.current) {
          const errorMsg = e instanceof Error ? e.message : 'Unknown error';
          setTranscriptionError(errorMsg);
        setTranscription(
          '[00:00.000] Transcription unavailable. Turn off and on again or try a shorter file.\n\n[00:05.000] You can still use markers and review the waveform.'
        );
      }
    } finally {
      if (!transcribeAbortRef.current) setIsTranscribing(false);
    }
  };

  // When toggle is ON and we have a file, run transcription in background (deferred so UI shows loading first)
  useEffect(() => {
    if (!currentFile || !transcriptionOn) return;
    let cancelled = false;
    transcribeAbortRef.current = false;

    setIsTranscribing(true);
    setTranscriptionError(null);

    const runAsync = async () => {
      try {
        const transcript = await transcribeAudioFileInWorker(currentFile);
        if (!cancelled && !transcribeAbortRef.current) {
          setTranscription(transcript);
          setTranscriptionError(null);
        }
      } catch (e) {
        if (!cancelled && !transcribeAbortRef.current) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          setTranscriptionError(msg);
          setTranscription(
            '[00:00.000] Transcription failed.\n\n[00:05.000] You can still use markers and review the waveform.'
          );
        }
      } finally {
        if (!cancelled) setIsTranscribing(false);
      }
    };

    const timeoutId = setTimeout(runAsync, 0);
    return () => {
      cancelled = true;
      transcribeAbortRef.current = true;
      clearTimeout(timeoutId);
      setIsTranscribing(false);
    };
  }, [currentFile, transcriptionOn]);

  const handleScriptSelect = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setScriptText(result.value);
        setScriptFileName(file.name);
      } catch (e) {
        setScriptText('');
        setScriptFileName('');
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) || '';
        setScriptText(text);
        setScriptFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleFileClick = (file: AudioFile) => {
    setSelectedFileId(file.id);
    setCurrentFile(null);
    setPlaybackTime(0);
    setSelections([]);
    const mockMetadata: Metadata = {
      fileSize: `${(Math.random() * 50 + 10).toFixed(2)} MB`,
      duration: '00:04:32.123',
      format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      codec: getCodecForFormat(file.name),
      voaStatus: file.status,
      bitrate: '256 kbps',
      sampleRate: '44.1 kHz',
      channels: 'Stereo (2)',
    };
    setMetadata(mockMetadata);
    setTranscription('[Historical transcription data would be loaded here for previously analyzed files.]');
  };

  const handleAddSelection = (selection: Selection) => {
    setSelections((prev) => {
      if (prev.some((s) => s.id === selection.id)) return prev;
      return [...prev, selection];
    });
    setCreativeQCLogEntries((prev) => {
      const logId = `qc-${selection.id}`;
      if (prev.some((e) => e.id === logId)) return prev;
      return [
        ...prev,
        {
          id: logId,
          startTimecode: formatTimecodeMMSS(selection.start),
          endTimecode: formatTimecodeMMSS(selection.end),
          category: 'Dialogue',
          urgency: 'Can be fixed',
          feedback: '',
          color: selection.color,
        },
      ];
    });
  };

  const handleUpdateCreativeQCEntry = (id: string, patch: Partial<Omit<CreativeQCLogEntry, 'id' | 'color'>>) => {
    setCreativeQCLogEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const handleSelectionUpdate = (selectionId: string, params: { start: number; end: number }) => {
    setSelections((prev) =>
      prev.map((s) => (s.id === selectionId ? { ...s, start: params.start, end: params.end } : s))
    );
    const logId = `qc-${selectionId}`;
    setCreativeQCLogEntries((prev) =>
      prev.map((e) =>
        e.id === logId
          ? { ...e, startTimecode: formatTimecodeMMSS(params.start), endTimecode: formatTimecodeMMSS(params.end) }
          : e
      )
    );
  };

  const getCodecForFormat = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const codecMap: Record<string, string> = {
      wav: 'PCM',
      mp3: 'MPEG-1 Layer 3',
      flac: 'FLAC',
      aac: 'AAC-LC',
      ogg: 'Vorbis',
      m4a: 'AAC',
    };
    return codecMap[ext || ''] || 'Unknown';
  };

  return (
    <div className="dark h-screen overflow-hidden bg-[var(--background)] text-foreground flex flex-col">
      {/* Top Bar - Black */}
      <TopBar
        showName={showName}
        episodeNumber={episodeNumber}
        showTitle={showTitle}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Blue */}
        <div className="w-80 flex-shrink-0">
          <LeftSidebar
            onFileSelect={handleFileSelect}
            onScriptSelect={handleScriptSelect}
            previousUploads={previousUploads}
            selectedFileId={selectedFileId}
            onFileClick={handleFileClick}
            isProcessing={isProcessing}
            currentFileName={currentFileName}
            scriptFileName={scriptFileName}
            metadata={metadata}
          />
        </div>

        {/* Center Panel - Transcription with live scroll */}
        <div className="flex-1">
          <CenterPanel
            transcription={transcription}
            playbackTime={playbackTime}
            scriptText={scriptText}
            scriptFileName={scriptFileName}
            durationSeconds={durationSeconds}
            selections={selections}
            error={transcriptionError}
            transcriptionOn={transcriptionOn}
            onTranscriptionToggle={() => setTranscriptionOn((on) => !on)}
            isTranscribing={isTranscribing}
            canTranscribe={!!currentFile}
          />
        </div>

        {/* Right: Creative QC Log – keyed by file so it stays in sync with the current waveform */}
        <div className="w-96 flex-shrink-0">
          <CreativeQCLog key={currentFileName || 'no-file'} entries={creativeQCLogEntries} onUpdateEntry={handleUpdateCreativeQCEntry} />
        </div>
      </div>

      {/* Bottom Bar - Waveform + centered controls */}
      <div className="flex-shrink-0">
        <BottomBar
          audioFile={currentFile}
          onTimeUpdate={setPlaybackTime}
          onDurationChange={setDurationSeconds}
          onTotalActivePlayTimeChange={setTotalActivePlayTimeSeconds}
          onEngagementDataChange={(data) => {
            setEngagementData(data);
          }}
          selections={selections}
          onAddSelection={handleAddSelection}
          onSelectionUpdate={handleSelectionUpdate}
        />
      </div>

      {/* Backend Status Console – collapsible, captures console + milestones */}
      <SystemConsole />
    </div>
  );
}