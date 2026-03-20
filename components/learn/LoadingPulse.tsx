interface LoadingPulseProps {
  message?: string;
}

export function LoadingPulse({ message = 'Thinking...' }: LoadingPulseProps) {
  return (
    <div className="w-full space-y-4 animate-pulse my-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-6 h-6 rounded-full bg-violet-400/40 animate-bounce" />
        <p className="text-violet-300 text-sm font-medium">{message}</p>
      </div>

      {/* Skeleton sections */}
      {['First Principles', 'Derivation', 'Worked Examples'].map((label) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="h-4 w-36 rounded bg-white/15" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-5/6 rounded bg-white/10" />
            <div className="h-3 w-4/6 rounded bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-3/4 rounded bg-white/10" />
          </div>
          <p className="text-xs text-white/30">{label}...</p>
        </div>
      ))}
    </div>
  );
}
