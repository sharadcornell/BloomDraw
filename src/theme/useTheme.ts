import { useWindowDimensions } from 'react-native';

import { theme } from './theme';

/**
 * Theme hook. Returns the static design tokens plus responsive helpers.
 *
 * The theme is static (no runtime theming in V1), so this is a thin hook rather
 * than a context provider — see docs/03 §11 (no over-engineering). `isTablet`
 * drives responsive layouts (2-col phone vs 3–4-col tablet, padding).
 */
export function useTheme() {
  const { width } = useWindowDimensions();
  return {
    ...theme,
    isTablet: width >= theme.breakpoint.tablet,
    width,
  };
}

export type UseTheme = ReturnType<typeof useTheme>;
