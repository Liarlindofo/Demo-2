'use client';

interface ProgressBarProps {
  concluidas: number;
  total: number;
}

export function ProgressBar({ concluidas, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const todas = concluidas === total && total > 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            todas ? 'bg-green-500' : 'bg-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums shrink-0 ${todas ? 'text-green-400' : 'text-amber-400'}`}>
        {concluidas}/{total}
      </span>
    </div>
  );
}
