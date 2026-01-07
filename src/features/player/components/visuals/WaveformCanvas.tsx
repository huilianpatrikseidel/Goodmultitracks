// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useEffect, useRef, useCallback } from 'react';

interface WaveformCanvasProps {
  data: number[];
  width: number; // Largura total da track em pixels (song duration * pps)
  height: number;
  fill?: string;
  opacity?: number;
  className?: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollPosRef?: React.MutableRefObject<number>; // OPTIMIZATION (QA 2.2): Read from ref instead of DOM
  zoom?: number;
}

export function WaveformCanvas({ 
  data, 
  width, 
  height, 
  fill = '#60a5fa', 
  opacity = 0.8,
  className = '',
  scrollContainerRef,
  scrollPosRef,
  zoom = 1,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  
  // FIX QA: Cache inicializado com -1 em dataLen para forçar primeiro desenho
  const lastRenderState = useRef({ scrollLeft: -1, width: 0, totalWidth: 0, dataLen: -1, zoom: 0 });
  
  // QA FIX 2.2: ResizeObserver to avoid reading clientWidth in RAF loop
  const containerWidthRef = useRef(0);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidthRef.current = entry.contentRect.width;
      }
    });
    
    observer.observe(scrollContainerRef.current);
    
    // Initial read
    containerWidthRef.current = scrollContainerRef.current.clientWidth;
    
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  const draw = useCallback(() => {
    const renderStart = performance.now();
    
    const canvas = canvasRef.current;
    const scrollContainer = scrollContainerRef.current;
    
    // FIX QA: Se ref não estiver pronta, loop de espera (RAF)
    if (!canvas || !scrollContainer) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // OPTIMIZATION (QA 2.2): Read from ref if available to avoid Reflow/Layout Thrashing
    const scrollLeft = scrollPosRef ? scrollPosRef.current : scrollContainer.scrollLeft;
    const viewportWidth = containerWidthRef.current; // Read from ResizeObserver ref
    const dpr = window.devicePixelRatio || 1;

    // FIX QA: Verificar mudanças ANTES de fazer trabalho pesado
    const currentDataLen = data ? data.length : 0;
    if (
      scrollLeft === lastRenderState.current.scrollLeft &&
      viewportWidth === lastRenderState.current.width &&
      width === lastRenderState.current.totalWidth &&
      currentDataLen === lastRenderState.current.dataLen
    ) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
    
    // Atualizar cache
    lastRenderState.current = { 
      scrollLeft, 
      width: viewportWidth, 
      totalWidth: width, 
      dataLen: currentDataLen, 
      zoom: 0 
    };

    // Ajustar tamanho do canvas (buffer) se necessário
    const targetWidth = viewportWidth * dpr;
    const targetHeight = height * dpr;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${height}px`;
    }

    // Sincronia visual (transform)
    canvas.style.transform = `translateX(${scrollLeft}px)`;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Limpar e Configurar
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, viewportWidth, height);

    // FIX QA: Handle empty data - draw silence line
    if (!data || data.length === 0) {
      ctx.strokeStyle = fill;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(viewportWidth, height / 2);
      ctx.stroke();
      
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // --- RENDERIZAÇÃO DA WAVEFORM ---
    const totalDataPoints = data.length;
    // Pixels por ponto de dado = Largura Total da Música (px) / Total de Samples
    // width (prop) já inclui o zoom
    const pixelPerPoint = width / totalDataPoints;
    
    if (width === 0) return;

    // Índices visíveis na viewport (compensando scrollLeft)
    const startIndex = Math.floor(scrollLeft / pixelPerPoint);
    const endIndex = Math.ceil((scrollLeft + viewportWidth) / pixelPerPoint);
    
    // Clamp
    const safeStart = Math.max(0, startIndex);
    const safeEnd = Math.min(totalDataPoints, endIndex);

    if (safeStart >= safeEnd) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // LOD RENDERING (26/11/2025): Step dinâmico com peak detection
    // Calcula quantos pontos de dados existem por pixel de tela
    const pointsPerPixel = 1 / pixelPerPoint;
    const step = pointsPerPixel > 1 ? Math.floor(pointsPerPixel) : 1;
    
    const centerY = height / 2;

    ctx.fillStyle = fill;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    
    // Começa no primeiro ponto visível
    const firstX = (safeStart * pixelPerPoint) - scrollLeft;
    ctx.moveTo(firstX, centerY);

    // CRITICAL: Peak detection aprimorado para preservar transientes
    // Quando step > 1, não podemos simplesmente pular dados, senão perdemos batidas/ataques
    const getPeakInRange = (startIdx: number, endIdx: number): number => {
      let peak = 0;
      for (let j = startIdx; j < Math.min(endIdx, totalDataPoints); j++) {
        if (data[j] > peak) peak = data[j];
      }
      return peak;
    };

    // Loop: Parte Superior
    for (let i = safeStart; i < safeEnd; i += step) {
      // Se estamos pulando pontos (zoom out), procura o pico no intervalo
      const val = step > 1 ? getPeakInRange(i, i + step) : data[i];

      const x = (i * pixelPerPoint) - scrollLeft;
      
      // FIX: Math.max(0.5, ...): Garante no mínimo 0.5px de altura (total 1px visual)
      // Desenha linha de silêncio fina e contínua, evitando "desaparecimento" em -∞ dB
      const barHeight = Math.max(0.5, val * centerY * 0.95);
      
      ctx.lineTo(x, centerY - barHeight);
    }

    // Loop: Parte Inferior (espelhada para simular estéreo/bipolar visual)
    for (let i = safeEnd - 1; i >= safeStart; i -= step) {
      const val = step > 1 ? getPeakInRange(i, i + step) : data[i];
      
      const x = (i * pixelPerPoint) - scrollLeft;
      
      // Mesma lógica de altura mínima
      const barHeight = Math.max(0.5, val * centerY * 0.95);
      
      ctx.lineTo(x, centerY + barHeight);
    }

    ctx.closePath();
    ctx.fill();
    
    // Performance monitoring
    const renderTime = performance.now() - renderStart;
    if (renderTime > 16) {
      console.warn(
        `[LOD Performance Main] Slow render: ${renderTime.toFixed(2)}ms | ` +
        `Step: ${step} | Points: ${safeEnd - safeStart} | Zoom: ${zoom.toFixed(2)}`
      );
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [data, width, height, fill, opacity, zoom, scrollContainerRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    // Container do Canvas dentro do ClipBox
    <div className="h-full w-full relative">
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: 'block',
          position: 'absolute', // FIX QA: Sticky removido. Absolute + Transform é o correto.
          left: 0,
          top: 0,
          pointerEvents: 'none', // Permite clicar através do canvas
          willChange: 'transform', // Otimização de GPU
        }}
      />
    </div>
  );
}
