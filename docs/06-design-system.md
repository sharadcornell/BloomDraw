# 06 — Design System

> Status: Draft for approval · Owner: Design/Eng · Last updated: 2026-06-15
> These tokens become `src/theme/tokens.ts`. Goal: playful + magical + premium + parent-trustworthy. Avoid clutter, dark/scary visuals, enterprise/adult-AI feel.

## 1. Visual direction

BloomDraw should feel like a **magical creative studio for kids** that a parent is proud to own: soft rounded shapes, gentle gradients, generous whitespace, expressive but tasteful color, and delightful micro-animations. Premium, not toyish; friendly, not babyish. Big touch targets, minimal text, warm empty states.

Moodboard words: bloom, glow, soft, rounded, paper, crayon-meets-Apple, gentle motion, confident whitespace.

## 2. Color palette (proposal)

Pending a real brand pass (brief open question #4). Hex values are the starting tokens.

### Brand
| token | hex | use |
| --- | --- | --- |
| `brand.violet` | `#7C5CFC` | primary actions, active states, logo |
| `brand.violetDeep` | `#5B3FE0` | pressed/gradient end |
| `brand.coral` | `#FF7E6B` | secondary/playful accents, hearts |
| `brand.sun` | `#FFC93C` | highlights, badges, stars |
| `brand.mint` | `#3FD6B0` | success-ish accent, "create" energy |
| `brand.sky` | `#5FC9F3` | tertiary accent, projector/cool tones |

### Surfaces & ink
| token | hex | use |
| --- | --- | --- |
| `bg.base` | `#FBF8FF` | app background (soft lavender-white) |
| `bg.subtle` | `#F2ECFF` | section backgrounds |
| `surface.card` | `#FFFFFF` | cards, sheets |
| `surface.elevated` | `#FFFFFF` + shadow | floating elements |
| `ink.strong` | `#2B2350` | primary text/headings (deep indigo, not black) |
| `ink.body` | `#4A4470` | body text |
| `ink.muted` | `#857FA6` | secondary/captions |
| `line.hairline` | `#ECE6FB` | dividers, card borders |

### Semantic (kid-friendly, never harsh)
| token | hex | use |
| --- | --- | --- |
| `state.success` | `#34C98B` | confirmations |
| `state.warning` | `#FFB020` | gentle warnings |
| `state.error` | `#FF6B8A` | errors (warm pink-red, not alarming red) |
| `state.info` | `#5FC9F3` | tips, demo-mode |

### Gradients
| token | stops | use |
| --- | --- | --- |
| `grad.bloom` | `#7C5CFC → #FF7E6B` | hero banner, splash |
| `grad.sky` | `#5FC9F3 → #3FD6B0` | projector/cool sections |
| `grad.sun` | `#FFC93C → #FF7E6B` | playful CTAs, badges |

Category accent colors (each category gets one for cards/chips): alphabets=violet, numbers=sky, animals=mint, vehicles=coral, space=violetDeep, nature=mint, curriculum=sun, cards=coral. Pair every color use with sufficient contrast text (see §10).

## 3. Typography (proposal)

- **Display/Headings:** **Baloo 2** (rounded, friendly, premium-playful) — weights 600/700/800.
- **Body/UI:** **Nunito** (highly readable, warm) — weights 400/600/700.
- Both via `@expo-google-fonts/*` (license-clear; pending sign-off, brief OQ #4).

### Type scale
| token | size / line | weight | font | use |
| --- | --- | --- | --- | --- |
| `display` | 34 / 40 | 800 | Baloo 2 | hero titles |
| `h1` | 28 / 34 | 700 | Baloo 2 | screen titles |
| `h2` | 22 / 28 | 700 | Baloo 2 | section headers |
| `h3` | 18 / 24 | 600 | Baloo 2 | card titles |
| `body` | 16 / 24 | 400 | Nunito | default text |
| `bodyStrong` | 16 / 24 | 700 | Nunito | emphasis |
| `caption` | 13 / 18 | 600 | Nunito | meta, chips |
| `button` | 16 / 20 | 700 | Nunito | button labels |

Min body size 16 for kid readability. Avoid all-caps blocks; use sentence case, minimal text.

## 4. Spacing & layout

- **Spacing scale (4-based):** `xs 4, sm 8, md 12, base 16, lg 20, xl 24, 2xl 32, 3xl 40, 4xl 48, 5xl 64`.
- **Screen padding:** 20 (phone), 32 (tablet).
- **Grid:** 2 columns (phone) / 3–4 (tablet) for library/variants; responsive via breakpoints `phone < 600 ≤ tablet`.
- **Touch targets:** min 48×48; primary kid CTAs 56–64 tall.
- **Safe areas:** respect notches/home indicator (`react-native-safe-area-context`).

## 5. Radii & elevation

- **Radii:** `sm 10, md 16, lg 22, xl 28, pill 999`. Cards default `lg`; sheets `xl`; chips `pill`.
- **Shadows (soft, colored-tinted):** `e1` subtle (cards), `e2` medium (floating CTAs), `e3` high (modals/projector controls). Use low-opacity violet-tinted shadows for the "premium glow," not hard black.

## 6. Cards

- White surface, radius `lg`, padding `base`, shadow `e1`, optional category accent stripe/icon chip.
- **Drawing card:** thumbnail (4:3) top, title (`h3`), meta row (age chip + difficulty dots), heart (favorite) top-right. Placeholder items use the branded placeholder image (never a broken image icon).
- **Category card:** large icon + name + count, tinted with the category accent.
- **Variant card:** square image + style label + select affordance (check overlay when selected).
- Press: scale-down 0.97 + subtle haptic.

## 7. Buttons

| variant | look | use |
| --- | --- | --- |
| `primary` | `grad.bloom` fill, white text, radius pill, shadow e2 | main CTAs ("Generate", "Start tutorial") |
| `secondary` | white fill, violet text, hairline border | secondary actions |
| `ghost` | transparent, violet text | tertiary/inline |
| `icon` | circular, surface card, e1 | toolbar/projector controls |
| `chip` | pill, tinted bg, accent text | filters (age/difficulty/category) — selectable |

States: default / pressed (scale + darken) / disabled (50% + no shadow) / loading (spinner replaces label). Min height 56 for primary.

## 8. Icons

- Use a single consistent set (e.g., `@expo/vector-icons` Ionicons/Feather) plus a few custom playful glyphs/emoji for categories where helpful. Rounded, friendly weights. Avoid sharp/aggressive iconography.
- Tab bar: Home, Explore (compass/grid), Create (sparkle/plus), Recents (clock), Settings (gear). Active = brand violet + label; inactive = ink.muted.

## 9. Animations

Library: Reanimated 3 + Moti. Keep motion gentle and purposeful (no seizure-risk flashing; respect reduce-motion).
- **Splash:** logo "blooms" (scale + petals/opacity) ~1–1.5s, then cross-fade to app.
- **Screen transitions:** soft fade/slide; shared-element-ish hero on card → detail where cheap.
- **Cards:** staggered fade-up on list mount; press scale 0.97.
- **CTAs:** subtle idle shimmer on primary "magic" actions; success confetti/sparkle (brief, skippable) on generation complete.
- **Loaders:** branded blooming/pulsing loader, not a default spinner, for AI/processing.
- **Tabs:** active icon pop + color tween.
- Performance: animations on UI thread (Reanimated worklets); 60fps target; disable heavy effects on low-end via a flag.

## 10. Empty / error / loading states

Consistent components: `EmptyState`, `ErrorState`, `Loader`, `DemoModeBadge`, `SkeletonCard`.
- **Empty:** friendly illustration + one warm line + (optional) action. Copy from `01-prd.md` §8.
- **Error:** soft illustration + child-safe line + Retry. Copy from `01-prd.md` §9 / `05` §9. Never show codes/stack/provider.
- **Loading:** branded blooming loader; skeletons for lists/variants; AI processing shows a playful "making your art…" state.
- **Demo mode:** small `info`-tinted badge ("Demo mode — sample art") whenever `demo:true`/no keys, so real-vs-mock is never ambiguous.

## 11. Accessibility notes

- **Contrast:** target WCAG AA for text (≥4.5:1 body, ≥3:1 large). Validate ink-on-tint combos; don't rely on color alone (difficulty also shown as dots/label).
- **Touch:** ≥48px targets; spacing prevents mis-taps for small hands.
- **Labels:** every control has an `accessibilityLabel`/`accessibilityRole`; images have alt text; decorative art marked decorative.
- **Dynamic type:** respect OS font scaling up to a sensible cap; layouts wrap, don't clip.
- **Motion:** honor `prefers-reduced-motion` / reduce-motion setting → swap big animations for fades.
- **Reading level:** instructions at an early-reader level; pair text with imagery for pre-readers; parent-facing copy (Settings/safety) in plain adult language.
- **No dark/scary palette;** maintain calm, bright, high-legibility surfaces.

## 12. Content & copy tone

- To kids: short, warm, encouraging, second person ("Let's draw a cat!"). No jargon, no scary words, no error codes.
- To parents (Settings/safety): clear, honest, reassuring; explain the safety layer in plain language.
- All child-facing strings centralized in `src/lib/strings.ts` for review/consistency (referenced by `02`, `05`, `CLAUDE.md`).

### Audio narration (optional polish — Milestone 10)
An **optional**, lightweight text-to-speech layer (`expo-speech`) added only if easy/stable; deferred to future if risky. **No recorded voice in V1.** Helpful for pre-readers (pairs audio with the early-reader text + imagery noted in §11 Accessibility).
- **Scope:** AI-creation and upload/camera-creation flows only; narrates a few short **centralized strings** (e.g., "Let's make your drawing.", "I made your idea a little more kid-friendly.", "Your art is ready.", "Pick your favorite style.").
- **Controls:** a clearly visible **mute** toggle (persisted, default-on or default-off TBD) and a **replay** button. Mute icon follows the icon set (§8); place near the screen header.
- **Respect device silent mode**; never force audio when silenced. TTS unavailable → silent no-op.
- Narration uses the same `src/lib/strings.ts` keys — no separate copy to keep in sync.

## 13. Tokens → code (shape)
```ts
export const tokens = {
  color: { brand: {...}, bg: {...}, surface: {...}, ink: {...}, line: {...}, state: {...} },
  gradient: { bloom: ['#7C5CFC','#FF7E6B'], sky: [...], sun: [...] },
  space: { xs:4, sm:8, md:12, base:16, lg:20, xl:24, '2xl':32, '3xl':40, '4xl':48, '5xl':64 },
  radius: { sm:10, md:16, lg:22, xl:28, pill:999 },
  font: { display:{...}, h1:{...}, /* … */ },
  shadow: { e1:{...}, e2:{...}, e3:{...} },
  breakpoint: { tablet: 600 },
};
```
`useTheme()` exposes tokens + helpers (`spacing()`, `categoryAccent(slug)`, responsive `isTablet`).
