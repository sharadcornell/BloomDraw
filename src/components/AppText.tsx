import { Text as RNText, type TextProps } from 'react-native';

import { theme } from '@/theme/theme';

type Variant = keyof typeof theme.typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

/**
 * Small typography helper so screens apply the type scale + ink colors
 * consistently without repeating styles. (docs/06 §3)
 */
export function AppText({ variant = 'body', color = theme.color.ink.body, center, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[theme.typography[variant], { color }, center && { textAlign: 'center' }, style]}
    />
  );
}
