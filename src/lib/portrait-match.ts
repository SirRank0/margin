/**
 * Match one portrait slot in a screenshot against every hero's reference art.
 * Each hero gets its own best small shift and scale, then the closest hero must beat the next one clearly.
 */

export type RgbImage = { w: number; h: number; data: Uint8ClampedArray };

/** A reference picture squeezed onto a small grid, with the cells that hold painted pixels. */
export type PortraitRef = {
  id: number;
  cols: number;
  rows: number;
  /** Height over width of the area the grid covers, in reference pixels. */
  aspect: number;
  color: Float32Array;
  luma: Float32Array;
  alpha: Float32Array;
};

/** Where a slot's reference frame sits in the screenshot, and which grid cells are visible there. */
export type SlotFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  visible?: (u: number, v: number) => boolean;
};

export type SlotMatch = {
  id: number;
  score: number;
  runnerId: number;
  runner: number;
  /** Every hero's best score, highest first. */
  ranked: { id: number; score: number }[];
  /** Where the closest hero lined up best. */
  pose?: Pose;
};

export type Verdict = {
  id: number | null;
  sure: boolean;
  match: SlotMatch | null;
};

/** Minimum score and lead over the runner-up before a slot is called without asking. */
export const SURE_SCORE = 0.75;
export const SURE_MARGIN = 0.1;

/** Builds a reference from a ready-made grid of RGBA cells, as written by scripts/build-portrait-refs.py. */
export function refFromGrid(
  id: number,
  cols: number,
  rows: number,
  rgba: Uint8Array | Uint8ClampedArray,
  aspect = rows / cols,
): PortraitRef | null {
  if (rgba.length !== cols * rows * 4) return null;
  const color = new Float32Array(cols * rows * 3);
  const alpha = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    color[i * 3] = rgba[i * 4];
    color[i * 3 + 1] = rgba[i * 4 + 1];
    color[i * 3 + 2] = rgba[i * 4 + 2];
    alpha[i] = rgba[i * 4 + 3];
  }
  return { id, cols, rows, aspect, color, luma: toLuma(color), alpha };
}

export type SearchOptions = {
  /** How far the frame may move, both as a share of its width. */
  shiftX?: number;
  shiftY?: number;
  /** Grid points on each side of the center for the first pass. */
  steps?: number;
  scales?: number[];
  /** Heroes that get a finer second pass around their best spot. */
  refine?: number;
};

export type Pose = { x: number; y: number; w: number; h: number };

/** Best score for every hero at one slot: a coarse pass over shifts and scales, then a fine pass for the closest few. */
export function matchSlot(
  shot: RgbImage,
  frame: SlotFrame,
  refs: PortraitRef[],
  opts: SearchOptions = {},
): SlotMatch | null {
  if (refs.length === 0) return null;
  const shiftX = opts.shiftX ?? 0.1;
  const shiftY = opts.shiftY ?? 0.1;
  const steps = opts.steps ?? 3;
  const scales = opts.scales ?? [0.92, 1, 1.08];
  const best = new Map<number, { score: number; pose: Pose }>();
  const groups = new Map<string, PortraitRef[]>();
  for (const ref of refs) {
    const key = `${ref.cols}x${ref.rows}`;
    const list = groups.get(key) ?? [];
    list.push(ref);
    groups.set(key, list);
  }
  const cx = frame.x + frame.w / 2;
  const cy = frame.y + frame.h / 2;
  const dx = (shiftX * frame.w) / steps;
  const dy = (shiftY * frame.w) / steps;
  for (const list of groups.values()) {
    const { cols, rows } = list[0];
    const visible = visibleCells(frame, cols, rows);
    const trial = (pose: Pose, candidates: PortraitRef[]) => {
      const probe = probeAt(shot, pose, cols, rows);
      if (!probe) return;
      for (const ref of candidates) {
        const score = compare(
          probe.color,
          probe.luma,
          probe.alpha,
          visible,
          ref,
        );
        const seen = best.get(ref.id);
        if (!seen || score > seen.score) best.set(ref.id, { score, pose });
      }
    };
    for (const scale of scales) {
      const w = frame.w * scale;
      const h = frame.h * scale;
      for (let sy = -steps; sy <= steps; sy++) {
        for (let sx = -steps; sx <= steps; sx++)
          trial(
            { x: cx - w / 2 + sx * dx, y: cy - h / 2 + sy * dy, w, h },
            list,
          );
      }
    }
    const leaders = list
      .filter((ref) => best.has(ref.id))
      .sort((a, b) => best.get(b.id)!.score - best.get(a.id)!.score)
      .slice(0, opts.refine ?? 6);
    for (const ref of leaders) {
      const start = best.get(ref.id)!.pose;
      for (const grow of [0.96, 1, 1.04]) {
        const w = start.w * grow;
        const h = start.h * grow;
        const mx = start.x + start.w / 2;
        const my = start.y + start.h / 2;
        for (const fy of [-0.5, 0, 0.5]) {
          for (const fx of [-0.5, 0, 0.5])
            trial({ x: mx - w / 2 + fx * dx, y: my - h / 2 + fy * dy, w, h }, [
              ref,
            ]);
        }
      }
    }
  }
  const ranked = [...best.entries()]
    .map(([id, hit]) => ({ id, score: hit.score }))
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  const top = ranked[0];
  const next = ranked[1] ?? { id: -1, score: -1 };
  return {
    id: top.id,
    score: top.score,
    runnerId: next.id,
    runner: next.score,
    ranked,
    pose: best.get(top.id)?.pose,
  };
}

