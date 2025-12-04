#!/usr/bin/env python3
"""
Simple line-by-line fix for DAWPlayer.tsx duplicates
"""

def main():
    filepath = 'features/player/components/DAWPlayer.tsx'
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Original file: {len(lines)} lines")
    
    # Remove lines 466-489 (indices 465-488 in 0-indexed)
    # We'll keep lines 0-465 and 489+
    lines_to_keep = lines[:465] + lines[489:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines_to_keep)
    
    print(f"Fixed file: {len(lines_to_keep)} lines")
    print(f"Removed {len(lines) - len(lines_to_keep)} duplicate lines")
    print("\n✅ Build errors should be fixed!")
    print("\nRun: npm run dev")

if __name__ == '__main__':
    main()
