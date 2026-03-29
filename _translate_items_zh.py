#!/usr/bin/env python3
"""Translate items_zh.json name and description fields to Chinese."""
import json, re, copy

with open('src/data/zh/items_zh.json', 'r') as f:
    items = json.load(f)

# ─── NAME TRANSLATIONS ────────────────────────────────────────────
# Game-specific weapon names stay as-is (proper nouns: Tempest, Anvil, etc.)
# Translate generic/descriptive names
NAME_MAP = {
    # Materials
    "ARC Alloy": "ARC合金",
    "ARC Motion Core": "ARC运动核心",
    "ARC Filament": "ARC细丝",
    "ARC Fiber": "ARC纤维",
    "ARC Mesh": "ARC网格",
    "ARC Plating": "ARC装甲板",
    "ARC Thread": "ARC线",
    "Scrap Metal": "废金属",
    "Wires": "电线",
    "Voltage Converter": "电压转换器",
    "Circuit Board": "电路板",
    "Copper Wire": "铜线",
    "Steel Pipe": "钢管",
    "Duct Tape": "胶带",
    "Fabric": "布料",
    "Gunpowder": "火药",
    "Polymer": "聚合物",
    "Resin": "树脂",
    "Rubber": "橡胶",
    "Adhesive": "粘合剂",
    "Chemicals": "化学品",
    "Leather": "皮革",
    "Oil": "油",
    "Electronics": "电子元件",
    "Explosive Powder": "炸药粉末",
    "Mechanical Parts": "机械零件",
    "Optics": "光学元件",
    "Springs": "弹簧",
    "Bolts": "螺栓",
    "Wind Turbine": "风力涡轮机",
    "Solar Panel": "太阳能板",
    "Battery Cell": "电池单元",
    "Electric Motor": "电动马达",
    "Radio Transmitter": "无线电发射器",
    "Sewing Kit": "缝纫工具包",
    "Torch Ginger": "火炬姜",
    "Aloe Vera": "芦荟",
    "Herbal Extract": "草药提取物",
    "Volcanic Rock": "火山岩",

    # Recyclables
    "Thermostat": "温控器",
    "Tick Pod": "蜱虫舱",
    "Toaster": "烤面包机",
    "Torn Blanket": "破烂毯子",
    "Torn Book": "破损书籍",
    "Turbo Pump": "涡轮泵",
    "Unusable Weapon": "废弃武器",
    "Vase": "花瓶",
    "Water Filter": "净水器",
    "Water Pump": "水泵",
    "Wasp Driver": "黄蜂控制模块",
    "Hornet Driver": "大黄蜂控制模块",
    "Bison Driver": "野牛控制模块",
    "Surveyor Core": "勘测核心",
    "Broken Electronics": "损坏的电子设备",
    "Old Circuit Board": "旧电路板",
    "Rusted Parts": "生锈零件",
    "Spark Plug": "火花塞",
    "Glass Shard": "玻璃碎片",

    # Trinkets
    "Very Comfortable Pillow": "非常舒适的枕头",
    "Rubber Duck": "橡皮鸭",
    "Snow Globe": "雪花球",
    "Teddy Bear": "泰迪熊",
    "Music Box": "音乐盒",
    "Pottery": "陶器",
    "Action Figure": "动作手办",

    # Medical / Quick Use
    "Vita Shot": "维生素注射",
    "Vita Spray": "维生素喷雾",
    "Vita Pack": "维生素包",
    "Bandage": "绷带",
    "Med Kit": "医疗包",
    "Stim Pack": "兴奋剂",
    "Agave Shot": "龙舌兰注射",
    "Agave Leaf": "龙舌兰叶",
    "Stamina Booster": "耐力增强剂",
    "Yellow Light Stick": "黄色荧光棒",
    "Red Light Stick": "红色荧光棒",
    "Green Light Stick": "绿色荧光棒",
    "Blue Light Stick": "蓝色荧光棒",
    "Portable Radar": "便携雷达",
    "Zipline": "滑索",

    # Throwables / Grenades
    "Frag Grenade": "碎片手雷",
    "Stun Grenade": "眩晕手雷",
    "Lure Grenade": "诱饵手雷",
    "Smoke Grenade": "烟雾弹",
    "Blaze Grenade": "燃烧弹",
    "Gas Grenade": "毒气弹",
    "Tag Grenade": "标记手雷",
    "Trigger Nade": "遥控雷",
    "Trailblazer Grenade": "拓荒者手雷",
    "EMP Grenade": "EMP手雷",
    "Razor Nade": "剃刀雷",
    "Homing Grenade": "追踪手雷",

    # Gadgets
    "Shield Charger": "护盾充电器",
    "Shield Repair Kit": "护盾修复工具",
    "Proximity Alarm": "接近警报",
    "Deployable Cover": "可部署掩体",
    "Grappling Hook": "抓钩",
    "ARC Cloak": "ARC隐身衣",
    "ARC Scanner": "ARC扫描仪",
    "Noise Maker": "噪音发生器",
    "Padlock": "挂锁",

    # Keys
    "Outskirts Bunker Key": "郊区地堡钥匙",
    "Sewer Key": "下水道钥匙",

    # Instruments
    "Guitar": "吉他",
    "Recorder": "竖笛",

    # Shields
    "Light Shield": "轻型护盾",
    "Medium Shield": "中型护盾",
    "Heavy Shield": "重型护盾",

    # Outfits
    "Aviator (Outfit)": "飞行员（服装）",
    "Warden (Outfit)": "守望者（服装）",
    "Nomad (Outfit)": "游牧者（服装）",
    "Hiker (Outfit)": "徒步者（服装）",
    "Pathfinder (Outfit)": "探路者（服装）",
    "Scout (Outfit)": "侦察兵（服装）",
    "Raider (Outfit)": "袭击者（服装）",

    # Backpack attachments
    "Backpack Attachment": "背包配件",

    # Food
    "Tuna Can": "金枪鱼罐头",
    "Agave Seeds": "龙舌兰种子",
    "Compact Snowball": "紧实雪球",

    # WolfPack
    "WolfPack": "狼群火箭",
}