function visibleCells(frame: SlotFrame, cols: number, rows: number) {
  const visible = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++)
      visible[r * cols + c] =
        !frame.visible || frame.visible((c + 0.5) / cols, (r + 0.5) / rows)
          ? 1
          : 0;
  }
  return visible;
}

function probeAt(shot: RgbImage, pose: Pose, cols: number, rows: number) {
  const { x, y, w, h } = pose;
  if (
    x < -w * 0.25 ||
    y < -h * 0.25 ||
    x + w > shot.w + w * 0.25 ||
    y + h > shot.h + h * 0.25
  )
    return null;
  const color = new Float32Array(cols * rows * 3);
  const alpha = new Float32Array(cols * rows);
  sampleRect(shot, x, y, w, h, cols, rows, color, alpha);
  return { color, alpha, luma: toLuma(color) };
}

/** A slot is named only when its best hero is close and clearly ahead of the next one. */
export function decide(
  match: SlotMatch | null,
  minScore = SURE_SCORE,
  minMargin = SURE_MARGIN,
): Verdict {
  if (!match) return { id: null, sure: false, match };
  const sure =
    match.score >= minScore && match.score - match.runner >= minMargin;
  return { id: match.id, sure, match };
}

/**
 * Color pattern, brightness pattern, and closeness together, over the whole frame.
 * Where the reference is see-through it is filled with the screenshot's own background there,
 * so the outline of the head counts as well as what is inside it. Brightness carries greyed-out portraits.
 */
