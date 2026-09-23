// Draws the extension icons without image dependencies: a dark badge with a
// tally mark and a segmented colour bar, matching the on-page counter.
import { mkdir, writeFile } from "node:fs/promises";
import { crc32, deflateSync } from "node:zlib";

const BADGE = [17, 24, 39];
const WHITE = [255, 255, 255];
const BAR = [
  [255, 255, 255],
  [200, 30, 30],
  [250, 204, 21],
  [21, 128, 61],
  [29, 78, 216],
  [126, 34, 206]
];

// Chrome Web Store asks for 96px artwork inside a 128px icon; smaller sizes use
// nearly the whole canvas so they stay legible.
const SIZES = { 16: 0, 32: 1, 48: 2, 128: 16 };
const SUPERSAMPLE = 8;

function roundedRect(x, y, x0, y0, x1, y1, r) {
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return Math.hypot(dx, dy) <= r && x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function capsule(x, y, ax, ay, bx, by, r) {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - (ax + t * vx), y - (ay + t * vy)) <= r;
}

// Colour at a point in artwork space (0..1 on both axes), or null if outside.
function sample(x, y) {
  if (!roundedRect(x, y, 0, 0, 1, 1, 0.22)) return null;
  if (roundedRect(x, y, 0.16, 0.7, 0.84, 0.84, 0.07)) {
    const segment = Math.min(BAR.length - 1, Math.floor(((x - 0.16) / 0.68) * BAR.length));
    return BAR[segment];
  }
  const stroke = 0.05;
  for (const tx of [0.28, 0.42, 0.56, 0.7]) {
    if (capsule(x, y, tx, 0.18, tx, 0.56, stroke)) return WHITE;
  }
  if (capsule(x, y, 0.18, 0.5, 0.8, 0.24, stroke)) return WHITE;
  return BADGE;
}

function render(size, padding) {
  const pixels = Buffer.alloc(size * size * 4);
  const art = size - padding * 2;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const sum = [0, 0, 0];
      let hits = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const x = (px + (sx + 0.5) / SUPERSAMPLE - padding) / art;
          const y = (py + (sy + 0.5) / SUPERSAMPLE - padding) / art;
          const colour = sample(x, y);
          if (!colour) continue;
          hits += 1;
          for (let i = 0; i < 3; i += 1) sum[i] += colour[i];
        }
      }
      const offset = (py * size + px) * 4;
      if (hits) for (let i = 0; i < 3; i += 1) pixels[offset + i] = Math.round(sum[i] / hits);
      pixels[offset + 3] = Math.round((hits / SUPERSAMPLE ** 2) * 255);
    }
  }
  return png(size, pixels);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    rows.push(Buffer.from([0]), pixels.subarray(y * size * 4, (y + 1) * size * 4));
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

const dir = new URL("../icons/", import.meta.url);
await mkdir(dir, { recursive: true });
for (const [size, padding] of Object.entries(SIZES)) {
  await writeFile(new URL(`icon-${size}.png`, dir), render(Number(size), padding));
}
