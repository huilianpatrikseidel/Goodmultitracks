/**
 * Web Worker para processamento de áudio off-thread
 * 
 * OTIMIZAÇÃO CRÍTICA (QA Report 23/11/2025):
 * - Move decodificação de áudio para fora da thread principal
 * - Previne bloqueio de UI e OOM (Out of Memory) em projetos grandes
 * - CORREÇÃO WAVEFORM (26/11/2025): Removido hard-cap de 10k samples
 *   * Densidade fixa: 500 samples/segundo (precisão de 2ms)
 *   * Super-amostragem permite zoom sem visual "esticado"
 * - MULTI-LEVEL LOD (05/01/2026): Sistema de 3 níveis para melhor performance
 *   * Overview (Low): 2k samples - visão distante
 *   * Medium: 20k samples - edição normal
 *   * Detail (High): 150k+ samples - zoom máximo
 */

interface WaveformRequest {
  type: 'generateWaveform';
  arrayBuffer: ArrayBuffer;
  samples?: number;
}

interface WaveformResponse {
  type: 'waveformComplete';
  waveform: number[];         // High detail LOD
  waveformMedium: number[];   // Medium detail LOD
  waveformOverview: number[]; // Low detail LOD
  duration: number;
  error?: string;
}

/**
 * Gera array de waveform a partir de raw audio data
 * CORREÇÃO CRÍTICA 23/11/2025: Lógica robusta para blockSize < 1
 * - Garante blockSize mínimo de 1 para evitar divisão por zero
 * - Usa PICO (max) em vez de MÉDIA para capturar transientes
 * - Otimização: Pula samples em blocos grandes (step)
 */
function generateWaveformArray(rawData: Float32Array, targetSamples: number): number[] {
  // Garante que não tentamos extrair mais samples do que existem dados
  const safeTargetSamples = Math.min(targetSamples, rawData.length);
  
  // FIX CRÍTICO: Block size mínimo de 1 para evitar loops infinitos
  const blockSize = Math.max(1, Math.floor(rawData.length / safeTargetSamples));
  
  const waveform: number[] = [];

  // Calcula PICO MÁXIMO por bloco
  for (let i = 0; i < safeTargetSamples; i++) {
    const startIndex = blockSize * i;
    // Garante que não ultrapassa o array
    const endIndex = Math.min(startIndex + blockSize, rawData.length);
    
    let max = 0;
    // Otimização: Para blocos muito grandes, pular alguns samples
    // (apenas se bloco > 1000 samples, pula a cada 10)
    const step = blockSize > 1000 ? 10 : 1;
    
    for (let j = startIndex; j < endIndex; j += step) {
      const abs = Math.abs(rawData[j]);
      if (abs > max) max = abs;
    }
    waveform.push(max);
  }
  
  return waveform;
}

/**
 * Normaliza array de amplitudes para range 0-1 e remove silêncio absoluto (NaN fix)
 * CRITICAL FIX (26/11/2025): Math.max(...waveform) causa Stack Overflow em arrays grandes
 * Substituído por reduce para segurança de memória (150k+ samples)
 */
function normalizeWaveform(waveform: number[]): number[] {
  // Usa reduce em vez de spread operator para evitar stack overflow
  const max = waveform.reduce((a, b) => Math.max(a, b), 0.001);
  return waveform.map(v => {
    const norm = v / max;
    return isNaN(norm) ? 0 : norm; // Garante que não haja NaNs
  });
}

// Handler para mensagens do thread principal
self.onmessage = async (e: MessageEvent<any>) => {
  const { type, samples } = e.data;

  if (type === 'generateWaveform') {
    try {
      // QA FIX 1.1: AudioContext removed from worker.
      // Expecting raw Float32Array data from main thread now.
      
      const data = e.data;
      let rawData: Float32Array;
      let duration: number;

      if (data.rawData) {
         rawData = data.rawData;
         duration = data.duration;
      } else {
         throw new Error("Worker expects rawData (Float32Array) decoded by main thread.");
      }

      // MULTI-LEVEL LOD GENERATION (05/01/2026):
      // Generates 3 levels of detail for optimal performance at different zoom levels
      const SAMPLES_PER_SECOND = 500; // High detail: 2ms precision
      const targetDetailSamples = samples || Math.ceil(duration * SAMPLES_PER_SECOND);
      
      // Generate all 3 LOD levels
      const waveform = generateWaveformArray(rawData, targetDetailSamples);  // High: ~150k for 5min
      const waveformMedium = generateWaveformArray(rawData, 20000);          // Medium: 20k samples
      const waveformOverview = generateWaveformArray(rawData, 2000);         // Low: 2k samples
      
      // Normalize all levels
      const normalizedWaveform = normalizeWaveform(waveform);
      const normalizedMedium = normalizeWaveform(waveformMedium);
      const normalizedOverview = normalizeWaveform(waveformOverview);

      self.postMessage({
        type: 'waveformComplete',
        waveform: normalizedWaveform,
        waveformMedium: normalizedMedium,
        waveformOverview: normalizedOverview,
        duration
      } as WaveformResponse);

    } catch (error) {
      self.postMessage({
        type: 'waveformComplete',
        waveform: [],
        waveformMedium: [],
        waveformOverview: [],
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as WaveformResponse);
    }
  }
};

// Export para TypeScript
export {};
