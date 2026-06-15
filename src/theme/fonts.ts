import {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

/**
 * Font modules passed to `useFonts`. The object keys become the React Native
 * `fontFamily` names referenced in `tokens.ts`.
 *
 * Display/headings: Baloo 2 (rounded, premium-playful). Body/UI: Nunito (warm, readable).
 * See docs/06-design-system.md §3.
 */
export const fontAssets = {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
};

export const fontFamily = {
  display: 'Baloo2_800ExtraBold',
  heading: 'Baloo2_700Bold',
  headingSemi: 'Baloo2_600SemiBold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;
