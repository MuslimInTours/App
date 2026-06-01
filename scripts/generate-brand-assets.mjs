import { writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const colors = {
  cream: [248, 250, 245, 255],
  emerald: [15, 107, 91, 255],
  emeraldDark: [7, 54, 51, 255],
  gold: [214, 168, 79, 255],
  mint: [190, 232, 224, 255],
  transparent: [0, 0, 0, 0],
};

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));

function createCanvas(size, background) {
  const png = new PNG({ colorType: 6, height: size, width: size });
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const pixel = background(x, y, size);
      png.data[index] = pixel[0];
      png.data[index + 1] = pixel[1];
      png.data[index + 2] = pixel[2];
      png.data[index + 3] = pixel[3];
    }
  }
  return png;
}

function blendPixel(png, x, y, color, alpha = 1) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height || alpha <= 0) {
    return;
  }
  const index = (Math.floor(y) * png.width + Math.floor(x)) * 4;
  const sourceAlpha = clamp((color[3] / 255) * alpha);
  const targetAlpha = png.data[index + 3] / 255;
  const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  if (outputAlpha <= 0) {
    return;
  }
  for (let channel = 0; channel < 3; channel += 1) {
    const source = color[channel] / 255;
    const target = png.data[index + channel] / 255;
    const output = (source * sourceAlpha + target * targetAlpha * (1 - sourceAlpha)) / outputAlpha;
    png.data[index + channel] = Math.round(output * 255);
  }
  png.data[index + 3] = Math.round(outputAlpha * 255);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared);
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function drawCircle(png, cx, cy, radius, color) {
  const left = Math.floor(cx - radius);
  const right = Math.ceil(cx + radius);
  const top = Math.floor(cy - radius);
  const bottom = Math.ceil(cy + radius);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const alpha = clamp(radius - distance);
      blendPixel(png, x, y, color, alpha);
    }
  }
}

function eraseCircle(png, cx, cy, radius) {
  const left = Math.floor(cx - radius);
  const right = Math.ceil(cx + radius);
  const top = Math.floor(cy - radius);
  const bottom = Math.ceil(cy + radius);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (x < 0 || x >= png.width || y < 0 || y >= png.height) {
        continue;
      }
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const alpha = clamp(radius - distance);
      if (alpha <= 0) {
        continue;
      }
      const index = (y * png.width + x) * 4;
      png.data[index + 3] = Math.round(png.data[index + 3] * (1 - alpha));
    }
  }
}

function drawRing(png, cx, cy, radius, width, color) {
  const outer = radius + width / 2;
  const left = Math.floor(cx - outer);
  const right = Math.ceil(cx + outer);
  const top = Math.floor(cy - outer);
  const bottom = Math.ceil(cy + outer);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const alpha = clamp(width / 2 - Math.abs(distance - radius));
      blendPixel(png, x, y, color, alpha);
    }
  }
}

function drawLine(png, ax, ay, bx, by, width, color) {
  const radius = width / 2;
  const left = Math.floor(Math.min(ax, bx) - radius);
  const right = Math.ceil(Math.max(ax, bx) + radius);
  const top = Math.floor(Math.min(ay, by) - radius);
  const bottom = Math.ceil(Math.max(ay, by) + radius);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const distance = distanceToSegment(x + 0.5, y + 0.5, ax, ay, bx, by);
      const alpha = clamp(radius - distance);
      blendPixel(png, x, y, color, alpha);
    }
  }
}

function drawCrescent(png, cx, cy, radius, cutOffset, color, cutColor) {
  drawCircle(png, cx, cy, radius, color);
  if (cutColor[3] === 0) {
    eraseCircle(png, cx + cutOffset, cy - radius * 0.04, radius * 0.92);
  } else {
    drawCircle(png, cx + cutOffset, cy - radius * 0.04, radius * 0.92, cutColor);
  }
}

function drawMonogram(png, scale = 1) {
  const s = scale;
  const stroke = 94 * s;
  const leftX = 315 * s;
  const middleX = 512 * s;
  const rightX = 709 * s;
  const topY = 370 * s;
  const middleY = 595 * s;
  const bottomY = 740 * s;

  drawLine(png, leftX, bottomY, leftX, topY, stroke, colors.cream);
  drawLine(png, leftX, topY, middleX, middleY, stroke, colors.cream);
  drawLine(png, middleX, middleY, rightX, topY, stroke, colors.cream);
  drawLine(png, rightX, topY, rightX, bottomY, stroke, colors.cream);
  drawLine(png, leftX, topY, middleX, middleY, stroke * 0.42, colors.gold);
  drawLine(png, middleX, middleY, rightX, topY, stroke * 0.42, colors.gold);
}

function iconBackground(x, y, size) {
  const nx = x / size;
  const ny = y / size;
  const radial = clamp(Math.hypot(nx - 0.3, ny - 0.18) * 1.35);
  const base = mix(colors.emerald, colors.emeraldDark, radial);
  const glow = clamp(1 - Math.hypot(nx - 0.72, ny - 0.22) * 2.1);
  return mix(base, [37, 138, 116, 255], glow * 0.45);
}

function transparentBackground() {
  return colors.transparent;
}

function flatBackground(color) {
  return () => color;
}

function writePng(path, png) {
  writeFileSync(path, PNG.sync.write(png));
}

function createIcon(size) {
  const png = createCanvas(size, iconBackground);
  const scale = size / 1024;
  drawRing(png, 512 * scale, 512 * scale, 378 * scale, 18 * scale, [248, 250, 245, 54]);
  drawCrescent(
    png,
    563 * scale,
    252 * scale,
    126 * scale,
    66 * scale,
    colors.gold,
    iconBackground(600 * scale, 250 * scale, size),
  );
  drawCircle(png, 648 * scale, 226 * scale, 13 * scale, colors.cream);
  drawMonogram(png, scale);
  return png;
}

function createForeground(size) {
  const png = createCanvas(size, transparentBackground);
  const scale = size / 1024;
  drawCrescent(png, 563 * scale, 252 * scale, 126 * scale, 66 * scale, colors.gold, colors.transparent);
  drawCircle(png, 648 * scale, 226 * scale, 13 * scale, colors.cream);
  drawMonogram(png, scale);
  return png;
}

function createMonochrome(size) {
  const png = createCanvas(size, transparentBackground);
  const scale = size / 1024;
  drawCrescent(png, 563 * scale, 252 * scale, 126 * scale, 66 * scale, [255, 255, 255, 255], colors.transparent);
  drawCircle(png, 648 * scale, 226 * scale, 13 * scale, [255, 255, 255, 255]);
  const originalCream = colors.cream;
  const originalGold = colors.gold;
  colors.cream = [255, 255, 255, 255];
  colors.gold = [255, 255, 255, 255];
  drawMonogram(png, scale);
  colors.cream = originalCream;
  colors.gold = originalGold;
  return png;
}

writePng('assets/icon.png', createIcon(1024));
writePng('assets/splash-icon.png', createIcon(1024));
writePng('assets/favicon.png', createIcon(48));
writePng('assets/android-icon-background.png', createCanvas(512, flatBackground(colors.emerald)));
writePng('assets/android-icon-foreground.png', createForeground(512));
writePng('assets/android-icon-monochrome.png', createMonochrome(432));
