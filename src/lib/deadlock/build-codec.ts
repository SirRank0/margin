import { heroLabel } from "./heroes.ts";

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

export type BuildInfo = {
  heroId: number;
  heroName: string;
  name: string;
};

type VarintField = { field: number; wire: 0; value: number };
type BytesField = { field: number; wire: 1 | 2 | 5; bytes: Uint8Array };
type Field = VarintField | BytesField;

export class BuildCodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuildCodecError";
  }
}

function readVarint(buf: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let i = offset;
  while (i < buf.length && shift <= 49) {
    const byte = buf[i]!;
    const piece = byte & 0x7f;
    if (value > MAX_SAFE / 128) {
      throw new BuildCodecError("This build code uses a number the converter can't rewrite.");
    }
    value += piece * 2 ** shift;
    i += 1;
    if ((byte & 0x80) === 0) return { value, next: i };
    shift += 7;
  }
  throw new BuildCodecError("Build code is cut off.");
}

function encodeVarint(value: number): number[] {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new BuildCodecError("Invalid hero id.");
  }
  const out: number[] = [];
  let rest = value;
  while (rest > 0x7f) {
    out.push((rest & 0x7f) | 0x80);
    rest = Math.floor(rest / 128);
  }
  out.push(rest);
  return out;
}

function parseMessage(buf: Uint8Array): Field[] {
  const fields: Field[] = [];
  let i = 0;
  while (i < buf.length) {
    const key = readVarint(buf, i);
    const field = Math.floor(key.value / 8);
    const wire = key.value % 8;
    i = key.next;
    if (wire === 0) {
      const body = readVarint(buf, i);
      fields.push({ field, wire: 0, value: body.value });
      i = body.next;
      continue;
    }
    if (wire === 2) {
      const len = readVarint(buf, i);
      const start = len.next;
      const end = start + len.value;
      if (end > buf.length) throw new BuildCodecError("Build code is cut off.");
      fields.push({ field, wire: 2, bytes: buf.subarray(start, end) });
      i = end;
      continue;
    }
    if (wire !== 1 && wire !== 5) {
      throw new BuildCodecError("This build code uses a layout the converter doesn't know.");
    }
    const width = wire === 5 ? 4 : 8;
    if (i + width > buf.length) throw new BuildCodecError("Build code is cut off.");
    fields.push({ field, wire, bytes: buf.subarray(i, i + width) });
    i += width;
  }
  return fields;
}

function encodeMessage(fields: Field[]): Uint8Array {
  const chunks: number[] = [];
  for (const entry of fields) {
    chunks.push(...encodeVarint(entry.field * 8 + entry.wire));
    if (entry.wire === 0) {
      chunks.push(...encodeVarint(entry.value));
      continue;
    }
    if (entry.wire === 2) {
      chunks.push(...encodeVarint(entry.bytes.length));
    }
    for (const byte of entry.bytes) chunks.push(byte);
  }
  return Uint8Array.from(chunks);
}

function decodeName(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function inspectBuild(decoded: Uint8Array): BuildInfo {
  const fields = parseMessage(decoded);
  const hero = fields.find((entry): entry is VarintField => entry.field === 2 && entry.wire === 0);
  if (!hero) throw new BuildCodecError("No hero is stamped on this build.");
  if (hero.value < 1 || hero.value > 255) {
    throw new BuildCodecError("This code doesn't look like a hero build.");
  }
  const nameField = fields.find((entry): entry is BytesField => entry.field === 5 && entry.wire === 2);
  return {
    heroId: hero.value,
    heroName: heroLabel(hero.value),
    name: nameField ? decodeName(nameField.bytes) : "",
  };
}

export function retargetBuild(
  decoded: Uint8Array,
  heroId: number,
  name?: string,
): Uint8Array {
  if (!Number.isInteger(heroId) || heroId < 1 || heroId > 255) {
    throw new BuildCodecError("Pick a real hero id.");
  }
  const fields = parseMessage(decoded);
  let stamped = false;
  const next = fields.map((entry): Field => {
    if (!stamped && entry.field === 2 && entry.wire === 0) {
      stamped = true;
      return { field: 2, wire: 0, value: heroId };
    }
    if (name !== undefined && entry.field === 5 && entry.wire === 2) {
      return { field: 5, wire: 2, bytes: new TextEncoder().encode(name) };
    }
    return entry;
  });
  if (!stamped) throw new BuildCodecError("No hero is stamped on this build.");
  return encodeMessage(next);
}

/** Pull a KLUv/ code out of a messy paste (quotes, line breaks, labels). */
export function extractCode(raw: string): string {
  const compact = raw.replace(/\s+/g, "");
  const start = compact.indexOf("KLUv/");
  if (start < 0) throw new BuildCodecError("Paste the build code. It starts with KLUv/.");
  const body = compact.slice(start).replace(/[^A-Za-z0-9+/=]/g, "");
  if (body.length < 16) throw new BuildCodecError("That code is too short to be a build.");
  return body;
}

export function decodeBase64(code: string): Uint8Array {
  const pad = code.length % 4 === 0 ? "" : "=".repeat(4 - (code.length % 4));
  let binary: string;
  try {
    binary = atob(code + pad);
  } catch {
    throw new BuildCodecError("That paste isn't a build code.");
  }
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  if (out.length < 4 || out[0] !== 0x28 || out[1] !== 0xb5 || out[2] !== 0x2f || out[3] !== 0xfd) {
    throw new BuildCodecError("That paste isn't a compressed build code.");
  }
  return out;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}


export type SkillClick = {
  ability: number;
  /** 0 unlock, 1 the 1-point rank, 2 the 2-point rank, 5 the 5-point rank. */
  rank: 0 | 1 | 2 | 5;
};

const NEGATIVE: Record<1 | 2 | 5, number[]> = {
  1: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01],
  2: [0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01],
  5: [0xfb, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01],
};

