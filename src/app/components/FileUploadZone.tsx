import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Clock, Loader2 } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';

interface AudioFile {
  id: string;
  name: string;
  timestamp: string;
  status: 'pass' | 'fail';
}

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  uploadProgress: number;
  recentFiles: AudioFile[];
  selectedFileId: string | null;
  onFileClick: (file: AudioFile) => void;
  isProcessing: boolean;
  currentFileName?: string;
}

export function FileUploadZone({ 
  onFileSelect, 
  uploadProgress, 
  recentFiles,
  selectedFileId,
  onFileClick,
  isProcessing,
  currentFileName
}: FileUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: {
      'audio/wav': ['.wav']
    },
    multiple: false
  });

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--qc-panel)' }}>
      {/* Drop Zone */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--qc-panel-border)' }}>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive 
              ? 'border-[var(--qc-success)] bg-[var(--qc-success-bg)]' 
              : isProcessing
              ? 'border-muted-foreground/30 cursor-not-allowed'
              : 'border-[var(--qc-panel-border)] hover:border-muted-foreground'
          }`}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          {isProcessing ? (
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-[var(--qc-success)] animate-spin" />
          ) : (
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          )}
          <p className="text-sm text-foreground mb-1">
            {isProcessing 
              ? 'Processing audio file...' 
              : isDragActive 
              ? 'Drop WAV file here' 
              : 'Drag & drop WAV file'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isProcessing ? currentFileName : 'or click to browse (.wav only)'}
          </p>
        </div>

        {/* Loading State & Progress Bar */}
        {isProcessing && (
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--qc-success-bg)', borderLeft: '3px solid var(--qc-success)' }}>
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--qc-success)' }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: 'var(--qc-success)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  ANALYZING AUDIO
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Extracting metadata & generating waveform
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <span className="text-muted-foreground">Progress</span>
                <span style={{ color: 'var(--qc-success)' }}>{uploadProgress}%</span>
              </div>
              <Progress.Root
                value={uploadProgress}
                max={100}
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--qc-panel-border)' }}
              >
                <Progress.Indicator
                  className="h-full transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--qc-success)',
                    width: `${uploadProgress}%`
                  }}
                />
              </Progress.Root>
            </div>
          </div>
        )}
      </div>

      {/* Recently Analyzed Files */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--qc-panel-border)' }}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Recently Analyzed
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {recentFiles.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No files analyzed yet
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--qc-panel-border)' }}>
              {recentFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  disabled={isProcessing}
                  className={`w-full p-3 text-left transition-colors ${
                    isProcessing 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-accent/50'
                  } ${
                    selectedFileId === file.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileAudio className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate mb-1">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        <Clock className="w-3 h-3" />
                        <span>{file.timestamp}</span>
                      </div>
                    </div>
                    <div
                      className="px-2 py-0.5 rounded text-xs flex-shrink-0"
                      style={{
                        fontFamily: 'IBM Plex Mono, monospace',
                        backgroundColor: file.status === 'pass' ? 'var(--qc-success-bg)' : 'var(--qc-fail-bg)',
                        color: file.status === 'pass' ? 'var(--qc-success)' : 'var(--qc-fail)',
                      }}
                    >
                      {file.status.toUpperCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}