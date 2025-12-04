#!/usr/bin/env python3
"""
Fix duplicate function declarations in DAWPlayer.tsx by removing lines 466-489
"""

def main():
    filepath = 'features/player/components/DAWPlayer.tsx'
    
    print(f"Reading {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    print(f"Total lines: {len(lines)}")
    print(f"Removing lines 466-489 (duplicate function declarations)")
    
    # Lines 466-489 in 1-indexed = indices 465-488 in 0-indexed
    # But we need to account for both \n and \r\n
    # Let's use a different approach - remove the specific text block
    
    duplicate_block = """  const getTrackHeightPx = () => {
    switch (trackHeight) {
      case 'small': return 64;
      case 'large': return 128;
      default: return 96;
    }
  };

  const getCurrentMeasure = () => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    return Math.floor(secondsToMeasure(currentTime, tempoChanges, song.tempo));
  };

  const getCurrentTempoInfo = (time: number) => {
    const tempoChanges = song.tempoChanges || [{ time: 0, tempo: song.tempo, timeSignature: '4/4' }];
    const measure = secondsToMeasure(time, tempoChanges, song.tempo);
    const sortedChanges = [...tempoChanges].sort((a, b) => a.time - b.time);
    const activeTempoChange = sortedChanges.slice().reverse().find(tc => tc.time <= measure) || tempoChanges[0];
    return activeTempoChange;
  };

  const getCurrentTimeSignature = () => {
    return getCurrentTempoInfo(currentTime).timeSignature;
  };

"""
    
    if duplicate_block in content:
        new_content = content.replace(duplicate_block, "")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("✅ Successfully removed duplicate declarations:")
        print("   - getTrackHeightPx")
        print("   - getCurrentMeasure") 
        print("   - getCurrentTempoInfo")
        print("   - getCurrentTimeSignature")
        print("\n✅ File saved!")
    else:
        print("❌ Could not find the duplicate block to remove")
        print("The file may have already been fixed or has different formatting")

if __name__ == '__main__':
    main()
