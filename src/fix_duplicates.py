#!/usr/bin/env python3
"""
Fix duplicate function declarations in DAWPlayer.tsx
"""

def fix_duplicates():
    filepath = 'features/player/components/DAWPlayer.tsx'
    
    # Read the file
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find and remove lines 466-489 (0-indexed: 465-488)
    # These are the duplicate declarations
    start_line = 465  # Line 466 in 1-indexed
    end_line = 489    # Line 489 in 1-indexed
    
    # Remove the duplicate declarations
    new_lines = lines[:start_line] + lines[end_line:]
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"✅ Removed duplicate declarations (lines {start_line+1}-{end_line})")
    print(f"   - getTrackHeightPx")
    print(f"   - getCurrentMeasure")
    print(f"   - getCurrentTempoInfo")
    print(f"   - getCurrentTimeSignature")

if __name__ == '__main__':
    fix_duplicates()
