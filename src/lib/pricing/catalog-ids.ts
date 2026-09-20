/**
 * Catalog IDs from database seed
 * These are the CUIDs generated when seeding the database
 */

// Stone Colors (Quartz White used for Golden Test A)
export const STONE_COLORS = {
  QUARTZ_WHITE: 'cmu9t6lau000o8m8hf38wp4xp',
  QUARTZ_GREY: 'cmu9t6lau000s8m8h11tzka7g',
  QUARTZ_BLACK: 'cmu9t6lau000t8m8h7moot8md',
  QUARTZ_BEIGE: 'cmu9t6lau000u8m8hgh37yipe',
  GRANITE_BLACK: 'cmu9t6lau000x8m8hsyyuurg1',
  GRANITE_BROWN: 'cmu9t6lau000y8m8hlbwckqmj',
  GRANITE_RED: 'cmu9t6lau00108m8h2zd74vd1',
  MARBLE_WHITE: 'cmu9t6lau00138m8h6uj46kn1',
  MARBLE_GREY: 'cmu9t6lau00148m8hd0vrx2r9',
  MARBLE_CREAM: 'cmu9t6lau00158m8hmsozvk90',
  MARBLE_GOLD: 'cmu9t6lau00168m8hho2jzq15',
  CERAMIC_WHITE: 'cmu9t6lau000z8m8hgoirg1nh',
  CERAMIC_GREY: 'cmu9t6lau00118m8h1o16xm1p',
  CERAMIC_BLACK: 'cmu9t6lau00128m8hzx9w2x45',
  COMPACT_OAK: 'cmu9t6lau00198m8h0cypogpp',
  COMPACT_WALNUT: 'cmu9t6lau001a8m8hfdn1bnus',
  COMPACT_CONCRETE: 'cmu9t6lau001b8m8hw4znl9hq',
} as const;

// Thicknesses
export const THICKNESSES = {
  CM_2: 'cmu9t6lb0001c8m8hg28mr6ql',
  CM_3: 'cmu9t6lb0001d8m8h18u3kmvi', // Used for Golden Test A
  CM_4: 'cmu9t6lb0001e8m8hn181yck3',
} as const;

// Form Types
export const FORM_TYPES = {
  STRAIGHT: 'cmu9t6lb3001f8m8hoxcp3z3n',
  L: 'cmu9t6lb3001g8m8h5p95hmsc', // Used for Golden Test A
  U: 'cmu9t6lb4001h8m8hz6kruuhx',
  ISLAND: 'cmu9t6lb4001i8m8hkyv7vq6a',
} as const;

// Edge Types
export const EDGE_TYPES = {
  STRAIGHT: 'cmu9t6lb8001j8m8hrqov9rb7',
  RADIUS: 'cmu9t6lb8001k8m8hoou2xgs8', // Used for Golden Test A
  BEVEL: 'cmu9t6lb8001m8m8hd1buc1gx',
  IRON: 'cmu9t6lb8001l8m8hnsgulr7w',
} as const;

// Helper to get catalog ID by enum-like key
export function getStoneColorId(key: keyof typeof STONE_COLORS): string {
  return STONE_COLORS[key];
}

export function getThicknessId(cm: 2 | 3 | 4): string {
  return THICKNESSES[`CM_${cm}` as keyof typeof THICKNESSES];
}

export function getFormTypeId(formType: string): string {
  return FORM_TYPES[formType as keyof typeof FORM_TYPES];
}

export function getEdgeTypeId(edgeType: string): string {
  const key = edgeType.toUpperCase() as keyof typeof EDGE_TYPES;
  return EDGE_TYPES[key];
}
