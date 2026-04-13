'use client';

interface AlertBadgeProps {
  count: number;
  className?: string;
}

export function AlertBadge({ count, className = '' }: AlertBadgeProps) {
  if (count === 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