function skillChange(ability: number, rank: SkillClick["rank"]): number[] {
  const type = rank === 0 ? 2 : 1;
  const delta = rank === 2 ? 2 : rank === 5 ? 5 : 1;
  const id = encodeVarint(ability);
  return [0x08, ...id, 0x10, type, 0x18, ...NEGATIVE[delta]];
}

function skillOrder(clicks: SkillClick[]): Uint8Array {
  const chunks: number[] = [];
  for (const click of clicks) {
    const body = skillChange(click.ability, click.rank);
    chunks.push(0x0a, ...encodeVarint(body.length), ...body);
  }
  return Uint8Array.from(chunks);
}

/** Replace the build's ability order with the target hero's clicks. */
export function applySkillOrder(decoded: Uint8Array, clicks: SkillClick[]): Uint8Array {
  if (clicks.length === 0) return decoded;
  const fields = parseMessage(decoded);
  const details = fields.find((entry): entry is BytesField => entry.field === 10 && entry.wire === 2);
  if (!details) throw new BuildCodecError("This build has no skill order to replace.");
  const inner = parseMessage(details.bytes);
  const order = skillOrder(clicks);
  let stamped = false;
  const nextInner = inner.map((entry): Field => {
    if (!stamped && entry.field === 2 && entry.wire === 2) {
      stamped = true;
      return { field: 2, wire: 2, bytes: order };
    }
    return entry;
  });
  if (!stamped) nextInner.push({ field: 2, wire: 2, bytes: order });
  const packed = encodeMessage(nextInner);
  return encodeMessage(
    fields.map((entry) =>
      entry.field === 10 && entry.wire === 2 ? { field: 10, wire: 2, bytes: packed } : entry,
    ),
  );
}

