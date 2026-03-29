#!/usr/bin/env python3
"""Generate Chinese translation data files for quests, traders, and items."""
import json, os

DATA_DIR = "src/data"
ZH_DIR = os.path.join(DATA_DIR, "zh")

# ─── Quest translations ───
QUEST_NAME_ZH = {
    "Picking Up The Pieces": "拾起碎片",
    "Clearer Skies": "更晴朗的天空",
    "An Innocent Probe": "无害的探测器",
    "A Balanced Harvest": "平衡的收获",
    "A Bad Feeling": "不好的预感",
    "A Better Use": "更好的用途",
    "Call For Help": "求助信号",
    "Crack Open": "破壳而出",
    "Deadly Dash": "致命冲刺",
    "Emergency Services": "紧急服务",
    "Engineer's Blueprint": "工程师的蓝图",
    "Fair Trade": "公平交易",
    "Feed The Fire": "添火加柴",
    "Fire And Forget": "发射后不管",
    "Firebugs": "纵火虫",
    "First Steps": "第一步",
    "First Supply Drop": "第一次补给投放",
    "Good Samaritan": "好撒玛利亚人",
    "Gotta Keep Moving": "必须继续前进",
    "Grease The Wheels": "润滑齿轮",
    "Healing Hand": "治愈之手",
    "Heavy Lifting": "重型搬运",
    "High Value Target": "高价值目标",
    "Hive Mind": "蜂巢思维",
    "House Calls": "上门服务",
    "In And Out": "速进速出",
    "Into The Unknown": "走向未知",
    "Keeping Watch": "保持警惕",
    "Last Resort": "最后手段",
    "Lock And Load": "上膛准备",
    "Long Shot": "远距离射击",
    "Material World": "物质世界",
    "Mining Operation": "采矿行动",
    "On The Clock": "计时行动",
    "Open Skies": "开阔天空",
    "Pack Mule": "驮骡",
    "Parts Unknown": "未知零件",
    "Pest Control": "害虫控制",
    "Pop Goes The Weasel": "黄鼠狼来了",
    "Quick Draw": "快速拔枪",
    "Raider's Toolkit": "突袭者工具包",
    "Repair Job": "修复工作",
    "Rising Tensions": "紧张升级",
    "Running Errands": "跑腿任务",
    "Salvage Rights": "打捞权",
    "Scavenger Hunt": "拾荒猎人",
    "Scout's Honor": "侦察兵的荣誉",
    "Shock And Awe": "震慑行动",
    "Snitch Hunt": "猎捕告密者",
    "Startup Sequence": "启动序列",
    "Steady Hands": "稳定之手",
    "Survival Instinct": "求生本能",
    "Target Practice": "射击练习",
    "The Big Haul": "大收获",
    "The Bigger They Are": "越大越笨",
    "The Last Laugh": "笑到最后",
    "The Long Game": "持久战",
    "Tick Tock": "滴答作响",
    "Tool Time": "工具时间",
    "Trail Blazer": "开拓者",
    "Under Pressure": "压力之下",
    "Vital Signs": "生命体征",
    "Wrecking Ball": "破坏之球",
    "A First Foothold": "第一个据点",
    "A Lay Of The Land": "地形勘察",
    "Alpine Ascent": "高山攀登",
    "Cold Storage": "冷库",
    "Deep Cuts": "深切",
    "Frozen Assets": "冻结资产",
    "Mountain Recon": "山地侦察",
    "Peak Performance": "巅峰表现",
    "Snow Blind": "雪盲",
    "Summit Push": "冲顶",
}

