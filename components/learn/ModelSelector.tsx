'use client';

import { useState, useEffect } from 'react';

interface Model {
  id: string;
  provider: string;
  display_name: string;
  max_tokens: number;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => setModels(data.models || []))
      .catch(() => {});
  }, []);

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-white/50 mb-2">
        AI Model
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedModelData?.display_name || 'Select Model'}
          </span>
          {selectedModelData && (
            <span className="text-xs text-white/40 px-2 py-0.5 rounded bg-white/10">
              {selectedModelData.provider}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/20 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl z-20 max-h-80 overflow-y-auto">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-all duration-200 border-b border-white/5 last:border-0 ${
                  selectedModel === model.id ? 'bg-violet-500/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {model.display_name}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {model.provider} · {model.max_tokens.toLocaleString()} tokens
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