# Weapon variant name patterns (keep original but add Chinese suffix for blueprints)
BLUEPRINT_SUFFIX_ZH = "蓝图"

# ─── DESCRIPTION TRANSLATIONS ─────────────────────────────────────
DESC_EXACT = {
    "Can be recycled into crafting materials.": "可回收为制作材料。",
    "A refined material used in crafting.": "用于制作的精炼材料。",
    "A plant used to craft medical supplies.": "用于制作医疗用品的植物。",
    "A piece of hand-crafted pottery.": "一件手工制作的陶器。",
    "A decorative vase, possibly valuable.": "装饰花瓶，可能很值钱。",
    "A can of tuna, suspiciously bloated.": "一罐金枪鱼，可疑地膨胀着。",
    "A device that sparks and pops in a pleasant manner.": "一种会令人愉快地发出火花和爆裂声的装置。",
    "A compact snowball fashioned out of the most malleable and aerodynamic snow.": "用最柔软、最具空气动力学特性的雪制成的紧实雪球。",
    "A handful of seeds. Celeste might be looking for these.": "一把种子。Celeste可能正在寻找这些。",
    "A piece of an agave leaf. Can be used to regain a small amount of health.": "一片龙舌兰叶。可用于恢复少量生命值。",
    "A portable analyzer from the world before, complete with several spare tubes.": "来自旧世界的便携式分析仪，配有几根备用管。",
    "A remnant of a time long lost, when it was fashionable to stand out.": "一个早已逝去的时代遗物，那时标新立异是一种时尚。",
    "30% Reduced Max-Shot Dispersion": "最大射击散布降低30%",
    "A concoction that temporarily increases stamina regeneration, at a small initial cost to health.": "一种暂时增加耐力恢复的药剂，会略微消耗初始生命值。",
    "A food item that moderately increases both health and stamina.": "一种可以适度增加生命值和耐力的食物。",
    "A new cosmetic variant will be added to your collection.": "新的外观变体将添加到您的收藏中。",
    "A locking mechanism that can be placed on large metal doors to limit access.": "可以放置在大型金属门上限制通行的锁定装置。",
    "May be worth a few credits to someone.": "对某些人来说可能值几个信用点。",
}