OBJECTIVE_ZH = {
    "Visit any area on your map with a loot category icon": "访问地图上有战利品分类图标的任意区域",
    "Loot 3 containers": "搜刮3个容器",
    "Destroy 3 ARC enemies": "消灭3个ARC敌人",
    "Get 3 ARC Alloy for Shani": "为沙妮获取3个ARC合金",
    "Find and search any ARC Probe or ARC Courier": "找到并搜索任意ARC探测器或ARC信使",
    "Kill 3 Wasps": "消灭3只黄蜂",
    "Collect 3 Topside Material": "收集3个地面材料",
    "Kill 3 Hornets": "消灭3只大黄蜂",
    "Craft 1 item at a workbench": "在工作台制作1件物品",
    "Visit a Call Station and request a Supply Drop": "访问呼叫站并请求补给投放",
    "Collect the Supply Drop": "收集补给投放",
    "Use a healing item": "使用一个治疗物品",
    "Pick up and deliver a crate to a Field Depot": "拾取并将箱子运送到野战补给站",
    "Kill any ARC enemy with a grenade": "用手雷消灭任意ARC敌人",
    "Deal damage to 3 Hornets": "对3只大黄蜂造成伤害",
    "Kill a Fireball": "消灭一个火球",
    "Destroy a Turret": "摧毁一个炮塔",
    "Repair any broken object": "修复任意损坏的物体",
    "Kill 5 ARC enemies": "消灭5个ARC敌人",
    "Loot 5 containers": "搜刮5个容器",
    "Reach the extraction zone": "到达撤离区",
    "Find and search 2 ARC Probes": "找到并搜索2个ARC探测器",
    "Find a Field Depot": "找到一个野战补给站",
    "Kill 3 Fireballs": "消灭3个火球",
    "Kill 5 Wasps": "消灭5只黄蜂",
    "Kill a Hornet": "消灭一只大黄蜂",
    "Loot 10 containers": "搜刮10个容器",
    "Kill 10 ARC enemies": "消灭10个ARC敌人",
    "Craft 3 items": "制作3件物品",
    "Use a Shield": "使用护盾",
    "Kill 2 Snitches": "消灭2个告密者",
    "Collect 5 Topside Materials": "收集5个地面材料",
    "Deliver 2 crates to Field Depots": "运送2个箱子到野战补给站",
    "Kill a Snitch before it alerts": "在告密者发出警报前消灭它",
    "Destroy 2 Turrets": "摧毁2个炮塔",
    "Craft 5 items at workbenches": "在工作台制作5件物品",
    "Kill 15 ARC enemies": "消灭15个ARC敌人",
    "Deal damage to any ARC using a throwable": "使用投掷物对任意ARC造成伤害",
    "Reach level 5": "达到5级",
    "Kill a Sentinel": "消灭一个哨兵",
    "Complete an extraction": "完成一次撤离",
    "Kill 3 Ticks": "消灭3只蜱虫",
    "Find and loot a rare container": "找到并搜刮一个稀有容器",
    "Kill a Bastion": "消灭一个堡垒",
    "Survive 5 minutes in a single raid": "在单次突袭中存活5分钟",
}

UNLOCK_REQ_ZH = {
    "Dam Battlegrounds Unlocked": "水坝战场已解锁",
    "Blue Gate Unlocked": "蓝门已解锁",
    "Stella Montis Unlocked": "星辰之山已解锁",
    "Starting area": "起始区域",
    "18 rounds played": "已进行18轮",
    "24 rounds played": "已进行24轮",
}

LOCATION_ZH = {
    "Any": "任意",
    "Dam Battlegrounds": "水坝战场",
    "Blue Gate": "蓝门",
    "Stella Montis": "星辰之山",
    "The Spaceport": "太空港",
    "Buried City": "掩埋之城",
}

QUEST_GIVER_ZH = {
    "Shani": "沙妮",
    "Apollo": "阿波罗",
    "TianWen": "天问",
    "Tian Wen": "天问",
    "Celeste": "赛莱斯特",
    "Lance": "兰斯",
}

# ─── Build quests_zh.json ───
with open(os.path.join(DATA_DIR, "quests.json"), "r") as f:
    quests = json.load(f)

quests_zh = json.loads(json.dumps(quests))  # deep copy

# Translate metadata
if "unlock_requirements" in quests_zh:
    ur = quests_zh["unlock_requirements"]
    ur["dam_battlegrounds"] = UNLOCK_REQ_ZH.get(ur.get("dam_battlegrounds", ""), ur.get("dam_battlegrounds", ""))
    ur["blue_gate"] = UNLOCK_REQ_ZH.get(ur.get("blue_gate", ""), ur.get("blue_gate", ""))
    ur["stella_montis"] = UNLOCK_REQ_ZH.get(ur.get("stella_montis", ""), ur.get("stella_montis", ""))

for q in quests_zh.get("quests", []):
    q["name"] = QUEST_NAME_ZH.get(q["name"], q["name"])
    q["quest_giver"] = QUEST_GIVER_ZH.get(q.get("quest_giver", ""), q.get("quest_giver", ""))
    q["location"] = LOCATION_ZH.get(q.get("location", ""), q.get("location", ""))
    q["objectives"] = [OBJECTIVE_ZH.get(o, o) for o in q.get("objectives", [])]
    if q.get("unlock_requirement"):
        q["unlock_requirement"] = UNLOCK_REQ_ZH.get(q["unlock_requirement"], q["unlock_requirement"])
    # Keep reward item names in English (game proper nouns)
    # Keep prerequisites as English quest names for matching

