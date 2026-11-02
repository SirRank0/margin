"""Write src/data/shop-items.ts from the Deadlock assets item list.

Shop rows are the upgrades the game currently sells (shopable, shop version 0).
Tooltip text is the in-game card: innate lines, the active or passive
description, the stats under it, and the component it upgrades from.
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "shop-items.ts"
API = "https://api.deadlock-api.com/v1/assets/items"

SLOT_ORDER = {"weapon": 0, "vitality": 1, "spirit": 2}
CASTS = {
    "passive": "passive",
    "instant_cast": "active",
    "press": "press",
    "instant_cast_toggle": "toggle",
}
IMBUES = {
    "imbue_active": "Imbues an ability",
    "imbue_active_non_ult": "Imbues a non-ultimate ability",
    "imbue_modifier_value": "Imbues an ability",
}


def clean_text(value: str) -> str:
    text = re.sub(r"<svg\b[\s\S]*?</svg>", "", value, flags=re.IGNORECASE)
    text = text.replace("\xa0", " ").replace("\r", "")
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def format_value(prop: dict) -> str | None:
    value = prop.get("value")
    if value is None:
        return None
    postfix = prop.get("postfix") or ""
    prefix = prop.get("prefix") or ""
    if isinstance(value, float):
        raw = str(int(value)) if value.is_integer() else f"{value:g}"
    elif isinstance(value, int):
        raw = str(value)
    else:
        raw = str(value).strip()
    if not raw or raw.lower() == "none":
        return None
    match = re.match(r"^-?\d+(?:\.\d+)?", raw.replace(",", ""))
    number = float(match.group(0)) if match else None
    if number == 0:
        return None
    sign = ""
    if prefix == "{s:sign}":
        if (number is None or number > 0) and not raw.startswith("+"):
            sign = "+"
    elif prefix == "-":
        if not raw.startswith("-"):
            sign = "-"
    elif isinstance(prefix, str) and prefix and not prefix.startswith("{") and not prefix.startswith("<"):
        sign = prefix
    unit = ""
    postfix_text = postfix.strip()
    if postfix_text and not raw.endswith(postfix_text):
        unit = postfix_text
    return f"{sign}{raw}{unit}"


def scale_of(prop: dict) -> dict | None:
    scale = prop.get("scale_function") or {}
    value = scale.get("stat_scale")
    if not isinstance(value, (int, float)) or value == 0:
        return None
    name = scale.get("class_name") or ""
    spec = scale.get("specific_stat_scale_type") or ""
    if "Boon" in spec or "boon" in name:
        kind = "boon"
    elif "Weapon" in spec or "weapon" in name:
        kind = "weapon"
    else:
        kind = "spirit"
    rounded = round(float(value), 3)
    return {"v": int(rounded) if rounded.is_integer() else rounded, "t": kind}


def as_stat(prop: dict) -> dict | None:
    text = format_value(prop)
    if not text:
        return None
    stat = {"n": prop.get("label") or "Stat", "v": text}
    icon = prop.get("icon")
    if isinstance(icon, str) and icon:
        stat["icon"] = icon
    scale = scale_of(prop)
    if scale:
        stat["sc"] = scale
    return stat


def body_of(item: dict) -> str:
    parts: list[str] = []
    for section in item.get("tooltip_sections") or []:
        if section.get("section_type") == "innate":
            continue
        for attr in section.get("section_attributes") or []:
            text = clean_text(attr.get("loc_string") or "")
            if text:
                parts.append(text)
    if parts:
        return "\n".join(parts)
    description = item.get("description") or {}
    if isinstance(description, dict):
        for key in ("active", "passive", "desc", "desc2"):
            text = clean_text(description.get(key) or "")
            if text:
                parts.append(text)
    return "\n".join(parts)


def card_stats(item: dict) -> tuple[list[dict], list[dict], str | None]:
    props = item.get("properties") or {}
    innate: list[dict] = []
    effects: list[dict] = []
    seen: set[str] = set()
    cooldown = None
    for section in item.get("tooltip_sections") or []:
        kind = section.get("section_type")
        for attr in section.get("section_attributes") or []:
            ordered: list[str] = []
            for key in (
                list(attr.get("elevated_properties") or [])
                + list(attr.get("important_properties") or [])
                + list(attr.get("properties") or [])
            ):
                if key not in ordered:
                    ordered.append(key)
            for key in ordered:
                if key in seen:
                    continue
                prop = props.get(key)
                if key == "AbilityCooldown":
                    seen.add(key)
                    if prop and cooldown is None:
                        cooldown = format_value(prop)
                    continue
                if not prop:
                    continue
                stat = as_stat(prop)
                if not stat:
                    continue
                seen.add(key)
                if kind == "innate":
                    innate.append(stat)
                else:
                    effects.append(stat)
    return innate, effects, cooldown


def shop_row(item: dict, by_class: dict[str, dict]) -> dict:
    innate, effects, cooldown = card_stats(item)
    slot = item.get("item_slot_type")
    if slot not in SLOT_ORDER:
        raise SystemExit(f"unknown slot on {item.get('name')}: {slot}")
    row = {
        "id": item["id"],
        "name": item["name"],
        "cost": item.get("cost") or 0,
        "tier": item.get("item_tier") or 0,
        "slot": slot,
        "active": bool(item.get("is_active_item")),
        "cast": CASTS.get(item.get("activation") or "", "passive"),
        "image": item.get("shop_image_webp") or item.get("image_webp") or "",
        "body": body_of(item),
        "innate": innate,
        "effects": effects,
        "from": [],
    }
    if cooldown:
        row["cooldown"] = cooldown
    note = IMBUES.get(item.get("imbue") or "")
    if note:
        row["imbue"] = note
    components = []
    for class_name in item.get("component_items") or []:
        other = by_class.get(class_name)
        if other:
            components.append(other["id"])
    row["from"] = components
    return row


def load_items() -> list[dict]:
    request = urllib.request.Request(API, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = json.load(response)
    if not isinstance(payload, list):
        raise SystemExit("item payload was not a list")
    return payload


def main() -> None:
    items = load_items()
    upgrades = [item for item in items if item.get("type") == "upgrade" and item.get("shopable")]
    by_class = {item["class_name"]: item for item in upgrades}
    rows = [shop_row(item, by_class) for item in upgrades]
    rows.sort(key=lambda row: (SLOT_ORDER[row["slot"]], row["tier"], row["name"].lower(), row["id"]))
    ids = [row["id"] for row in rows]
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate shop item id")
    header = """/** Shop items from the Deadlock assets API. Abilities and unreleased mods are not included. */
export type ShopSlot = "weapon" | "vitality" | "spirit";

export type ShopScale = { v: number; t: "spirit" | "boon" | "weapon" };

export type ShopStat = {
  n: string;
  v: string;
  icon?: string;
  sc?: ShopScale;
};

export type ShopCast = "passive" | "active" | "press" | "toggle";

export type ShopItem = {
  id: number;
  name: string;
  cost: number;
  tier: number;
  slot: ShopSlot;
  active: boolean;
  cast: ShopCast;
  image: string;
  /** In-game description. Highlight and attribute spans are kept. */
  body: string;
  innate: ShopStat[];
  effects: ShopStat[];
  from: number[];
  cooldown?: string;
  imbue?: string;
};

export const shopItems: ShopItem[] = """
    OUT.write_text(header + json.dumps(rows, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"wrote {len(rows)} items to {OUT}")


if __name__ == "__main__":
    main()