DESC_PATTERNS = [
    # Blueprint descriptions
    (r"^Lets you craft a (.+)$", lambda m: f"让你制作{m.group(1)}"),
    (r"^Allows you to craft the (.+)\.$", lambda m: f"允许你制作{m.group(1)}。"),
    (r"^Lets you craft a (.+) - (.+)$", lambda m: f"让你制作{m.group(1)} - {m.group(2)}"),

    # Weapon descriptions
    (r"^Fully automatic assault rifle", lambda m: "全自动突击步枪" + m.string[len(m.group(0)):]),
    (r"^Semi-automatic assault rifle", lambda m: "半自动突击步枪" + m.string[len(m.group(0)):]),
    (r"^Fully automatic SMG", lambda m: "全自动冲锋枪" + m.string[len(m.group(0)):]),
    (r"^Semi-automatic pistol", lambda m: "半自动手枪" + m.string[len(m.group(0)):]),
    (r"^Single-action hand cannon", lambda m: "单动手炮" + m.string[len(m.group(0)):]),
    (r"^Single-action pistol", lambda m: "单动手枪" + m.string[len(m.group(0)):]),
    (r"^Pump-action shotgun", lambda m: "泵动式霰弹枪" + m.string[len(m.group(0)):]),
    (r"^Semi-automatic shotgun", lambda m: "半自动霰弹枪" + m.string[len(m.group(0)):]),
    (r"^Heavy break-action rifle", lambda m: "重型折开式步枪" + m.string[len(m.group(0)):]),
    (r"^A scoped bolt-action sniper rifle", lambda m: "带瞄准镜的栓动式狙击步枪" + m.string[len(m.group(0)):]),
    (r"^A bolt-action sniper rifle", lambda m: "栓动式狙击步枪" + m.string[len(m.group(0)):]),
    (r"^A 3-round burst assault rifle", lambda m: "三连发突击步枪" + m.string[len(m.group(0)):]),
    (r"^Fires explosive projectiles", lambda m: "发射爆炸弹药" + m.string[len(m.group(0)):]),
    (r"^Has large ammo capacity", lambda m: "拥有大弹药容量" + m.string[len(m.group(0)):]),
    (r"^Has slow fire rate", lambda m: "射速较慢" + m.string[len(m.group(0)):]),
    (r"^A high capacity experimental beam rifle", lambda m: "高容量实验型光束步枪" + m.string[len(m.group(0)):]),
    (r"^A classic makeshift weapon", lambda m: "经典的临时武器" + m.string[len(m.group(0)):]),

    # Grenade/throwable descriptions
    (r"^A grenade that detonates after a delay, dealing explosive damage", lambda m: "延时引爆的手雷，造成爆炸伤害" + m.string[len(m.group(0)):]),
    (r"^A grenade that detonates after a delay, stunning enemies", lambda m: "延时引爆的手雷，眩晕范围内的敌人" + m.string[len(m.group(0)):]),
    (r"^A grenade that detonates after a delay, tagging", lambda m: "延时引爆的手雷，标记" + m.string[len(m.group(0)):]),
    (r"^A grenade that detonates on impact, covering an area in fire", lambda m: "着弹即爆的手雷，覆盖区域造成持续火焰伤害" + m.string[len(m.group(0)):]),
    (r"^A grenade that detonates on impact, dealing explosive damage", lambda m: "着弹即爆的手雷，造成范围爆炸伤害" + m.string[len(m.group(0)):]),
    (r"^A grenade that creates a lingering smoke cloud", lambda m: "产生持续烟雾的手雷" + m.string[len(m.group(0)):]),
    (r"^A grenade that emits a trail of flammable gas", lambda m: "释放易燃气体轨迹的手雷" + m.string[len(m.group(0)):]),
    (r"^A grenade that sticks to surfaces", lambda m: "可粘附在表面的手雷" + m.string[len(m.group(0)):]),
    (r"^A grenade that scatters into multiple homing missiles", lambda m: "碎裂成多枚追踪导弹的手雷" + m.string[len(m.group(0)):]),
    (r"^A grenade that pops a thick but small smoke cloud", lambda m: "释放浓密但范围小的烟雾的手雷" + m.string[len(m.group(0)):]),
    (r"^A grenade that emites lingering toxic cloud", lambda m: "释放持续有毒烟雾的手雷" + m.string[len(m.group(0)):]),
    (r"^A homing grenade that targets", lambda m: "追踪特定目标的手雷" + m.string[len(m.group(0)):]),
    (r"^A remote-detonated grenade", lambda m: "遥控引爆手雷" + m.string[len(m.group(0)):]),
    (r"^A makeshift fuze grenade", lambda m: "临时引信手雷" + m.string[len(m.group(0)):]),

    # Mine descriptions
    (r"^A proximity triggered mine that pops up and explodes", lambda m: "接近触发式弹跳地雷，弹起后爆炸" + m.string[len(m.group(0)):]),
    (r"^A proximity triggered mine that pops up and stuns", lambda m: "接近触发式弹跳地雷，弹起后眩晕目标" + m.string[len(m.group(0)):]),
    (r"^A proximity-triggered mine that pops up and deploys a gas cloud", lambda m: "接近触发式弹跳地雷，弹起后释放毒气" + m.string[len(m.group(0)):]),
    (r"^A proximity-triggered mine that pops up and knocks back", lambda m: "接近触发式弹跳地雷，弹起后击退目标" + m.string[len(m.group(0)):]),
    (r"^A mine that deals damage", lambda m: "造成伤害的地雷" + m.string[len(m.group(0)):]),

    # Laser trip wire
    (r"^A laser trip wire that detonates a (.+)$", lambda m: f"触发后引爆{m.group(1)}的激光绊线。"),
    (r"^A deployable laser trip wire that detonates a (.+)\.$", lambda m: f"可部署的激光绊线，触发后引爆{m.group(1)}。"),

    # Gadgets
    (r"^A gadget that allows the user to conceal themselves", lambda m: "使用户能够隐蔽自身的小工具" + m.string[len(m.group(0)):]),
    (r"^A gadget that allows the user to scale structures", lambda m: "使用户能够攀爬建筑和快速移动的小工具" + m.string[len(m.group(0)):]),
    (r"^A deployable cover that can block incoming damage", lambda m: "可部署的掩体，能阻挡来袭伤害" + m.string[len(m.group(0)):]),
    (r"^A deployable zipline", lambda m: "可部署的滑索" + m.string[len(m.group(0)):]),
    (r"^A deployable device that", lambda m: "可部署的装置，" + m.string[len(m.group(0)):]),
    (r"^A deployable proximity sensor", lambda m: "可部署的接近传感器" + m.string[len(m.group(0)):]),
    (r"^A noisy device that sticks to surfaces", lambda m: "可粘附在表面的噪音装置" + m.string[len(m.group(0)):]),
    (r"^A handheld repair kit that recharges a shield", lambda m: "可充能护盾的手持修复工具" + m.string[len(m.group(0)):]),
    (r"^A handkeld kit that recharges a shield", lambda m: "可充能护盾的手持工具"),

    # Shields
    (r"^A lightweight shield", lambda m: "轻量级护盾" + m.string[len(m.group(0)):]),
    (r"^A heavy shield", lambda m: "重型护盾" + m.string[len(m.group(0)):]),
    (r"^A medium weight shield", lambda m: "中型护盾" + m.string[len(m.group(0)):]),

    # Augments
    (r"^A Combat augment", lambda m: "战斗型增强器" + m.string[len(m.group(0)):]),
    (r"^A defence-focused augment", lambda m: "防御型增强器" + m.string[len(m.group(0)):]),
    (r"^A healing-focused augment", lambda m: "治疗型增强器" + m.string[len(m.group(0)):]),
    (r"^A looting augment", lambda m: "拾取型增强器" + m.string[len(m.group(0)):]),
    (r"^A heavy-duty pack mule augment", lambda m: "重型载物增强器" + m.string[len(m.group(0)):]),
    (r"^A balanced augment", lambda m: "均衡型增强器" + m.string[len(m.group(0)):]),
    (r"^An all-around augment", lambda m: "全能型增强器" + m.string[len(m.group(0)):]),
    (r"^A standard augment", lambda m: "标准增强器" + m.string[len(m.group(0)):]),

    # Medical
    (r"^A medical item that restores a large amount of health", lambda m: "恢复大量生命值的医疗物品" + m.string[len(m.group(0)):]),
    (r"^A medical item that gradually restores a large amount", lambda m: "逐渐恢复大量生命值的医疗物品" + m.string[len(m.group(0)):]),
    (r"^A medical item that gradually restores health", lambda m: "逐渐恢复生命值的医疗物品" + m.string[len(m.group(0)):]),
    (r"^A medical item that continuously restores health", lambda m: "持续恢复生命值的医疗物品" + m.string[len(m.group(0)):]),

    # Materials
    (r"^Obtained from ARC enemies or activities\. Used to craft components", lambda m: "从ARC敌人或活动中获得。用于制作组件" + m.string[len(m.group(0)):]),
    (r"^Used to craft a wide range of items", lambda m: "用于制作多种物品" + m.string[len(m.group(0)):]),
    (r"^A bundle of old wires", lambda m: "一捆旧电线" + m.string[len(m.group(0)):]),
    (r"^A device that adjusts electrical voltage", lambda m: "调节电压的装置" + m.string[len(m.group(0)):]),
    (r"^A control module used to operate (.+) drones", lambda m: f"用于操控{m.group(1)}无人机的控制模块" + m.string[len(m.group(0)):]),
    (r"^A critical control component from a (.+) vehicle", lambda m: f"来自{m.group(1)}载具的关键控制组件" + m.string[len(m.group(0)):]),

    # Keys
    (r"^Unlocks a door in the (.+)\.", lambda m: f"打开{m.group(1)}的一扇门。"),
    (r"^A makeshift key that lets you open the (.+)$", lambda m: f"可以打开{m.group(1)}的临时钥匙"),
    (r"^A pungent key used to operate", lambda m: "用于操作" + m.string[len(m.group(0)):]),

    # Cosmetics
    (r"^A new cosmetic variant will be added to your collection for the (.+)$",
     lambda m: f"新的{m.group(1)}外观变体将添加到您的收藏中"),
    (r"^A new cosmetic variant will be added to your collection\. Complete (.+) Quest\.$",
     lambda m: f"新外观变体将添加到您的收藏中。完成{m.group(1)}任务。"),
    (r"^This is the (.+) cosmetic outfit$", lambda m: f"这是{m.group(1)}外观服装"),
    (r"^This is the (.+) cosmetic colour$", lambda m: f"这是{m.group(1)}外观颜色"),

    # Instruments
    (r"^A playable acoustic guitar", lambda m: "可演奏的原声吉他" + m.string[len(m.group(0)):]),
    (r"^A playable recorder", lambda m: "可演奏的竖笛" + m.string[len(m.group(0)):]),

    # Light sticks
    (r"^A throwable chemical light that illuminates", lambda m: "可投掷的化学荧光棒，照亮" + m.string[len(m.group(0)):]),

    # Binoculars
    (r"^A basic pair of binoculars", lambda m: "基础望远镜" + m.string[len(m.group(0)):]),

    # Scanner
    (r"^A laser-based scanner used to detect", lambda m: "用于探测的激光扫描仪" + m.string[len(m.group(0)):]),

    # Generic catch-all fragments to translate within remaining descriptions
]

