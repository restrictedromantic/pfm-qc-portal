import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Clock, Loader2 } from 'lucide-react';

interface AudioFile {
  id: string;
  name: string;
  timestamp: string;
  status: 'pass' | 'fail';
}

interface LeftSidebarProps {
  onFileSelect: (file: File) => void;
  previousUploads: AudioFile[];
  selectedFileId: string | null;
  onFileClick: (file: AudioFile) => void;
  isProcessing: boolean;
  currentFileName?: string;
}

export function LeftSidebar({
  onFileSelect,
  previousUploads,
  selectedFileId,
  onFileClick,
  isProcessing,
  currentFileName,
}: LeftSidebarProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: {
      'audio/wav': ['.wav'],
    },
    multiple: false,
  });

  return (
    <div className="h-full flex flex-col bg-blue-950/20 border-r border-blue-900/30">
      {/* Upload Zone */}
      <div className="p-4 border-b border-blue-900/30">
        <h3 className="text-xs uppercase tracking-wider text-blue-300 mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          File Upload
        </h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-400 bg-blue-500/10'
              : isProcessing
              ? 'border-blue-700/50 cursor-not-allowed opacity-60'
              : 'border-blue-700 hover:border-blue-500 hover:bg-blue-950/30'
          }`}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          {isProcessing ? (
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-400 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 mx-auto mb-2 text-blue-400" />
          )}
          <p className="text-sm text-blue-100 mb-1">
            {isProcessing ? 'Processing...' : isDragActive ? 'Drop here' : 'Drop WAV file'}
          </p>
          <p className="text-xs text-blue-400">
            {isProcessing ? currentFileName : 'or click to browse'}
          </p>
        </div>
      </div>

      {/* Previous Uploads */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-blue-900/30">
          <h3 className="text-xs uppercase tracking-wider text-blue-300" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Previous Uploads
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {previousUploads.length === 0 ? (
            <div className="p-4 text-center text-blue-400 text-sm">
              No previous uploads
            </div>
          ) : (
            <div className="divide-y divide-blue-900/30">
              {previousUploads.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  disabled={isProcessing}
                  className={`w-full p-3 text-left transition-colors ${
                    isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-900/20'
                  } ${selectedFileId === file.id ? 'bg-blue-900/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <FileAudio className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-blue-100 truncate mb-1">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-blue-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
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
