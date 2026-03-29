#!/usr/bin/env python3
"""Translate traders_zh.json, maps_zh.json, and guides_zh.json reward names
by cross-referencing with the already-translated items_zh.json."""
import json

# Load items_zh.json as lookup
with open('src/data/zh/items_zh.json') as f:
    items = json.load(f)

# Build name -> chinese name/description lookup from items
item_name_map = {}
item_desc_map = {}
for item in items:
    en_name = item.get('_original_name', '')  # not available
    cn_name = item.get('name', '')
    cn_desc = item.get('description', '')
    item_id = item.get('id', '')
    item_name_map[item_id] = cn_name
    if cn_desc:
        item_desc_map[item_id] = cn_desc

# Also load the English items to get original names
with open('src/data/items.json') as f:
    items_en = json.load(f)

# Build en_name -> item_id lookup
en_name_to_id = {}
en_name_to_desc = {}
for item in items_en:
    en_name_to_id[item.get('name', '')] = item.get('id', '')
    en_name_to_desc[item.get('name', '')] = item.get('description', '')

# Build en_name -> zh_name lookup
en_to_zh_name = {}
en_to_zh_desc = {}
for item_en in items_en:
    en_name = item_en.get('name', '')
    item_id = item_en.get('id', '')
    if item_id in item_name_map:
        en_to_zh_name[en_name] = item_name_map[item_id]
    if item_id in item_desc_map:
        en_to_zh_desc[en_name] = item_desc_map[item_id]

# Also match by description text
en_desc_to_zh_desc = {}
for item_en, item_zh in zip(items_en, items):
    en_desc = item_en.get('description', '')
    zh_desc = item_zh.get('description', '')
    if en_desc and zh_desc:
        en_desc_to_zh_desc[en_desc] = zh_desc

