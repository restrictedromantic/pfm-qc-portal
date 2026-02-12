import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { CenterPanel } from './components/CenterPanel';
import { RightSidebar } from './components/RightSidebar';
import { BottomBar } from './components/BottomBar';

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

  // Previous Uploads
  const [previousUploads] = useState<AudioFile[]>([
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
    setCurrentFile(file);
    setSelectedFileId(null);
    setIsProcessing(true);
    setCurrentFileName(file.name);
    setMetadata(null);
    setTranscription('');
    
    // Parse filename for top bar info
    parseFilename(file.name);

    // Simulate processing
    setTimeout(() => {
      const mockMetadata: Metadata = {
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        duration: '00:03:24.567',
        format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        codec: getCodecForFormat(file.name),
        voaStatus: Math.random() > 0.3 ? 'pass' : 'fail',
        bitrate: '320 kbps',
        sampleRate: '48 kHz',
        channels: 'Stereo (2)',
      };
      setMetadata(mockMetadata);

      // Generate mock transcription
      const mockTranscription = `[00:00.000] Hello and welcome to today's audio production quality control session. This is a test recording designed to demonstrate the capabilities of our QC portal.

[00:15.234] The system performs real-time analysis of audio characteristics including bitrate, sample rate, codec validation, and VOA compliance standards.

[00:32.567] Our automated transcription service provides millisecond-accurate timestamps for every spoken segment, making it easier to identify and correct issues during post-production.

[01:02.891] Technical specifications are validated against industry standards to ensure broadcast-ready output. The portal supports multiple audio formats including WAV, MP3, FLAC, AAC, and OGG.

[01:45.123] Quality assurance metrics include signal-to-noise ratio, dynamic range analysis, peak level detection, and frequency response validation.

[02:18.456] Thank you for using the Audio Production QC Portal. This concludes the demonstration transcript.`;

      setTranscription(mockTranscription);
      setIsProcessing(false);
    }, 2000);
  };

  const handleFileClick = (file: AudioFile) => {
    setSelectedFileId(file.id);
    setCurrentFile(null);
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
            previousUploads={previousUploads}
            selectedFileId={selectedFileId}
            onFileClick={handleFileClick}
            isProcessing={isProcessing}
            currentFileName={currentFileName}
          />
        </div>

        {/* Center Panel - Red */}
        <div className="flex-1">
          <CenterPanel transcription={transcription} />
        </div>

        {/* Right Sidebar - Green */}
        <div className="w-96 flex-shrink-0">
          <RightSidebar metadata={metadata} />
        </div>
      </div>

      {/* Bottom Bar - Pink */}
      <div className="flex-shrink-0">
        <BottomBar audioFile={currentFile} />
      </div>
    </div>
  );
}