/**
 * Unit tests for geometry module
 * PE-6 Golden Test Cases
 */

import { computeArea, applyWaste, type FormType, type DimensionsCm } from './index';

describe('Geometry Module - PE-6 Golden Tests', () => {
  describe('computeArea', () => {
    it('STRAIGHT: length=320 depth=65 → 2.0800 m²', () => {
      const result = computeArea('STRAIGHT', { length: 320, depth: 65 });
      expect(result).toBe(2.0800);
    });

    it('L: leg1=320 leg2=180 depth=65 → 2.8275 m²', () => {
      const result = computeArea('L', { leg1: 320, leg2: 180, depth: 65 });
      expect(result).toBe(2.8275);
    });

    it('U: leg1=320 leg2=180 leg3=200 depth=65 → 3.7050 m²', () => {
      const result = computeArea('U', { leg1: 320, leg2: 180, leg3: 200, depth: 65 });
      expect(result).toBe(3.7050);
    });

    it('ISLAND: length=320 depth=65 → 2.0800 m²', () => {
      const result = computeArea('ISLAND', { length: 320, depth: 65 });
      expect(result).toBe(2.0800);
    });
  });

  describe('applyWaste', () => {
    it('STRAIGHT with 5% waste: 2.0800 → 2.1840 m²', () => {
      const computed = 2.0800;
      const result = applyWaste(computed, 0.05);
      expect(result).toBe(2.1840);
    });

    it('L with 5% waste: 2.8275 → 2.9689 m²', () => {
      const computed = 2.8275;
      const result = applyWaste(computed, 0.05);
      expect(result).toBe(2.9689);
    });

    it('U with 5% waste: 3.7050 → 3.8903 m²', () => {
      const computed = 3.7050;
      const result = applyWaste(computed, 0.05);
      expect(result).toBe(3.8903);
    });

    it('ISLAND with 5% waste: 2.0800 → 2.1840 m²', () => {
      const computed = 2.0800;
      const result = applyWaste(computed, 0.05);
      expect(result).toBe(2.1840);
    });
  });

  describe('Full workflow tests', () => {
    it('STRAIGHT: compute and apply waste in one flow', () => {
      const computed = computeArea('STRAIGHT', { length: 320, depth: 65 });
      expect(computed).toBe(2.0800);
      
      const billable = applyWaste(computed, 0.05);
      expect(billable).toBe(2.1840);
    });

    it('L: compute and apply waste in one flow', () => {
      const computed = computeArea('L', { leg1: 320, leg2: 180, depth: 65 });
      expect(computed).toBe(2.8275);
      
      const billable = applyWaste(computed, 0.05);
      expect(billable).toBe(2.9689);
    });

    it('U: compute and apply waste in one flow', () => {
      const computed = computeArea('U', { leg1: 320, leg2: 180, leg3: 200, depth: 65 });
      expect(computed).toBe(3.7050);
      
      const billable = applyWaste(computed, 0.05);
      expect(billable).toBe(3.8903);
    });

    it('ISLAND: compute and apply waste in one flow', () => {
      const computed = computeArea('ISLAND', { length: 320, depth: 65 });
      expect(computed).toBe(2.0800);
      
      const billable = applyWaste(computed, 0.05);
      expect(billable).toBe(2.1840);
    });
  });

  describe('Edge cases and validation', () => {
    it('throws error for STRAIGHT without length', () => {
      expect(() => {
        computeArea('STRAIGHT', { depth: 65 });
      }).toThrow('STRAIGHT form requires length');
    });

    it('throws error for L without required legs', () => {
      expect(() => {
        computeArea('L', { depth: 65 });
      }).toThrow('L form requires leg1 and leg2');
    });

    it('throws error for U without required legs', () => {
      expect(() => {
        computeArea('U', { leg1: 320, leg2: 180, depth: 65 });
      }).toThrow('U form requires leg1, leg2, and leg3');
    });

    it('throws error for ISLAND without length', () => {
      expect(() => {
        computeArea('ISLAND', { depth: 65 });
      }).toThrow('ISLAND form requires length');
    });

    it('handles zero waste correctly', () => {
      const result = applyWaste(2.0800, 0);
      expect(result).toBe(2.0800);
    });

    it('handles high waste percentage correctly', () => {
      const result = applyWaste(2.0000, 0.20);
      expect(result).toBe(2.4000);
    });
  });

  describe('Rounding behavior', () => {
    it('rounds correctly using ROUND_HALF_UP', () => {
      // Test case where rounding matters
      const result = computeArea('STRAIGHT', { length: 333, depth: 67 });
      // 333 * 67 = 22311 cm² = 2.2311 m²
      expect(result).toBe(2.2311);
    });

    it('rounds waste application correctly', () => {
      const result = applyWaste(2.2311, 0.05);
      // 2.2311 * 1.05 = 2.342655 → rounds to 2.3427
      expect(result).toBe(2.3427);
    });
  });
});
