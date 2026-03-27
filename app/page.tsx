'use client';

import Link from 'next/link';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500 opacity-30 blur-3xl animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-500 opacity-30 blur-3xl animate-pulse" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-fuchsia-500 opacity-20 blur-3xl animate-pulse" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 via-cyan-400 to-fuchsia-400 flex items-center justify-center text-xl font-black text-slate-900 shadow-lg">💬</div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-violet-300 via-cyan-300 to-fuchsia-300 text-transparent bg-clip-text">LearnAI</h1>
          </div>
          <div className="space-x-2 flex">
            <Link
              href="/learn"
              className="inline-block px-6 py-3 border-2 border-violet-400/60 hover:border-violet-400 text-violet-300 hover:text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:bg-violet-500/10"
            >
              Chat
            </Link>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-violet-500/50"
            >
              Upload PDF
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero/Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 pb-32">
        {/* Animated Chat Bubble */}
        <div className="mb-10 flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-cyan-400 to-fuchsia-500 rounded-full blur-3xl opacity-60 animate-pulse" style={{animationDuration: '3s'}}></div>
            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-violet-500 via-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <div className="text-7xl drop-shadow-lg">💬</div>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center max-w-4xl space-y-8">
          <div className="space-y-6">
            <h2 className="text-7xl md:text-8xl font-black leading-tight tracking-tighter">
              <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-fuchsia-300 text-transparent bg-clip-text">Learn</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-300 text-transparent bg-clip-text">Anything</span>
            </h2>
            <p className="text-2xl md:text-3xl text-purple-200 font-light max-w-3xl mx-auto leading-relaxed">
              Choose One:
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="pt-3 flex flex-col items-center gap-5">
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span className="w-10 h-px bg-white/20" />
              <span className="uppercase tracking-[0.35em]">Choose One</span>
              <span className="w-10 h-px bg-white/20" />
            </div>
            <div className="flex flex-wrap gap-5 justify-center">
              <div className="flex flex-col items-center gap-2">
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-3 px-12 py-5 border-2 border-violet-400/60 hover:border-violet-400 text-violet-200 hover:text-white text-xl rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:bg-violet-500/10"
                >
                  <span className="text-2xl">💬</span>
                  Chat
                </Link>
                <span className="text-xs text-white/45 tracking-wide uppercase">Build first-principles understanding</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white text-xl rounded-2xl font-bold transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-violet-500/50"
                >
                  <span className="text-2xl">📄</span>
                  Upload PDF
                </Link>
                <span className="text-xs text-white/45 tracking-wide uppercase">Turn notes into lessons</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-md bg-white/5 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-purple-300 text-sm font-light">
          Learn smarter. Master faster. Think deeper.
        </div>
      </footer>
    </div>
  );
}