# ─── WORD-LEVEL TRANSLATIONS for remaining untranslated parts ───────
WORD_MAP = {
    " with high damage output and headshot damage, but slow handling.": "，具有高伤害输出和爆头伤害，但操控较慢。",
    " with moderate fire rate and accuracy.": "，具有中等射速和精度。",
    " with decent damage output and accuracy.": "，具有不错的伤害输出和精度。",
    " with high fire rate but low damage.": "，射速高但伤害低。",
    " with good bullet spread but sharp falloff.": "，弹丸散布良好但衰减明显。",
    ". Packs a punch.": "。一击必杀。",
    ". Quick and precise at medium range.": "。中距离快速精准。",
    ". A reliable workhorse.": "。可靠的主力武器。",
    " with exceptional damage output and accuracy, but slow handling.": "，具有卓越的伤害输出和精度，但操控较慢。",
    " that only detonate after a short delay upon impact.": "，着弹后短暂延迟后才会引爆。",
    ", but is only accurate while crouched. ": "，但只有蹲下时才精准。",
    ", but is only accurate while crouched.": "，但只有蹲下时才精准。",
    ". Fires two shots at a time.": "。每次发射两发子弹。",
    ". Fires two shots at a time": "。每次发射两发子弹",
    " with a built-in flashlight.": "，带有内置手电筒。",
    ", sure to leave scorch marks.": "，必定留下灼烧痕迹。",
    " with two levels of magnification.": "，带有两级放大倍率。",
    ", at a small initial cost to health.": "，会略微消耗初始生命值。",
    ", dealing explosive damage after a short delay.": "，短暂延迟后造成爆炸伤害。",
    ", distracting nearby ARC machines and drawing their fire.": "，干扰附近ARC机器并吸引火力。",
    " that offers limited protection without severely impacting mobility.": "，提供有限保护但不会严重影响机动性。",
    " that blocks a large portion of incoming damage, but carries a significant cost to mobility.": "，阻挡大量伤害，但大幅降低机动性。",
    " that provides a good balance of protection and mobility.": "，在保护和机动性之间提供良好平衡。",
    " is more focused on maneuverability than absorbing damage.": "更注重机动性而非吸收伤害。",
    " more focused on maneuverability than absorbing damage.": "更注重机动性而非吸收伤害。",
    " for keeping shields topped up.": "，保持护盾充能。",
    " which adds extra slots for healing items.": "，增加治疗物品的额外槽位。",
    " that swaps some carry capacity to increase survivability.": "，牺牲部分负重以增加生存能力。",
    " that trades weight and utility for increased looting potential. A Safe Pocket that allows any items to be stored.": "，牺牲负重和实用性以增加拾取潜力。安全口袋可存放任何物品。",
    ". Large weight capacity and large backpack space.": "。大负重容量和大背包空间。",
    " on impact, blocking visibility from other Raiders.": "，阻挡其他掠夺者的视野。",
    " on impact, blocking visibility from ARC and other Raiders.": "，阻挡ARC和其他掠夺者的视野。",
    " in its radius.": "范围内的一切。",
    " within its radius.": "范围内的一切。",
    " Raiders and ARC enemies in an area, allowing you to briefly track their location.": "区域内的掠夺者和ARC敌人，让你短暂追踪他们的位置。",
    " that deals damage over time.": "，造成持续伤害。",
    " in a small radius.": "在小范围内。",
    ", each one targeting ARC and dealing explosive damage on impact.": "，每枚追踪ARC目标并在撞击时造成爆炸伤害。",
    " along its path, causing an explosive chain reaction when it ignites.": "沿其路径释放，点燃时引发爆炸连锁反应。",
    " on impact, draining the stamina of any Raiders within its area of effect.": "，消耗范围内所有掠夺者的耐力。",
    " that can stick to surfaces and ARC, dealing explosive damage when triggered.": "，可粘附在表面和ARC上，触发时造成爆炸伤害。",
    " that bursts into razor-sharp fragments upon detonation.": "，引爆时碎裂成锋利碎片。",
    " a single nearby ARC dealing explosive damage on impact": "附近单个ARC目标，撞击时造成爆炸伤害",
    " until it breaks.": "直到它被摧毁。",
    ", when manually triggered, launches a Raider Distress Flare.": "，手动触发时发射掠夺者求救信号弹。",
    " that sounds an alarm when enemy raiders are detected.": "，检测到敌方掠夺者时发出警报。",
    " from ARC.": "免受ARC发现。",
    " and cover large distances.": "并覆盖远距离。",
    " that allows you to quickly move between two locations.": "，让你在两个位置之间快速移动。",
    " on use.": "。",
    " over time.": "。",
    "Can be recycled into ARC Alloy.": "可回收为ARC合金。",
    ". Can be recycled into ARC Alloy.": "。可回收为ARC合金。",
    ". Can be recycled into scrap metal.": "。可回收为废金属。",
    "Can be used on yourself or your allies.": "可对自己或队友使用。",
    " during use. Can be used on yourself or your allies.": "。可对自己或队友使用。",
    " health over time.": "生命值。",
    "Health Per Second: 10/s": "每秒生命值：10/s",
    "Illumination Radius 7m": "照明半径 7m",
    "Illumination Radius: 7m": "照明半径：7m",
    "Somewhat effective against ARC armor plating": "对ARC装甲板有一定效果",
    " once the timer runs out": "计时器结束后",
    " that rapidly drains stamina": "快速消耗耐力",
    "the subtlest changer to the Earth's surface.": "地球表面最细微的变化。",
    "ARC's attention and impress other Raiders.": "ARC的注意力并给其他掠夺者留下深刻印象。",
    "What pages remain speak of chosen heroes, vampires, and lots of longing glances.": "残存的书页讲述着被选中的英雄、吸血鬼和许多渴望的目光。",
    "Like sleeping on an especially ergonomic cloud.": "就像睡在一朵特别符合人体工学的云上。",
    "The envy of every Raider. ": "每个掠夺者都羡慕不已。",
    "The explosive pod from a Tick. ": "来自蜱虫的爆炸舱。",
}

