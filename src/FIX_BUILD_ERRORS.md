# 🔧 Fix Build Errors - DAWPlayer.tsx

## Problem

The file `DAWPlayer.tsx` has duplicate function declarations causing build errors:

```
ERROR: The symbol "getTrackHeightPx" has already been declared
ERROR: The symbol "getCurrentMeasure" has already been declared  
ERROR: The symbol "getCurrentTempoInfo" has already been declared
ERROR: The symbol "getCurrentTimeSignature" has already been declared
```

## Root Cause

These functions are:
1. ✅ **Correctly imported** from the `useDAWHelpers` hook on **line 294**
2. ❌ **Incorrectly redeclared** on **lines 466-489**

The duplicate declarations on lines 466-489 need to be removed.

## Quick Fix (2 minutes)

### Option 1: Run Python Script (RECOMMENDED)

```bash
python fix_daw_player.py
```

This will automatically remove the duplicate lines and fix the build.

### Option 2: Manual Edit

Open `/features/player/components/DAWPlayer.tsx` and **delete lines 466-489**:

```typescript
// DELETE THESE LINES (466-489):

  const getTrackHeightPx = () => {
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

// END OF LINES TO DELETE
```

**After deletion, the code should jump directly from line 464 to line 491:**

```typescript
  }, [song?.tracks, pinnedTracks]);

  const handleTempoMarkerAdd = (time: number) => {
    openMarkerEditor('tempo', null, time);
  };
```

## Verification

After the fix, run:

```bash
npm run dev
```

The build should succeed with no errors.

## Why This Happened

During the restore to a previous version, the file ended up with both:
- The new modular approach (using `useDAWHelpers` hook)  
- The old inline declarations

The functions only need to exist in ONE place - in the hook.

## Summary

✅ **Keep:** Line 294 - functions from `useDAWHelpers`
❌ **Remove:** Lines 466-489 - duplicate declarations

---

**Quick action:** Run `python fix_daw_player.py` now! ⚡
