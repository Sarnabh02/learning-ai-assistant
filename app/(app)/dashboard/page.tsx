'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/store/learning-store';

interface DocEntry {
  id: string;
  name: string;
  size: string;
  file: File;
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const setPendingFile = useLearningStore((s) => s.setPendingFile);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: DocEntry = {
      id: Date.now().toString(),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      file,
    };
    setDocuments((prev) => [newDoc, ...prev]);

    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 0);
  };

  const handleOpenDoc = (doc: DocEntry) => {
    setPendingFile(doc.file);
    router.push('/learn');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-violet-500 opacity-20 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-cyan-500 opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 backdrop-blur-md bg-white/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-cyan-400 flex items-center justify-center text-lg font-black text-slate-900">
              💬
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
              LearnAI
            </h1>
          </Link>
          <div className="text-sm text-purple-200">Upload & Learn</div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-4xl space-y-8">
          {/* Welcome section */}
          <div className="text-center space-y-8 mb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-violet-500 via-cyan-400 to-fuchsia-500 rounded-full blur-3xl opacity-60 animate-pulse"
                  style={{ animationDuration: '3s' }}
                />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 via-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-2xl">
                  <div className="text-6xl">🚀</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-violet-300 via-cyan-300 to-fuchsia-300 text-transparent bg-clip-text">
                Start Learning Now
              </h2>
              <p className="text-lg md:text-xl text-purple-200 font-light max-w-2xl mx-auto">
                Upload any PDF or PPTX. The AI analyzes your intent, builds a first-principles
                breakdown, and generates practice problems.
              </p>
            </div>
          </div>

          {/* Upload card */}
          <div
            className="group relative cursor-pointer mb-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-12 rounded-3xl border-2 border-dashed border-white/40 group-hover:border-white/60 transition-all duration-300 space-y-6 hover:from-white/20 hover:to-white/10">
              <div className="text-7xl text-center drop-shadow-lg">📚</div>
              <div className="space-y-3 text-center">
                <h3 className="text-2xl font-black text-white">Upload Your Material</h3>
                <div className="space-y-2">
                  <p className="text-purple-200 text-lg">PDF • Presentations (PPTX)</p>
                  <p className="text-sm text-purple-300">Click to upload or drag and drop</p>
                </div>
              </div>
              <div className="flex justify-center pt-4">
                <span className="px-12 py-4 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white rounded-2xl font-bold transition-all duration-300 transform group-hover:scale-110 shadow-xl text-lg">
                  Choose File
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.pptx"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Mode selection card */}
          <div className="mt-8">
            <Link
              href="/learn"
              className="group relative bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-400/30 hover:border-violet-400/60 rounded-2xl p-8 hover:bg-violet-500/25 transition-all duration-300 flex items-center gap-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              <div className="relative text-5xl flex-shrink-0">🔬</div>
              <div className="relative">
                <h4 className="text-xl font-bold text-white mb-1">Learn</h4>
                <p className="text-violet-200 text-sm">
                  AI breaks any topic into first principles and generates practice problems.
                </p>
              </div>
              <div className="relative ml-auto flex-shrink-0 text-violet-400 text-xl font-bold">→</div>
            </Link>
          </div>

          {/* Uploaded documents */}
          {documents.length > 0 && (
            <div className="mt-8 mb-8 space-y-4">
              <h3 className="text-2xl font-bold text-white">Your Uploads</h3>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group bg-white/10 border border-white/20 rounded-xl p-6 hover:border-white/40 hover:bg-white/15 transition-all duration-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">📄</div>
                      <div>
                        <p className="text-white font-semibold">{doc.name}</p>
                        <p className="text-sm text-purple-300">{doc.size}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDoc(doc)}
                        className="px-4 py-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105"
                      >
                        Learn →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How it works banner */}
          <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-white/20 rounded-3xl p-8 backdrop-blur-xl mt-8 mb-8">
            <p className="text-lg font-semibold text-cyan-300 mb-4 text-center">How it works</p>
            <div className="text-sm space-y-1">
              <p className="text-violet-300 font-semibold">🔬 Learn</p>
              <p className="text-purple-100 font-light">Upload or type a topic → AI builds first-principles breakdown → Practice problems</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 backdrop-blur-md bg-white/5 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-purple-300 text-sm font-light">
          <p>Powered by Claude + LangGraph · Learn anything, from first principles.</p>
        </div>
      </footer>
    </div>
  );
}
