/**
 * Waveform Renderer Worker - OffscreenCanvas Rendering
 * 
 * OTIMIZAÇÃO CRÍTICA (QA Report 23/11/2025):
 * - Move renderização de canvas para Web Worker (off-thread)
 * - Evita bloqueio da UI durante scroll/zoom em projetos longos
 * - Usa OffscreenCanvas API para desenhar sem travar thread principal
 * - Responde a mensagens de scroll/zoom e redesenha dinamicamente
 * 
 * LOD RENDERING (26/11/2025):
 * - Peak detection inteligente preserva transientes em zoom out
 * - Step dinâmico baseado em pointsPerPixel para performance
 * - Trabalha em conjunto com super-amostragem (500 samples/seg)
 * 
 * PERFORMANCE MONITORING (05/01/2026):
 * - Tracks render time and warns if exceeding 16ms (60fps target)
 * - Logs step size and data point count for optimization analysis
 */

interface RenderRequest {
  type: 'init' | 'render' | 'updateData' | 'updateMetrics';
  canvas?: OffscreenCanvas;
  data?: number[];
  width?: number;
  height?: number;
  viewportWidth?: number;
  scrollLeft?: number;
  zoom?: number;
  fill?: string;
  opacity?: number;
}

let offscreenCanvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let waveformData: number[] = [];
let totalWidth = 0;
let canvasHeight = 100;
let currentFill = '#60a5fa';
let currentOpacity = 0.8;

/**
 * Inicializa o OffscreenCanvas
 */
function initCanvas(canvas: OffscreenCanvas, data: number[], width: number, height: number, fill: string, opacity: number) {
  offscreenCanvas = canvas;
  ctx = canvas.getContext('2d', { alpha: true });
  waveformData = data;
  totalWidth = width;
  canvasHeight = height;
  currentFill = fill;
  currentOpacity = opacity;
}

/**
 * Atualiza os dados da waveform
 */
function updateData(data: number[]) {
  waveformData = data;
}

/**
 * Atualiza as dimensões da waveform (width/height)
 * CRITICAL FIX (26/11/2025): Sincroniza quando zoom ou container mudam
 */
function updateMetrics(newWidth: number, newHeight: number) {
  totalWidth = newWidth;
  canvasHeight = newHeight;
}

/**
 * Renderiza a waveform baseado nos parâmetros da viewport
 */
function render(viewportWidth: number, scrollLeft: number, zoom: number) {
  const renderStart = performance.now();
  
  if (!ctx || !offscreenCanvas || waveformData.length === 0) return;
  
  // Safety check: viewportWidth deve ser válido
  if (viewportWidth <= 0 || !isFinite(viewportWidth)) {
    console.warn('Invalid viewportWidth:', viewportWidth);
    return;
  }

  // Setup canvas size
  offscreenCanvas.width = viewportWidth;
  offscreenCanvas.height = canvasHeight;

  // Clear
  ctx.clearRect(0, 0, viewportWidth, canvasHeight);

  // CRITICAL FIX (26/11/2025): Guarda contra divisão por zero
  const safeTotalWidth = totalWidth > 0 ? totalWidth : 1;
  const viewStartPct = scrollLeft / safeTotalWidth;
  const viewEndPct = (scrollLeft + viewportWidth) / safeTotalWidth;
  
  const iStart = Math.floor(waveformData.length * viewStartPct);
  const iEnd = Math.ceil(waveformData.length * viewEndPct);
  
  if (iStart >= iEnd || iStart < 0 || iEnd > waveformData.length) return;

  // LOD RENDERING (26/11/2025): Step dinâmico com peak detection
  const dataPointsInView = iEnd - iStart;
  const pixelsAvailable = viewportWidth;
  const pointsPerPixel = dataPointsInView / pixelsAvailable;
  const step = pointsPerPixel > 1 ? Math.floor(pointsPerPixel) : 1;
  
  // Desenhar waveform
  ctx.fillStyle = currentFill;
  ctx.globalAlpha = currentOpacity;
  
  const centerY = canvasHeight / 2;
  const pixelPerDataPoint = viewportWidth / dataPointsInView;
  
  // CRITICAL: Peak detection aprimorado para preservar transientes
  const getPeakInRange = (startIdx: number, endIdx: number): number => {
    let peak = 0;
    const safeEnd = Math.min(endIdx, waveformData.length);
    for (let j = startIdx; j < safeEnd; j++) {
      if (waveformData[j] > peak) peak = waveformData[j];
    }
    return peak;
  };
  
  ctx.beginPath();
  
  // Primeira passagem: Parte superior da waveform
  for (let i = iStart; i < iEnd; i += step) {
    // Se estamos pulando pontos (zoom out), procura o pico no intervalo
    const value = step > 1 ? getPeakInRange(i, i + step) : waveformData[i];
    const x = (i - iStart) * pixelPerDataPoint;
    
    // FIX: Math.max(0.5, ...): Garante visualização mínima em silêncios
    const barHeight = Math.max(0.5, value * centerY * 0.95);
    
    if (i === iStart) {
      ctx.moveTo(x, centerY - barHeight);
    } else {
      ctx.lineTo(x, centerY - barHeight);
    }
  }
  
  // Segunda passagem: Parte inferior (espelhada)
  for (let i = iEnd - 1; i >= iStart; i -= step) {
    const value = step > 1 ? getPeakInRange(i, i + step) : waveformData[i];
    const x = (i - iStart) * pixelPerDataPoint;
    const barHeight = Math.max(0.5, value * centerY * 0.95);
    ctx.lineTo(x, centerY + barHeight);
  }
  
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Performance monitoring
  const renderTime = performance.now() - renderStart;
  
  // Warn if render exceeds 16ms (below 60fps)
  if (renderTime > 16) {
    console.warn(
      `[LOD Performance] Slow render: ${renderTime.toFixed(2)}ms | ` +
      `Step: ${step} | Points in view: ${dataPointsInView} | ` +
      `Zoom: ${zoom.toFixed(2)}`
    );
  }
  
  // Notifica thread principal que renderização está completa
  self.postMessage({ type: 'renderComplete' });
}

// Handler de mensagens
self.onmessage = (e: MessageEvent<RenderRequest>) => {
  const { type } = e.data;
  
  if (type === 'init') {
    const { canvas, data, width, height, fill, opacity } = e.data;
    if (canvas && data && width && height && fill !== undefined && opacity !== undefined) {
      initCanvas(canvas, data, width, height, fill, opacity);
    }
  } else if (type === 'updateData') {
    const { data } = e.data;
    if (data) {
      updateData(data);
    }
  } else if (type === 'updateMetrics') {
    const { width, height } = e.data;
    if (width !== undefined && height !== undefined) {
      updateMetrics(width, height);
    }
  } else if (type === 'render') {
    const { viewportWidth, scrollLeft, zoom } = e.data;
    if (viewportWidth !== undefined && scrollLeft !== undefined && zoom !== undefined) {
      render(viewportWidth, scrollLeft, zoom);
    }
  }
};

export {};
