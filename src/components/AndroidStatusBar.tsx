import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

interface AndroidStatusBarProps {
  darkText?: boolean;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ darkText = true }) => {
  const [time, setTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`h-7 px-4 flex items-center justify-between text-xs font-medium select-none tracking-tight transition-colors ${
        darkText ? 'text-zinc-800' : 'text-zinc-100'
      }`}
    >
      <span className="font-semibold text-[13px]">{time}</span>
      <div className="flex items-center gap-1.5 opacity-90">
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-0.5">
          <span className="text-[11px] font-mono">87%</span>
          <Battery className="w-4 h-4 fill-current" />
        </div>
      </div>
    </div>
  );
};
