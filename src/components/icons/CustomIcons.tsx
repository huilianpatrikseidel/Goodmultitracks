// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import React from 'react';

// Ícone de Metrônomo - representa um metrônomo mecânico clássico
export const MetronomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Base do metrônomo */}
    <path d="M6 20h12l-2-12H8l-2 12z" />
    {/* Linha do pêndulo */}
    <line x1="12" y1="8" x2="14" y2="13" />
    {/* Peso do pêndulo */}
    <circle cx="14.5" cy="14" r="1.5" />
    {/* Base inferior */}
    <path d="M5 20h14" />
  </svg>
);

// Ícone de Workspace/Modo de Trabalho - representa diferentes modos de visualização
export const WorkspaceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Janela principal */}
    <rect x="3" y="3" width="18" height="18" rx="2" />
    {/* Divisórias */}
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="3" y1="9" x2="9" y2="9" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

// Ícone de Mix Preset - representa faders de mixer em posições salvas
export const MixPresetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Fader 1 */}
    <line x1="6" y1="4" x2="6" y2="20" />
    <rect x="4" y="7" width="4" height="3" rx="1" fill="currentColor" />
    
    {/* Fader 2 */}
    <line x1="12" y1="4" x2="12" y2="20" />
    <rect x="10" y="11" width="4" height="3" rx="1" fill="currentColor" />
    
    {/* Fader 3 */}
    <line x1="18" y1="4" x2="18" y2="20" />
    <rect x="16" y="9" width="4" height="3" rx="1" fill="currentColor" />
  </svg>
);

// Ícone de Playback Settings - representa controles de velocidade e pitch
export const PlaybackSettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Círculo base tipo velocímetro */}
    <path d="M12 2a10 10 0 0 1 10 10" />
    <path d="M12 2a10 10 0 0 0-10 10" />
    <path d="M2 12a10 10 0 0 0 10 10" />
    <path d="M22 12a10 10 0 0 1-10 10" />
    {/* Ponteiro */}
    <path d="M12 12l4-4" />
    {/* Centro */}
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    {/* Marcadores */}
    <line x1="12" y1="4" x2="12" y2="5" />
    <line x1="19" y1="12" x2="18" y2="12" />
    <line x1="12" y1="20" x2="12" y2="19" />
    <line x1="5" y1="12" x2="6" y2="12" />
  </svg>
);

// Ícone de Snap Grid - linhas de grade verticais com magnetismo
export const SnapGridIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Linhas verticais da grade */}
    <line x1="6" y1="4" x2="6" y2="20" strokeWidth="1.5" />
    <line x1="12" y1="4" x2="12" y2="20" strokeWidth="2" />
    <line x1="18" y1="4" x2="18" y2="20" strokeWidth="1.5" />
    {/* Seta horizontal com ponto representando snap/magnetismo */}
    <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    <path d="M10.5 12h4.5" />
    <path d="M13 10l2 2-2 2" />
  </svg>
);

// Ícone de Loop - círculo com setas representando repetição
export const LoopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Arco superior com seta */}
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11v-1a9 9 0 0 1 9-9h9" />
    {/* Arco inferior com seta */}
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v1a9 9 0 0 1-9 9H3" />
  </svg>
);

// Ícone de Player Mode - play button dentro de um círculo
export const PlayerModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
  </svg>
);

// Ícone de Marker Editor - marcador de timeline com lápis
export const MarkerEditorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Marcador/Flag */}
    <path d="M4 4v16" strokeWidth="2.5" />
    <path d="M4 4h12l-2 4 2 4H4" />
    {/* Lápis pequeno */}
    <path d="M17 15l2-2 2 2-3 3-2-2z" />
    <path d="M16 18l-2 2" />
  </svg>
);

// Ícone de Warp Grid - grade de tempo com distorção
export const WarpGridIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Grade com linha ondulada representando warp */}
    <line x1="4" y1="7" x2="20" y2="7" strokeWidth="1.5" />
    <path d="M4 12 Q 12 9, 20 12" strokeWidth="2" />
    <line x1="4" y1="17" x2="20" y2="17" strokeWidth="1.5" />
    {/* Linhas verticais */}
    <line x1="8" y1="5" x2="8" y2="19" strokeWidth="1" opacity="0.5" />
    <line x1="12" y1="5" x2="12" y2="19" strokeWidth="1" opacity="0.5" />
    <line x1="16" y1="5" x2="16" y2="19" strokeWidth="1" opacity="0.5" />
    {/* Pontos de controle */}
    <circle cx="12" cy="9" r="2" fill="currentColor" />
  </svg>
);

// Ícone de View Settings - representa configurações de visualização com réguas/camadas
export const ViewSettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Camadas/réguas empilhadas */}
    <rect x="3" y="4" width="18" height="3" rx="1" />
    <rect x="3" y="10" width="18" height="3" rx="1" />
    <rect x="3" y="16" width="18" height="3" rx="1" />
    {/* Indicadores de visibilidade */}
    <circle cx="8" cy="5.5" r="0.8" fill="currentColor" />
    <circle cx="8" cy="11.5" r="0.8" fill="currentColor" />
    <circle cx="8" cy="17.5" r="0.8" fill="currentColor" />
  </svg>
);