# Manual name translations for items not in items.json
EXTRA_NAMES = {
    "Bandage": "绷带",
    "Battery": "电池",
    "Canister": "罐",
    "Chemicals": "化学品",
    "Duct Tape": "管道胶带",
    "Energy Clip": "能量弹夹",
    "Fabric": "布料",
    "Great Mullein": "毛蕊花",
    "Moss": "苔藓",
    "Oil": "油",
    "Rope": "绳索",
    "Rubber Parts": "橡胶零件",
    "Syringe": "注射器",
    "Voltage Converter": "电压转换器",
    "Wires": "电线",
    "Metal Parts": "金属零件",
    "Steel Spring": "钢弹簧",
    "Processor": "处理器",
    "Sensors": "传感器",
    "Synthesized Fuel": "合成燃料",
    "Speaker Component": "扬声器元件",
    "Simple Gun Parts": "简易枪械零件",
    "Light Gun Parts": "轻型枪械零件",
    "Medium Gun Parts": "中型枪械零件",
    "Heavy Gun Parts": "重型枪械零件",
    "Complex Gun Parts": "复杂枪械零件",
    "Shotgun Parts": "霰弹枪零件",
    "Magnet": "磁铁",
    "Light Ammo": "轻型弹药",
    "Medium Ammo": "中型弹药",
    "Heavy Ammo": "重型弹药",
    "Shotgun ammo": "霰弹枪弹药",
    "Shotgun Ammo": "霰弹枪弹药",
    "Launcher Ammo": "发射器弹药",
    "Barricade Kit": "路障工具",
    "Binoculars": "望远镜",
    "Blue Light Stick": "蓝色荧光棒",
    "Green Light Stick": "绿色荧光棒",
    "Red Light Stick": "红色荧光棒",
    "Yellow Light Stick": "黄色荧光棒",
    "Deadline": "死线",
    "Defibrillator": "除颤器",
    "Door Blocker": "门阻挡器",
    "Exodus Modules": "出埃及记模块",
    "Noisemaker": "噪音发生器",
    "Padlock": "挂锁",
    "Recorder": "竖笛",
    "Remote Raider Flare": "遥控掠夺者信号弹",
    "Shield Recharger": "护盾充能器",
    "Surge Shield Recharger": "激涌护盾充能器",
    "Smoke Grenade": "烟雾弹",
    "Zipline": "滑索",
    "Raider Hatch Key": "掠夺者舱口钥匙",
    "Adrenaline Shot": "肾上腺素注射",
    "Herbal Bandage": "草药绷带",
    "Sterilized Bandage": "消毒绷带",
    "Light Shield": "轻型护盾",
    "Medium Shield": "中型护盾",
    "Heavy Shield": "重型护盾",
    "Gas Mine": "毒气地雷",
    "Jolt Mine": "电击地雷",
    "Pulse Mine": "脉冲地雷",
    "Heavy Fuze Grenade": "重型引信手雷",
    "Snap Blast Grenade": "速爆手雷",
    "Seeker Grenade": "追踪手雷",
    "Light Impact Grenade": "轻型冲击手雷",
    # Weapons
    "Anvil I": "铁砧 I",
    "Burletta I": "滑稽剧 I",
    "Ferro I": "铁骑 I",
    "Hairpin I": "发卡 I",
    "Hullcracker I": "破壳者 I",
    "Il Toro I": "公牛 I",
    "Kettle I": "壶 I",
    "Renegade I": "叛逆者 I",
    "Stitcher I": "缝合者 I",
    # Augments
    "Combat Mk. 1": "战斗型 Mk.1",
    "Combat Mk. 2": "战斗型 Mk.2",
    "Looting Mk. 1": "拾取型 Mk.1",
    "Looting Mk. 2": "拾取型 Mk.2",
    "Tactical Mk. 1": "战术型 Mk.1",
    "Tactical Mk. 2": "战术型 Mk.2",
    # Mods
    "Angled Grip I": "斜握把 I",
    "Angled Grip III": "斜握把 III",
    "Compensator I": "补偿器 I",
    "Extended Light Mag I": "扩展轻型弹匣 I",
    "Extended Light Mag II": "扩展轻型弹匣 II",
    "Extended Medium Mag I": "扩展中型弹匣 I",
    "Extended Shotgun Mag I": "扩展霰弹枪弹匣 I",
    "Muzzle Brake I": "枪口制退器 I",
    "Padded Stock": "软垫枪托",
    "Shotgun Choke I": "霰弹枪收束器 I",
    "Shotgun Choke II": "霰弹枪收束器 II",
    "Stable Stock I": "稳定枪托 I",
    "Vertical Grip I": "垂直握把 I",
    # Guide rewards extras
    "Advanced Electrical Components": "高级电气元件",
    "Advanced Mechanical Components": "高级机械元件",
    "Angled Grip II": "斜握把 II",
    "Antiseptic": "消毒剂",
    "Anvil III": "铁砧 III",
    "Arpeggio I": "琶音 I",
    "Blaze Grenade": "燃烧弹",
    "Compensator II": "补偿器 II",
    "Credits": "信用点",
    "Deployable Cover": "可部署掩体",
    "Durable Cloth": "耐用布料",
    "Electrical Components": "电气元件",
    "Equalizer": "均衡者",
    "Extended Medium Mag II": "扩展中型弹匣 II",
    "Extended Medium Mag I": "扩展中型弹匣 I",
    "Explosive Compound": "爆炸化合物",
    "Explosive Mine": "爆炸地雷",
    "Frag Grenade": "碎片手雷",
    "Guitar": "吉他",
    "Il Toro IV": "公牛 IV",
    "Jupiter": "木星",
    "Looting MK. 3 (Safekeeper)": "拾取型 Mk.3（保管者）",
    "Lure Grenade": "诱饵手雷",
    "Mechanical Components": "机械元件",
    "Med Kit": "医疗包",
    "Mod Components": "改装元件",
    "Muzzle Brake II": "枪口制退器 II",
    "Photoelectric Cloak": "光电隐身斗篷",
    "Portable Radar": "便携雷达",
    "Rattler III": "响尾蛇 III",
    "Scrap Metal": "废金属",
    "Shotgun Parts": "霰弹枪零件",
    "Silencer II": "消音器 II",
    "Snitch Scanner": "告密扫描仪",
    "Stable Stock II": "稳定枪托 II",
    "Stable Stock III": "稳定枪托 III",
    "Stun Grenade": "眩晕手雷",
    "Tactical MK. 3 (Revival)": "战术型 Mk.3（复活）",
    "Venator I": "猎人 I",
    "Vertical Grip II": "垂直握把 II",
    "Vita Shot": "维生素注射",
    "Burletta III": "滑稽剧 III",
    "Coffee Pot": "咖啡壶",
    "Crude Explosives": "粗制炸药",
    "Dam Control Tower Key": "大坝控制塔钥匙",
    "Dam Staff Room Key": "大坝员工休息室钥匙",
    "Dam Testing Annex Key": "大坝测试附楼钥匙",
    "Firecracker": "鞭炮",
    "Fireworks Box": "烟花盒",
    "Hullcracker Blueprint": "破壳者蓝图",
    "Li'l Smoke Grenade": "小型烟雾弹",
    "Lure Grenade Blueprint": "诱饵手雷蓝图",
    "Magnetic Accelerator": "磁力加速器",
    "Music Box": "音乐盒",
    "Navy Blue (Warden Color)": "海军蓝（守望者颜色）",
    "Origin Outfit (Orange Camo Color)": "原始服装（橙色迷彩颜色）",
    "Patrol Car Key": "巡逻车钥匙",
    "Power Rod": "电源棒",
    "Stitcher II": "缝合者 II",
    "Tactical Mk. 3 (Healing)": "战术型 Mk.3（治疗）",
    "Tagging Grenade": "标记手雷",
    "Trigger 'Nade Blueprint": "遥控雷蓝图",
    "Shrapnel Grenade": "弹片手雷",
    "Vita Spray": "维生素喷雾",
    "Vulcano III": "火山 III",
    "Snap Hook": "弹簧钩",
    "Rosary": "念珠",
    "Shaker": "沙锤",
    "Trailblazer": "开拓者",
    "Wolfpack": "狼群",
    "Showstopper": "惊鸿一击",
    "Raider Tokens": "掠夺者代币",
    "Spaceport Trench Tower Key": "航天港壕沟塔钥匙",
    "Extended Shotgun Mag II": "扩展霰弹枪弹匣 II",
    "Burletta Blueprint": "滑稽剧蓝图",
    "Air Freshener": "空气清新剂",
    "Equalizer I": "均衡者 I",
    "Jump Mine": "跳跃地雷",
}

