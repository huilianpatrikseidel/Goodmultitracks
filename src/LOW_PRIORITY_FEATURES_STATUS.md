# GoodMultitracks - Status de Features de Baixa Prioridade

## ✅ Features de Baixa Prioridade Implementadas

### 1. ✅ Chord Playback (COMPLETO)
**Status**: JÁ ESTAVA IMPLEMENTADO  
**Local**: `/components/ChordDiagram.tsx`

- Botão "Play Chord" em cada diagrama (Guitar, Piano, Ukulele)
- Integração completa com `/lib/chordPlayback.ts`
- Funções `playChord()`, `playGuitarChord()`, `playUkuleleChord()` funcionando
- Web Audio API para reprodução de acordes
- ADSR envelope para som natural

### 2. ✅ Section Loop on Click (COMPLETO)  
**Status**: RECÉM-IMPLEMENTADO  
**Local**: `/components/PerformanceMode.tsx`

**Implementações**:
- Ao clicar em uma section tag, automaticamente cria um loop dessa seção
- Loop start = tempo da seção clicada
- Loop end = tempo da próxima seção (ou duração da música)
- Indicador visual de loop ativo com botão "Loop: XX:XX - XX:XX"
- Botão com ícone Repeat para desativar o loop
- Playback automático inicia na seção clicada
- Metronome reseta corretamente quando volta ao início do loop

**Benefícios**:
- Feature essencial para praticar seções específicas
- UX intuitivo - um clique para loop de seção
- Visual feedback claro do loop ativo
- Perfeito para rehearsal e performance

---

## 📋 Features de Baixa Prioridade Pendentes

### 3. ❌ Track Pinning on Preset Load
**Prioridade**: Média-Baixa  
**Complexidade**: Média

**Descrição**: Quando carregar um preset de mix, automaticamente mover a track do instrumento principal do usuário para o topo.

**Requisitos**:
- Precisa integrar com User preferences (mainInstrument)
- Reordenar array de tracks após load
- Manter configuração de mix do preset

**Bloqueio**: Mix Presets Manager precisa estar integrado no DAWPlayer primeiro

---

### 4. ❌ Tempo Curves (Rallentando/Accelerando)
**Prioridade**: Baixa  
**Complexidade**: Alta

**Descrição**: Implementar mudanças graduais de tempo (rallentando/accelerando)

**Estrutura já existe**:
```typescript
curve?: {
  type: 'linear' | 'exponential';
  targetTempo: number;
  targetTime: number;
}
```

**Tarefas necessárias**:
1. UI no TimelineEditorDialog para configurar curves
2. Campos: Target Tempo, Target Time, Curve Type
3. Visualização da curva no Timeline
4. Lógica de playback que interpola tempo gradualmente
5. Cálculo correto de posição de playhead durante curva

**Desafios**:
- Interpolação de tempo em tempo real durante playback
- Visualização clara da curva na timeline
- Precisão de sincronização

---

### 5. ❌ Time Warp Tool
**Prioridade**: Baixa  
**Complexidade**: Muito Alta

**Descrição**: Ferramenta avançada para "warpar" o tempo e sincronizar com áudio que não está perfeitamente no grid.

**Funcionalidade planejada**:
- Arrastar e fixar pontos temporais ("warp markers")
- Ajustar BPM dinamicamente para sincronizar com áudio
- Auto-hide de tempo markers importados
- Interface drag-and-drop para warp points
- Cálculo automático de BPM entre warp points

**Tarefas**:
1. UI para adicionar/remover warp markers
2. Drag handles na timeline para ajustar posição
3. Cálculo de BPM variável entre markers
4. Atualização de TempoChanges baseado em warp
5. Preview visual de grid ajustado

**Uso**: Similar ao Elastic Audio (Pro Tools) ou Flex Time (Logic Pro)

---

### 6. ❌ Advanced Metronome Logic
**Prioridade**: Baixa  
**Complexidade**: Média-Alta

**Descrição**: Lógica avançada para metrônomo em compassos compostos e irregulares

**Funcionalidades**:
1. **Compound Time Logic**:
   - 6/8, 9/8, 12/8: Click apenas em beats principais (não em cada subdivisão)
   - Ex: 6/8 = 2 clicks por compasso (não 6)

2. **Irregular Time Signatures**:
   - Suporte para subdivisões customizadas (ex: 5/8 = 2+3 ou 3+2)
   - UI para definir agrupamento de beats
   - Campo `subdivision` no TempoChange (ex: "2+3")

3. **Metronome Sound Settings**:
   - Downbeat frequency (Hz)
   - Beat frequency (Hz)  
   - Subdivision frequency (Hz)
   - Checkbox "Mark Subdivisions"

**Tarefas**:
1. Adicionar UI no TimelineEditorDialog para subdivisões
2. Input para padrões irregulares (ex: "2+3+2" para 7/8)
3. Lógica de click baseada em subdivisões
4. Settings para frequências customizadas
5. User preferences para metronome settings

