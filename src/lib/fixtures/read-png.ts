/** Tiny PNG reader for test fixtures: 8-bit RGB or RGBA, not interlaced. Node only. */
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

export function readPng(path: string): {
  w: number;
  h: number;
  data: Uint8ClampedArray;
} {
  const file = readFileSync(path);
  let offset = 8;
  let w = 0;
  let h = 0;
  let channels = 0;
  const parts: Buffer[] = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString("ascii", offset + 4, offset + 8);
    const body = file.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      const depth = body[8];
      const color = body[9];
      if (depth !== 8 || body[12] !== 0 || (color !== 2 && color !== 6))
        throw new Error(`unsupported PNG: ${path}`);
      channels = color === 2 ? 3 : 4;
    } else if (type === "IDAT") {
      parts.push(body);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts));
  const stride = w * channels;
  const pixels = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const corner =
        x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      let add = 0;
      if (filter === 1) add = left;
      else if (filter === 2) add = up;
      else if (filter === 3) add = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - corner;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - corner);
        add = pa <= pb && pa <= pc ? left : pb <= pc ? up : corner;
      }
      pixels[y * stride + x] = (line[x] + add) & 255;
    }
  }
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = pixels[i * channels];
    data[i * 4 + 1] = pixels[i * channels + 1];
    data[i * 4 + 2] = pixels[i * channels + 2];
    data[i * 4 + 3] = channels === 4 ? pixels[i * channels + 3] : 255;
  }
  return { w, h, data };
}
