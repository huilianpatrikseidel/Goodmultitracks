import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface InteractivePianoDiagramProps {
  keys: string[];
  onChange: (keys: string[]) => void;
}

export function InteractivePianoDiagram({ keys, onChange }: InteractivePianoDiagramProps) {
  const { t } = useLanguage();
  const allKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
  const whiteKeys = allKeys.filter(k => !blackKeys.includes(k));
  
  const handleKeyClick = (key: string) => {
    const newKeys = [...keys];
    const index = newKeys.indexOf(key);
    
    if (index > -1) {
      // Remove if already selected
      newKeys.splice(index, 1);
    } else {
      // Add if not selected
      newKeys.push(key);
    }
    
    onChange(newKeys);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-sm text-gray-600">
        {t.clickPianoKeys}
      </p>
      
      <svg width="440" height="200" viewBox="0 0 440 200" className="border rounded-lg bg-gray-100">
        {/* White keys */}
        {whiteKeys.map((key, i) => {
          const x = 20 + i * 56;
          const isActive = keys.includes(key);
          
          return (
            <g key={`white-${key}`}>
              <rect
                x={x}
                y="20"
                width="54"
                height="150"
                fill={isActive ? '#2563eb' : 'white'}
                stroke="#333"
                strokeWidth="2"
                rx="4"
                cursor="pointer"
                onClick={() => handleKeyClick(key)}
              />
              <text
                x={x + 27}
                y="160"
                fontSize="14"
                fill={isActive ? 'white' : '#666'}
                textAnchor="middle"
                cursor="pointer"
                onClick={() => handleKeyClick(key)}
                style={{ userSelect: 'none' }}
              >
                {key}
              </text>
            </g>
          );
        })}
        
        {/* Black keys */}
        {blackKeys.map((key) => {
          const whiteKeyIndex = allKeys.indexOf(key) - Math.floor((allKeys.indexOf(key) + 1) / 2);
          const x = 20 + whiteKeyIndex * 56 + 40;
          const isActive = keys.includes(key);
          
          return (
            <rect
              key={`black-${key}`}
              x={x}
              y="20"
              width="28"
              height="95"
              fill={isActive ? '#1e40af' : '#333'}
              stroke="#000"
              strokeWidth="2"
              rx="3"
              cursor="pointer"
              onClick={() => handleKeyClick(key)}
            />
          );
        })}
      </svg>
      
      <div className="text-xs text-gray-500 space-y-1 text-center max-w-md">
        <p><strong>{t.selectedNotes}</strong> {keys.length > 0 ? keys.join(', ') : t.none}</p>
        <p className="text-gray-400">{t.clickToToggle}</p>
      </div>
    </div>
  );
}
