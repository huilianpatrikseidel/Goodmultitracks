// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * WAVEFORM MIPMAP GENERATOR
 * 
 * CRITICAL PERFORMANCE FIX (QA Jan 2026):
 * Generates pre-computed pyramid levels (mipmaps) for waveform data
 * to eliminate O(N) peak scanning during render loop.
 * 
 * LOD Strategy:
 * - Level 0: Original data (100%)
 * - Level 1: Max of every 10 samples (10%)
 * - Level 2: Max of every 100 samples (1%)
 * - Level 3: Max of every 1000 samples (0.1%)
 * 
 * At runtime, select appropriate level based on zoom:
 * - If showing < 10 points per pixel: Level 0 (raw)
 * - If showing 10-100 points per pixel: Level 1
 * - If showing 100-1000 points per pixel: Level 2
 * - If showing > 1000 points per pixel: Level 3
 * 
 * This changes rendering complexity from O(N) to O(1) lookup.
 */

export interface WaveformMipmap {
  level0: Float32Array;  // Original
  level1: Float32Array;  // 10x downsampled
  level2: Float32Array;  // 100x downsampled
  level3: Float32Array;  // 1000x downsampled
}

/**
 * Generate mipmap pyramid from raw waveform data
 * 
 * @param rawData - Original waveform data (high detail)
 * @returns WaveformMipmap with all LOD levels
 * 
 * @example
 * const mipmaps = generateWaveformMipmaps(audioData);
 * // Later, in render loop:
 * const level = selectMipmapLevel(pointsPerPixel);
 * const data = mipmaps[`level${level}`];
 */
export function generateWaveformMipmaps(rawData: Float32Array): WaveformMipmap {
  const level0 = rawData; // Original reference
  
  // Level 1: Max of every 10 samples
  const level1Size = Math.ceil(rawData.length / 10);
  const level1 = new Float32Array(level1Size);
  for (let i = 0; i < level1Size; i++) {
    const start = i * 10;
    const end = Math.min(start + 10, rawData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      if (rawData[j] > max) max = rawData[j];
    }
    level1[i] = max;
  }
  
  // Level 2: Max of every 100 samples (or max of every 10 from level1)
  const level2Size = Math.ceil(rawData.length / 100);
  const level2 = new Float32Array(level2Size);
  for (let i = 0; i < level2Size; i++) {
    const start = i * 100;
    const end = Math.min(start + 100, rawData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      if (rawData[j] > max) max = rawData[j];
    }
    level2[i] = max;
  }
  
  // Level 3: Max of every 1000 samples
  const level3Size = Math.ceil(rawData.length / 1000);
  const level3 = new Float32Array(level3Size);
  for (let i = 0; i < level3Size; i++) {
    const start = i * 1000;
    const end = Math.min(start + 1000, rawData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      if (rawData[j] > max) max = rawData[j];
    }
    level3[i] = max;
  }
  
  return { level0, level1, level2, level3 };
}

/**
 * Select appropriate mipmap level based on points per pixel
 * 
 * @param pointsPerPixel - Number of data points that will be displayed per screen pixel
 * @returns Mipmap level (0-3)
 * 
 * @example
 * selectMipmapLevel(5)     → 0 (use original)
 * selectMipmapLevel(50)    → 1 (use 10x downsampled)
 * selectMipmapLevel(500)   → 2 (use 100x downsampled)
 * selectMipmapLevel(5000)  → 3 (use 1000x downsampled)
 */
export function selectMipmapLevel(pointsPerPixel: number): 0 | 1 | 2 | 3 {
  if (pointsPerPixel < 10) return 0;
  if (pointsPerPixel < 100) return 1;
  if (pointsPerPixel < 1000) return 2;
  return 3;
}

/**
 * Get the downsampling factor for a given mipmap level
 * Used to adjust index calculations when reading from mipmap
 */
export function getMipmapFactor(level: 0 | 1 | 2 | 3): number {
  return [1, 10, 100, 1000][level];
}

/**
 * Get waveform data at specific position using appropriate mipmap level
 * This is a helper for random access (not used in main render loop)
 * 
 * @param mipmaps - Mipmap pyramid
 * @param index - Original data index
 * @param pointsPerPixel - Current zoom level
 * @returns Peak value at that position
 */
export function getWaveformValueAt(
  mipmaps: WaveformMipmap,
  index: number,
  pointsPerPixel: number
): number {
  const level = selectMipmapLevel(pointsPerPixel);
  const factor = getMipmapFactor(level);
  const mipmapIndex = Math.floor(index / factor);
  const data = mipmaps[`level${level}`] as Float32Array;
  
  return data[mipmapIndex] ?? 0;
}
