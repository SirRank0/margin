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
  annotation?: string;
};

const NEGATIVE: Record<1 | 2 | 5, number[]> = {
  1: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01],
  2: [0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01],
  5: [0xfb, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01],
};

function skillChange(ability: number, rank: SkillClick["rank"], annotation?: string): number[] {
  const type = rank === 0 ? 2 : 1;
  const delta = rank === 2 ? 2 : rank === 5 ? 5 : 1;
  const id = encodeVarint(ability);
  const out = [0x08, ...id, 0x10, type, 0x18, ...NEGATIVE[delta]];
  const note = annotation?.trim();
  if (note) {
    const bytes = [...encodeString(note)];
    out.push(0x22, ...encodeVarint(bytes.length), ...bytes);
  }
  return out;
}

function skillOrder(clicks: SkillClick[]): Uint8Array {
  const chunks: number[] = [];
  for (const click of clicks) {
    const body = skillChange(click.ability, click.rank, click.annotation);
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

export type BuildMod = {
  id: number;
  annotation?: string;
  /** Empty inventory slots the game wants free before this buy. */
  flexSlots?: number;
  sellPriority?: number;
  /** Ability this imbue is assigned to. */
  imbueTarget?: number;
};

export type BuildColumn = {
  name: string;
  description?: string;
  optional?: boolean;
  width?: number;
  height?: number;
  itemIds?: number[];
  mods?: BuildMod[];
};

function columnMods(column: BuildColumn): BuildMod[] {
  if (column.mods) return column.mods;
  return (column.itemIds ?? []).map((id) => ({ id }));
}

/**
 * A build the game can import. Field numbers match CMsgHeroBuild:
 * hero id 2, name 5, description 6, details 10, tags 11. Details hold the
 * shop categories (name, note, items, item annotations) and the ability order.
 */
export function encodeHeroBuild(input: {
  heroId: number;
  name: string;
  description?: string;
  tags?: number[];
  columns: BuildColumn[];
  clicks: SkillClick[];
}): Uint8Array {
  if (!Number.isInteger(input.heroId) || input.heroId < 1 || input.heroId > 255) {
    throw new BuildCodecError("Pick a hero before copying a build.");
  }
  const categories = input.columns.map((column) => {
    const mods = columnMods(column).map((mod) => {
      if (!Number.isSafeInteger(mod.id) || mod.id < 1) throw new BuildCodecError("That item isn't a shop item.");
      const fields: Field[] = [{ field: 1, wire: 0, value: mod.id }];
      const note = mod.annotation?.trim();
      if (note) fields.push({ field: 2, wire: 2, bytes: encodeString(note) });
      if (mod.flexSlots && mod.flexSlots > 0) fields.push({ field: 3, wire: 0, value: mod.flexSlots });
      if (mod.sellPriority && mod.sellPriority > 0) fields.push({ field: 4, wire: 0, value: mod.sellPriority });
      if (mod.imbueTarget && mod.imbueTarget > 0) fields.push({ field: 5, wire: 0, value: mod.imbueTarget });
      return encodeMessage(fields);
    });
    const fields: Field[] = mods.map((bytes) => ({ field: 1, wire: 2, bytes }));
    fields.push({ field: 2, wire: 2, bytes: encodeString(column.name) });
    const description = column.description?.trim();
    if (description) fields.push({ field: 3, wire: 2, bytes: encodeString(description) });
    const width = column.width && column.width > 0 ? column.width : 300;
    const height =
      column.height && column.height > 0 ? column.height : Math.max(180, 88 + columnMods(column).length * 64);
    fields.push({ field: 4, wire: 5, bytes: encodeFloat(width) });
    fields.push({ field: 5, wire: 5, bytes: encodeFloat(height) });
    if (column.optional) fields.push({ field: 6, wire: 0, value: 1 });
    return encodeMessage(fields);
  });
  const details = encodeMessage([
    ...categories.map((bytes): Field => ({ field: 1, wire: 2, bytes })),
    { field: 2, wire: 2, bytes: skillOrder(input.clicks) },
  ]);
  const fields: Field[] = [
    { field: 2, wire: 0, value: input.heroId },
    { field: 5, wire: 2, bytes: encodeString(input.name.trim().slice(0, 64)) },
  ];
  const description = input.description?.trim();
  if (description) fields.push({ field: 6, wire: 2, bytes: encodeString(description.slice(0, 280)) });
  fields.push({ field: 10, wire: 2, bytes: details });
  for (const tag of input.tags ?? []) {
    if (tag > 0) fields.push({ field: 11, wire: 0, value: tag });
  }
  return encodeMessage(fields);
}

export type DecodedMod = {
  id: number;
  annotation: string;
  flexSlots: number;
  sellPriority: number;
  imbueTarget: number;
};

export type DecodedColumn = {
  name: string;
  description: string;
  optional: boolean;
  itemIds: number[];
  mods: DecodedMod[];
  width: number;
  height: number;
};

export type DecodedBuild = {
  heroId: number;
  name: string;
  description: string;
  tags: number[];
  columns: DecodedColumn[];
  clicks: SkillClick[];
};

/** Read a build we encoded, or one copied out of the game. */
export function readHeroBuild(decoded: Uint8Array): DecodedBuild {
  const fields = parseMessage(decoded);
  const hero = fields.find((entry): entry is VarintField => entry.field === 2 && entry.wire === 0);
  const nameField = fields.find((entry): entry is BytesField => entry.field === 5 && entry.wire === 2);
  const descriptionField = fields.find((entry): entry is BytesField => entry.field === 6 && entry.wire === 2);
  const details = fields.find((entry): entry is BytesField => entry.field === 10 && entry.wire === 2);
  if (!hero || !details) throw new BuildCodecError("This build is missing a hero or its items.");
  const inner = parseMessage(details.bytes);
  const columns = inner
    .filter((entry): entry is BytesField => entry.field === 1 && entry.wire === 2)
    .map(readColumn);
  const order = inner.find((entry): entry is BytesField => entry.field === 2 && entry.wire === 2);
  const tags = fields
    .filter((entry): entry is VarintField => entry.field === 11 && entry.wire === 0 && entry.value > 0)
    .map((entry) => entry.value);
  return {
    heroId: hero.value,
    name: nameField ? decodeName(nameField.bytes) : "",
    description: descriptionField ? decodeName(descriptionField.bytes) : "",
    tags,
    columns,
    clicks: order ? readClicks(order.bytes) : [],
  };
}

function readFloat(entry: BytesField | undefined): number {
  if (!entry) return 0;
  return new DataView(entry.bytes.buffer, entry.bytes.byteOffset, 4).getFloat32(0, true);
}

function readColumn(entry: BytesField): DecodedColumn {
  const fields = parseMessage(entry.bytes);
  const mods = fields
    .filter((field): field is BytesField => field.field === 1 && field.wire === 2)
    .map(readMod)
    .filter((mod): mod is DecodedMod => mod !== null);
  const nameField = fields.find((field): field is BytesField => field.field === 2 && field.wire === 2);
  const descriptionField = fields.find((field): field is BytesField => field.field === 3 && field.wire === 2);
  const optional = fields.find((field): field is VarintField => field.field === 6 && field.wire === 0);
  const width = fields.find((field): field is BytesField => field.field === 4 && field.wire === 5);
  const height = fields.find((field): field is BytesField => field.field === 5 && field.wire === 5);
  return {
    name: nameField ? decodeName(nameField.bytes) : "",
    description: descriptionField ? decodeName(descriptionField.bytes) : "",
    optional: Boolean(optional && optional.value),
    itemIds: mods.map((mod) => mod.id),
    mods,
    width: readFloat(width),
    height: readFloat(height),
  };
}

function readMod(entry: BytesField): DecodedMod | null {
  const fields = parseMessage(entry.bytes);
  const id = fields.find((field): field is VarintField => field.field === 1 && field.wire === 0);
  if (!id || id.value <= 0) return null;
  const note = fields.find((field): field is BytesField => field.field === 2 && field.wire === 2);
  const flex = fields.find((field): field is VarintField => field.field === 3 && field.wire === 0);
  const sell = fields.find((field): field is VarintField => field.field === 4 && field.wire === 0);
  const imbue = fields.find((field): field is VarintField => field.field === 5 && field.wire === 0);
  return {
    id: id.value,
    annotation: note ? decodeName(note.bytes).trim() : "",
    flexSlots: flex?.value ?? 0,
    sellPriority: sell?.value ?? 0,
    imbueTarget: imbue?.value ?? 0,
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
    if (field === 1) {
      const click = readClick(bytes.subarray(start, end));
      if (click) clicks.push(click);
    }
    i = end;
  }
  return clicks;
}

function readClick(bytes: Uint8Array): SkillClick | null {
  let ability = 0;
  let kind = 0;
  let spent = 0;
  let annotation = "";
  let i = 0;
  while (i < bytes.length) {
    const key = readPlainVarint(bytes, i);
    const field = Math.floor(key.value / 8);
    const wire = key.value % 8;
    i = key.next;
    if (wire === 2) {
      const len = readPlainVarint(bytes, i);
      const start = len.next;
      const end = start + len.value;
      if (end > bytes.length) throw new BuildCodecError("Build code is cut off.");
      if (field === 4) annotation = decodeName(bytes.subarray(start, end)).trim();
      i = end;
      continue;
    }
    if (wire === 5) {
      i += 4;
      continue;
    }
    if (wire === 1) {
      i += 8;
      continue;
    }
    if (wire !== 0) throw new BuildCodecError("A skill step in this build is incomplete.");
    const body = field === 3 ? readSigned32(bytes, i) : readPlainVarint(bytes, i);
    if (field === 1) ability = body.value;
    if (field === 2) kind = body.value;
    if (field === 3) spent = body.value;
    i = body.next;
  }
  if (ability < 1 || (kind !== 1 && kind !== 2)) return null;
  const rank: SkillClick["rank"] = kind === 2 ? 0 : spent === -5 ? 5 : spent === -2 ? 2 : 1;
  return annotation ? { ability, rank, annotation } : { ability, rank };
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

type PublicMod = {
  ability_id?: number | null;
  annotation?: string | null;
  required_flex_slots?: number | null;
  sell_priority?: number | null;
  imbue_target_ability_id?: number | null;
};

type PublicCategory = {
  name?: string | null;
  description?: string | null;
  optional?: boolean | null;
  width?: number | null;
  height?: number | null;
  mods?: PublicMod[] | null;
};

/** The `hero_build` object from GET /v1/builds. */
export type PublicHeroBuild = {
  hero_id?: number | null;
  name?: string | null;
  description?: string | null;
  tags?: number[] | null;
  details?: {
    mod_categories?: PublicCategory[] | null;
    ability_order?: {
      currency_changes?: Array<{
        ability_id?: number | null;
        currency_type?: number | null;
        delta?: number | null;
        annotation?: string | null;
      }> | null;
    } | null;
  } | null;
};

function rankFromSpend(currencyType: number, delta: number): SkillClick["rank"] {
  if (currencyType === 2) return 0;
  if (delta === -5 || delta === 5) return 5;
  if (delta === -2 || delta === 2) return 2;
  return 1;
}

/** Turn a public build from the API into the same shape as a pasted code. */
export function readPublicBuild(hero: PublicHeroBuild): DecodedBuild {
  const heroId = hero.hero_id ?? 0;
  if (!Number.isInteger(heroId) || heroId < 1) throw new BuildCodecError("That public build has no hero.");
  const categories = hero.details?.mod_categories ?? [];
  const columns: DecodedColumn[] = categories.map((column) => {
    const mods: DecodedMod[] = (column.mods ?? [])
      .filter((mod) => typeof mod.ability_id === "number" && mod.ability_id > 0)
      .map((mod) => ({
        id: mod.ability_id as number,
        annotation: mod.annotation?.trim() ?? "",
        flexSlots: mod.required_flex_slots ?? 0,
        sellPriority: mod.sell_priority ?? 0,
        imbueTarget: mod.imbue_target_ability_id ?? 0,
      }));
    return {
      name: column.name?.trim() || "Category",
      description: column.description?.trim() ?? "",
      optional: Boolean(column.optional),
      itemIds: mods.map((mod) => mod.id),
      mods,
      width: column.width ?? 0,
      height: column.height ?? 0,
    };
  });
  const clicks: SkillClick[] = [];
  for (const step of hero.details?.ability_order?.currency_changes ?? []) {
    if (typeof step.ability_id !== "number" || step.ability_id < 1) continue;
    const rank = rankFromSpend(step.currency_type ?? 1, step.delta ?? -1);
    const annotation = step.annotation?.trim();
    clicks.push(annotation ? { ability: step.ability_id, rank, annotation } : { ability: step.ability_id, rank });
  }
  return {
    heroId,
    name: hero.name?.trim() ?? "",
    description: hero.description?.trim() ?? "",
    tags: (hero.tags ?? []).filter((tag) => tag > 0),
    columns,
    clicks,
  };
}