with open(os.path.join(ZH_DIR, "quests_zh.json"), "w") as f:
    json.dump(quests_zh, f, ensure_ascii=False, indent=2)
print(f"✓ quests_zh.json: {len(quests_zh.get('quests', []))} quests")

# ─── Build traders_zh.json ───
ITEM_TYPE_ZH = {
    "Quick Use": "快速使用",
    "Weapon": "武器",
    "Shield": "护盾",
    "Augment": "增强器",
    "Modification": "改装件",
    "Ammunition": "弹药",
    "Topside Material": "地面材料",
    "Recyclable": "可回收物",
    "Trinket": "饰品",
    "Throwable": "投掷物",
    "Consumable": "消耗品",
    "Medical": "医疗",
    "Blueprint": "蓝图",
    "Backpack": "背包",
    "Tool": "工具",
    "Key": "钥匙",
    "Gadget": "小工具",
}

RARITY_ZH = {
    "Common": "普通",
    "Uncommon": "优良",
    "Rare": "稀有",
    "Epic": "史诗",
    "Legendary": "传说",
}

with open(os.path.join(DATA_DIR, "traders.json"), "r") as f:
    traders = json.load(f)

traders_zh = json.loads(json.dumps(traders))
for t in traders_zh:
    t["trader_name"] = QUEST_GIVER_ZH.get(t.get("trader_name", ""), t.get("trader_name", ""))
    t["item_type"] = ITEM_TYPE_ZH.get(t.get("item_type", ""), t.get("item_type", ""))
    t["item_rarity"] = RARITY_ZH.get(t.get("item_rarity", ""), t.get("item_rarity", ""))
    # Keep item_name and item_description in English (game content)

with open(os.path.join(ZH_DIR, "traders_zh.json"), "w") as f:
    json.dump(traders_zh, f, ensure_ascii=False)
print(f"✓ traders_zh.json: {len(traders_zh)} items")

# ─── Build items_zh.json ───
with open(os.path.join(DATA_DIR, "items.json"), "r") as f:
    items = json.load(f)

items_zh = json.loads(json.dumps(items))
for item in items_zh:
    item["item_type"] = ITEM_TYPE_ZH.get(item.get("item_type", ""), item.get("item_type", ""))
    item["rarity"] = RARITY_ZH.get(item.get("rarity", ""), item.get("rarity", ""))
    # Keep name and description in English (game proper nouns + descriptions too varied)

with open(os.path.join(ZH_DIR, "items_zh.json"), "w") as f:
    json.dump(items_zh, f, ensure_ascii=False)
print(f"✓ items_zh.json: {len(items_zh)} items")

# ─── Build maps_zh.json ───
MAP_ZH = {
    "Dam Battlegrounds": {"name": "水坝战场", "description": "一座被ARC部队占领的巨型水力发电大坝。溢洪道和发电机房周围是密集的战斗区域。", "difficulty": "中等"},
    "Buried City": {"name": "掩埋之城", "description": "曾经繁荣的大都市遗迹，如今半埋在沙土和瓦砾之下。战利品丰富但危险重重。", "difficulty": "困难"},
    "The Spaceport": {"name": "太空港", "description": "一座废弃的发射设施，有机库、控制塔和散落的ARC科技。开阔的射界。", "difficulty": "简单"},
    "Blue Gate": {"name": "蓝门", "description": "区域之间的加固检查站。狭窄的走廊和垂直空间带来激烈的战斗。", "difficulty": "中等"},
    "Stella Montis": {"name": "星辰之山", "description": "拥有高山森林和隐藏地堡的山区。高价值资源散布在各个山峰上。", "difficulty": "困难"},
}

with open(os.path.join(DATA_DIR, "maps.json"), "r") as f:
    maps = json.load(f)

maps_zh = json.loads(json.dumps(maps))
for m in maps_zh:
    zh = MAP_ZH.get(m["name"])
    if zh:
        m["name"] = zh["name"]
        m["description"] = zh["description"]
        m["difficulty"] = zh["difficulty"]

with open(os.path.join(ZH_DIR, "maps_zh.json"), "w") as f:
    json.dump(maps_zh, f, ensure_ascii=False, indent=2)
print(f"✓ maps_zh.json: {len(maps_zh)} maps")

print("\nDone! All zh data files generated.")
