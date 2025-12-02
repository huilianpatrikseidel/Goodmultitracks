/**
 * Web Worker para processamento ZIP off-thread
 * 
 * CORREÇÃO CRÍTICA (QA): Move compressão/descompressão ZIP para fora da thread principal
 * prevenindo congelamento da UI durante exportação/importação de projetos grandes
 */

import JSZip from 'jszip';

interface ZipCompressRequest {
  type: 'compress';
  files: Array<{ path: string; content: Blob | string }>;
  filename: string;
}

interface ZipDecompressRequest {
  type: 'decompress';
  arrayBuffer: ArrayBuffer;
}

interface ZipCompressResponse {
  type: 'compressComplete';
  blob: Blob;
  error?: string;
}

interface ZipDecompressResponse {
  type: 'decompressComplete';
  files: Record<string, Blob>;
  error?: string;
}

type ZipRequest = ZipCompressRequest | ZipDecompressRequest;
type ZipResponse = ZipCompressResponse | ZipDecompressResponse;

// Handler para mensagens do thread principal
self.onmessage = async (e: MessageEvent<ZipRequest>) => {
  const request = e.data;

  if (request.type === 'compress') {
    try {
      const zip = new JSZip();
      
      // Adiciona todos os arquivos ao ZIP
      for (const file of request.files) {
        zip.file(file.path, file.content);
      }
      
      // Gera blob do ZIP
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 } // Balanço entre tamanho e velocidade
      });
      
      const response: ZipCompressResponse = {
        type: 'compressComplete',
        blob
      };
      
      self.postMessage(response);
      
    } catch (error) {
      const response: ZipCompressResponse = {
        type: 'compressComplete',
        blob: new Blob(),
        error: error instanceof Error ? error.message : 'Unknown compression error'
      };
      
      self.postMessage(response);
    }
  } 
  else if (request.type === 'decompress') {
    try {
      const zip = await JSZip.loadAsync(request.arrayBuffer);
      const files: Record<string, Blob> = {};
      
      // Extrai todos os arquivos
      const filePromises: Promise<void>[] = [];
      
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          filePromises.push(
            zipEntry.async('blob').then(blob => {
              files[relativePath] = blob;
            })
          );
        }
      });
      
      await Promise.all(filePromises);
      
      const response: ZipDecompressResponse = {
        type: 'decompressComplete',
        files
      };
      
      self.postMessage(response);
      
    } catch (error) {
      const response: ZipDecompressResponse = {
        type: 'decompressComplete',
        files: {},
        error: error instanceof Error ? error.message : 'Unknown decompression error'
      };
      
      self.postMessage(response);
    }
  }
};

// Export para TypeScript
export {};