def translate_name(name):
    """Translate item name."""
    if not name:
        return name

    # Direct map
    if name in NAME_MAP:
        return NAME_MAP[name]

    # Blueprint pattern: "X Blueprint" -> "X蓝图"
    if name.endswith(' Blueprint'):
        base = name[:-len(' Blueprint')]
        base_zh = NAME_MAP.get(base, base)
        return f"{base_zh}{BLUEPRINT_SUFFIX_ZH}"

    # Recipe pattern: "X Recipe" (treat as blueprint)
    if name.endswith(' Recipe'):
        base = name[:-len(' Recipe')]
        base_zh = NAME_MAP.get(base, base)
        return f"{base_zh}{BLUEPRINT_SUFFIX_ZH}"

    # Outfit patterns
    m = re.match(r'^(.+) \(Outfit\)$', name)
    if m:
        return f"{m.group(1)}（服装）"

    # Colour/Emote patterns
    m = re.match(r'^(.+) \(Colour\)$', name)
    if m:
        return f"{m.group(1)}（颜色）"
    m = re.match(r'^(.+) \(Emote\)$', name)
    if m:
        return f"{m.group(1)}（表情）"
    m = re.match(r'^(.+) \(Backpack Attachment\)$', name)
    if m:
        return f"{m.group(1)}（背包挂件）"

    # Keep weapon names and other proper nouns as-is
    return name