function encodeString(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function encodeFloat(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setFloat32(0, value, true);
  return bytes;
}

export type BuildColumn = {
  name: string;
  itemIds: number[];
};

/**
 * A build the game can import. Field numbers match CMsgHeroBuild:
 * hero id 2, name 5, details 10. Details hold the shop columns and the
 * ability-point order.
 */
export function encodeHeroBuild(input: {
  heroId: number;
  name: string;
  columns: BuildColumn[];
  clicks: SkillClick[];
}): Uint8Array {
  if (!Number.isInteger(input.heroId) || input.heroId < 1 || input.heroId > 255) {
    throw new BuildCodecError("Pick a hero before copying a build.");
  }
  const categories = input.columns.map((column) => {
    const mods = column.itemIds.map((id) => {
      if (!Number.isSafeInteger(id) || id < 1) throw new BuildCodecError("That item isn't a shop item.");
      return encodeMessage([{ field: 1, wire: 0, value: id }]);
    });
    const fields: Field[] = mods.map((bytes) => ({ field: 1, wire: 2, bytes }));
    fields.push({ field: 2, wire: 2, bytes: encodeString(column.name) });
    fields.push({ field: 4, wire: 5, bytes: encodeFloat(300) });
    const height = Math.max(180, 88 + column.itemIds.length * 64);
    fields.push({ field: 5, wire: 5, bytes: encodeFloat(height) });
    return encodeMessage(fields);
  });
  const details = encodeMessage([
    ...categories.map((bytes): Field => ({ field: 1, wire: 2, bytes })),
    { field: 2, wire: 2, bytes: skillOrder(input.clicks) },
  ]);
  return encodeMessage([
    { field: 2, wire: 0, value: input.heroId },
    { field: 5, wire: 2, bytes: encodeString(input.name.trim().slice(0, 64)) },
    { field: 10, wire: 2, bytes: details },
  ]);
}

export type DecodedColumn = { name: string; itemIds: number[]; width: number; height: number };

/** Read a build we encoded, so a copy can be checked before it leaves the browser. */
export function readHeroBuild(decoded: Uint8Array): {
  heroId: number;
  name: string;
  columns: DecodedColumn[];
  clicks: SkillClick[];
} {
  const fields = parseMessage(decoded);
  const hero = fields.find((entry): entry is VarintField => entry.field === 2 && entry.wire === 0);
  const nameField = fields.find((entry): entry is BytesField => entry.field === 5 && entry.wire === 2);
  const details = fields.find((entry): entry is BytesField => entry.field === 10 && entry.wire === 2);
  if (!hero || !details) throw new BuildCodecError("This build is missing a hero or its items.");
  const inner = parseMessage(details.bytes);
  const columns = inner
    .filter((entry): entry is BytesField => entry.field === 1 && entry.wire === 2)
    .map(readColumn);
  const order = inner.find((entry): entry is BytesField => entry.field === 2 && entry.wire === 2);
  return {
    heroId: hero.value,
    name: nameField ? decodeName(nameField.bytes) : "",
    columns,
    clicks: order ? readClicks(order.bytes) : [],
  };
}

function readColumn(entry: BytesField): DecodedColumn {
  const fields = parseMessage(entry.bytes);
  const itemIds = fields
    .filter((field): field is BytesField => field.field === 1 && field.wire === 2)
    .map((field) => {
      const id = parseMessage(field.bytes).find(
        (inner): inner is VarintField => inner.field === 1 && inner.wire === 0,
      );
      return id?.value ?? 0;
    })
    .filter((id) => id > 0);
  const nameField = fields.find((field): field is BytesField => field.field === 2 && field.wire === 2);
  const width = fields.find((field): field is BytesField => field.field === 4 && field.wire === 5);
  const height = fields.find((field): field is BytesField => field.field === 5 && field.wire === 5);
  return {
    name: nameField ? decodeName(nameField.bytes) : "",
    itemIds,
    width: width ? new DataView(width.bytes.buffer, width.bytes.byteOffset, 4).getFloat32(0, true) : 0,
    height: height ? new DataView(height.bytes.buffer, height.bytes.byteOffset, 4).getFloat32(0, true) : 0,
  };
}

function readClicks(bytes: Uint8Array): SkillClick[] {
  const clicks: SkillClick[] = [];
  let i = 0;
  while (i < bytes.length) {
    const key = readPlainVarint(bytes, i);
    const field = Math.floor(key.value / 8);
    const wire = key.value % 8;
    i = key.next;
    if (wire !== 2) throw new BuildCodecError("A skill step in this build is incomplete.");
    const len = readPlainVarint(bytes, i);
    const start = len.next;
    const end = start + len.value;
    if (end > bytes.length) throw new BuildCodecError("Build code is cut off.");
    if (field === 1) clicks.push(readClick(bytes.subarray(start, end)));
    i = end;
  }
  return clicks;
}

function readClick(bytes: Uint8Array): SkillClick {
  let ability = 0;
  let kind = 0;
  let spent = 0;
  let i = 0;
  while (i < bytes.length) {
    const key = readPlainVarint(bytes, i);
    const field = Math.floor(key.value / 8);
    const wire = key.value % 8;
    i = key.next;
    if (wire !== 0) throw new BuildCodecError("A skill step in this build is incomplete.");
    const body = field === 3 ? readSigned32(bytes, i) : readPlainVarint(bytes, i);
    if (field === 1) ability = body.value;
    if (field === 2) kind = body.value;
    if (field === 3) spent = body.value;
    i = body.next;
  }
  if (ability < 1 || (kind !== 1 && kind !== 2)) {
    throw new BuildCodecError("A skill step in this build is incomplete.");
  }
  const rank: SkillClick["rank"] = kind === 2 ? 0 : spent === -5 ? 5 : spent === -2 ? 2 : 1;
  return { ability, rank };
}

function readPlainVarint(buf: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let i = offset;
  while (i < buf.length && shift <= 28) {
    const byte = buf[i];
    value += (byte & 0x7f) * 2 ** shift;
    i += 1;
    if ((byte & 0x80) === 0) return { value, next: i };
    shift += 7;
  }
  throw new BuildCodecError("Build code is cut off.");
}

/** A negative ability-point cost is a 10-byte protobuf int32. Keep the low 32 bits. */
function readSigned32(buf: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0n;
  let shift = 0n;
  let i = offset;
  while (i < buf.length && shift <= 63n) {
    const byte = BigInt(buf[i]);
    value |= (byte & 0x7fn) << shift;
    i += 1;
    if ((byte & 0x80n) === 0n) {
      const low = Number(value & 0xffffffffn);
      return { value: low >= 0x80000000 ? low - 0x100000000 : low, next: i };
    }
    shift += 7n;
  }
  throw new BuildCodecError("Build code is cut off.");
}
