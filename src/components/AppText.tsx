import { Text as RNText, type TextProps } from 'react-native';

import { theme } from '@/theme/theme';

type Variant = keyof typeof theme.typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

/**
 * Caps how far each variant scales with the OS "larger text" setting so big
 * dynamic type stays readable without breaking layouts (docs/06 §11). Headings
 * scale less (they're already large); body/captions scale more for readability.
 */
const MAX_FONT_SCALE: Record<Variant, number> = {
  display: 1.3,
  h1: 1.3,
  h2: 1.35,
  h3: 1.4,
  body: 1.6,
  bodyStrong: 1.6,
  caption: 1.5,
  button: 1.3,
};

/**
 * Small typography helper so screens apply the type scale + ink colors
 * consistently without repeating styles. (docs/06 §3)
 */
export function AppText({ variant = 'body', color = theme.color.ink.body, center, style, ...rest }: Props) {
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE[variant]}
      {...rest}
      style={[theme.typography[variant], { color }, center && { textAlign: 'center' }, style]}
    />
  );
}
