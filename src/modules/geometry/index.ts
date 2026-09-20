/**
 * Geometry calculation module for kitchen countertop configurator
 * Handles area computation and waste factor application
 */

export type FormType = 'STRAIGHT' | 'L' | 'U' | 'ISLAND';

export interface DimensionsCm {
  length?: number;
  depth: number;
  leg1?: number;
  leg2?: number;
  leg3?: number;
}

/**
 * Computes the area in square meters for a given form type and dimensions
 * All input dimensions are in centimeters
 * 
 * Formulas:
 * - STRAIGHT: (length × depth) / 10000
 * - L: (leg1×depth + leg2×depth − depth²) / 10000
 * - U: (leg1×depth + leg2×depth + leg3×depth − 2×depth²) / 10000
 * - ISLAND: (length × depth) / 10000
 * 
 * @param formType - The shape of the countertop
 * @param dimensions - Dimensions in centimeters
 * @returns Computed area in square meters, rounded to 4 decimal places
 */
export function computeArea(formType: FormType, dimensions: DimensionsCm): number {
  const { length, depth, leg1, leg2, leg3 } = dimensions;
  let areaCm2: number;

  switch (formType) {
    case 'STRAIGHT':
      if (length === undefined) {
        throw new Error('STRAIGHT form requires length');
      }
      areaCm2 = length * depth;
      break;

    case 'L':
      if (leg1 === undefined || leg2 === undefined) {
        throw new Error('L form requires leg1 and leg2');
      }
      areaCm2 = leg1 * depth + leg2 * depth - depth * depth;
      break;

    case 'U':
      if (leg1 === undefined || leg2 === undefined || leg3 === undefined) {
        throw new Error('U form requires leg1, leg2, and leg3');
      }
      areaCm2 = leg1 * depth + leg2 * depth + leg3 * depth - 2 * depth * depth;
      break;

    case 'ISLAND':
      if (length === undefined) {
        throw new Error('ISLAND form requires length');
      }
      areaCm2 = length * depth;
      break;

    default:
      throw new Error(`Unknown form type: ${formType}`);
  }

  const areaM2 = areaCm2 / 10000;
  return roundHalfUp(areaM2, 4);
}

/**
 * Applies waste percentage to a computed area
 * billableAreaM2 = area × (1 + wastePercent)
 * 
 * @param area - Computed area in square meters
 * @param wastePercent - Waste percentage as decimal (e.g., 0.05 for 5%)
 * @returns Billable area in square meters, rounded to 4 decimal places
 */
export function applyWaste(area: number, wastePercent: number): number {
  const billableArea = area * (1 + wastePercent);
  return roundHalfUp(billableArea, 4);
}

/**
 * Rounds a number to a specified number of decimal places using ROUND_HALF_UP
 * (also known as "round half away from zero" or "commercial rounding")
 * 
 * @param value - The number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
function roundHalfUp(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier + Number.EPSILON) / multiplier;
}