function compare(
  color: Float32Array,
  luma: Float32Array,
  shotAlpha: Float32Array,
  visible: Uint8Array,
  ref: PortraitRef,
): number {
  const n = ref.alpha.length;
  let bgCount = 0;
  let bg0 = 0,
    bg1 = 0,
    bg2 = 0;
  for (let i = 0; i < n; i++) {
    if (!visible[i] || shotAlpha[i] < 160 || ref.alpha[i] > 60) continue;
    bgCount++;
    bg0 += color[i * 3];
    bg1 += color[i * 3 + 1];
    bg2 += color[i * 3 + 2];
  }
  if (bgCount > 0) {
    bg0 /= bgCount;
    bg1 /= bgCount;
    bg2 /= bgCount;
  }
  const want = bgCount > 0 ? 60 : 160;
  let count = 0;
  let m0 = 0,
    m1 = 0,
    m2 = 0,
    r0 = 0,
    r1 = 0,
    r2 = 0;
  const filled = fill.length >= n * 3 ? fill : (fill = new Float32Array(n * 3));
  for (let i = 0; i < n; i++) {
    if (
      !visible[i] ||
      shotAlpha[i] < 160 ||
      (ref.alpha[i] <= want - 1e-3 && bgCount === 0)
    )
      continue;
    const a = bgCount > 0 ? ref.alpha[i] / 255 : 1;
    filled[i * 3] = ref.color[i * 3] * a + bg0 * (1 - a);
    filled[i * 3 + 1] = ref.color[i * 3 + 1] * a + bg1 * (1 - a);
    filled[i * 3 + 2] = ref.color[i * 3 + 2] * a + bg2 * (1 - a);
    count++;
    m0 += color[i * 3];
    m1 += color[i * 3 + 1];
    m2 += color[i * 3 + 2];
    r0 += filled[i * 3];
    r1 += filled[i * 3 + 1];
    r2 += filled[i * 3 + 2];
  }
  if (count < 12) return -1;
  m0 /= count;
  m1 /= count;
  m2 /= count;
  r0 /= count;
  r1 /= count;
  r2 /= count;
  const ml = 0.299 * m0 + 0.587 * m1 + 0.114 * m2;
  const rl = 0.299 * r0 + 0.587 * r1 + 0.114 * r2;
  let cxy = 0,
    cxx = 0,
    cyy = 0,
    lxy = 0,
    lxx = 0,
    lyy = 0;
  let diff = 0;
  for (let i = 0; i < n; i++) {
    if (
      !visible[i] ||
      shotAlpha[i] < 160 ||
      (ref.alpha[i] <= want - 1e-3 && bgCount === 0)
    )
      continue;
    const a0 = color[i * 3] - m0,
      a1 = color[i * 3 + 1] - m1,
      a2 = color[i * 3 + 2] - m2;
    const f0 = filled[i * 3],
      f1 = filled[i * 3 + 1],
      f2 = filled[i * 3 + 2];
    const b0 = f0 - r0,
      b1 = f1 - r1,
      b2 = f2 - r2;
    cxy += a0 * b0 + a1 * b1 + a2 * b2;
    cxx += a0 * a0 + a1 * a1 + a2 * a2;
    cyy += b0 * b0 + b1 * b1 + b2 * b2;
    const al = luma[i] - ml;
    const bl = 0.299 * f0 + 0.587 * f1 + 0.114 * f2 - rl;
    lxy += al * bl;
    lxx += al * al;
    lyy += bl * bl;
    diff +=
      Math.abs(color[i * 3] - f0) +
      Math.abs(color[i * 3 + 1] - f1) +
      Math.abs(color[i * 3 + 2] - f2);
  }
  const ncc = cxx > 1 && cyy > 1 ? cxy / Math.sqrt(cxx * cyy) : 0;
  const lncc = lxx > 1 && lyy > 1 ? lxy / Math.sqrt(lxx * lyy) : 0;
  const close = 1 - Math.min(1, diff / (count * 3 * 96));
  return 0.45 * ncc + 0.35 * lncc + 0.2 * close;
}

let fill = new Float32Array(0);

function toLuma(color: Float32Array): Float32Array {
  const out = new Float32Array(color.length / 3);
  for (let i = 0; i < out.length; i++)
    out[i] =
      0.299 * color[i * 3] +
      0.587 * color[i * 3 + 1] +
      0.114 * color[i * 3 + 2];
  return out;
}

/** Box-averaged colors of a rectangle on a cols x rows grid. Pixels outside the picture count as transparent. */
export function sampleRect(
  image: RgbImage,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
  color: Float32Array,
  alpha: Float32Array,
) {
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    const ya = y + r * ch;
    const y0 = Math.max(0, Math.floor(ya));
    const y1 = Math.min(image.h, Math.max(y0 + 1, Math.ceil(ya + ch)));
    for (let c = 0; c < cols; c++) {
      const xa = x + c * cw;
      const x0 = Math.max(0, Math.floor(xa));
      const x1 = Math.min(image.w, Math.max(x0 + 1, Math.ceil(xa + cw)));
      let s0 = 0,
        s1 = 0,
        s2 = 0,
        sa = 0,
        k = 0,
        wsum = 0;
      for (let py = y0; py < y1; py++) {
        const row = py * image.w;
        for (let px = x0; px < x1; px++) {
          const i = (row + px) * 4;
          const a = image.data[i + 3];
          s0 += image.data[i] * a;
          s1 += image.data[i + 1] * a;
          s2 += image.data[i + 2] * a;
          wsum += a;
          sa += a;
          k++;
        }
      }
      const o = r * cols + c;
      const inside = Math.max(
        0,
        Math.min(
          1,
          ((Math.min(x1, xa + cw) - Math.max(x0, xa)) *
            (Math.min(y1, ya + ch) - Math.max(y0, ya))) /
            (cw * ch),
        ),
      );
      if (k === 0 || wsum === 0) {
        color[o * 3] = color[o * 3 + 1] = color[o * 3 + 2] = 0;
        alpha[o] = 0;
        continue;
      }
      color[o * 3] = s0 / wsum;
      color[o * 3 + 1] = s1 / wsum;
      color[o * 3 + 2] = s2 / wsum;
      alpha[o] = (sa / k) * inside;
    }
  }
}
