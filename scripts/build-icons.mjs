// Draws the extension icons without image dependencies: a dark circle with
// a white "67", matching the on-page count badge.
import { mkdir, writeFile } from "node:fs/promises";
import { crc32, deflateSync } from "node:zlib";

const BADGE = [17, 24, 39];
const WHITE = [255, 255, 255];

// Chrome Web Store asks for 96px artwork inside a 128px icon; smaller sizes use
// nearly the whole canvas so they stay legible.
const SIZES = { 16: 0, 32: 1, 48: 2, 128: 16 };
const SUPERSAMPLE = 8;

function capsule(x, y, ax, ay, bx, by, r) {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - (ax + t * vx), y - (ay + t * vy)) <= r;
}

// Colour at a point in artwork space (0..1 on both axes), or null if outside.
// Digits are single strokes with round caps: a "6" (loop plus rising stroke)
// and a "7" (bar plus diagonal).
function sample(x, y) {
  if (Math.hypot(x - 0.5, y - 0.5) > 0.5) return null;
  const stroke = 0.055;
  const six =
    Math.abs(Math.hypot(x - 0.35, y - 0.595) - 0.125) <= stroke ||
    capsule(x, y, 0.235, 0.55, 0.39, 0.28, stroke);
  const seven =
    capsule(x, y, 0.53, 0.28, 0.755, 0.28, stroke) ||
    capsule(x, y, 0.755, 0.28, 0.6, 0.72, stroke);
  return six || seven ? WHITE : BADGE;
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