**Estrutura parcialmente implementada**:
```typescript
preferences: {
  metronomeSettings?: {
    downbeatFreq?: number;
    beatFreq?: number;
    subdivisionFreq?: number;
    markSubdivisions?: boolean;
  }
}
```

---

### 7. ❌ Irregular Time Signature UI
**Prioridade**: Baixa  
**Complexidade**: Média

**Descrição**: Interface dedicada para definir subdivisões de compassos irregulares

**Features planejadas**:
- Input field para padrões (ex: "3+2+2" para 7/8)
- Validação que soma bate com numerador
- Presets comuns para compassos irregulares:
  - 5/8: "2+3", "3+2"
  - 7/8: "2+2+3", "3+2+2", "2+3+2"
  - 11/8: "3+3+3+2", etc.
- Preview visual de agrupamento
- Integração com metronome logic

**Local de implementação**: `/components/TimelineEditorDialog.tsx`

---

## 🎯 Features Adicionais Sugeridas (Não na Lista Original)

### 8. ⭐ First Time Setup Integration
**Prioridade**: Média  
**Complexidade**: Baixa

**Descrição**: Mostrar FirstTimeSetup automaticamente para novos usuários

**Implementação**:
- Verificar localStorage para flag "has_completed_setup"
- Mostrar FirstTimeSetup dialog no primeiro acesso
- Salvar preferências de instrumentos selecionados
- Usar mainInstrument para Track Pinning futuro

**Tarefas**:
1. Adicionar estado no App.tsx para show setup
2. Check localStorage no mount
3. Pass callbacks para salvar preferences
4. Set flag após conclusão

---

### 9. ⭐ Hide Tempo Markers in Player Mode  
**Prioridade**: Baixa  
**Complexidade**: Muito Baixa

**Descrição**: No modo Player (imported songs), ocultar tempo markers automáticos

**Implementação**:
- Adicionar campo `hidden` no TempoChange
- No DAWPlayer, filtrar tempoChanges com `hidden === true` se não estiver em editMode
- UI no TimelineEditorDialog para toggle "Hide in Player Mode"

---

### 10. ⭐ Advanced Transpose UI  
**Prioridade**: Baixa  
**Complexidade**: Baixa-Média

**Descrição**: Popup avançado para transpose com capo e indicação de tonalidade

**Features**:
- Transpose em semitons (-12 a +12)
- Capo position (0-12)
- Indicação de tonalidade resultante
- Chord ruler responde a mudanças

**UI**: Popover no PlaybackControls com:
- Slider para transpose
- Slider para capo
- Display: "Key: C → D" (exemplo)
- Botão Reset

---

## 📊 Resumo de Progresso

### Implementadas Nesta Sessão: 1/7
- ✅ Section Loop on Click

### Já Existiam: 1/7
- ✅ Chord Playback

### Pendentes: 5/7
- ❌ Track Pinning on Preset Load
- ❌ Tempo Curves
- ❌ Time Warp Tool
- ❌ Advanced Metronome Logic
- ❌ Irregular Time Signature UI

### Sugeridas Adicionais: 3
- ⭐ First Time Setup Integration (quick win)
- ⭐ Hide Tempo Markers (quick win)
- ⭐ Advanced Transpose UI (quick win)

---

## 🎖️ Recomendações de Implementação

### Quick Wins (Alta Prioridade, Baixa Complexidade):
1. **First Time Setup Integration** - 30 min
2. **Hide Tempo Markers** - 20 min
3. **Advanced Transpose UI** - 45 min

### Medium Effort (Média Prioridade):
4. **Irregular Time Signature UI** - 2-3h
5. **Advanced Metronome Logic** - 3-4h
6. **Track Pinning on Preset Load** - 1-2h (após Mix Presets)

### High Effort (Baixa Prioridade):
7. **Tempo Curves** - 5-8h (UI + lógica + visualização)
8. **Time Warp Tool** - 10-15h (ferramenta complexa)

---

## 💡 Notas Técnicas

### Section Loop Implementation
**Arquivos modificados**: `/components/PerformanceMode.tsx`

**Estados adicionados**:
```typescript
const [loopStart, setLoopStart] = useState<number | null>(null);
const [loopEnd, setLoopEnd] = useState<number | null>(null);
```

**Lógica de loop**:
```typescript
// Check loop boundaries
if (loopEnd !== null && newTime >= loopEnd) {
  lastBeatRef.current = 0;
  return loopStart || 0;
}
```

**UI de loop ativo**:
- Badge com tempo de início e fim
- Ícone Repeat
- Click para desativar
- Cor verde para indicar estado ativo

---

**Última Atualização**: Implementação de Section Loop on Click  
**Progresso Geral de Baixa Prioridade**: 2/7 completas (29%)  
**Progresso Geral do Projeto**: ~82% (incluindo esta feature)
