import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { isRenderableImage } from '@/lib/image';
import type { VariantKey } from '@/services/upload';
import { theme } from '@/theme/theme';

import { AppText } from './AppText';

/**
 * A single photo-transform variant (docs/06 §6): square preview + style label +
 * a check overlay when selected. Real (loadable) variants render via expo-image;
 * demo/SVG variants render a branded, style-specific placeholder.
 */
type Props = {
  url?: string | null;
  styleKey: VariantKey;
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function VariantCard({ url, styleKey, label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      style={({ pressed }) => [styles.card, selected && styles.selectedCard, pressed && styles.pressed]}
    >
      <View style={styles.preview}>
        {isRenderableImage(url) ? (
          <Image source={{ uri: url }} style={styles.image} contentFit="cover" accessibilityLabel={label} />
        ) : (
          <VariantPlaceholder styleKey={styleKey} />
        )}
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark-circle" size={28} color={theme.color.brand.violet} />
          </View>
        ) : null}
      </View>
      <AppText variant="caption" color={selected ? theme.color.brand.violetDeep : theme.color.ink.body} center style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Deterministic, style-specific placeholder for demo variants. */
function VariantPlaceholder({ styleKey }: { styleKey: VariantKey }) {
  if (styleKey === 'cartoon' || styleKey === 'original') {
    return (
      <LinearGradient
        colors={styleKey === 'cartoon' ? ['#FFC93C', '#FF7E6B'] : ['#7C5CFC', '#B79CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <AppText style={styles.glyph}>{styleKey === 'cartoon' ? '🎨' : '🖼️'}</AppText>
      </LinearGradient>
    );
  }
  // line_art / sketch / coloring_page → outline look on white.
  const stroke = styleKey === 'sketch' ? theme.color.ink.muted : theme.color.ink.strong;
  return (
    <View style={[styles.fill, styles.outlineBg]}>
      <View style={[styles.outlineCircle, { borderColor: stroke }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: theme.radius.lg, overflow: 'hidden' },
  selectedCard: { borderWidth: 2.5, borderColor: theme.color.brand.violet },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  preview: { aspectRatio: 1, borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.color.bg.subtle },
  image: { width: '100%', height: '100%' },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  outlineBg: { backgroundColor: theme.color.surface.card },
  outlineCircle: { width: '55%', aspectRatio: 1, borderRadius: 999, borderWidth: 5 },
  glyph: { fontSize: 56 },
  check: {
    position: 'absolute',
    top: theme.space.sm,
    right: theme.space.sm,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.pill,
  },
  label: { paddingVertical: theme.space.sm },
});
