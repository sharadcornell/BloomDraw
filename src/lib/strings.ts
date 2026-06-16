/**
 * Centralized child-facing + parent-facing copy.
 *
 * All user-visible wording lives here so it stays consistent and reviewable
 * (CLAUDE.md AI safety rules; docs/06 §12). AI-flow strings are included now so
 * they are ready when those flows are built; exact wording is verified against
 * the PRD in Milestone 11 tests.
 */
export const strings = {
  app: {
    name: 'BloomDraw',
    tagline: 'Draw something magical',
  },
  splash: {
    tagline: "Let's make something magical",
  },
  onboarding: {
    title: 'How old is the artist?',
    subtitle: "We'll pick drawings that are just right.",
    skip: 'Skip for now',
    cta: "Let's draw!",
  },
  home: {
    heroTitle: "Let's make\nsomething magical",
    heroSubtitle: 'Draw, trace, and create with a little help.',
    heroCta: 'Start creating',
    featured: 'Featured lessons',
    categories: 'Explore categories',
    quickCreate: 'Create something',
    recents: 'Your recent creations',
    favorites: 'Your favorites',
    projector: 'Projector Preview',
    seeAll: 'See all',
  },
  explore: {
    title: 'Explore',
    subtitle: 'Find a drawing to make',
  },
  create: {
    title: 'Create',
    subtitle: 'Turn ideas, photos, and prompts into art',
    comingSoon: 'Coming soon',
  },
  ai: {
    title: 'Make art with AI',
    subtitle: "Type an idea and we'll draw it — always kept kid-safe.",
    inputPlaceholder: 'A cute elephant astronaut on the moon…',
    inputLabel: 'Your drawing idea',
    examplesLabel: 'Need an idea? Tap one:',
    generate: 'Make my drawing',
    ageLabel: 'Drawing for ages',
    // Loading phases (docs/02 §6).
    moderating: 'Checking that your idea is safe and fun…',
    generating: 'Making your drawing…',
    longRunning: 'Still adding a little magic…',
    // Result screen.
    resultTitle: 'Your drawing',
    lineArtTitle: 'Trace-ready line art',
    yourIdea: 'Your idea',
    kidFriendlyIdea: 'Kid-friendly idea',
    tryAgain: 'Try another idea',
    saved: 'Saved to your recents',
    projectorCta: 'Projector Preview',
    notFound: "We couldn't find that creation.",
    // Tappable kid-safe example prompts.
    examples: [
      'cute elephant astronaut on the moon',
      'friendly dragon in a magical forest',
      'rocket flying past the moon',
      'butterfly in a flower garden',
      'happy robot drawing stars',
    ],
  },
  upload: {
    title: 'Add a photo',
    subtitle: 'Turn a photo into drawing styles you can trace.',
    pickGallery: 'Pick from gallery',
    takePhoto: 'Take a photo',
    usePhoto: 'Use this photo',
    retake: 'Choose another',
    previewLabel: 'Your photo',
    // Loading copy (docs/02 §5).
    processing: 'Turning your photo into drawing styles…',
    tracing: 'Making a tracing version…',
    longRunning: 'Still adding a little magic…',
    // Permission / availability (child-safe; never a raw error).
    cameraDenied: "We can't open the camera right now. You can still pick a photo from your gallery!",
    cameraUnavailable: 'No camera here — pick a photo from your gallery instead.',
    galleryDenied: "We can't open your photos right now. Try again, or take a photo instead!",
    // Variant Selection.
    variantsTitle: 'Pick a style',
    variantsSubtitle: 'Choose the look you want to trace.',
    save: 'Use this style',
    saved: 'Saved to your recents',
    tryAnother: 'Try another photo',
    notFound: "We couldn't find that creation.",
    recentTitle: 'My photo art',
    styleLabels: {
      original: 'Original',
      line_art: 'Line art',
      sketch: 'Pencil sketch',
      coloring_page: 'Coloring page',
      cartoon: 'Cartoon',
    },
  },
  projector: {
    title: 'Projector Preview',
    subtitle: 'This is what the projector will shine onto paper to trace.',
    open: 'Projector Preview',
    rotate: 'Rotate',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset',
    brightness: 'Brightness',
    contrast: 'High contrast',
    paper: 'Paper',
    comingSoonTitle: 'Connect a projector — coming soon',
    comingSoonBody:
      'The BloomDraw projector is on its way. This preview gets your art ready to shine onto real paper to trace.',
    sourceLabels: { drawing: 'Lesson', ai: 'AI art', upload: 'Photo' },
  },
  recents: {
    title: 'Recents',
  },
  settings: {
    title: 'Settings',
    ageTitle: 'Artist age',
    ageSubtitle: 'Pick drawings that fit just right.',
    safetyTitle: 'Kid-safe AI',
    safetyNote:
      "Every AI idea is checked to keep things friendly and safe for kids. We never show scary or grown-up content.",
    account: 'Account & sign in',
    privacy: 'Privacy & safety',
    comingSoon: 'Coming soon',
    version: 'Version',
  },
  empty: {
    recents: 'Your creations will bloom here.\nMake your first one!',
    favorites: 'Tap the heart on any drawing to save it here.',
    library: 'Library coming soon — drawings are on the way!',
  },
  errors: {
    generic: "Something went wrong, but it's not your fault. Try again!",
    aiNap: "Our art helper is taking a quick nap. Let's try again.",
    aiResting: 'Our art helper is resting for now. Please try again later.',
    rateLimit: "Let's take a tiny break and try again in a moment.",
    offline: "You're offline right now. You can still draw from the library!",
    // Maps to the `invalid_input` Edge Function error (docs/05 §9).
    invalidInput: "Hmm, that didn't work. Try a different idea!",
    // Maps to the `storage_error` Edge Function error (docs/05 §9).
    storage: "We couldn't save that image. Let's try again!",
    retry: 'Try again',
  },
  safety: {
    blocked:
      "Let's make something fun and safe to draw. Try asking for an animal, space scene, vehicle, flower, or cartoon character.",
    rewritten: 'I made your idea a little more kid-friendly.',
  },
  demoMode: 'Demo mode',
} as const;
