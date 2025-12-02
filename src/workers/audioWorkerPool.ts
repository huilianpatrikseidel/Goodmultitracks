/**
 * Audio Worker Pool - Gerenciamento eficiente de workers de áudio
 * 
 * CORREÇÃO CRÍTICA QA (Iteração 2): Evita criar 20+ workers simultâneos
 * - Limita workers ao número de CPUs disponíveis
 * - Implementa fila de tarefas
 * - Reutiliza workers para múltiplos arquivos
 */

interface WorkerTask {
  file: File;
  samples?: number;
  resolve: (result: { waveform: number[]; waveformOverview: number[]; duration: number }) => void;
  reject: (error: Error) => void;
}

interface PendingTask {
  resolve: (result: { waveform: number[]; waveformOverview: number[]; duration: number }) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

class AudioWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private readonly poolSize: number;
  private pendingTasks: Map<Worker, PendingTask> = new Map();

  constructor() {
    // Limita ao número de CPUs ou máximo de 4 (balanceamento)
    this.poolSize = Math.min(navigator.hardwareConcurrency || 2, 4);
    this.initializePool();
  }

  private initializePool(): void {
    // DISABLED: Worker creation fails in this build environment
    // All audio processing will happen on main thread
    console.log('Audio processing will run on main thread (Workers disabled)');
    // Workers array stays empty, processAudio will handle main thread fallback
  }

  private handleWorkerMessage(worker: Worker, e: MessageEvent): void {
    const pending = this.pendingTasks.get(worker);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingTasks.delete(worker);

    const { waveform, waveformOverview, duration, error } = e.data;

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve({ waveform, waveformOverview, duration });
    }

    this.returnWorkerToPool(worker);
  }

  private handleWorkerError(worker: Worker, error: ErrorEvent | Event): void {
    const pending = this.pendingTasks.get(worker);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingTasks.delete(worker);

    pending.reject(error instanceof ErrorEvent ? new Error(error.message) : new Error('Worker error'));
    this.returnWorkerToPool(worker);
  }

  /**
   * Processa arquivo de áudio usando worker disponível
   */
  async processAudio(file: File, samples?: number): Promise<{ waveform: number[]; waveformOverview: number[]; duration: number }> {
    // FALLBACK: If no workers available (disabled), process on main thread
    if (this.workers.length === 0) {
      return this.processAudioMainThread(file, samples);
    }

    return new Promise((resolve, reject) => {
      const task: WorkerTask = { file, samples, resolve, reject };

      if (this.availableWorkers.length > 0) {
        this.executeTask(task);
      } else {
        // Adiciona à fila se todos workers estiverem ocupados
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * Process audio on main thread (fallback when Workers are disabled)
   */
  private async processAudioMainThread(file: File, samples: number = 500): Promise<{ waveform: number[]; waveformOverview: number[]; duration: number }> {
    const arrayBuffer = await file.arrayBuffer();
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const decodingContext = new AudioContextClass();
    
    try {
      const audioBuffer = await decodingContext.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      const duration = audioBuffer.duration;
      
      // Generate waveform - same logic as worker
      const samplesPerPixel = Math.floor(rawData.length / samples);
      const waveform: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = i * samplesPerPixel;
        const end = start + samplesPerPixel;
        let max = 0;
        
        for (let j = start; j < end && j < rawData.length; j++) {
          const abs = Math.abs(rawData[j]);
          if (abs > max) max = abs;
        }
        
        waveform.push(max);
      }
      
      // Generate overview (lower resolution for zoom-out view)
      const overviewSamples = 1000;
      const overviewSamplesPerPixel = Math.floor(rawData.length / overviewSamples);
      const waveformOverview: number[] = [];
      
      for (let i = 0; i < overviewSamples; i++) {
        const start = i * overviewSamplesPerPixel;
        const end = start + overviewSamplesPerPixel;
        let max = 0;
        
        for (let j = start; j < end && j < rawData.length; j++) {
          const abs = Math.abs(rawData[j]);
          if (abs > max) max = abs;
        }
        
        waveformOverview.push(max);
      }
      
      return { waveform, waveformOverview, duration };
      
    } finally {
      if (decodingContext.state !== 'closed') {
        await decodingContext.close();
      }
    }
  }

  private async executeTask(task: WorkerTask): Promise<void> {
    const worker = this.availableWorkers.pop();
    if (!worker) return;

    try {
      // QA FIX 1.1: Decode in Main Thread to avoid AudioContext limit in workers
      const arrayBuffer = await task.file.arrayBuffer();
      
      // Use a shared context or create one just for decoding
      // Note: Creating AudioContext in main thread is safer but still has limits if not closed.
      // Ideally we should reuse a single context.
      // Since we don't have access to the global context here easily, we create one and close it,
      // OR we assume the browser handles main thread contexts better (it does).
      // Better yet: Reuse a static context if possible, but for now let's create/close.
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const decodingContext = new AudioContextClass();
      
      let rawData: Float32Array;
      let duration: number;
      
      try {
        const audioBuffer = await decodingContext.decodeAudioData(arrayBuffer);
        rawData = audioBuffer.getChannelData(0);
        duration = audioBuffer.duration;
      } finally {
        // Always close the context
        if (decodingContext.state !== 'closed') {
          await decodingContext.close();
        }
      }

      // Register pending task with timeout
      const timeout = setTimeout(() => {
        const pending = this.pendingTasks.get(worker);
        if (pending) {
          this.pendingTasks.delete(worker);
          pending.reject(new Error('Worker timeout (30s)'));
          this.returnWorkerToPool(worker);
        }
      }, 30000);

      this.pendingTasks.set(worker, {
        resolve: task.resolve,
        reject: task.reject,
        timeout
      });

      // CRITICAL FIX (26/11/2025): Clone instead of transfer to prevent stack overflow
      // Transfer ownership causes issues with worker reuse
      const clonedData = new Float32Array(rawData);
      
      worker.postMessage({
        type: 'generateWaveform',
        rawData: clonedData,
        duration,
        samples: task.samples
      }); // No transfer, just structured clone

    } catch (error) {
      task.reject(error as Error);
      this.returnWorkerToPool(worker);
    }
  }

  private returnWorkerToPool(worker: Worker): void {
    this.availableWorkers.push(worker);

    // Processa próxima tarefa da fila se houver
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        this.executeTask(nextTask);
      }
    }
  }

  /**
   * Termina todos os workers (cleanup)
   */
  terminate(): void {
    // Clear all pending tasks
    this.pendingTasks.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker pool terminated'));
    });
    this.pendingTasks.clear();

    // Terminate workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }

  /**
   * Retorna estatísticas do pool
   */
  getStats() {
    return {
      poolSize: this.poolSize,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
      busyWorkers: this.poolSize - this.availableWorkers.length
    };
  }
}

// Singleton global
let workerPool: AudioWorkerPool | null = null;

export function getAudioWorkerPool(): AudioWorkerPool {
  if (!workerPool) {
    workerPool = new AudioWorkerPool();
  }
  return workerPool;
}

export function terminateAudioWorkerPool(): void {
  if (workerPool) {
    workerPool.terminate();
    workerPool = null;
  }
}