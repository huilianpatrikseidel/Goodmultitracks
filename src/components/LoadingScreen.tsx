import React from 'react';
import { Music } from 'lucide-react';
import { Progress } from './ui/progress';

interface LoadingScreenProps {
  progress: number;
  message: string;
}

export function LoadingScreen({ progress, message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex items-center justify-center gap-4">
          <Music className="w-12 h-12 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">GoodMultitracks</h1>
            <p className="text-lg text-gray-500">Professional Study Player</p>
          </div>
        </div>

        <div className="px-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-400 mt-3 animate-pulse">
            {message}
          </p>
        </div>

        <div className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} GoodMultitracks. All rights reserved.
        </div>
      </div>
    </div>
  );
}