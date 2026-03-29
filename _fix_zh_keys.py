#!/usr/bin/env python3
"""Fix zh data files: revert filter/key fields back to English values.
These fields are used for code filtering (e.g. item_type === 'Weapon')
and must NOT be translated."""
import json, os

DATA_DIR = "src/data"
ZH_DIR = os.path.join(DATA_DIR, "zh")

# ── Reverse maps (Chinese → English) ──
ITEM_TYPE_REV = {
    "快速使用": "Quick Use",
    "武器": "Weapon",
    "护盾": "Shield",
    "增强器": "Augment",
    "改装件": "Modification",
    "弹药": "Ammunition",
    "地面材料": "Topside Material",
    "可回收物": "Recyclable",
    "饰品": "Trinket",
    "投掷物": "Throwable",
    "消耗品": "Consumable",
    "医疗": "Medical",
    "蓝图": "Blueprint",
    "背包": "Backpack",
    "工具": "Tool",
    "钥匙": "Key",
    "小工具": "Gadget",
}

RARITY_REV = {
    "普通": "Common",
    "优良": "Uncommon",
    "稀有": "Rare",
    "史诗": "Epic",
    "传说": "Legendary",
}

TRADER_NAME_REV = {
    "沙妮": "Shani",
    "阿波罗": "Apollo",
    "天问": "TianWen",
    "赛莱斯特": "Celeste",
    "兰斯": "Lance",
}

GUIDE_TYPE_REV = {
    "任务": "quest",
    "通用": "general",
}

# ── Fix items_zh.json ──
with open(os.path.join(ZH_DIR, "items_zh.json"), "r") as f:
    items = json.load(f)

for item in items:
    it = item.get("item_type", "")
    if it in ITEM_TYPE_REV:
        item["item_type"] = ITEM_TYPE_REV[it]
    r = item.get("rarity", "")
    if r in RARITY_REV:
        item["rarity"] = RARITY_REV[r]

with open(os.path.join(ZH_DIR, "items_zh.json"), "w") as f:
    json.dump(items, f, ensure_ascii=False)
print(f"✓ items_zh.json: fixed {len(items)} items")

# ── Fix traders_zh.json ──
with open(os.path.join(ZH_DIR, "traders_zh.json"), "r") as f:
    traders = json.load(f)

for t in traders:
    tn = t.get("trader_name", "")
    if tn in TRADER_NAME_REV:
        t["trader_name"] = TRADER_NAME_REV[tn]
    it = t.get("item_type", "")
    if it in ITEM_TYPE_REV:
        t["item_type"] = ITEM_TYPE_REV[it]
    r = t.get("item_rarity", "")
    if r in RARITY_REV:
        t["item_rarity"] = RARITY_REV[r]

with open(os.path.join(ZH_DIR, "traders_zh.json"), "w") as f:
    json.dump(traders, f, ensure_ascii=False)
print(f"✓ traders_zh.json: fixed {len(traders)} entries")

# ── Fix guides_zh.json ──
with open(os.path.join(ZH_DIR, "guides_zh.json"), "r") as f:
    guides = json.load(f)

for g in guides:
    gt = g.get("type", "")
    if gt in GUIDE_TYPE_REV:
        g["type"] = GUIDE_TYPE_REV[gt]

with open(os.path.join(ZH_DIR, "guides_zh.json"), "w") as f:
    json.dump(guides, f, ensure_ascii=False, indent=2)
print(f"✓ guides_zh.json: fixed {len(guides)} guides")

# ── Fix quests_zh.json (revert quest_giver to English for matching) ──
QUEST_GIVER_REV = {
    "沙妮": "Shani",
    "阿波罗": "Apollo",
    "天问": "Tian Wen",
    "赛莱斯特": "Celeste",
    "兰斯": "Lance",
}

with open(os.path.join(ZH_DIR, "quests_zh.json"), "r") as f:
    quests = json.load(f)

for q in quests.get("quests", []):
    qg = q.get("quest_giver", "")
    if qg in QUEST_GIVER_REV:
        q["quest_giver"] = QUEST_GIVER_REV[qg]

with open(os.path.join(ZH_DIR, "quests_zh.json"), "w") as f:
    json.dump(quests, f, ensure_ascii=False, indent=2)
print(f"✓ quests_zh.json: fixed quest_giver fields")

# ── Fix maps_zh.json (revert difficulty to English for getDifficultyColor) ──
DIFFICULTY_REV = {
    "简单": "Easy",
    "中等": "Medium",
    "困难": "Hard",
}

with open(os.path.join(ZH_DIR, "maps_zh.json"), "r") as f:
    maps = json.load(f)

for m in maps:
    d = m.get("difficulty", "")
    if d in DIFFICULTY_REV:
        m["difficulty"] = DIFFICULTY_REV[d]

with open(os.path.join(ZH_DIR, "maps_zh.json"), "w") as f:
    json.dump(maps, f, ensure_ascii=False, indent=2)
print(f"✓ maps_zh.json: fixed difficulty fields")

print("\nDone! All filter/key fields reverted to English.")
