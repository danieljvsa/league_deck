import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'compact' | 'medium' | 'expanded';

const BREAKPOINTS = {
  compact: 0,
  medium: 380,
  expanded: 768,
} as const;

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  
  if (width >= BREAKPOINTS.expanded) return 'expanded';
  if (width >= BREAKPOINTS.medium) return 'medium';
  return 'compact';
}

export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'expanded';
}

export function useResponsiveColumns(compact = 1, medium = 2, expanded = 3): number {
  const breakpoint = useBreakpoint();
  
  switch (breakpoint) {
    case 'expanded': return expanded;
    case 'medium': return medium;
    default: return compact;
  }
}

export function useResponsivePadding(): { horizontal: number; vertical: number } {
  const breakpoint = useBreakpoint();
  
  switch (breakpoint) {
    case 'expanded': return { horizontal: 32, vertical: 24 };
    case 'medium': return { horizontal: 24, vertical: 16 };
    default: return { horizontal: 16, vertical: 12 };
  }
}

export function useMaxContentWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, 800);
}
