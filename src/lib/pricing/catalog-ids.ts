/**
 * Catalog IDs from Pricing Engine database seed
 * These are the CUIDs used in the verified Pricing Engine
 */

// Stone Colors (Quartz White used for Golden Test A)
export const STONE_COLORS = {
  QUARTZ_WHITE: 'cmu9pojis000vjrrp5epidwok', // Used for Golden Test A
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
  CM_2: 'cmu9pojiy001cjrrpmjzqfhp5',
  CM_3: 'cmu9pojiy001djrrp8x5dfbpi', // Used for Golden Test A
  CM_4: 'cmu9pojiy001ejrrpi6k42vjt',
} as const;

// Form Types
export const FORM_TYPES = {
  STRAIGHT: 'cmu9pojiz001fjrrp7x06vmew',
  L: 'cmu9pojj0001gjrrp0678b8d4', // Used for Golden Test A
  U: 'cmu9pojj0001hjrrp48iwhnvu',
  ISLAND: 'cmu9pojj0001ijrrpnqe67dgj',
} as const;

// Edge Types
export const EDGE_TYPES = {
  STRAIGHT: 'cmu9pojj2001jjrrpigr18zl7',
  RADIUS: 'cmu9pojj2001jjrrps0l86qvb', // Used for Golden Test A
  BEVEL: 'cmu9pojj2001kjrrp8mh93ry1',
  IRON: 'cmu9pojj2001ljrrpwfnafz6d',
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
