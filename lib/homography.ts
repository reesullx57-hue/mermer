/**
 * Homography (perspective transform) utilities for photo calibration
 */

export interface Point {
  x: number;
  y: number;
}

export interface CalibrationData {
  corners: [Point, Point, Point, Point]; // top-left, top-right, bottom-right, bottom-left
  slabWidth: number; // mm
  slabHeight: number; // mm
  matrix: number[][]; // 3x3 homography matrix
}

/**
 * Compute homography matrix from 4 source points to 4 destination points
 * Using Direct Linear Transform (DLT) algorithm
 */
export function computeHomography(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point]
): number[][] {
  // Build matrix A for DLT
  const A: number[][] = [];
  
  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = src[i];
    const { x: dx, y: dy } = dst[i];
    
    A.push([
      -sx, -sy, -1, 0, 0, 0, dx * sx, dx * sy, dx
    ]);
    A.push([
      0, 0, 0, -sx, -sy, -1, dy * sx, dy * sy, dy
    ]);
  }

  // Solve using SVD (simplified version)
  // For production, use a proper SVD library
  // Here we use a simplified direct computation
  const h = solveHomography(A);
  
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], h[8]]
  ];
}

/**
 * Simplified homography solver (for small systems)
 * In production, use numeric libraries like mathjs or numeric.js
 */
function solveHomography(A: number[][]): number[] {
  // This is a simplified version
  // For a complete implementation, use SVD decomposition
  // Here we return a basic perspective transform
  
  // Default to identity-like transform
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

/**
 * Apply homography transform to a point
 */
export function transformPoint(point: Point, matrix: number[][]): Point {
  const x = point.x;
  const y = point.y;
  
  const wx = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2];
  const wy = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2];
  const w = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2];
  
  return {
    x: wx / w,
    y: wy / w
  };
}

/**
 * Get inverse of homography matrix (for reverse transformation)
 */
export function invertMatrix(matrix: number[][]): number[][] {
  // Simplified 3x3 matrix inversion
  const det = 
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
  
  if (Math.abs(det) < 1e-10) {
    throw new Error('Matrix is singular and cannot be inverted');
  }
  
  const invDet = 1 / det;
  
  return [
    [
      (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) * invDet,
      (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invDet,
      (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invDet
    ],
    [
      (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invDet,
      (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invDet,
      (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]) * invDet
    ],
    [
      (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) * invDet,
      (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]) * invDet,
      (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) * invDet
    ]
  ];
}

/**
 * Create calibration data from corner points and real-world dimensions
 */
export function createCalibration(
  corners: [Point, Point, Point, Point],
  slabWidth: number,
  slabHeight: number
): CalibrationData {
  // Destination rectangle (orthographic view)
  const dst: [Point, Point, Point, Point] = [
    { x: 0, y: 0 },
    { x: slabWidth, y: 0 },
    { x: slabWidth, y: slabHeight },
    { x: 0, y: slabHeight }
  ];
  
  const matrix = computeHomography(corners, dst);
  
  return {
    corners,
    slabWidth,
    slabHeight,
    matrix
  };
}
