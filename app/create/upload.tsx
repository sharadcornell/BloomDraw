import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppText, BackHeader, Banner, Button, Card, DemoModeBadge, Loader, Screen } from '@/components';
import { strings } from '@/lib/strings';
import { getDeviceId } from '@/services/session';
import { BUCKETS, uploadToBucket } from '@/services/storage';
import { isSupabaseConfigured } from '@/services/supabase';
import { processUpload } from '@/services/upload';
import { useUploadStore } from '@/state';
import { theme } from '@/theme/theme';

/** Upload / Capture (docs/02 §5). Pick or snap a photo → process into variants. */
export default function UploadScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const setDraft = useUploadStore((s) => s.setDraft);

  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [longRunning, setLongRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoOpened = useRef(false);

  const pickFromGallery = async () => {
    setNotice(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setNotice(strings.upload.galleryDenied);
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (!res.canceled && res.assets?.[0]?.uri) setUri(res.assets[0].uri);
    } catch {
      setNotice(strings.upload.galleryDenied);
    }
  };

  const takePhoto = async () => {
    setNotice(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setNotice(strings.upload.cameraDenied);
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!res.canceled && res.assets?.[0]?.uri) setUri(res.assets[0].uri);
    } catch {
      // Simulator / device without a camera.
      setNotice(strings.upload.cameraUnavailable);
    }
  };

  // Optional deep-link: Create → "Take a photo" opens the camera straight away.
  useEffect(() => {
    if (mode === 'camera' && !autoOpened.current) {
      autoOpened.current = true;
      void takePhoto();
    }
  }, [mode]);

  const reset = () => {
    setUri(null);
    setError(null);
    setNotice(null);
  };

  const onUse = async () => {
    if (!uri) return;
    setError(null);
    setBusy(true);
    setLongRunning(false);
    longTimer.current = setTimeout(() => setLongRunning(true), 6000);
    try {
      const prepared = await prepareSource(uri);
      if (isSupabaseConfigured && !prepared.uploadRef) {
        // Configured but the original couldn't be uploaded → child-safe storage error.
        setError(strings.errors.storage);
        return;
      }
      const outcome = await processUpload({ originalUri: prepared.originalUri, uploadRef: prepared.uploadRef });
      if (outcome.status === 'error') {
        setError(outcome.userMessage);
        return;
      }
      setDraft(outcome.data);
      router.push('/create/variants');
    } finally {
      if (longTimer.current) clearTimeout(longTimer.current);
      setBusy(false);
      setLongRunning(false);
    }
  };

  return (
    <Screen scroll>
      <BackHeader title={strings.upload.title} right={<DemoModeBadge />} />

      {busy ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.loadingWrap}>
          <Loader label={longRunning ? strings.upload.longRunning : strings.upload.processing} />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.body}>
          <AppText variant="body" color={theme.color.ink.muted}>
            {strings.upload.subtitle}
          </AppText>

          {notice ? <Banner tone="info" emoji="📷" message={notice} /> : null}
          {error ? <Banner tone="info" emoji="🎨" message={error} /> : null}

          {uri ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri }}
                style={styles.preview}
                contentFit="cover"
                accessibilityLabel={strings.upload.previewLabel}
              />
              <View style={styles.actions}>
                <Button label={strings.upload.usePhoto} icon="color-wand" onPress={onUse} />
                <Button label={strings.upload.retake} variant="secondary" icon="images-outline" onPress={reset} />
              </View>
            </View>
          ) : (
            <View style={styles.actions}>
              <Card>
                <View style={styles.pickRow}>
                  <AppText variant="h3">🖼️</AppText>
                  <AppText variant="bodyStrong" color={theme.color.ink.strong} style={styles.flex}>
                    {strings.upload.pickGallery}
                  </AppText>
                </View>
                <Button label={strings.upload.pickGallery} icon="images" onPress={pickFromGallery} />
                <View style={styles.spacer} />
                <Button label={strings.upload.takePhoto} variant="secondary" icon="camera" onPress={takePhoto} />
              </Card>
            </View>
          )}
        </Animated.View>
      )}
    </Screen>
  );
}

// --- Native helpers (not unit-tested; run on device) -----------------------

/** Best-effort resize/compress; never blocks the flow if the API/version differs. */
async function preprocess(rawUri: string): Promise<string> {
  try {
    // The expo-image-manipulator surface varies across SDKs; `any` keeps this
    // resilient and the result is optional — we fall back to the original uri.
    const mod = ImageManipulator as unknown as {
      manipulateAsync?: (
        uri: string,
        actions: { resize: { width: number } }[],
        opts: { compress: number; format?: unknown },
      ) => Promise<{ uri?: string }>;
      SaveFormat?: { JPEG?: unknown };
    };
    if (typeof mod.manipulateAsync === 'function') {
      const out = await mod.manipulateAsync(rawUri, [{ resize: { width: 1024 } }], {
        compress: 0.7,
        format: mod.SaveFormat?.JPEG,
      });
      if (out?.uri) return out.uri as string;
    }
  } catch {
    /* fall back to the original uri */
  }
  return rawUri;
}

function uuid(): string {
  return 'xxxxxxxxxxxx4xxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

/** Resize, then (when Supabase is configured) upload the original to user-uploads. */
async function prepareSource(rawUri: string): Promise<{ originalUri: string; uploadRef?: string }> {
  const originalUri = await preprocess(rawUri);
  if (!isSupabaseConfigured) return { originalUri };
  try {
    const deviceId = await getDeviceId();
    const path = `${deviceId}/${uuid()}.jpg`;
    const resp = await fetch(originalUri);
    const blob = await resp.blob();
    const result = await uploadToBucket(BUCKETS.userUploads, path, blob, 'image/jpeg');
    if (result.ok) return { originalUri, uploadRef: `${BUCKETS.userUploads}/${path}` };
  } catch {
    /* upload failed — caller surfaces a child-safe storage error */
  }
  return { originalUri };
}

const styles = StyleSheet.create({
  loadingWrap: { paddingTop: theme.space.xxl },
  body: { gap: theme.space.lg },
  flex: { flex: 1 },
  actions: { gap: theme.space.md },
  spacer: { height: theme.space.sm },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, marginBottom: theme.space.md },
  previewWrap: { gap: theme.space.lg },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.bg.subtle,
  },
});
