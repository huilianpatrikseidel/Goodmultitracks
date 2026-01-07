// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React, { useEffect, useRef, useCallback } from 'react';
import { WaveformMipmap, selectMipmapLevel, getMipmapFactor } from '../../../lib/waveformMipmaps';

interface WaveformCanvasProps {
  data: Float32Array;  // CRITICAL FIX: Float32Array for zero-copy transfer
  mipmaps?: WaveformMipmap;  // CRITICAL FIX: Pre-computed mipmaps for O(1) rendering
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
  mipmaps,
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
    
    // CRITICAL PERFORMANCE FIX (QA Jan 2026): Use mipmaps for O(1) lookup
    // Select appropriate mipmap level based on zoom
    let renderData = data;
    let dataFactor = 1;  // Index adjustment factor
    
    if (mipmaps && pointsPerPixel > 1) {
      const level = selectMipmapLevel(pointsPerPixel);
      dataFactor = getMipmapFactor(level);
      renderData = mipmaps[`level${level}`] as Float32Array;
    }
    
    const centerY = height / 2;

    ctx.fillStyle = fill;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    
    // Ajusta índices para o mipmap level selecionado
    const mipmapStart = Math.floor(safeStart / dataFactor);
    const mipmapEnd = Math.ceil(safeEnd / dataFactor);
    const mipmapStep = Math.max(1, Math.floor(step / dataFactor));
    
    // Começa no primeiro ponto visível
    const firstX = (safeStart * pixelPerPoint) - scrollLeft;
    ctx.moveTo(firstX, centerY);

    // Loop: Parte Superior - Direct mipmap access (O(1) per pixel)
    for (let i = mipmapStart; i < mipmapEnd; i += mipmapStep) {
      const val = renderData[i] ?? 0;
      const originalIndex = i * dataFactor;  // Convert back to original scale
      const x = (originalIndex * pixelPerPoint) - scrollLeft;
      
      // FIX: Math.max(0.5, ...): Garante no mínimo 0.5px de altura (total 1px visual)
      // Desenha linha de silêncio fina e contínua, evitando "desaparecimento" em -∞ dB
      const barHeight = Math.max(0.5, val * centerY * 0.95);
      
      ctx.lineTo(x, centerY - barHeight);
    }

    // Loop: Parte Inferior (espelhada para simular estéreo/bipolar visual)
    for (let i = mipmapEnd - 1; i >= mipmapStart; i -= mipmapStep) {
      const val = renderData[i] ?? 0;
      const originalIndex = i * dataFactor;
      const x = (originalIndex * pixelPerPoint) - scrollLeft;
      
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
  }, [data, mipmaps, width, height, fill, opacity, zoom, scrollContainerRef, scrollPosRef]);

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
