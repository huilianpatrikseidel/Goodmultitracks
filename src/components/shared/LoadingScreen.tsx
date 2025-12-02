import React from 'react';
import { Loader2, Music } from 'lucide-react';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

export function LoadingScreen({ progress = 0, message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-[#171717] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6 max-w-md w-full px-6">
        {/* Logo/Icon */}
        <div className="relative">
          <Music className="w-16 h-16 text-blue-500" />
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin absolute inset-0" />
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-2xl text-white mb-1">GoodMultitracks</h1>
          <p className="text-sm text-gray-400">Professional Study Player</p>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="w-full space-y-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 text-center">{progress}%</p>
          </div>
        )}

        {/* Loading Message */}
        <p className="text-sm text-gray-400 text-center animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
