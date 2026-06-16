import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { isRenderableImage } from '@/lib/image';
import {
  BRIGHTNESS_LEVELS,
  PAPER_SIZES,
  type PreviewSource,
  type ProjectorState,
} from '@/lib/projector';
import { theme } from '@/theme/theme';

import { AppText } from './AppText';

/**
 * The "paper" surface a projector would shine art onto (docs/02 §7). Renders the
 * chosen source centered on a paper-aspect canvas, with rotate + zoom transforms,
 * a brightness overlay, and a high-contrast mode that prefers the line-art /
 * trace version. Demo/SVG sources fall back to a branded placeholder.
 */
type Props = {
  source: PreviewSource;
  state: ProjectorState;
};

export function ProjectorCanvas({ source, state }: Props) {
  const paper = PAPER_SIZES[state.paperIndex] ?? PAPER_SIZES[0];
  const brightness = BRIGHTNESS_LEVELS[state.brightnessIndex] ?? BRIGHTNESS_LEVELS[1];

  // High-contrast prefers the outline/trace image when it's loadable.
  const preferOutline = state.highContrast && isRenderableImage(source.outlineUrl);
  const effectiveUrl = preferOutline ? source.outlineUrl : source.url;
  const showImage = isRenderableImage(effectiveUrl);

  const transform = [{ rotate: `${state.rotation}deg` }, { scale: state.zoom }];

  return (
    <View style={styles.stage}>
      <View style={[styles.paper, { aspectRatio: paper.ratio }]}>
        <View style={[styles.inner, { transform }]}>
          {showImage ? (
            <Image
              source={{ uri: effectiveUrl }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel={`${source.title} preview`}
            />
          ) : (
            <Placeholder source={source} highContrast={state.highContrast} />
          )}
        </View>

        {brightness.overlay !== 'transparent' ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: brightness.overlay }]} />
        ) : null}
      </View>
    </View>
  );
}

function Placeholder({ source, highContrast }: { source: PreviewSource; highContrast: boolean }) {
  if (highContrast) {
    return (
      <View style={[styles.fill, styles.outlineBg]}>
        <View style={styles.outlineRing} />
        <AppText style={[styles.glyph, styles.glyphInk]}>{source.emoji}</AppText>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={[source.accent, `${source.accent}55`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      <AppText style={styles.glyph}>{source.emoji}</AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.space.md },
  paper: {
    height: '92%',
    maxWidth: '100%',
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.card,
    overflow: 'hidden',
    ...theme.shadow.e2,
  },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  fill: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  outlineBg: { backgroundColor: theme.color.surface.card },
  outlineRing: {
    position: 'absolute',
    width: '52%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: theme.color.ink.strong,
  },
  glyph: { fontSize: 120 },
  glyphInk: { color: theme.color.ink.strong },
});
