/**
 * Metronome Timer Worker
 * CRITICAL (P1): Timer independente do requestAnimationFrame
 * Garante que o metrônomo funcione quando a aba está em background
 * 
 * Navegadores throttlem RAF, mas Workers continuam executando
 */

let intervalId: number | null = null;

self.onmessage = (e: MessageEvent) => {
  const { action, interval } = e.data;

  if (action === 'start') {
    // Timer de alta precisão (25ms = 40 Hz)
    // Suficiente para lookahead scheduling sem sobrecarregar
    intervalId = self.setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, interval || 25) as unknown as number;
  } else if (action === 'stop') {
    if (intervalId !== null) {
      self.clearInterval(intervalId);
      intervalId = null;
    }
  }
};
