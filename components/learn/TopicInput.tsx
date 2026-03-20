'use client';

import { useState, FormEvent } from 'react';
import type { LearnInput } from '@/lib/first-principles/types';
import { FileUploadZone } from './FileUploadZone';
import { ModelSelector } from './ModelSelector';

interface TopicInputProps {
  onSubmit: (input: LearnInput) => void;
  isLoading: boolean;
  error?: string | null;
}

type Tab = 'text' | 'file';

export function TopicInput({ onSubmit, isLoading, error }: TopicInputProps) {
  const [tab, setTab] = useState<Tab>('text');
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');

  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;
    onSubmit({ mode: 'text', topic: trimmed, model: selectedModel });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileSubmit = () => {
    if (!selectedFile) return;
    const mode = selectedFile.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'pptx';
    onSubmit({ mode, file: selectedFile, fileName: selectedFile.name, model: selectedModel });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-6">
      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 w-fit">
        {(['text', 'file'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t === 'text' ? 'Enter Topic' : 'Upload File'}
          </button>
        ))}
      </div>

      {tab === 'text' ? (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              What concept do you want to learn from first principles?
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Newton's Second Law, Supply and Demand, Gradient Descent, Entropy..."
              rows={3}
              disabled={isLoading}
              className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 text-sm resize-none focus:outline-none focus:border-violet-400/60 focus:bg-white/15 transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Building breakdown...' : 'Break It Down'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          
          <p className="text-sm font-medium text-white/60 mb-2">
            Upload a PDF or PowerPoint — the AI will extract and explain the core concept.
          </p>
          <FileUploadZone
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            error={error}
          />
          <button
            onClick={handleFileSubmit}
            disabled={!selectedFile || isLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Analyze & Break Down'}
          </button>
        </div>
      )}
    </div>
  );
}
