import React from 'react';

interface StatusBlinkDotProps {
  isOpen: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBlinkDot: React.FC<StatusBlinkDotProps> = ({
  isOpen,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  const currentSize = sizeMap[size];

  return (
    <span className={`relative flex ${currentSize} shrink-0 items-center justify-center ${className}`}>
      {/* Outer expanding radar ping wave */}
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          isOpen ? 'bg-emerald-400' : 'bg-rose-400'
        }`}
      />
      {/* Inner glowing blinking core dot */}
      <span
        className={`relative inline-flex rounded-full ${currentSize} shadow-sm animate-status-blink ${
          isOpen ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
        }`}
      />
    </span>
  );
};
