import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AppText,
  BackHeader,
  Banner,
  Button,
  DemoModeBadge,
  EmptyState,
  Screen,
  VariantCard,
} from '@/components';
import { strings } from '@/lib/strings';
import { previewFromUpload } from '@/lib/projector';
import {
  buildUploadRecentInput,
  variantUrl,
  VARIANT_KEYS,
  type UploadResultData,
  type VariantKey,
} from '@/services/upload';
import { recents, useProjectorStore, useRecentsStore, useUploadStore } from '@/state';
import type { RecentCreation } from '@/types';
import { theme } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';

/** Rebuild a result view from a saved upload recent (re-open from Recents). */
function fromRecent(item: RecentCreation | undefined): UploadResultData | null {
  if (!item || item.type !== 'uploaded_image') return null;
  const originalUri = item.originalUri ?? item.variants?.original ?? item.imageUrl ?? '';
  const variants = item.variants ?? {
    original: originalUri,
    line_art: null,
    sketch: null,
    cartoon: null,
    coloring_page: null,
  };
  return { originalUri, variants, provider: item.provider ?? 'mock', demo: !!item.demo, status: 'complete' };
}

/** Variant Selection (docs/02 §5) — pick a drawing style, save to recents. */
export default function VariantsScreen() {
  const router = useRouter();
  const { isTablet } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const draft = useUploadStore((s) => s.draft);
  const recentItem = useRecentsStore((s) => (id ? s.recents.find((r) => r.id === id) : undefined));
  const setProjectorSource = useProjectorStore((s) => s.setSource);
  const data = useMemo<UploadResultData | null>(
    () => (id ? fromRecent(recentItem) : draft),
    [id, recentItem, draft],
  );

  const labels = strings.upload.styleLabels;
  const available = useMemo<VariantKey[]>(
    () => (data ? VARIANT_KEYS.filter((k) => variantUrl(data, k) != null) : []),
    [data],
  );

  const initialStyle: VariantKey =
    (id && recentItem?.style && (available as string[]).includes(recentItem.style)
      ? (recentItem.style as VariantKey)
      : available.includes('line_art')
        ? 'line_art'
        : available[0]) ?? 'original';

  const [selected, setSelected] = useState<VariantKey>(initialStyle);
  const [savedId, setSavedId] = useState<string | undefined>(id);
  const [savedStyle, setSavedStyle] = useState<VariantKey | undefined>(
    id ? (recentItem?.style as VariantKey | undefined) : undefined,
  );

  if (!data) {
    return (
      <Screen>
        <BackHeader title={strings.upload.variantsTitle} />
        <View style={styles.notFound}>
          <EmptyState
            emoji="🖼️"
            message={strings.upload.notFound}
            actionLabel={strings.upload.tryAnother}
            onAction={() => router.replace('/create/upload')}
          />
        </View>
      </Screen>
    );
  }

  const isSaved = savedStyle === selected;
  const cardWidth = isTablet ? '31.5%' : '47.5%';

  const onSave = () => {
    const rec = recents.add({ ...buildUploadRecentInput(data, selected), id: savedId });
    setSavedId(rec.id);
    setSavedStyle(selected);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const openProjector = () => {
    setProjectorSource(previewFromUpload(data, selected, `${strings.upload.recentTitle} · ${labels[selected]}`));
    router.push('/projector');
  };

  return (
    <Screen scroll>
      <BackHeader title={strings.upload.variantsTitle} right={<DemoModeBadge force={data.demo} />} />

      <Animated.View entering={FadeInDown.duration(400)}>
        <AppText variant="body" color={theme.color.ink.muted}>
          {strings.upload.variantsSubtitle}
        </AppText>
      </Animated.View>

      {data.status === 'partial' ? (
        <Banner tone="info" emoji="🎨" message={strings.errors.aiNap} />
      ) : null}

      <View style={styles.grid}>
        {available.map((key) => (
          <View key={key} style={{ width: cardWidth }}>
            <VariantCard
              url={variantUrl(data, key)}
              styleKey={key}
              label={labels[key]}
              selected={selected === key}
              onPress={() => setSelected(key)}
            />
          </View>
        ))}
      </View>

      {isSaved ? (
        <AppText variant="caption" color={theme.color.state.success}>
          ✓ {strings.upload.saved}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={isSaved ? strings.upload.saved : `${strings.upload.save} · ${labels[selected]}`}
          icon={isSaved ? 'checkmark' : 'bookmark-outline'}
          onPress={onSave}
          disabled={isSaved}
        />
        <Button label={strings.projector.open} variant="secondary" icon="tv-outline" onPress={openProjector} />
        <Button
          label={strings.upload.tryAnother}
          variant="ghost"
          icon="images-outline"
          onPress={() => router.replace('/create/upload')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'space-between' },
  actions: { gap: theme.space.md },
});
