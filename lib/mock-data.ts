// Shared mock data for stone colors API
export const mockColors = [
  {
    id: 'color1',
    stoneId: 'stone1',
    code: 'WHITE_CLASSIC',
    nameTr: 'Klasik Beyaz',
    m2Price: '1800',  // Updated from 1680
    wastePercent: '0.15',
    textureUrl: '/textures/white-classic.jpg',
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
    textureUrl: '/textures/white-premium.jpg',
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
