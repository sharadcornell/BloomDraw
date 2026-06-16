import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, BackHeader, Card, Chip, ProjectorCanvas, Screen } from '@/components';
import { strings } from '@/lib/strings';
import {
  BRIGHTNESS_LEVELS,
  PAPER_SIZES,
  ZOOM_STEP,
  clampZoom,
  cycleIndex,
  defaultPreview,
  resetProjectorState,
  rotateBy,
  type ProjectorState,
} from '@/lib/projector';
import { useProjectorStore } from '@/state';
import { theme } from '@/theme/theme';

/** Projector Preview (docs/02 §7) — project any art onto a paper-ready canvas. */
export default function ProjectorScreen() {
  // Source is set by the entry screen; fall back to a safe default (never crash).
  const stored = useProjectorStore((s) => s.source);
  const source = stored ?? defaultPreview();
  const [state, setState] = useState<ProjectorState>(resetProjectorState());

  const tap = (next: (s: ProjectorState) => ProjectorState) => {
    Haptics.selectionAsync().catch(() => {});
    setState(next);
  };

  const paperLabel = PAPER_SIZES[state.paperIndex].label;
  const brightnessLabel = BRIGHTNESS_LEVELS[state.brightnessIndex].label;

  return (
    <Screen edges={['top', 'bottom']}>
      <BackHeader
        title={strings.projector.title}
        right={source.demo ? <Chip label={strings.demoMode} emoji="✨" accent={theme.color.brand.violetDeep} /> : null}
      />

      <View style={styles.labelRow}>
        <Chip label={strings.projector.sourceLabels[source.kind]} accent={theme.color.brand.sky} />
        <AppText variant="caption" color={theme.color.ink.muted} numberOfLines={1} style={styles.flex}>
          {source.title}
        </AppText>
      </View>

      <ProjectorCanvas source={source} state={state} />

      <View style={styles.controls}>
        <ControlButton
          icon="refresh"
          label={strings.projector.rotate}
          onPress={() => tap((s) => ({ ...s, rotation: rotateBy(s.rotation) }))}
        />
        <ControlButton
          icon="remove-circle-outline"
          label={strings.projector.zoomOut}
          onPress={() => tap((s) => ({ ...s, zoom: clampZoom(s.zoom - ZOOM_STEP) }))}
        />
        <ControlButton
          icon="add-circle-outline"
          label={strings.projector.zoomIn}
          onPress={() => tap((s) => ({ ...s, zoom: clampZoom(s.zoom + ZOOM_STEP) }))}
        />
        <ControlButton
          icon="sunny-outline"
          label={brightnessLabel}
          onPress={() => tap((s) => ({ ...s, brightnessIndex: cycleIndex(s.brightnessIndex, BRIGHTNESS_LEVELS.length) }))}
        />
        <ControlButton
          icon="contrast-outline"
          label={strings.projector.contrast}
          active={state.highContrast}
          onPress={() => tap((s) => ({ ...s, highContrast: !s.highContrast }))}
        />
        <ControlButton
          icon="document-outline"
          label={paperLabel}
          onPress={() => tap((s) => ({ ...s, paperIndex: cycleIndex(s.paperIndex, PAPER_SIZES.length) }))}
        />
        <ControlButton
          icon="refresh-circle-outline"
          label={strings.projector.reset}
          onPress={() => tap(() => resetProjectorState())}
        />
      </View>

      <Card accent={theme.color.brand.sky}>
        <View style={styles.comingSoon}>
          <AppText variant="h3">📽️</AppText>
          <View style={styles.flex}>
            <AppText variant="bodyStrong" color={theme.color.ink.strong}>
              {strings.projector.comingSoonTitle}
            </AppText>
            <AppText variant="caption" color={theme.color.ink.muted}>
              {strings.projector.comingSoonBody}
            </AppText>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.control, pressed && styles.controlPressed]}
    >
      <View style={[styles.controlIcon, active && styles.controlIconActive]}>
        <Ionicons name={icon} size={24} color={active ? theme.color.ink.onBrand : theme.color.brand.violet} />
      </View>
      <AppText variant="caption" color={theme.color.ink.muted} center numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginTop: theme.space.sm },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.space.sm,
    paddingVertical: theme.space.md,
  },
  control: { alignItems: 'center', gap: theme.space.xs, width: 64 },
  controlPressed: { transform: [{ scale: 0.94 }], opacity: 0.9 },
  controlIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.e1,
  },
  controlIconActive: { backgroundColor: theme.color.brand.violet },
  comingSoon: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
});
