/**
 * Waveform Component - Adaptive renderer
 * 
 * CORREÇÃO QA: Usa Canvas por padrão (performance), SVG como fallback
 */

import React from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { WaveformCanvasOffscreen } from './WaveformCanvasOffscreen';

interface WaveformProps {
  data: number[];
  width: number;
  height: number;
  fill?: string;
  opacity?: number;
  className?: string;
  useCanvas?: boolean; // Default: true
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>; // Ref ao container de scroll
  scrollPosRef?: React.MutableRefObject<number>; // OPTIMIZATION (QA 2.2): Ref para posição de scroll
  zoom?: number; // Fator de zoom para LOD
}

export function Waveform({ 
  data, 
  width, 
  height, 
  fill = '#60a5fa', 
  opacity = 0.8,
  className = '',
  useCanvas = true, // Canvas por padrão (melhor performance)
  scrollContainerRef,
  scrollPosRef,
  zoom = 1
}: WaveformProps) {
  
  // Detecta suporte a Canvas e OffscreenCanvas
  const hasCanvasSupport = typeof HTMLCanvasElement !== 'undefined';
  
  // SYNC FIX (26/11/2025): updateMetrics implementado no worker
  // Para REATIVAR OffscreenCanvas (melhor performance):
  //   1. Teste com projeto real (múltiplas tracks)
  //   2. Verifique zoom in/out sem travamentos
  //   3. Mude linha abaixo para: typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'
  // ATENÇÃO: Main Thread Canvas (atual) é mais estável para desenvolvimento
  const hasOffscreenCanvasSupport = false; // typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined';
  
  // PRIORIDADE 1: OffscreenCanvas (renderiza em Worker, melhor performance)
  // DESABILITADO temporariamente - sincronização de dimensões
  if (useCanvas && hasOffscreenCanvasSupport) {
    return (
      <WaveformCanvasOffscreen
        data={data}
        width={width}
        height={height}
        fill={fill}
        opacity={opacity}
        className={className}
        zoom={zoom}
        // TODO: Pass scrollPosRef to OffscreenCanvas if we enable it
      />
    );
  }
  
  // PRIORIDADE 2: Canvas Main Thread (fallback para navegadores sem OffscreenCanvas)
  // FIX QA P0: Removemos verificação de scrollContainerRef.current
  // Refs são null na primeira render. Se condicionarmos aqui, React renderiza SVG e nunca atualiza.
  // WaveformCanvas tem RAF loop interno que espera a ref estar pronta.
  return (
    <WaveformCanvas
      data={data}
      width={width}
      height={height}
      fill={fill}
      opacity={opacity}
      className={className}
      scrollContainerRef={scrollContainerRef || { current: null }}
      scrollPosRef={scrollPosRef}
      zoom={zoom}
    />
  );
}

// Re-export para compatibilidade
export { WaveformCanvas } from './WaveformCanvas';

