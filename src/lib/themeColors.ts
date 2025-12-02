/**
 * Theme-aware color utilities
 * Use these instead of hardcoded hex colors to support light/dark themes
 */

// CSS Variables mapping (defined in globals.css)
export const themeColors = {
  // Backgrounds
  background: 'hsl(var(--background))',
  card: 'hsl(var(--card))',
  popover: 'hsl(var(--popover))',
  
  // Borders
  border: 'hsl(var(--border))',
  muted: 'hsl(var(--muted))',
  
  // Text
  foreground: 'hsl(var(--foreground))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  
  // Accents
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  destructive: 'hsl(var(--destructive))',
  
  // Specific ruler colors
  ruler: {
    background: '#171717', // Dark neutral
    border: '#3A3A3A', // Medium dark
    text: '#9E9E9E', // Gray
    beat: '#2B2B2B', // Darker gray for beats
    compound: '#8B5CF6', // Purple for compound time
    irregular: '#F59E0B', // Amber for irregular time
  }
} as const;

// Tailwind class mappings for common patterns
export const themeClasses = {
  rulerBackground: 'bg-neutral-900',
  rulerBorder: 'border-neutral-700',
  rulerText: 'text-neutral-400',
  beatBorder: 'border-neutral-800',
  compoundBorder: 'border-purple-500',
  compoundBg: 'bg-purple-500/5',
  compoundText: 'text-purple-500',
  irregularBorder: 'border-amber-500',
  irregularBg: 'bg-amber-500/5',
  irregularText: 'text-amber-500',
} as const;

/**
 * Convert hex color to rgba with alpha
 * @deprecated Use Tailwind utilities like bg-blue-500/30 instead
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}