# Rarity translations
RARITY_MAP = {
    "Common": "普通",
    "Uncommon": "非凡",
    "Rare": "稀有",
    "Epic": "史诗",
    "Legendary": "传奇",
}

# Item type translations
TYPE_MAP = {
    "Ammunition": "弹药",
    "Augment": "强化装置",
    "Basic Material": "基础材料",
    "Gadget": "小工具",
    "Key": "钥匙",
    "Modification": "改装件",
    "Nature": "自然",
    "Quick Use": "快速使用",
    "Recyclable": "可回收物",
    "Shield": "护盾",
    "Topside Material": "地表材料",
    "Weapon": "武器",
    "ARC Material": "ARC材料",
    "Crafting Material": "制作材料",
    "Crafting Component": "制作元件",
    "ARC Enemy Parts": "ARC敌人零件",
    "Trinket": "饰品",
    "Medical": "医疗",
    "Food": "食物",
    "Consumable": "消耗品",
    "Grenade": "手雷",
    "Throwable": "投掷物",
    "Mine": "地雷",
    "Trap": "陷阱",
    "Instrument": "乐器",
    "Cosmetic": "外观",
}

# Description translations for trader items
DESC_MAP = {
    "A Combat augment is more focused on maneuverability than absorbing damage.": "战斗型强化装置更注重机动性而非吸收伤害。",
    "A basic pair of binoculars with two levels of magnification.": "一对基本的望远镜，有两档放大倍率。",
    "A bundle of old wires. Used to craft a wide range of items. Can be recycled into scrap metal.": "一捆旧电线。用于制作多种物品。可回收为废金属。",
    "A deployable cover that can block incoming damage until it breaks.": "可部署的掩体，能够阻挡伤害直到被摧毁。",
    "A deployable device that, when manually triggered, launches a Raider Distress Flare.": "一种可部署装置，手动触发时会发射掠夺者求救信号弹。",
    "A deployable proximity sensor that sounds an alarm when enemy raiders are detected.": "一种可部署的近距离传感器，检测到敌方掠夺者时会发出警报。",
    "A deployable zipline that allows you to quickly move between two locations.": "一种可部署的滑索，让你快速在两个位置之间移动。",
    "A device that adjusts electrical voltage for various crafting purposes.": "一种调节电压的设备，用于各种制作。",
    "A grenade that creates a lingering smoke cloud on impact, blocking visibility from other Raiders.": "一种撞击后产生持续烟雾云的手雷，阻挡其他掠夺者的视线。",
    "A grenade that detonates after a delay, dealing explosive damage in its radius.": "一种延迟引爆的手雷，在其范围内造成爆炸伤害。",
    "A grenade that detonates on impact, dealing explosive damage in a small radius.": "一种撞击时引爆的手雷，在小范围内造成爆炸伤害。",
    "A grenade that sticks to surfaces, dealing explosive damage after a short delay.": "一种粘附在表面的手雷，短暂延迟后造成爆炸伤害。",
    "A handheld repair kit that recharges a shield on use.": "一种手持修理工具，使用时为护盾充能。",
    "A handkeld kit that recharges a shield": "一种手持工具，为护盾充能",
    "A heavy shield that blocks a large portion of incoming damage, but carries a significant cost to mobility.": "一种重型护盾，能阻挡大部分伤害，但严重影响机动性。",
    "A homing grenade that targets a single nearby ARC dealing explosive damage on impact": "一种追踪手雷，锁定附近一个ARC并在撞击时造成爆炸伤害",
    "A lightweight shield that offers limited protection without severely impacting mobility.": "一种轻型护盾，提供有限保护而不会严重影响机动性。",
    "A locking mechanism that can be placed on large metal doors to limit access.": "一种锁定机制，可放置在大型金属门上限制通行。",
    "A medical item that gradually restores a large amount health over time.": "一种医疗物品，随时间逐渐恢复大量生命值。",
    "A medical item that gradually restores health over time.": "一种医疗物品，随时间逐渐恢复生命值。",
    "A mine that deals damage to anything within its radius once the timer runs out": "一种地雷，计时器结束后对其范围内的一切造成伤害",
    "A playable recorder used to attract ARC's attention and impress other Raiders.": "一种可演奏的竖笛，用于吸引ARC的注意力并给其他掠夺者留下深刻印象。",
    "A proximity triggered mine that pops up and stuns anything within its radius.": "一种近距离触发的地雷，弹出并眩晕其范围内的目标。",
    "A proximity-triggered mine that pops up and deploys a gas cloud that rapidly drains stamina": "一种近距离触发的地雷，弹出并释放迅速消耗体力的毒气云",
    "A proximity-triggered mine that pops up and knocks back anything within its radius": "一种近距离触发的地雷，弹出并击退其范围内的目标",
    "A serum that fully restores stamina and temporarily increases stamina regeneration": "一种完全恢复体力并暂时提高体力恢复速度的血清",
    "A standard shield that blocks a medium portion of incoming damage at a moderate cost to mobility.": "一种标准护盾，以适度的机动性代价阻挡中等伤害。",
    "A sterile syringe for medical use. Used to craft medical supplies. Can be recycled into plastic.": "一种无菌医用注射器。用于制作医疗用品。可回收为塑料。",
    "A throwable chemical light that illuminates the area around it.": "一种可投掷的化学荧光棒，照亮周围区域。",
    "A tightly wound coil of metal. Used to craft a wide range of items. Can be recycled into scrap metal.": "一圈紧密缠绕的线圈。用于制作多种物品。可回收为废金属。",
    "Adds more backpack space and an extra utility item slot.": "增加更多背包空间和一个额外工具物品栏位。",
    "Ammo used for energy weapons. One clip will fully charge a single weapon.": "能量武器使用的弹药。一个弹夹可完全充满一把武器。",
    "An improvised medical item that gradually restores health over time.": "一种临时医疗物品，随时间逐渐恢复生命值。",
    "An injection that quickly revives downed raiders and restores some health.": "一种注射剂，快速复活倒地的掠夺者并恢复部分生命值。",
    "Anti-ARC payloads used mainly by the Hullcracker": "主要由破壳者使用的反ARC弹药",
    "Assorted spare parts used for pistols and SMGs.": "用于手枪和冲锋枪的各种备用零件。",
    "Assorted spare parts used for rifles. ": "用于步枪的各种备用零件。",
    "Basic combat augment. Supports stronger shields, but with limited backpack capacity and Quick Use slots.": "基础战斗型强化装置。支持更强的护盾，但背包容量和快速使用栏位有限。",
    "Basic looting augment. More backpack slots and weight capacity, but low defensive and tactical capability.": "基础拾取型强化装置。更多背包栏位和负重容量，但防御和战术能力较低。",
    "Basic tactical augment. More Quick Use slots for more tactical choice, but limited survivability and slightly lower loot": "基础战术型强化装置。更多快速使用栏位以提供更多战术选择，但生存能力有限且拾取能力略低",
    "Can be used to regain a small amount of health.": "可用于恢复少量生命值。",
    "Fires explosive projectiles that only detonate when hitting ARC.": "发射只在击中ARC时引爆的爆炸弹头。",
    "Full automatic SMG. Deals good damage, but has quite a low fire-rate and can be hard to control.": "全自动冲锋枪。伤害不错，但射速较低且难以控制。",
    "Fun thing to put on a fridgerator.": "放在冰箱上的有趣小玩意。",
    "Heavy break-action rifle. Packs a punch, but must be reloaded between every shot.": "重型中折式步枪。威力强大，但每次射击后必须重新装弹。",
    "Heavy bullets used mainly with large-caliber weapons.": "主要用于大口径武器的重型子弹。",
    "Lever-action battle rifle with high damage output, accuracy, and headshot damage.": "杠杆式战斗步枪，高伤害输出、精准度和爆头伤害。",
    "Light bullets used mainly with SMGs and light handguns. Such as Kettle, Stitcher, Burletta, Hairpin and Bobcat.": "主要用于冲锋枪和轻型手枪的轻型子弹。如壶、缝合者、滑稽剧、发卡和山猫。",
    "Medium bullets used mainly with medium-caliber weapons. Such as Rattler, Tempest, Arpeggio, Renegade and Torrente.": "主要用于中口径武器的中型子弹。如响尾蛇、风暴、琶音、叛逆者和激流。",
    "Moderately extends the ammo capacity of the compatible weapons that use light ammo.": "适度扩展使用轻型弹药的兼容武器的弹药容量。",
    "Moderately reduces base dispersion.": "适度降低基础散布。",
    "Pump-action shotgun with large bullet spread, sharp falloff, and high damage output.": "泵动式霰弹枪，弹丸散布大、衰减明显、输出伤害高。",
    "Semi-automatic assault rifle. Quick and accurate, but has low bullet velocity and takes a long time reload.": "半自动突击步枪。快速精准，但弹头速度低且装弹时间长。",
    "Semi-automatic pistol with decent damage output and accuracy. Can be fired as fast as you can pull the trigger.": "半自动手枪，伤害和精准度不错。射速取决于你扣扳机的速度。",
    "Shotgun shells used for shotguns.": "霰弹枪使用的弹壳。",
    "Significantly improves stability.": "显著提高稳定性。",
    "Significantly increases looting potential; adds slots for trinkets.": "显著提高拾取潜力；增加饰品栏位。",
    "Significantly reduces horizontal recoil.": "显著降低水平后坐力。",
    "Single-action hand cannon with high damage output and headshot damage, but slow handling.": "单动式手炮，高伤害输出和爆头伤害，但操控缓慢。",
    "Single-action pistol with a built-in silencer. Great for stealth, but tricky in combat.": "自带消音器的单动式手枪。适合隐匿，但在战斗中使用不易。",
    "Slightly extends the ammo capacity of compatible weapons that use medium ammo.": "略微扩展使用中型弹药的兼容武器的弹药容量。",
    "Slightly extends the ammo capacity of compatible weapons that use shotgun ammo.": "略微扩展使用霰弹枪弹药的兼容武器的弹药容量。",
    "Slightly extends the ammo capacity of the compatible weapons that use light ammo.": "略微扩展使用轻型弹药的兼容武器的弹药容量。",
    "Slightly improves dispersion & recoil recovery time. Compatible with: Rattler, Ferro, Arpeggio, Bettina, Kettle.": "略微改善散布和后坐力恢复时间。兼容：响尾蛇、铁骑、琶音、贝蒂娜、壶。",
    "Slightly reduces base dispersion.": "略微降低基础散布。",
    "Slightly reduces both vertical recoil & horizontal recoil.": "略微降低垂直和水平后坐力。",
    "Slightly reduces horizontal recoil.": "略微降低水平后坐力。",
    "Slightly reduces per-shot dispersion.": "略微降低每发散布。",
    "Slightly reduces vertical recoil.": "略微降低垂直后坐力。",
    "Unlocks a Raider Hatch.": "解锁掠夺者舱口。",
    "Used directly in crafting items of all tiers.": "直接用于制作各等级物品。",
    "Used in crafting.": "用于制作。",
    "Used to craft a wide range of items.": "用于制作多种物品。",
    "Used to craft a wide range of items. Can be recycled into crafting materials": "用于制作多种物品。可回收为制作材料",
    "Used to craft a wide range of items. Can be recycled into plastic.": "用于制作多种物品。可回收为塑料。",
    "Used to craft advanced weapons.": "用于制作高级武器。",
    "Used to craft medical supplies and shields.": "用于制作医疗用品和护盾。",
    "Used to craft medical supplies, explosives, and utility items.": "用于制作医疗用品、爆炸物和工具物品。",
    "Used to craft medical supplies.": "用于制作医疗用品。",
    "Used to craft medical supplies. Can be recycled into scrap metal.": "用于制作医疗用品。可回收为废金属。",
    "Used to craft utility items and explosives. Can be recycled into chemicals.": "用于制作工具物品和爆炸物。可回收为化学品。",
    "Used to craft utility items and explosives. Can be recycled into scrap metal.": "用于制作工具物品和爆炸物。可回收为废金属。",
    "Used to craft weapons and explosives. Can be recycled into chemicals.": "用于制作武器和爆炸物。可回收为化学品。",
    "Used to craft weapons. Can be recycled into scrap metal.": "用于制作武器。可回收为废金属。",
}

