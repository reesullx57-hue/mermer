/**
 * DXF export utilities for CNC fabrication
 */

export interface DXFPoint {
  x: number;
  y: number;
}

export interface DXFPiece {
  name: string;
  points: DXFPoint[]; // Closed polygon
  closed?: boolean;
}

/**
 * Generate DXF file content from pieces
 * Uses simplified DXF format with LWPOLYLINE entities
 */
export function generateDXF(pieces: DXFPiece[]): string {
  const lines: string[] = [];
  
  // DXF Header
  lines.push('0', 'SECTION');
  lines.push('2', 'HEADER');
  lines.push('9', '$ACADVER');
  lines.push('1', 'AC1015'); // AutoCAD 2000
  lines.push('9', '$INSUNITS');
  lines.push('70', '4'); // Millimeters
  lines.push('0', 'ENDSEC');
  
  // Tables section
  lines.push('0', 'SECTION');
  lines.push('2', 'TABLES');
  
  // Layer table
  lines.push('0', 'TABLE');
  lines.push('2', 'LAYER');
  lines.push('70', '1');
  lines.push('0', 'LAYER');
  lines.push('2', '0');
  lines.push('70', '0');
  lines.push('62', '7'); // White
  lines.push('6', 'CONTINUOUS');
  lines.push('0', 'ENDTAB');
  
  lines.push('0', 'ENDSEC');
  
  // Entities section
  lines.push('0', 'SECTION');
  lines.push('2', 'ENTITIES');
  
  // Add each piece as a LWPOLYLINE
  pieces.forEach((piece, index) => {
    lines.push('0', 'LWPOLYLINE');
    lines.push('8', '0'); // Layer
    lines.push('62', String(1 + (index % 7))); // Color (cycle through 7 colors)
    lines.push('90', String(piece.points.length)); // Number of vertices
    lines.push('70', piece.closed !== false ? '1' : '0'); // Closed flag
    
    piece.points.forEach(point => {
      lines.push('10', point.x.toFixed(3));
      lines.push('20', point.y.toFixed(3));
    });
    
    // Add text label for piece name
    if (piece.points.length > 0) {
      const centerX = piece.points.reduce((sum, p) => sum + p.x, 0) / piece.points.length;
      const centerY = piece.points.reduce((sum, p) => sum + p.y, 0) / piece.points.length;
      
      lines.push('0', 'TEXT');
      lines.push('8', '0');
      lines.push('10', centerX.toFixed(3));
      lines.push('20', centerY.toFixed(3));
      lines.push('40', '50.0'); // Text height in mm
      lines.push('1', piece.name);
      lines.push('50', '0'); // Rotation angle
    }
  });
  
  lines.push('0', 'ENDSEC');
  
  // End of file
  lines.push('0', 'EOF');
  
  return lines.join('\n');
}

/**
 * Convert piece geometry to DXF points
 */
export function pieceToDXFPoints(
  geometry: any,
  x: number,
  y: number,
  rotation: number,
  flipped: boolean
): DXFPoint[] {
  // Parse geometry JSON
  let points: DXFPoint[];
  
  if (typeof geometry === 'string') {
    geometry = JSON.parse(geometry);
  }
  
  if (Array.isArray(geometry.points)) {
    points = geometry.points;
  } else if (geometry.width && geometry.height) {
    // Rectangle
    const w = geometry.width;
    const h = geometry.height;
    points = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h }
    ];
  } else {
    points = [{ x: 0, y: 0 }];
  }
  
  // Apply transformations
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  return points.map(p => {
    let px = p.x;
    let py = p.y;
    
    // Flip
    if (flipped) {
      px = -px;
    }
    
    // Rotate
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    
    // Translate
    return {
      x: rx + x,
      y: ry + y
    };
  });
}
