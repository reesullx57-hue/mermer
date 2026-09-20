// Shared mock data for stone colors API
export const mockColors = [
  {
    id: 'color1',
    stoneId: 'stone1',
    code: 'WHITE_CLASSIC',
    nameTr: 'Klasik Beyaz',
    m2Price: '1800',
    wastePercent: '0.15',
    textureUrl: 'public/uploads/textures/550e8400-e29b-41d4-a716-446655440000.jpg',
    isActive: true,
    stone: {
      id: 'stone1',
      code: 'CARRARA',
      nameTr: 'Carrara Mermer',
      brand: {
        id: 'brand1',
        code: 'ITALIAN',
        nameTr: 'İtalyan Mermer'
      }
    }
  },
  {
    id: 'color2',
    stoneId: 'stone1',
    code: 'WHITE_PREMIUM',
    nameTr: 'Premium Beyaz',
    m2Price: '2400',
    wastePercent: '0.12',
    textureUrl: 'public/uploads/textures/7c9e6679-7425-40de-944b-e07fc1f90ae7.png',
    isActive: true,
    stone: {
      id: 'stone1',
      code: 'CARRARA',
      nameTr: 'Carrara Mermer',
      brand: {
        id: 'brand1',
        code: 'ITALIAN',
        nameTr: 'İtalyan Mermer'
      }
    }
  },
  {
    id: 'color3',
    stoneId: 'stone2',
    code: 'GRAY_MODERN',
    nameTr: 'Modern Gri',
    m2Price: '1850',
    wastePercent: '0.18',
    textureUrl: null,
    isActive: true,
    stone: {
      id: 'stone2',
      code: 'EMPERADOR',
      nameTr: 'Emperador Mermer',
      brand: {
        id: 'brand2',
        code: 'SPANISH',
        nameTr: 'İspanyol Mermer'
      }
    }
  }
];