# Difficulty translations
DIFFICULTY_MAP = {
    "Easy": "简单",
    "Medium": "中等",
    "Hard": "困难",
}

# ═══════════════════════════════════════════════════════════════
# 1. TRANSLATE TRADERS
# ═══════════════════════════════════════════════════════════════
with open('src/data/zh/traders_zh.json') as f:
    traders = json.load(f)

for t in traders:
    name = t.get('item_name', '')
    # Try lookup from items first, then manual
    zh_name = en_to_zh_name.get(name) or EXTRA_NAMES.get(name)
    if zh_name:
        t['item_name'] = zh_name

    desc = t.get('item_description', '')
    zh_desc = DESC_MAP.get(desc) or en_to_zh_desc.get(name) or en_desc_to_zh_desc.get(desc)
    if zh_desc:
        t['item_description'] = zh_desc

    rarity = t.get('item_rarity', '')
    if rarity in RARITY_MAP:
        t['item_rarity'] = RARITY_MAP[rarity]

    itype = t.get('item_type', '')
    if itype in TYPE_MAP:
        t['item_type'] = TYPE_MAP[itype]

with open('src/data/zh/traders_zh.json', 'w', encoding='utf-8') as f:
    json.dump(traders, f, ensure_ascii=False, indent=2)

# Stats
def has_chinese(s):
    return any('\u4e00' <= c <= '\u9fff' for c in str(s))

