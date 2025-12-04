# Time Standardization Documentation

## ⏱️ Time Units Standard - **CRITICAL QA FIX**

This document defines the **single source of truth** for time representation across the GoodMultitracks codebase.

**⚠️ QA ALERT:** This standard was created to resolve a critical inconsistency between type definitions and implementation logic that would have caused complete desynchronization in songs with tempo changes.

---

## Core Principle

**All persisted time values use SECONDS as the unit of measurement.**

Musical time (bars/beats) is ALWAYS derived at runtime from tempo and time signature information.

### Why This Matters

**WRONG** ❌ (Old implementation):
```typescript
// Types say "seconds" but code treated it as "measures"
const deltaMeasures = change.time - currentMeasure; // 120.5 - 1 = garbage!
```

**CORRECT** ✅ (Fixed implementation):
```typescript
// Types say "seconds" AND code treats it as seconds
const measuresUntilChange = (change.time - currentSeconds) / secondsPerMeasure;
```

---

## Data Model Standards

### ✅ CORRECT: Seconds-Based Storage

```typescript
interface TempoChange {
  time: number;          // ✅ SECONDS from start of song (e.g., 45.5)
  tempo: number;         // BPM (e.g., 140)
  timeSignature: string; // e.g., "4/4"
}

interface Marker {
  time: number;          // ✅ SECONDS from start of song (e.g., 120.0)
  label: string;
}

interface ChordMarker {
  time: number;          // ✅ SECONDS from start of song
  chord: string;
  duration: number;      // ✅ SECONDS (e.g., 2.5)
}
```

### Example: Tempo Change Timeline

```typescript
// A song that starts at 120 BPM and changes to 140 BPM at 30 seconds
const tempoChanges: TempoChange[] = [
  { time: 0, tempo: 120, timeSignature: "4/4" },    // Start of song
  { time: 30.0, tempo: 140, timeSignature: "4/4" }, // 30 seconds in
  { time: 90.5, tempo: 100, timeSignature: "3/4" }  // 90.5 seconds in
];
```

**NOT** ❌:
```typescript
// NEVER DO THIS - time is NOT a measure number!
{ time: 15, tempo: 140 } // Is this measure 15 or 15 seconds? AMBIGUOUS!
```

---

## Conversion Functions

Use the standardized utilities from `/lib/timeUtils.ts`:

```typescript
import { secondsToBeats, beatsToSeconds, secondsToBars } from '@/lib/timeUtils';

// Converting seconds to musical time
const beats = secondsToBeats(timeInSeconds, tempo);
const bars = secondsToBars(timeInSeconds, tempo, timeSignature);

// Converting musical time back to seconds
const seconds = beatsToSeconds(beats, tempo);
```

---

## Warp/Tempo Changes

When a song has multiple tempo changes, use `warpUtils.ts`:

```typescript
import { gridTimeToAudioTime, audioTimeToGridTime } from '@/features/player/utils/warpUtils';

// Grid time = visual/musical timeline (affected by tempo changes)
// Audio time = actual audio file playback position

const audioPosition = gridTimeToAudioTime(gridSeconds, tempoChanges, baseTempo);
const gridPosition = audioTimeToGridTime(audioSeconds, tempoChanges, baseTempo);
```

**Important:** Both `gridTime` and `audioTime` are measured in **seconds**, just in different reference frames.

---

## UI Display

The UI layer can display time in any format (MM:SS, bars:beats, etc.), but:

1. **Input from user** → Convert to seconds before storing
2. **Display to user** → Convert from seconds to desired format
3. **Internal calculations** → Always use seconds

---

## Database/Export Format

When exporting to `.gmtk` XML or storing in IndexedDB:

```xml
<tempoChange time="45.5" tempo="140" timeSignature="4/4" />
<!-- time is ALWAYS in seconds -->

<marker time="120.0" label="Chorus 2" />
<!-- time is ALWAYS in seconds -->
```

---

## Rationale

**Why seconds instead of bars/beats?**

1. **Tempo changes** make bar/beat positions ambiguous without context
2. **Audio files** are inherently time-based (samples per second)
3. **Simplicity** - no conversion needed when seeking audio
4. **Precision** - floating-point seconds are more precise than integer bar numbers
5. **Universality** - works with any time signature or tempo

**Why not samples?**

Samples are sample-rate dependent (44.1kHz vs 48kHz). Seconds are universal.

---

## Migration Guide

If you find code using bars/beats as storage format:

1. Add conversion functions in the data access layer
2. Update the TypeScript interfaces to document the unit
3. Add validation to ensure the conversion is correct
4. Test with tempo changes

---

## Validation Checklist

Before committing code that handles time:

- [ ] All `time` properties are documented with units (seconds)
- [ ] Conversion functions are used consistently
- [ ] No raw bar/beat arithmetic without tempo context
- [ ] Test cases include tempo changes

---

**Last Updated:** December 2024  
**Author:** GoodMultitracks Development Team