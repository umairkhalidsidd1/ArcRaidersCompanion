import json, re

with open('src/data/zh/items_zh.json') as f:
    items = json.load(f)

# Fix specific remaining genuinely broken descriptions
fixes = {
    # Explosive mine - has English fragment
    "接近触发式弹跳地雷，弹起后爆炸, dealing damage to 其范围内的一切。":
        "接近触发式弹跳地雷，弹起后爆炸，对其范围内的一切造成伤害。",
    # Optic cloak - awkward phrasing
    "使用户能够隐蔽自身的小工具免受ARC发现。":
        "使用者在ARC探测下隐身的装置。",
    # Wasp driver - extra spaces
    "用于操控黄蜂无人机的控制模块 或载具。 可回收为ARC合金。":
        "用于操控黄蜂无人机或载具的控制模块。可回收为ARC合金。",
    # ARC circuit - period instead of comma
    "从ARC敌人或活动中获得。用于制作组件. 可回收为ARC合金。":
        "从ARC敌人或活动中获得。用于制作组件。可回收为ARC合金。",
}

# Fix blueprint names that should use Chinese item names
name_fixes = {
    "Energy Ammo蓝图": "能量弹药蓝图",
    "Heavy Fuse Grenade蓝图": "重型引信手雷蓝图",
    "Laser Trap: Fire蓝图": "激光陷阱：火焰蓝图",
    "Laser Trap: Gas蓝图": "激光陷阱：毒气蓝图",
    "Combat Mk. 3 (Flanking)蓝图": "战斗型 Mk.3（侧翼）蓝图",
    "Combat Mk.3 (Aggressive)蓝图": "战斗型 Mk.3（进攻）蓝图",
    "Tactical MK.3 (Healing)蓝图": "战术型 Mk.3（治疗）蓝图",
    "Tactical Mk. 3 (Revival)蓝图": "战术型 Mk.3（复活）蓝图",
    "Tactical MK.3 (Defensive)蓝图": "战术型 Mk.3（防御）蓝图",
    "Anvil蓝图": "铁砧蓝图",
    "Burletta蓝图": "滑稽剧蓝图",
    "Hullcracker蓝图": "破壳者蓝图",
    "Il Toro蓝图": "公牛蓝图",
    "Renegade蓝图": "叛逆者蓝图",
    "Torrente蓝图": "激流蓝图",
    "Venator蓝图": "猎人蓝图",
    "Vulcano蓝图": "火山蓝图",
    "Wolfpack蓝图": "狼群蓝图",
    "Patrol（服装）": "巡逻（服装）",
    "Radio Renegade（服装）": "无线叛逆者（服装）",
    "Bow and Arrow（表情）": "弓箭手（表情）",
    "Briefcase（背包挂件）": "公文包（背包挂件）",
    "Cans（背包挂件）": "罐头（背包挂件）",
    "Cheer（表情）": "欢呼（表情）",
    "Happy Jig（表情）": "欢乐之舞（表情）",
    "Junior（服装）": "少年（服装）",
    "Warden（服装）": "守望者（服装）",
}

# Blueprint description fixes: translate English item names in "让你制作X" patterns
bp_desc_fixes = {
    "让你制作能量弹药": "让你制作能量弹药",
    "让你制作ARC电路": "让你制作ARC电路",
}

desc_fixed = 0
name_fixed = 0

for i, item in enumerate(items):
    desc = item.get('description', '') or ''
    if desc in fixes:
        items[i]['description'] = fixes[desc]
        desc_fixed += 1
    
    name = item.get('name', '')
    if name in name_fixes:
        items[i]['name'] = name_fixes[name]
        name_fixed += 1

# Fix blueprint descriptions still containing English item names
bp_name_map = {
    "Anvil": "铁砧",
    "Blue Light Stick": "蓝色荧光棒",
    "Green Light Stick": "绿色荧光棒",
    "Red Light Stick": "红色荧光棒",
    "Yellow Light Stick": "黄色荧光棒",
    "Burletta": "滑稽剧",
    "Combat Mk. 3 (Flanking)": "战斗型 Mk.3（侧翼）",
    "Deadline Mine": "死线地雷",
    "Energy Ammo": "能量弹药",
    "Heavy Fuse Grenade": "重型引信手雷",
    "Heavy Fuze Grenade": "重型引信手雷",
    "Hullcracker": "破壳者",
    "Il Toro": "公牛",
    "Laser Trap: Fire": "激光陷阱：火焰",
    "Laser Trap: Gas": "激光陷阱：毒气",
    "Laser Trap: Lure": "激光陷阱：诱饵",
    "Laser Trap: Smoke": "激光陷阱：烟雾",
    "Medium Mag III": "中型弹匣 III",
    "Renegade": "叛逆者",
    "Shotgun Silencer": "霰弹枪消音器",
    "Showstopper": "惊鸿一击",
    "Tactical MK. 3 (Revival)": "战术型 Mk.3（复活）",
    "Torrente": "激流",
    "Venator": "猎人",
    "Wolfpack": "狼群",
    "Vulcano": "火山",
    "Horizontal Grip": "水平握把",
    "Launcher Ammo": "发射器弹药",
    "Remote Raider Flare": "遥控掠夺者信号弹",
    "Looting MK. 3 (Safekeeper)": "拾取型 Mk.3（保管者）",
    "Trigger 'Nade": "遥控雷",
    "Lure Grenade": "诱饵手雷",
    "Snap Blast Grenade": "速爆手雷",
}

for i, item in enumerate(items):
    desc = item.get('description', '') or ''
    if '让你制作' in desc:
        for en_name, zh_name in bp_name_map.items():
            if en_name in desc:
                desc = desc.replace(en_name, zh_name)
        items[i]['description'] = desc

with open('src/data/zh/items_zh.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f'Fixed {desc_fixed} descriptions and {name_fixed} names')

# Re-check
ALLOWED = r'\b(ARC|III|MK|Mk\.\d|II|IV|I|Celeste|Lance|J Kozma Ventures|JKV|ESR)\b'
real_mixed_d = 0
real_mixed_n = 0
for item in items:
    desc = item.get('description', '') or ''
    cleaned = re.sub(ALLOWED, '', desc)
    has_cn = any('\u4e00' <= c <= '\u9fff' for c in cleaned)
    has_en = bool(re.search('[a-zA-Z]{3,}', cleaned))
    if has_cn and has_en:
        real_mixed_d += 1
        print(f'STILL MIXED DESC: {item["name"]}: {desc[:150]}')
    
    name = item.get('name', '')
    cleaned_name = re.sub(ALLOWED, '', name)
    has_cn_n = any('\u4e00' <= c <= '\u9fff' for c in name)
    has_en_n = bool(re.search('[a-zA-Z]{2,}', cleaned_name))
    if has_cn_n and has_en_n:
        real_mixed_n += 1

print(f'\nRemaining mixed descriptions: {real_mixed_d}')
print(f'Remaining mixed names: {real_mixed_n}')
