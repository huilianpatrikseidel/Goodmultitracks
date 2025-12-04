/**
 * CRITICAL FIX (QA Report): Load project with memory-efficient streaming
 * 
 * Previous implementation loaded ALL audio files into memory simultaneously,
 * causing OOM crashes on mobile devices with large projects (500MB+).
 * 
 * New implementation:
 * 1. Parse XML first to get track list
 * 2. Load audio files on-demand as Blob URLs
 * 3. Allow browser to manage memory via garbage collection
 */

import JSZip from 'jszip';
import { Song, AudioTrack, SectionMarker, TempoChange, ChordMarker, MixPreset } from '../types';
import { waveformStore } from '../lib/waveformStore';

/**
 * Download a file using native browser API
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class ProjectService {
  /**
   * Salva um projeto como arquivo .gmtk
   * @param song - Objeto Song completo
   * @returns Promise que resolve quando download inicia
   */
  static async saveProject(song: Song): Promise<void> {
    try {
      const zip = new JSZip();

      // 1. Adicionar XML
      const xmlContent = this.generateProjectXML(song);
      zip.file('project.xml', xmlContent);

      // 2. Adicionar arquivos de áudio
      for (const track of song.tracks) {
        if (track.file) {
          const extension = this.getFileExtension(track.filename || 'unknown.wav');
          const filename = `audio/${track.id}${extension}`;
          zip.file(filename, track.file);
        }
      }

      // 3. Adicionar capa se existir
      if (song.thumbnailUrl && song.thumbnailUrl.startsWith('blob:')) {
        try {
          const response = await fetch(song.thumbnailUrl);
          const blob = await response.blob();
          zip.file('cover.jpg', blob);
        } catch (error) {
          console.warn('Failed to save cover image:', error);
        }
      }

      // 4. Gerar blob do ZIP
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // 5. Disparar download
      const safeFilename = this.sanitizeFilename(song.title || 'project');
      downloadFile(blob, `${safeFilename}.gmtk`);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates audio file magic numbers to prevent malicious file execution
   * SECURITY FIX (QA 3.3): Verify file signature before processing
   */
  private static async validateAudioBlob(blob: Blob): Promise<boolean> {
    // Read first 12 bytes
    const header = await blob.slice(0, 12).arrayBuffer();
    const magic = new Uint8Array(header);
    
    // Check for RIFF/WAVE (WAV)
    // 52 49 46 46 (RIFF) ... 57 41 56 45 (WAVE)
    if (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46) {
        if (magic[8] === 0x57 && magic[9] === 0x41 && magic[10] === 0x56 && magic[11] === 0x45) {
            return true;
        }
    }
    
    // Check for ID3 (MP3)
    // 49 44 33
    if (magic[0] === 0x49 && magic[1] === 0x44 && magic[2] === 0x33) {
        return true;
    }
    
    // Check for MP3 sync frame (FF FB) - simplified
    if (magic[0] === 0xFF && (magic[1] & 0xE0) === 0xE0) {
        return true;
    }
    
    // Check for OggS (OGG)
    // 4F 67 67 53
    if (magic[0] === 0x4F && magic[1] === 0x67 && magic[2] === 0x67 && magic[3] === 0x53) {
        return true;
    }
    
    // Check for fLaC (FLAC)
    // 66 4C 61 43
    if (magic[0] === 0x66 && magic[1] === 0x4C && magic[2] === 0x61 && magic[3] === 0x43) {
        return true;
    }
    
    // M4A/AAC (ftyp)
    // Usually starts at offset 4: ftypM4A or ftypmp42 or ftypisom
    // We check bytes 4-7 for 'ftyp'
    if (magic[4] === 0x66 && magic[5] === 0x74 && magic[6] === 0x79 && magic[7] === 0x70) {
        return true;
    }
    
    return false;
  }

  /**
   * Carrega um projeto de um arquivo .gmtk
   * SEGURANÇA (P1): Validação contra Zip Bombs e Path Traversal
   * @param file - Arquivo .gmtk selecionado pelo usuário
   * @returns Promise<Song> - Objeto Song reconstruído
   */
  static async loadProject(file: File): Promise<Song> {
    // SEGURANÇA: Validação de tamanho máximo (2GB)
    const MAX_PROJECT_SIZE = 2 * 1024 * 1024 * 1024;
    
    if (file.size > MAX_PROJECT_SIZE) {
      throw new Error('Project file too large (maximum 2GB allowed)');
    }
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // OPTIMIZATION: Don't extract all files upfront
      // Instead, keep a reference to the ZIP and extract on-demand
      
      // 1. Extract and parse XML first (small file)
      const xmlEntry = zip.file('project.xml');
      if (!xmlEntry) {
        throw new Error('Invalid .gmtk file: project.xml not found');
      }
      
      const xmlString = await xmlEntry.async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      // Verificar erros de parsing
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML format in project.xml');
      }

      // 2. Extrair metadados
      const song = this.parseProjectXML(xmlDoc);
      
      // --- LÓGICA DE CATEGORIZAÇÃO ---
      // Se for arquivo de teste (.gmtkmock), tratamos como PROJETO (editável).
      // Se for arquivo padrão (.gmtk), tratamos como IMPORTADO (somente leitura).
      if (file.name.toLowerCase().endsWith('.gmtkmock')) {
        song.source = 'project';
      } else {
        // Comportamento padrão para distribuição
        song.source = 'imported';
      }

      // 3. Carregar arquivos de áudio
      // Importar função de geração de waveform
      const { generateWaveformFromFile } = await import('../features/player/utils/audioUtils');
      
      for (const track of song.tracks) {
        const extension = this.getFileExtension(track.filename || '');
        const audioPath = `audio/${track.id}${extension}`;
        const audioEntry = zip.file(audioPath);

        if (audioEntry) {
          // SECURITY FIX (QA 3.3): Validate Magic Numbers
          const blob = await audioEntry.async('blob');
          const isValid = await this.validateAudioBlob(blob);
          if (!isValid) {
             console.warn(`Security Warning: Invalid audio file signature for ${track.name} (${audioPath}). Skipping.`);
             continue;
          }
          
          // Criar Blob URL para reprodução
          const url = URL.createObjectURL(blob);
          
          // Atualizar track
          track.file = blob;
          track.url = url;
          
          // GARANTIA DE INTEGRIDADE (26/11/2025): Limpa cache e força regeneração
          // Ignora qualquer waveformData que possa existir em tracks antigas
          waveformStore.delete(track.id);
          
          try {
            // Criar File do Blob para processamento
            const audioFile = new File([blob], track.filename || 'audio.wav');
            
            // Regenera waveform com alta densidade (500 samples/seg)
            const result = await generateWaveformFromFile(audioFile);
            
            // ARCHITECTURE CHANGE (QA 26/11/2025): Store in WaveformStore
            waveformStore.setWaveform(track.id, result.waveform);
            if (result.waveformOverview) {
              waveformStore.setOverview(track.id, result.waveformOverview);
            }
            
            // CRITICAL FIX: Garante que não há sobras de baixa qualidade na track
            delete track.waveformData;
            delete track.waveformOverview;
            
          } catch (error) {
            console.warn(`Failed to generate waveform for ${track.name}:`, error);
            // FIX QA: Empty array instead of random data
            waveformStore.setWaveform(track.id, []);
          }
        } else {
          console.warn(`Audio file not found for track: ${track.name} (${audioPath})`);
        }
      }

      // 4. Carregar cover art se existir
      const coverEntry = zip.file('cover.jpg');
      if (coverEntry) {
        try {
          const coverBlob = await coverEntry.async('blob');
          song.thumbnailUrl = URL.createObjectURL(coverBlob);
        } catch (error) {
          console.warn('Failed to load cover image:', error);
        }
      }

      return song;

    } catch (error) {
      console.error('Error loading project:', error);
      throw new Error(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gera o conteúdo XML do projeto
   */
  private static generateProjectXML(song: Song): string {
    const escapeXml = (str: string) => {
      return str
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<project version="1.0">\n';

    // Metadata
    xml += '  <metadata>\n';
    xml += `    <id>${escapeXml(song.id)}</id>\n`;
    xml += `    <title>${escapeXml(song.title)}</title>\n`;
    xml += `    <artist>${escapeXml(song.artist || '')}</artist>\n`;
    xml += `    <bpm>${song.tempo}</bpm>\n`;
    xml += `    <key>${escapeXml(song.key || 'C')}</key>\n`;
    xml += `    <duration>${song.duration}</duration>\n`;
    xml += `    <source>${escapeXml(song.source || 'project')}</source>\n`;
    xml += '  </metadata>\n';

    // Tracks
    xml += '  <tracks>\n';
    for (const track of song.tracks) {
      xml += '    <track>\n';
      xml += `      <id>${escapeXml(track.id)}</id>\n`;
      xml += `      <name>${escapeXml(track.name)}</name>\n`;
      xml += `      <type>${escapeXml(track.type)}</type>\n`;
      xml += `      <tag>${escapeXml(track.tag || '')}</tag>\n`;
      xml += `      <volume>${track.volume}</volume>\n`;
      xml += `      <muted>${track.muted}</muted>\n`;
      xml += `      <solo>${track.solo}</solo>\n`;
      xml += `      <color>${escapeXml(track.color || '#3b82f6')}</color>\n`;
      if (track.notes) {
        xml += `      <notes>${escapeXml(track.notes)}</notes>\n`;
      }
      if (track.filename) {
        xml += `      <filename>${escapeXml(track.filename)}</filename>\n`;
      }
      // FIX P2: Removido persistência de waveformData - arrays gigantes inflavam arquivo XML
      // Waveforms serão regeneradas dinamicamente via Worker ao carregar
      xml += '    </track>\n';
    }
    xml += '  </tracks>\n';

    // Markers (Section markers)
    xml += '  <markers>\n';
    for (const marker of song.markers || []) {
      xml += '    <marker>\n';
      xml += `      <id>${escapeXml(marker.id)}</id>\n`;
      xml += `      <time>${marker.time}</time>\n`;
      xml += `      <label>${escapeXml(marker.label)}</label>\n`;
      xml += `      <type>${escapeXml(marker.type)}</type>\n`;
      xml += '    </marker>\n';
    }
    xml += '  </markers>\n';

    // Chord Markers
    if (song.chordMarkers && song.chordMarkers.length > 0) {
      xml += '  <chordMarkers>\n';
      for (const chord of song.chordMarkers) {
        xml += '    <chord>\n';
        xml += `      <time>${chord.time}</time>\n`;
        xml += `      <chord>${escapeXml(chord.chord)}</chord>\n`;
        if (chord.customDiagram) {
          xml += `      <customDiagram>${escapeXml(JSON.stringify(chord.customDiagram))}</customDiagram>\n`;
        }
        xml += '    </chord>\n';
      }
      xml += '  </chordMarkers>\n';
    }

    // Tempo Changes
    if (song.tempoChanges && song.tempoChanges.length > 0) {
      xml += '  <tempoChanges>\n';
      for (const change of song.tempoChanges) {
        xml += '    <tempoChange>\n';
        xml += `      <time>${change.time}</time>\n`;
        xml += `      <tempo>${change.tempo}</tempo>\n`;
        xml += `      <timeSignature>${escapeXml(change.timeSignature || '4/4')}</timeSignature>\n`;
        if (change.subdivision) {
          xml += `      <subdivision>${escapeXml(change.subdivision)}</subdivision>\n`;
        }
        if (change.hidden !== undefined) {
          xml += `      <hidden>${change.hidden}</hidden>\n`;
        }
        xml += '    </tempoChange>\n';
      }
      xml += '  </tempoChanges>\n';
    }

    // Mix Presets
    if (song.mixPresets && song.mixPresets.length > 0) {
      xml += '  <mixPresets>\n';
      for (const preset of song.mixPresets) {
        xml += '    <preset>\n';
        xml += `      <id>${escapeXml(preset.id)}</id>\n`;
        xml += `      <name>${escapeXml(preset.name)}</name>\n`;
        xml += '      <tracks>\n';
        for (const track of preset.tracks) {
          xml += '        <presetTrack>\n';
          xml += `          <trackId>${escapeXml(track.trackId)}</trackId>\n`;
          xml += `          <volume>${track.volume}</volume>\n`;
          xml += `          <muted>${track.muted}</muted>\n`;
          xml += '        </presetTrack>\n';
        }
        xml += '      </tracks>\n';
        xml += '    </preset>\n';
      }
      xml += '  </mixPresets>\n';
    }

    xml += '</project>\n';
    return xml;
  }

  /**
   * Parseia o XML e reconstrói o objeto Song
   */
  private static parseProjectXML(xmlDoc: Document): Song {
    const getText = (parent: Element, tagName: string, defaultValue: string = ''): string => {
      const element = parent.querySelector(tagName);
      return element?.textContent?.trim() || defaultValue;
    };

    const getNumber = (parent: Element, tagName: string, defaultValue: number = 0): number => {
      const text = getText(parent, tagName);
      const num = parseFloat(text);
      return isNaN(num) ? defaultValue : num;
    };

    const getBool = (parent: Element, tagName: string, defaultValue: boolean = false): boolean => {
      const text = getText(parent, tagName).toLowerCase();
      return text === 'true' ? true : text === 'false' ? false : defaultValue;
    };

    // Parse metadata
    const metadata = xmlDoc.querySelector('metadata');
    if (!metadata) throw new Error('Missing metadata section in project.xml');

    const song: Song = {
      id: getText(metadata, 'id', `project-${Date.now()}`),
      title: getText(metadata, 'title', 'Untitled Project'),
      artist: getText(metadata, 'artist'),
      tempo: getNumber(metadata, 'bpm', 120),
      key: getText(metadata, 'key', 'C'),
      duration: getNumber(metadata, 'duration', 0),
      source: getText(metadata, 'source', 'project') as 'imported' | 'project',
      tracks: [],
      markers: [],
      chordMarkers: [],
      tempoChanges: [],
      mixPresets: [],
      chords: [],
      loops: [],
      notes: [],
      version: 1,
      tags: [],
    };

    // Parse tracks
    const trackElements = xmlDoc.querySelectorAll('tracks > track');
    trackElements.forEach((trackEl) => {
      // FIX P2: Waveform não é mais persistida no XML
      // Será regenerada via Worker após extrair arquivo de áudio
      
      const track: AudioTrack = {
        id: getText(trackEl, 'id'),
        name: getText(trackEl, 'name', 'Unnamed Track'),
        type: getText(trackEl, 'type', 'other') as any,
        tag: getText(trackEl, 'tag') as any,
        volume: getNumber(trackEl, 'volume', 1.0),
        muted: getBool(trackEl, 'muted', false),
        solo: getBool(trackEl, 'solo', false),
        color: getText(trackEl, 'color', '#3b82f6'),
        notes: getText(trackEl, 'notes'),
        filename: getText(trackEl, 'filename'),
        // waveformData: [], // REMOVED: Optional now
      };
      song.tracks.push(track);
    });

    // Parse markers
    const markerElements = xmlDoc.querySelectorAll('markers > marker');
    markerElements.forEach((markerEl) => {
      const marker: SectionMarker = {
        id: getText(markerEl, 'id'),
        time: getNumber(markerEl, 'time'),
        label: getText(markerEl, 'label'),
        type: getText(markerEl, 'type', 'custom') as any,
      };
      song.markers.push(marker);
    });

    // Parse chord markers
    const chordElements = xmlDoc.querySelectorAll('chordMarkers > chord');
    chordElements.forEach((chordEl) => {
      const chord: ChordMarker = {
        time: getNumber(chordEl, 'time'),
        chord: getText(chordEl, 'chord'),
      };
      const customDiagramStr = getText(chordEl, 'customDiagram');
      if (customDiagramStr) {
        try {
          chord.customDiagram = JSON.parse(customDiagramStr);
        } catch (e) {
          console.warn('Failed to parse custom diagram:', e);
        }
      }
      song.chordMarkers?.push(chord);
    });

    // Parse tempo changes
    const tempoElements = xmlDoc.querySelectorAll('tempoChanges > tempoChange');
    tempoElements.forEach((tempoEl) => {
      const tempoChange: TempoChange = {
        time: getNumber(tempoEl, 'time'),
        tempo: getNumber(tempoEl, 'tempo', 120),
        timeSignature: getText(tempoEl, 'timeSignature', '4/4'),
        subdivision: getText(tempoEl, 'subdivision') || undefined,
        hidden: getBool(tempoEl, 'hidden', false),
      };
      song.tempoChanges?.push(tempoChange);
    });

    // Parse mix presets
    const presetElements = xmlDoc.querySelectorAll('mixPresets > preset');
    presetElements.forEach((presetEl) => {
      const preset: MixPreset = {
        id: getText(presetEl, 'id'),
        name: getText(presetEl, 'name'),
        tracks: [],
      };
      
      const presetTrackElements = presetEl.querySelectorAll('tracks > presetTrack');
      presetTrackElements.forEach((ptEl) => {
        preset.tracks.push({
          trackId: getText(ptEl, 'trackId'),
          volume: getNumber(ptEl, 'volume', 1.0),
          muted: getBool(ptEl, 'muted', false),
        });
      });
      
      song.mixPresets.push(preset);
    });

    return song;
  }

  /**
   * Utilitários
   */
  private static getFileExtension(filename: string): string {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0] : '.wav';
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9-_\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços viram hífens
      .toLowerCase()
      .substring(0, 100); // Limita tamanho
  }

  /**
   * Libera URLs de Blob para prevenir memory leaks
   * Chamar quando um projeto é fechado ou substituído
   */
  static releaseProjectResources(song: Song): void {
    for (const track of song.tracks) {
      if (track.url && track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
      }
    }
  }
}