en_names = sum(1 for t in traders if not has_chinese(t.get('item_name', '')))
en_descs = sum(1 for t in traders if t.get('item_description') and not has_chinese(t.get('item_description', '')))
en_rars = sum(1 for t in traders if not has_chinese(t.get('item_rarity', '')))
en_types = sum(1 for t in traders if not has_chinese(t.get('item_type', '')))
print(f"Traders: names={en_names}, descs={en_descs}, rarities={en_rars}, types={en_types} remaining English (of {len(traders)})")
if en_names:
    for t in traders:
        if not has_chinese(t.get('item_name', '')):
            print(f"  Name: {t['item_name']}")
if en_descs:
    for t in traders:
        if t.get('item_description') and not has_chinese(t.get('item_description', '')):
            print(f"  Desc: {t['item_description'][:80]}")

# ═══════════════════════════════════════════════════════════════
# 2. TRANSLATE MAPS DIFFICULTY
# ═══════════════════════════════════════════════════════════════
with open('src/data/zh/maps_zh.json') as f:
    maps = json.load(f)

for m in maps:
    d = m.get('difficulty', '')
    if d in DIFFICULTY_MAP:
        m['difficulty'] = DIFFICULTY_MAP[d]

with open('src/data/zh/maps_zh.json', 'w', encoding='utf-8') as f:
    json.dump(maps, f, ensure_ascii=False, indent=2)