def translate_description(desc):
    """Translate item description."""
    if not desc or not desc.strip():
        return desc

    desc = desc.strip()

    # Exact match
    if desc in DESC_EXACT:
        return DESC_EXACT[desc]

    # Pattern match
    for pattern, replacement in DESC_PATTERNS:
        m = re.match(pattern, desc)
        if m:
            result = replacement(m)
            # Apply word-level translations to remaining English parts
            for eng, zh in WORD_MAP.items():
                result = result.replace(eng, zh)
            return result

    # If no pattern matched, try word-level translations on original
    result = desc
    for eng, zh in WORD_MAP.items():
        result = result.replace(eng, zh)

    return result


def translate_flavor(flavor):
    """Translate flavor text."""
    if not flavor or not flavor.strip():
        return flavor
    flavor = flavor.strip()
    # Apply word-level translations
    result = flavor
    for eng, zh in WORD_MAP.items():
        result = result.replace(eng, zh)
    return result


# ─── APPLY TRANSLATIONS ───────────────────────────────────────────
translated = []
for item in items:
    t = copy.deepcopy(item)
    t['name'] = translate_name(item['name'])
    t['description'] = translate_description(item.get('description'))
    if item.get('flavor_text'):
        t['flavor_text'] = translate_flavor(item['flavor_text'])
    translated.append(t)

with open('src/data/zh/items_zh.json', 'w', encoding='utf-8') as f:
    json.dump(translated, f, ensure_ascii=False, indent=2)

# Stats
total = len(translated)
names_translated = sum(1 for o, t in zip(items, translated) if o['name'] != t['name'])
descs_translated = sum(1 for o, t in zip(items, translated)
                       if (o.get('description') or '') != (t.get('description') or ''))
print(f"Total items: {total}")
print(f"Names translated: {names_translated}")
print(f"Descriptions translated: {descs_translated}")
print(f"Names remaining English: {total - names_translated}")
print(f"Descriptions remaining English: {total - descs_translated - sum(1 for i in items if not i.get('description'))}")
