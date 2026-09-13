#!/usr/bin/env node

/**
 * Generate a synthetic marble texture for demo purposes
 * This creates an SVG that looks like marble veining
 */

const fs = require('fs');
const path = require('path');

const width = 800;
const height = 600;

// Generate random veins
function generateVeins() {
  const veins = [];
  const numVeins = 8 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < numVeins; i++) {
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    const points = [[startX, startY]];
    
    let x = startX;
    let y = startY;
    const numPoints = 10 + Math.floor(Math.random() * 20);
    
    for (let j = 0; j < numPoints; j++) {
      x += (Math.random() - 0.5) * 100;
      y += (Math.random() - 0.5) * 80;
      points.push([x, y]);
    }
    
    veins.push(points);
  }
  
  return veins;
}

function createPath(points) {
  if (points.length === 0) return '';
  
  let d = `M ${points[0][0]} ${points[0][1]}`;
  
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    const [prevX, prevY] = points[i - 1];
    const cx1 = prevX + (x - prevX) * 0.33;
    const cy1 = prevY + (y - prevY) * 0.33;
    const cx2 = prevX + (x - prevX) * 0.67;
    const cy2 = prevY + (y - prevY) * 0.67;
    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
  }
  
  return d;
}

const veins = generateVeins();

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg">
      <stop offset="0%" stop-color="#f5f5f5" />
      <stop offset="100%" stop-color="#e8e8e8" />
    </radialGradient>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  
  ${veins.map((vein, i) => {
    const d = createPath(vein);
    const opacity = 0.1 + Math.random() * 0.2;
    const strokeWidth = 2 + Math.random() * 4;
    return `<path d="${d}" stroke="#888" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round" />`;
  }).join('\n  ')}
  
  ${veins.map((vein, i) => {
    const d = createPath(vein);
    const opacity = 0.05 + Math.random() * 0.1;
    const strokeWidth = 8 + Math.random() * 12;
    return `<path d="${d}" stroke="#aaa" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round" filter="blur(4px)" />`;
  }).join('\n  ')}
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sample-marble.svg'), svg);

console.log('Sample marble texture generated at public/sample-marble.svg');