en_diff = sum(1 for m in maps if m.get('difficulty') and not has_chinese(m['difficulty']))
print(f"\nMaps: {en_diff} remaining English difficulties")

# ═══════════════════════════════════════════════════════════════
# 3. TRANSLATE GUIDES REWARD NAMES
# ═══════════════════════════════════════════════════════════════
with open('src/data/zh/guides_zh.json') as f:
    guides = json.load(f)

for g in guides:
    for r in g.get('rewards', []):
        item = r.get('item', {})
        name = item.get('name', '')
        zh_name = en_to_zh_name.get(name) or EXTRA_NAMES.get(name)
        if zh_name:
            item['name'] = zh_name

with open('src/data/zh/guides_zh.json', 'w', encoding='utf-8') as f:
    json.dump(guides, f, ensure_ascii=False, indent=2)

en_reward_names = 0
remaining_rewards = set()
for g in guides:
    for r in g.get('rewards', []):
        name = r.get('item', {}).get('name', '')
        if name and not has_chinese(name):
            en_reward_names += 1
            remaining_rewards.add(name)
print(f"\nGuides: {en_reward_names} reward name instances still English ({len(remaining_rewards)} unique)")
if remaining_rewards:
    for r in sorted(remaining_rewards):
        print(f"  {r}")
