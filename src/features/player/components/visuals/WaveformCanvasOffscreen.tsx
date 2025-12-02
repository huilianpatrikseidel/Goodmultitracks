import React, { useEffect, useRef } from 'react';

/**
 * WaveformCanvasOffscreen - Canvas Renderer with OffscreenCanvas Worker
 * 
 * OTIMIZAÇÃO P0 (QA Report 23/11/2025):
 * - Renderização movida para Web Worker via OffscreenCanvas
 * - Thread principal livre para responder a interações do usuário
 * - Ideal para projetos muito longos onde scroll/zoom constantes poderiam causar input lag
 * 
 * NOTA: Requer suporte a OffscreenCanvas (Chrome 69+, Firefox 105+, Safari 16.4+)
 * Use WaveformCanvas.tsx (versão padrão) como fallback em navegadores antigos
 */

interface WaveformCanvasOffscreenProps {
  data: number[];
  width: number;
  height: number;
  fill?: string;
  opacity?: number;
  className?: string;
  scrollLeft?: number;
  viewportWidth?: number;
  zoom?: number;
}

export function WaveformCanvasOffscreen({ 
  data, 
  width, 
  height, 
  fill = '#60a5fa', 
  opacity = 0.8,
  className = '',
  scrollLeft = 0,
  viewportWidth = 1000,
  zoom = 1,
}: WaveformCanvasOffscreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const isInitializedRef = useRef(false);
  
  const isLoading = !data || data.length === 0;

  /**
   * Inicializa o Worker e transfere controle do Canvas
   * DISABLED: Workers not supported in this build environment
   */
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    // Verifica suporte a OffscreenCanvas
    if (typeof OffscreenCanvas === 'undefined') {
      // OffscreenCanvas not supported - silent return (expected in some browsers)
      return;
    }

    // DISABLED: Worker creation not supported in build environment
    // This component requires Workers, so it will not render
    // (Using WaveformCanvas as fallback is expected)
    return;
  }, [isLoading]); // Init apenas uma vez

  /**
   * Atualiza dados quando mudam (ex: carregamento progressivo ou troca de track)
   */
  useEffect(() => {
    if (!isInitializedRef.current || !workerRef.current || isLoading) return;

    workerRef.current.postMessage({
      type: 'updateData',
      data
    });
  }, [data, isLoading]);

  /**
   * CRITICAL FIX (26/11/2025): Sincroniza dimensões quando width/height mudam
   * O Worker precisa saber a nova largura total quando zoom muda
   */
  useEffect(() => {
    if (!isInitializedRef.current || !workerRef.current || isLoading) return;

    workerRef.current.postMessage({
      type: 'updateMetrics',
      width: width,
      height: height
    });
  }, [width, height, isLoading]);

  /**
   * Envia comandos de render quando viewport/zoom mudam
   */
  useEffect(() => {
    if (!isInitializedRef.current || !workerRef.current || isLoading) return;

    workerRef.current.postMessage({
      type: 'render',
      viewportWidth,
      scrollLeft,
      zoom
    });
  }, [scrollLeft, viewportWidth, zoom, isLoading]);

  return (
    <div className="relative w-full h-full">
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundColor: `${fill}15`,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Canvas - controle transferido para worker */}
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          opacity: isLoading ? 0 : 1,
        }}
      />
    </div>
  );
}

/**
 * WaveformCanvasOffscreenMemoized - Versão memoizada
 */
export const WaveformCanvasOffscreenMemoized = React.memo(
  WaveformCanvasOffscreen,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.fill === nextProps.fill &&
      prevProps.opacity === nextProps.opacity &&
      prevProps.scrollLeft === nextProps.scrollLeft &&
      prevProps.viewportWidth === nextProps.viewportWidth &&
      prevProps.zoom === nextProps.zoom
    );
  }
);

WaveformCanvasOffscreenMemoized.displayName = 'WaveformCanvasOffscreenMemoized';