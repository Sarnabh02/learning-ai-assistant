'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
}

const ACCEPTED_TYPES = ['.pdf', '.pptx'];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function isValidFile(file: File): { valid: boolean; error?: string } {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_TYPES.some(ext => name.endsWith(ext))) {
    return { valid: false, error: 'Only PDF and PPTX files are supported.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'File too large. Maximum size is 25 MB.' };
  }
  return { valid: true };
}

export function FileUploadZone({ onFileSelect, isLoading, error }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const { valid, error: validationError } = isValidFile(file);
    if (!valid) {
      setFileError(validationError ?? 'Invalid file.');
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const displayError = fileError ?? error;

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-8 text-center cursor-pointer
        ${isDragging ? 'border-violet-400 bg-violet-500/10' : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/8'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.pptx"
        className="sr-only"
        onChange={handleChange}
        disabled={isLoading}
      />

      {selectedFile ? (
        <div className="space-y-2">
          <div className="text-3xl">📄</div>
          <p className="text-white font-medium text-sm">{selectedFile.name}</p>
          <p className="text-white/40 text-xs">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-3xl text-white/30">↑</div>
          <p className="text-white/60 text-sm">
            Drag & drop a file here, or{' '}
            <span className="text-violet-400 underline underline-offset-2">browse</span>
          </p>
          <p className="text-white/30 text-xs">PDF or PPTX · Max 25 MB</p>
        </div>
      )}

      {displayError && (
        <p className="mt-3 text-rose-400 text-xs font-medium">{displayError}</p>
      )}
    </div>
  );
}
