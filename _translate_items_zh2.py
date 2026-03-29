#!/usr/bin/env python3
"""Comprehensive translation of items_zh.json - names and descriptions."""
import json, re, copy

with open('src/data/items.json', 'r') as f:
    items = json.load(f)

# ═══════════════════════════════════════════════════════════════════
# NAME TRANSLATIONS - Complete dictionary
# ═══════════════════════════════════════════════════════════════════
NAME_MAP = {
    # ─── ARC Materials ───
    "ARC Alloy": "ARC合金",
    "ARC Motion Core": "ARC运动核心",
    "ARC Filament": "ARC灯丝",
    "ARC Fiber": "ARC纤维",
    "ARC Mesh": "ARC网格",
    "ARC Plating": "ARC装甲板",
    "ARC Thread": "ARC线",
    "ARC Circuitry": "ARC电路",
    "ARC Coolant": "ARC冷却液",
    "ARC Flex Rubber": "ARC弹性橡胶",
    "ARC Performance Steel": "ARC高性能钢",
    "ARC Powercell": "ARC能量电池",
    "ARC Synthetic Resin": "ARC合成树脂",
    "ARC Thermo Lining": "ARC隔热衬层",
    "ARC Cloak": "ARC隐身斗篷",
    "ARC Scanner": "ARC扫描仪",
    "Advanced ARC Powercell": "高级ARC能量电池",
    "Burned ARC Circuitry": "烧毁的ARC电路",
    "Damaged ARC Motion Core": "损坏的ARC运动核心",
    "Damaged ARC Powercell": "损坏的ARC能量电池",
    "Degraded ARC Rubber": "劣化的ARC橡胶",
    "Dried-Out ARC Resin": "干涸的ARC树脂",
    "Impure ARC Coolant": "不纯的ARC冷却液",
    "Rusty ARC Steel": "生锈的ARC钢",
    "Tattered ARC Lining": "破损的ARC衬层",

    # ─── Crafting Materials ───
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
    "Coolant": "冷却液",
    "Sensors": "传感器",
    "Motor": "电机",
    "Moss": "苔藓",
    "Roots": "根茎",
    "Rope": "绳索",
    "Fertilizer": "肥料",
    "Antiseptic": "消毒剂",
    "Durable Cloth": "耐用布料",
    "Metal Parts": "金属零件",
    "Plastic Parts": "塑料零件",
    "Rubber Parts": "橡胶零件",
    "Metal Brackets": "金属支架",
    "Steel Spring": "钢弹簧",
    "Power Cable": "电源线",
    "Power Rod": "电源棒",
    "Syringe": "注射器",
    "Electrical Components": "电气元件",
    "Mechanical Components": "机械元件",
    "Advanced Electrical Components": "高级电气元件",
    "Advanced Mechanical Components": "高级机械元件",
    "Explosive Compound": "爆炸化合物",
    "Crude Explosives": "粗制炸药",
    "Synthesized Fuel": "合成燃料",
    "Refinement 1": "精炼品1",
    "Laboratory Reagents": "实验室试剂",
    "Exodus Modules": "出埃及模块",

    # ─── Crafting Components ───
    "Simple Gun Parts": "简易枪械零件",
    "Light Gun Parts": "轻型枪械零件",
    "Medium Gun Parts": "中型枪械零件",
    "Heavy Gun Parts": "重型枪械零件",
    "Complex Gun Parts": "复杂枪械零件",
    "Shotgun Parts": "霰弹枪零件",
    "Mod Components": "改装组件",

    # ─── ARC Enemy Parts ───
    "Wasp Driver": "黄蜂驱动器",
    "Hornet Driver": "大黄蜂驱动器",
    "Bison Driver": "野牛驱动器",
    "Rocketeer Driver": "火箭兵驱动器",
    "Surveyor Core": "勘测核心",
    "Surveyor Vault": "勘测保险库",
    "Bastion Cell": "堡垒电池",
    "Bombardier Cell": "轰炸兵电池",
    "Sentinel Firing Core": "哨兵射击核心",
    "Leaper Pulse Unit": "跳跃者脉冲装置",
    "Shredder Gyro": "粉碎者陀螺仪",
    "Spotter Relay": "观察者中继器",
    "Matriarch Reactor": "女王反应堆",
    "Queen Reactor": "女王反应堆",
    "Fireball Burner": "火球燃烧器",
    "Damaged Fireball Burner": "损坏的火球燃烧器",
    "Damaged Hornet Driver": "损坏的大黄蜂驱动器",
    "Damaged Rocketeer Driver": "损坏的火箭兵驱动器",
    "Damaged Wasp Driver": "损坏的黄蜂驱动器",
    "Damaged Tick Pod": "损坏的蜱虫舱",
    "Damaged Heat Sink": "损坏的散热器",
    "Tick Pod": "蜱虫舱",
    "Kinetic Converter": "动能转换器",

    # ─── Recyclables ───
    "Thermostat": "温控器",
    "Toaster": "烤面包机",
    "Torn Blanket": "破烂毯子",
    "Torn Book": "破损书籍",
    "Turbo Pump": "涡轮泵",
    "Unusable Weapon": "废弃武器",
    "Vase": "花瓶",
    "Water Filter": "净水器",
    "Water Pump": "水泵",
    "Broken Electronics": "损坏的电子设备",
    "Broken Flashlight": "损坏的手电筒",
    "Broken Guidance System": "损坏的制导系统",
    "Broken Handcuffs": "损坏的手铐",
    "Broken Handheld Radio": "损坏的手持电台",
    "Broken Riot Shield": "损坏的防暴盾",
    "Broken Taser": "损坏的电击枪",
    "Old Circuit Board": "旧电路板",
    "Rusted Parts": "生锈零件",
    "Rusted Bolts": "生锈螺栓",
    "Rusted Gear": "生锈齿轮",
    "Rusted Shut Medical Kit": "锈住的医疗包",
    "Rusted Tools": "生锈工具",
    "Ruined Accordion": "损坏的手风琴",
    "Ruined Augment": "损坏的增强器",
    "Ruined Baton": "损坏的警棍",
    "Ruined Handcuffs": "损坏的手铐",
    "Ruined Parachute": "损坏的降落伞",
    "Ruined Riot Shield": "损坏的防暴盾",
    "Ruined Tactical Vest": "损坏的战术背心",
    "Spark Plug": "火花塞",
    "Glass Shard": "玻璃碎片",
    "Air Freshener": "空气清新剂",
    "Alarm Clock": "闹钟",
    "Battery": "电池",
    "Bicycle Pump": "自行车打气筒",
    "Camera Lens": "相机镜头",
    "Candle Holder": "烛台",
    "Canister": "罐子",
    "Cat Bed": "猫窝",
    "Coffee Pot": "咖啡壶",
    "Cooling Coil": "冷却盘管",
    "Cooling Fan": "冷却风扇",
    "Cracked Bioscanner": "裂开的生物扫描仪",
    "Crumpled Plastic Bottle": "皱巴巴的塑料瓶",
    "Dart Board": "飞镖靶",
    "Defibrillator": "除颤器",
    "Deflated Football": "漏气的足球",
    "Diving Goggles": "潜水镜",
    "Dog Collar": "狗项圈",
    "Empty Wine Bottle": "空酒瓶",
    "Expired Pasta": "过期意面",
    "Expired Respirator": "过期呼吸器",
    "Faded Photograph": "褪色照片",
    "Film Reel": "电影胶卷",
    "Flow Controller": "流量控制器",
    "Fossilized Lightning": "化石闪电",
    "Frequency Modulation Box": "调频盒",
    "Fried Motherboard": "烧毁的主板",
    "Frying Pan": "平底锅",
    "Garlic Press": "压蒜器",
    "Geiger Counter": "盖革计数器",
    "Headphones": "耳机",
    "Household Cleaner": "家用清洁剂",
    "Humidifier": "加湿器",
    "Ice Cream Scooper": "冰淇淋勺",
    "Industrial Battery": "工业电池",
    "Industrial Charger": "工业充电器",
    "Industrial Magnet": "工业磁铁",
    "Ion Sputter": "离子溅射器",
    "Light Bulb": "灯泡",
    "Magnet": "磁铁",
    "Magnetic Accelerator": "磁力加速器",
    "Magnetron": "磁控管",
    "Microscope": "显微镜",
    "Mini Centrifuge": "迷你离心机",
    "Number Plate": "车牌",
    "Olives": "橄榄",
    "Playing Cards": "扑克牌",
    "Polluted Air Filter": "污染的空气滤芯",
    "Portable TV": "便携电视",
    "Power Bank": "充电宝",
    "Projector": "投影仪",
    "Radio": "收音机",
    "Radio Relay": "无线电中继器",
    "Remote Control": "遥控器",
    "Ripped Safety Vest": "撕烂的安全背心",
    "Rocket Thruster": "火箭推进器",
    "Rotary Encoder": "旋转编码器",
    "Rubber Pad": "橡胶垫",
    "Sample Cleaner": "样品清洁器",
    "Signal Amplifier": "信号放大器",
    "Shaker": "摇壶",
    "Speaker Component": "扬声器元件",
    "Spectrometer": "光谱仪",
    "Spectrum Analyzer": "频谱分析仪",
    "Spring Cushion": "弹簧坐垫",
    "Telemetry Transceiver": "遥测收发器",
    "Snap Hook": "弹簧钩",
    "ESR Analyzer": "ESR分析仪",
    "Processor": "处理器",
    "Poster of Natural Wonder": "自然奇观海报",
    "Music Album": "音乐专辑",
    "Tattered Clothes": "破烂衣服",
    "Painted Box": "彩绘盒子",

    # ─── Trinkets ───
    "Very Comfortable Pillow": "非常舒适的枕头",
    "Rubber Duck": "橡皮鸭",
    "Snow Globe": "雪花球",
    "Breathtaking Snow Globe": "令人惊叹的雪花球",
    "Teddy Bear": "泰迪熊",
    "Music Box": "音乐盒",
    "Pottery": "陶器",
    "Action Figure": "动作手办",
    "Fine Wristwatch": "精美腕表",
    "Red Coral Jewelry": "红珊瑚首饰",
    "Silver Teaspoon Set": "银茶匙套装",
    "Rosary": "念珠",
    "Statuette": "小雕像",

    # ─── Medical / Quick Use ───
    "Vita Shot": "维生素注射",
    "Vita Spray": "维生素喷雾",
    "Vita Pack": "维生素包",
    "Bandage": "绷带",
    "Med Kit": "医疗包",
    "Stim Pack": "兴奋剂包",
    "Agave Shot": "龙舌兰注射",
    "Agave Leaf": "龙舌兰叶",
    "Agave": "龙舌兰",
    "Agave Juice": "龙舌兰汁",
    "Agave Seeds": "龙舌兰种子",
    "Adrenaline Shot": "肾上腺素注射",
    "Stamina Booster": "耐力增强剂",
    "Herbal Bandage": "草药绷带",
    "Sterilized Bandage": "消毒绷带",
    "Shield Recharger": "护盾充能器",
    "Surge Shield Recharger": "激涌护盾充能器",
    "Herbal Extract": "草药提取物",

    # ─── Food / Consumables ───
    "Tuna Can": "金枪鱼罐头",
    "Bloated Tuna Can": "膨胀的金枪鱼罐头",
    "Apricot": "杏子",
    "Lemon": "柠檬",
    "Mushroom": "蘑菇",
    "Prickly Pear": "仙人掌果",
    "Great Mullein": "毛蕊花",
    "Candleberries": "白杨梅",
    "Assorted Seeds": "混合种子",
    "Fruit Mix": "水果混合",
    "Torch Ginger": "火炬姜",
    "Aloe Vera": "芦荟",
    "Compact Snowball": "紧实雪球",
    "Snowball": "雪球",
    "Burnt-Out Candles": "燃尽的蜡烛",

    # ─── Light Sticks ───
    "Yellow Light Stick": "黄色荧光棒",
    "Red Light Stick": "红色荧光棒",
    "Green Light Stick": "绿色荧光棒",
    "Blue Light Stick": "蓝色荧光棒",
    "Portable Radar": "便携雷达",

    # ─── Grenades / Throwables ───
    "Frag Grenade": "碎片手雷",
    "Stun Grenade": "眩晕手雷",
    "Lure Grenade": "诱饵手雷",
    "Smoke Grenade": "烟雾弹",
    "Blaze Grenade": "燃烧弹",
    "Gas Grenade": "毒气弹",
    "Tag Grenade": "标记手雷",
    "Tagging Grenade": "标记手雷",
    "Trigger Nade": "遥控雷",
    "Trailblazer Grenade": "拓荒者手雷",
    "EMP Grenade": "EMP手雷",
    "Razor Nade": "剃刀雷",
    "Homing Grenade": "追踪手雷",
    "Seeker Grenade": "搜索手雷",
    "Shrapnel Grenade": "破片手雷",
    "Snap Blast Grenade": "速爆手雷",
    "Heavy Fuze Grenade": "重型引信手雷",
    "Light Impact Grenade": "轻型冲击手雷",
    "WolfPack": "狼群火箭",
    "Li'l Smoke Grenade": "迷你烟雾弹",
    "Firecracker": "鞭炮",
    "Fireworks Box": "烟花盒",
    "Showstopper": "全场焦点",
    "Flame Spray": "火焰喷射",

    # ─── Mines / Traps ───
    "Explosive Mine": "爆炸地雷",
    "Gas Mine": "毒气地雷",
    "Pulse Mine": "脉冲地雷",
    "Jolt Mine": "震荡地雷",
    "Pop Trigger": "弹跳触发器",
    "Remote Raider Flare": "遥控掠夺者信号弹",
    "Blaze Grenade Trap": "燃烧弹陷阱",
    "Gas Grenade Trap": "毒气弹陷阱",
    "Lure Grenade Trap": "诱饵雷陷阱",
    "Smoke Grenade Trap": "烟雾弹陷阱",
    "Laser Trap: Lure": "激光陷阱：诱饵",
    "Door Blocker": "门阻挡器",
    "Barricade Kit": "路障工具",

    # ─── Gadgets ───
    "Shield Charger": "护盾充电器",
    "Shield Repair Kit": "护盾修复工具",
    "Proximity Alarm": "接近警报",
    "Deployable Cover": "可部署掩体",
    "Grappling Hook": "抓钩",
    "Noise Maker": "噪音发生器",
    "Noisemaker": "噪音发生器",
    "Padlock": "挂锁",
    "Zipline": "滑索",
    "Binoculars": "望远镜",
    "Lidar Scanner": "激光雷达扫描仪",
    "Snitch Scanner": "告密扫描仪",
    "Photoelectric Cloak": "光电隐身斗篷",

    # ─── Shields ───
    "Light Shield": "轻型护盾",
    "Medium Shield": "中型护盾",
    "Heavy Shield": "重型护盾",

    # ─── Augments ───
    "Combat Mk. 1": "战斗型 Mk.1",
    "Combat Mk. 2": "战斗型 Mk.2",
    "Combat Mk. 3 (Aggressive)": "战斗型 Mk.3（进攻）",
    "Combat Mk.3 (Flanking) ": "战斗型 Mk.3（侧翼）",
    "Looting Mk. 1": "拾取型 Mk.1",
    "Looting Mk. 2": "拾取型 Mk.2",
    "Looting MK. 3 (Cautious)": "拾取型 Mk.3（谨慎）",
    "Looting MK. 3 (Safekeeper)": "拾取型 Mk.3（保管者）",
    "Looting MK. 3 (Survivor)": "拾取型 Mk.3（幸存者）",
    "Tactical Mk. 1": "战术型 Mk.1",
    "Tactical Mk. 2": "战术型 Mk.2",
    "Tactical MK. 3 (Revival)": "战术型 Mk.3（复活）",
    "Tactical Mk. 3 (Healing)": "战术型 Mk.3（治疗）",
    "Tactical Mk.3 (Defensive)": "战术型 Mk.3（防御）",
    "Free Loadout Augment": "自由配装增强器",

    # ─── Ammo ───
    "Light Ammo": "轻型弹药",
    "Medium Ammo": "中型弹药",
    "Heavy Ammo": "重型弹药",
    "Shotgun ammo": "霰弹弹药",
    "Launcher Ammo": "发射器弹药",
    "Energy Clip": "能量弹夹",

    # ─── Weapons (proper names with tiers) ───
    "Tempest I": "风暴 I", "Tempest II": "风暴 II", "Tempest III": "风暴 III", "Tempest IV": "风暴 IV",
    "Venator I": "猎人 I", "Venator II": "猎人 II", "Venator III": "猎人 III", "Venator IV": "猎人 IV",
    "Torrente I": "激流 I", "Torrente II": "激流 II", "Torrente III": "激流 III", "Torrente IV": "激流 IV",
    "Vulcano I": "火山 I", "Vulcano II": "火山 II", "Vulcano III": "火山 III", "Vulcano IV": "火山 IV",
    "Anvil I": "铁砧 I", "Anvil II": "铁砧 II", "Anvil III": "铁砧 III", "Anvil IV": "铁砧 IV",
    "Anvil Splitter": "铁砧分裂者",
    "Rattler I": "响尾蛇 I", "Rattler II": "响尾蛇 II", "Rattler III": "响尾蛇 III", "Rattler IV": "响尾蛇 IV",
    "Arpeggio I": "琶音 I", "Arpeggio II": "琶音 II", "Arpeggio III": "琶音 III", "Arpeggio IV": "琶音 IV",
    "Renegade I": "叛逆者 I", "Renegade II": "叛逆者 II", "Renegade III": "叛逆者 III", "Renegade IV": "叛逆者 IV",
    "Ferro I": "铁骑 I", "Ferro II": "铁骑 II", "Ferro III": "铁骑 III", "Ferro IV": "铁骑 IV",
    "Bettina I": "贝蒂娜 I", "Bettina II": "贝蒂娜 II", "Bettina III": "贝蒂娜 III", "Bettina IV": "贝蒂娜 IV",
    "Kettle I": "壶 I", "Kettle II": "壶 II", "Kettle III": "壶 III", "Kettle IV": "壶 IV",
    "Stitcher I": "缝合者 I", "Stitcher II": "缝合者 II", "Stitcher III": "缝合者 III", "Stitcher IV": "缝合者 IV",
    "Burletta I": "滑稽剧 I", "Burletta II": "滑稽剧 II", "Burletta III": "滑稽剧 III", "Burletta IV": "滑稽剧 IV",
    "Bobcat I": "山猫 I", "Bobcat II": "山猫 II", "Bobcat III": "山猫 III", "Bobcat IV": "山猫 IV",
    "Hairpin I": "发卡 I", "Hairpin II": "发卡 II", "Hairpin III": "发卡 III", "Hairpin IV": "发卡 IV",
    "Osprey I": "鱼鹰 I", "Osprey II": "鱼鹰 II", "Osprey III": "鱼鹰 III", "Osprey IV": "鱼鹰 IV",
    "Hullcracker I": "破壳者 I", "Hullcracker II": "破壳者 II", "Hullcracker III": "破壳者 III", "Hullcracker IV": "破壳者 IV",
    "Il Toro I": "公牛 I", "Il Toro II": "公牛 II", "Il Toro III": "公牛 III", "Il Toro IV": "公牛 IV",
    "Aphelion Rifle": "远日步枪",
    "Equalizer": "均衡者",
    "Jupiter": "木星",
    "Deadline": "死线",

    # ─── Weapon Mods ───
    "Angled Grip I": "斜握把 I", "Angled Grip II": "斜握把 II", "Angled Grip III": "斜握把 III",
    "Vertical Grip I": "垂直握把 I", "Vertical Grip II": "垂直握把 II", "Vertical Grip III": "垂直握把 III",
    "Horizontal Grip": "水平握把",
    "Compensator I": "补偿器 I", "Compensator II": "补偿器 II", "Compensator III": "补偿器 III",
    "Muzzle Brake I": "制退器 I", "Muzzle Brake II": "制退器 II", "Muzzle Brake III": "制退器 III",
    "Silencer I": "消音器 I", "Silencer II": "消音器 II", "Silencer III": "消音器 III",
    "Shotgun Silencer": "霰弹枪消音器",
    "Shotgun Choke I": "霰弹枪收束器 I", "Shotgun Choke II": "霰弹枪收束器 II", "Shotgun Choke III": "霰弹枪收束器 III",
    "Extended Barrel": "加长枪管",
    "Extended Light Mag I": "扩展轻型弹匣 I", "Extended Light Mag II": "扩展轻型弹匣 II", "Extended Light Mag III": "扩展轻型弹匣 III",
    "Extended Medium Mag I": "扩展中型弹匣 I", "Extended Medium Mag II": "扩展中型弹匣 II", "Extended Medium Mag III": "扩展中型弹匣 III",
    "Extended Shotgun Mag I": "扩展霰弹弹匣 I", "Extended Shotgun Mag II": "扩展霰弹弹匣 II", "Extended Shotgun Mag III": "扩展霰弹弹匣 III",
    "Stable Stock I": "稳定枪托 I", "Stable Stock II": "稳定枪托 II", "Stable Stock III": "稳定枪托 III",
    "Lightweight Stock": "轻量枪托",
    "Padded Stock": "软垫枪托",

    # ─── Keys ───
    "Outskirts Bunker Key": "郊区地堡钥匙",
    "Sewer Key": "下水道钥匙",
    "Blue Gate Cellar Key": "蓝门地窖钥匙",
    "Blue Gate Communication Tower Key": "蓝门通信塔钥匙",
    "Blue Gate Confiscation Room Key": "蓝门没收室钥匙",
    "Blue Gate Village Key": "蓝门村庄钥匙",
    "Buried City Hospital Key": "埋葬之城医院钥匙",
    "Buried City JKV Employee Access Card": "埋葬之城JKV员工门禁卡",
    "Buried City Residential Master Key": "埋葬之城住宅万能钥匙",
    "Buried City Town Hall Key": "埋葬之城市政厅钥匙",
    "Dam Control Center Tower Key": "大坝控制中心塔钥匙",
    "Dam Surveillance Key": "大坝监控室钥匙",
    "Dam Testing Annex Key": "大坝测试附楼钥匙",
    "Dam Utility Key": "大坝设施钥匙",
    "Flushing Terminal Key": "冲洗终端钥匙",
    "Patrol Car Key": "巡逻车钥匙",
    "Raider Hatch Key": "掠夺者舱口钥匙",
    "Spaceport Container Storage Key": "航天港集装箱仓库钥匙",
    "Spaceport Control Tower Key": "航天港控制塔钥匙",
    "Spaceport Outskirts Bunker Key": "航天港郊区地堡钥匙",
    "Spaceport Trench Tower Key": "航天港壕沟塔钥匙",
    "Spaceport Warehouse Key": "航天港仓库钥匙",
    "Stella Montis Archives Key": "星山档案室钥匙",
    "Stella Montis Assembly Admin Key": "星山议会管理钥匙",
    "Stella Montis Medical Storage Key": "星山医疗储藏室钥匙",
    "Stella Montis Security Checkpoint Key": "星山安检站钥匙",

    # ─── Instruments ───
    "Guitar": "吉他",
    "Acoustic Guitar": "原声吉他",
    "Recorder": "竖笛",

    # ─── Cosmetics and quest rewards ───
    "Aviator (Outfit)": "飞行员（服装）",
    "Orange Camo (Origin Outfit)": "橙色迷彩（原始服装）",
    "Crimson Racer (Aviator Colour)": "深红赛车手（飞行员颜色）",
    "Black & White (Origin Color)": "黑白（原始颜色）",
    "Black (Hiker Colour)": "黑色（徒步者颜色）",
    "Black Eye (Face Style)": "黑眼（面部风格）",
    "Blue (Radio Renegade Color)": "蓝色（无线电叛逆颜色）",
    "Blue Yellow (Aviator Color)": "蓝黄（飞行员颜色）",
    "Tangerine (Warden Color)": "橘色（守望者颜色）",
    "Bag (Radio Renegade Variant)": "背包（无线电叛逆变体）",
    "Goggles (Radio Renegade Variant)": "护目镜（无线电叛逆变体）",
    "Helmet (Radio Renegade Variant)": "头盔（无线电叛逆变体）",
    "Banana (Backpack Charm)": "香蕉（背包挂件）",
    "Burgerboy (Backpack Charm)": "汉堡男孩（背包挂件）",
    "Succulent (Backpack Charm)": "多肉植物（背包挂件）",
    "Mastery Medal (Backpack Charm)": "精通奖章（背包挂件）",
    "Lance's Mixtape (5th Edition)": "Lance的混音带（第5版）",
    "Cheer Emote - Quest reward from The Right Tool": "欢呼表情",
    "Dam Staff Room Key": "大坝员工室钥匙",
    "Volcanic Rock": "火山岩",
}

# ─── DESCRIPTION TRANSLATIONS ─────────────────────────────────────
DESC_MAP = {
    # Recycling
    "Can be recycled into crafting materials.": "可回收为制作材料。",
    "Can be recycled into crafting materials": "可回收为制作材料",
    "Can be recycled into Crafting Materials": "可回收为制作材料",
    "Can be recycled into crafting material.": "可回收为制作材料。",
    "Can be recycled into chemicals.": "可回收为化学品。",
    "Can be recycled into fabric.": "可回收为布料。",
    "Can be recycled into metal parts.": "可回收为金属零件。",
    "Can be recycled into plastic parts.": "可回收为塑料零件。",
    "Can be recycled into rubber parts.": "可回收为橡胶零件。",
    "Can be recycled into ARC Alloy.": "可回收为ARC合金。",
    "Can be recycled into crafting materials. Used to craft: Equalizer, Jupiter": "可回收为制作材料。用于制作：均衡者、木星",

    # Materials
    "A refined material used in crafting.": "用于制作的精炼材料。",
    "Used in crafting.": "用于制作。",
    "Used directly in crafting items of all tiers.": "直接用于所有等级物品的制作。",
    "Used to craft explosives.": "用于制作爆炸物。",
    "Used to craft medical supplies.": "用于制作医疗用品。",
    "Used to craft advanced weapons.": "用于制作高级武器。",
    "Used to craft medical supplies and shields.": "用于制作医疗用品和护盾。",
    "Used to craft medical supplies, explosives, and utility items.": "用于制作医疗用品、爆炸物和实用物品。",
    "Used to craft explosives. Can be recycled into crafting materials.": "用于制作爆炸物。可回收为制作材料。",
    "Used to craft medical Supplies such as Herbal Bandage and Sterilized Bandage.": "用于制作草药绷带和消毒绷带等医疗用品。",
    "Used to craft medical supplies. Can be recycled into chemicals.": "用于制作医疗用品。可回收为化学品。",
    "Used to craft utility items and explosives. Can be recycled into chemicals.": "用于制作实用物品和爆炸物。可回收为化学品。",
    "Used to craft weapon mods. Can be recycled into crafting materials.": "用于制作武器改装件。可回收为制作材料。",
    "Used to craft weapons and explosives. Can be recycled into chemicals.": "用于制作武器和爆炸物。可回收为化学品。",
    "Used to open the Locked room near the Loading Bay. Also Used to craft shields. Can be recycled into crafting materials.": "用于打开装货区附近的锁定房间。也用于制作护盾。可回收为制作材料。",
    "Mostly used to craft advanced weapons. Can be recycled into crafting materials.": "主要用于制作高级武器。可回收为制作材料。",
    "Specialized components from shotgun-type weapons, used in crafting.": "来自霰弹枪类武器的专用元件，用于制作。",
    "Assorted spare parts used for pistols and SMGs.": "用于手枪和冲锋枪的各类备用零件。",
    "Assorted spare parts used for rifles.": "用于步枪的各类备用零件。",
    "Valuable resource that drops from all ARC enemies. Used to craft: Shield Recharger": "所有ARC敌人掉落的宝贵资源。用于制作：护盾充能器",
    "Very valuable resource that drops from certain ARC enemies": "特定ARC敌人掉落的珍贵资源",

    # ARC Materials
    "Obtained from ARC enemies or activities. Used to craft components.": "从ARC敌人或活动中获得。用于制作组件。",
    "Obtained from ARC enemies or activities, or by recycling certain ARC parts. Used to craft components.": "从ARC敌人或活动中获得，或通过回收特定ARC零件获得。用于制作组件。",
    "Obtained from ARC enemies or activities. Can be recycled into chemicals.": "从ARC敌人或活动中获得。可回收为化学品。",
    "Obtained from ARC enemies or activities. Can be recycled into chemicals": "从ARC敌人或活动中获得。可回收为化学品",
    "Obtained from ARC enemies or activities. Can be recycled into fabric.": "从ARC敌人或活动中获得。可回收为布料。",
    "Obtained from ARC enemies or activities. Can be recycled into plastic.": "从ARC敌人或活动中获得。可回收为塑料。",
    "Obtained from ARC enemies or activities. Can be recycled into rubber.": "从ARC敌人或活动中获得。可回收为橡胶。",
    "Obtained from ARC enemies and activities. Can be recycled into fabric.": "从ARC敌人和活动中获得。可回收为布料。",
    "Obtained from ARC enemies or Activities. Can be recycled into plastic.": "从ARC敌人或活动中获得。可回收为塑料。",

    # Consumables
    "Can be consumed for a small amount of stamina.": "食用后恢复少量耐力。",
    "Can be consumed for a small amount of stamina": "食用后恢复少量耐力",
    "Can be consumed to regain a small amount of health.": "食用后恢复少量生命值。",
    "Can be used to regain a small amount of health.": "可用于恢复少量生命值。",
    "A sun ripe apricot. Can be consumed for a small amount of stamina.": "一颗成熟的杏子。食用后恢复少量耐力。",
    "A piece of an agave leaf. Can be used to regain a small amount of health.": "一片龙舌兰叶。可用于恢复少量生命值。",
    "A food item that moderately increases both health and stamina.": "适度增加生命值和耐力的食物。",
    "A concoction that temporarily increases stamina regeneration, at a small initial cost to health.": "暂时增加耐力恢复的药剂，会略微消耗初始生命值。",

    # Medical
    "A serum that fully restores stamina and temporarily increases stamina regeneration": "完全恢复耐力并暂时增加耐力恢复的血清",
    "An injection that quickly revives downed raiders and restores some health.": "快速复活倒地掠夺者并恢复部分生命值的注射剂。",
    "A sterile syringe for medical use. Used to craft medical supplies. Can be recycled into plastic.": "医疗用无菌注射器。用于制作医疗用品。可回收为塑料。",

    # Ammo
    "Ammo used for energy weapons. One clip will fully charge a single weapon.": "能量武器弹药。一个弹夹可完全充能一把武器。",
    "Light bullets used mainly with SMGs and light handguns. Such as Kettle, Stitcher, Burletta, Hairpin and Bobcat.": "主要用于冲锋枪和轻型手枪的轻型子弹。适用于壶、缝合者、滑稽剧、发卡和山猫。",
    "Medium bullets used mainly with medium-caliber weapons. Such as Rattler, Tempest, Arpeggio, Renegade and Torrente.": "主要用于中口径武器的中型子弹。适用于响尾蛇、风暴、琶音、叛逆者和激流。",
    "Heavy bullets used mainly with large-caliber weapons.": "主要用于大口径武器的重型子弹。",
    "Shotgun shells used for shotguns.": "用于霰弹枪的霰弹。",
    "Anti-ARC payloads used mainly by the Hullcracker": "主要由破壳者使用的反ARC弹药",

    # Shields
    "A standard shield that blocks a medium portion of incoming damage at a moderate cost to mobility.": "标准护盾，以适度的机动性代价阻挡中等来袭伤害。",

    # Augments
    "An augment ruined beyond repair": "损坏到无法修复的增强器",
    "Basic augment for rookie Raiders, offering slightly more backpack space and carry capacity.": "新手掠夺者的基础增强器，提供略多的背包空间和负重。",
    "Basic combat augment. Supports stronger shields, but with limited backpack capacity and Quick Use slots.": "基础战斗增强器。支持更强护盾，但背包容量和快速使用槽位有限。",
    "Basic looting augment. More backpack slots and weight capacity, but low defensive and tactical capability.": "基础拾取增强器。更多背包槽位和负重容量，但防御和战术能力较低。",
    "Basic tactical augment. More Quick Use slots for more tactical choice, but limited survivability and slightly lower looting potential.": "基础战术增强器。更多快速使用槽位提供更多战术选择，但生存能力有限且拾取潜力略低。",
    "Adds more backpack space and an extra utility item slot.": "增加更多背包空间和一个额外的实用物品槽位。",
    "An improved version of the Combat II augment. Supports more shield types and comes with extra space for grenades": "战斗型 II增强器的改进版本。支持更多护盾类型，并配有额外的手雷空间",
    "An improved version of the Combat II augment. Supports more shield types, and comes with extra space for grenades.": "战斗型 II增强器的改进版本。支持更多护盾类型，并配有额外的手雷空间。",
    "Significantly increases looting potential; adds slots for trinkets.": "大幅增加拾取潜力；增加饰品槽位。",
    "A tactical augment focused on utility over defense and looting.": "注重实用性而非防御和拾取的战术增强器。",
    "a defense-focused augment for keeping Shields topped up": "以防御为重点的增强器，保持护盾充能",

    # Weapon mods: Grips
    "Moderately improves dispersion & recoil recovery time.": "适度改善散布和后坐力恢复时间。",
    "Significantly improves dispersion & recoil recovery  time.": "显著改善散布和后坐力恢复时间。",
    "Slightly improves dispersion & recoil recovery time. Compatible with: Rattler, Ferro, Arpeggio, Bettina, Kettle.": "轻微改善散布和后坐力恢复时间。兼容：响尾蛇、铁骑、琶音、贝蒂娜、壶。",
    "Moderately improves ADS & draw speed.": "适度提高瞄准和拔枪速度。",
    "Significantly improves stability.": "显著提高稳定性。",

    # Weapon mods: Compensators / Muzzle Brakes
    "Moderately reduces both vertical and horizontal recoil.": "适度减少垂直和水平后坐力。",
    "Moderately reduces both vertical recoil & horizontal recoil.": "适度减少垂直和水平后坐力。",
    "Significantly reduces both vertical recoil & horizontal recoil.": "显著减少垂直和水平后坐力。",
    "Slightly reduces both vertical recoil & horizontal recoil.": "轻微减少垂直和水平后坐力。",
    "Moderately reduces vertical recoil.": "适度减少垂直后坐力。",
    "Moderately reduces horizontal recoil.": "适度减少水平后坐力。",
    "Significantly reduces vertical recoil.": "显著减少垂直后坐力。",
    "Significantly reduces horizontal recoil.": "显著减少水平后坐力。",
    "Slightly reduces vertical recoil.": "轻微减少垂直后坐力。",
    "Slightly reduces horizontal recoil.": "轻微减少水平后坐力。",

    # Weapon mods: Silencers
    "Moderately reduces the amount of noise produced when firing.": "适度减少射击产生的噪音。",
    "Moderately reduces the amount of noise produced when firing.  Compatible with: Rattler,  Ferro, Tempest, Arpeggio, Bettina.": "适度减少射击产生的噪音。兼容：响尾蛇、铁骑、风暴、琶音、贝蒂娜。",
    "Significantly reduces the amount of noise produced when firing.": "显著减少射击产生的噪音。",
    "Slightly reduces the amount of noise produced when firing.": "轻微减少射击产生的噪音。",

    # Weapon mods: Chokes
    "Moderately reduces base dispersion.": "适度减少基础散布。",
    "Significantly reduces base dispersion. Compatible with: II Toro, Vulcano": "显著减少基础散布。兼容：公牛、火山",
    "Slightly reduces base dispersion.": "轻微减少基础散布。",
    "Moderately reduces per-shot dispersion.": "适度减少每发散布。",
    "Slightly reduces per-shot dispersion.": "轻微减少每发散布。",

    # Weapon mods: Barrels
    "Moderately increases bullet velocity.": "适度提高子弹速度。",
    "Moderately increases fire rate.": "适度提高射速。",

    # Weapon mods: Mags
    "Slightly extends the ammo capacity of compatible weapons that use medium ammo.": "轻微扩展使用中型弹药的兼容武器弹药容量。",
    "Moderately extends the ammo capacity of compatible weapons that use medium ammo": "适度扩展使用中型弹药的兼容武器弹药容量",
    "Significantly extends the ammo capacity of compatible weapons that use medium ammo.": "显著扩展使用中型弹药的兼容武器弹药容量。",
    "Slightly extends the ammo capacity of the compatible weapons that use light ammo.": "轻微扩展使用轻型弹药的兼容武器弹药容量。",
    "Moderately extends the ammo capacity of the compatible weapons that use light ammo.": "适度扩展使用轻型弹药的兼容武器弹药容量。",
    "Significantly extends the ammo capacity of the compatible weapons that use light ammo.": "显著扩展使用轻型弹药的兼容武器弹药容量。",
    "Slightly extends the ammo capacity of compatible weapons that use shotgun ammo.": "轻微扩展使用霰弹弹药的兼容武器弹药容量。",
    "Moderately extends the ammo capacity of compatible weapons that use shotgun ammo.": "适度扩展使用霰弹弹药的兼容武器弹药容量。",
    "Significantly extends the ammo capacity of shotguns.": "显著扩展霰弹枪弹药容量。",

    # Weapon mods: Stocks
    "30% Reduced Max-Shot Dispersion": "最大射击散布降低30%",

    # Weapons
    "Fires high velocity energy rounds.": "发射高速能量弹。",
    "Fires projectiles at an incredible velocity, capable of damaging multiple targets with one shot.": "以惊人速度发射弹丸，单发可伤害多个目标。",
    "Full automatic SMG. Deals good damage, but has quite a low fire-rate and can be hard to control.": "全自动冲锋枪。伤害不错，但射速较低且较难控制。",
    "Lever-action battle rifle with high damage output, accuracy, and headshot damage.": "杠杆式战斗步枪，具有高伤害输出、精度和爆头伤害。",
    "Has decent damage output and accuracy.": "具有不错的伤害输出和精度。",
    "Has reliable damage output and accuracy.": "具有可靠的伤害输出和精度。",
    "Has slow rate of fire and high damage output.": "射速慢但伤害输出高。",

    # Grenades / throwables
    "Can be thrown to create a violent singularity": "可投掷产生暴力奇点",

    # Gadgets extra
    "Compatible with: Anvil  - Tech mod for the Anvil that replaces its bullets with ones that split into 4 weaker projectiles.": "兼容：铁砧 - 铁砧科技改装件，将子弹替换为分裂成4枚较弱弹丸的子弹。",

    # Keys
    "Unlocks a Raider Hatch.": "打开掠夺者舱口。",
    "Unlocks a door by the Communication Tower near the Blue Gate": "打开蓝门附近通信塔旁的门",
    "Unlocks a door in Assembly in Stella Montis": "打开星山议会大厅的门",
    "Unlocks a door in Medical Research in Stella Montis": "打开星山医学研究室的门",
    "Unlocks a door in the Archives in Stella Montis": "打开星山档案室的门",
    "Unlocks a door in the Container Storage in Spaceport": "打开航天港集装箱仓库的门",
    "Unlocks a door in the J Kozma Ventures company building in Buried City": "打开埋葬之城J Kozma Ventures公司大楼的门",
    "Unlocks a door in the Security Checkpoint in Stella Montis": "打开星山安检站的门",
    "Unlocks a door in the Shipping Warehouse in Spaceport": "打开航天港运输仓库的门",
    "Unlocks a door to one of the old village buildings near the Blue Gate.": "打开蓝门附近一栋旧村庄建筑的门。",
    "Unlocks a door to the Ground Control Tower in Spaceport": "打开航天港地面控制塔的门",
    "Unlocks a door to the Trench Towers in Spaceport": "打开航天港壕沟塔的门",
    "Unlocks a door to the confiscated goods area within the Blue Gate tunnels": "打开蓝门隧道内没收物品区域的门",
    "Unlocks certain apartment doors in Buried City": "打开埋葬之城的某些公寓门",
    "Unlocks certain cellar doors near the Blue Gate.": "打开蓝门附近某些地窖的门。",
    "Unlocks the Dam Staff Room in the Control Tower.": "打开控制塔内的大坝员工室。",
    "Unlocks the door to the Town Hall in Buried City": "打开埋葬之城市政厅的门",
    "Unlocks the rear door of a patrol car": "打开巡逻车的后门",
    "Opens a locked room in the North West corner of the Hospital in Buried City on the Second Floor.": "打开埋葬之城医院二楼西北角的锁定房间。",

    # Trinkets / Cosmetics / Misc
    "A plant used to craft medical supplies.": "用于制作医疗用品的植物。",
    "A piece of hand-crafted pottery.": "一件手工制作的陶器。",
    "A decorative vase, possibly valuable.": "装饰花瓶，可能很值钱。",
    "A can of tuna, suspiciously bloated.": "一罐金枪鱼，可疑地膨胀着。",
    "A device that sparks and pops in a pleasant manner.": "会令人愉快地发出火花和爆裂声的装置。",
    "A compact snowball fashioned out of the most malleable and aerodynamic snow.": "用最柔软、最具空气动力学特性的雪制成的紧实雪球。",
    "A handful of seeds. Celeste might be looking for these.": "一把种子。Celeste可能正在寻找这些。",
    "A portable analyzer from the world before, complete with several spare tubes.": "来自旧世界的便携式分析仪，配有几根备用管。",
    "A remnant of a time long lost, when it was fashionable to stand out.": "一个早已逝去的时代遗物，那时标新立异是一种时尚。",
    "A new cosmetic variant will be added to your collection.": "新的外观变体将添加到您的收藏中。",
    "A locking mechanism that can be placed on large metal doors to limit access.": "可放置在大型金属门上限制通行的锁定装置。",
    "May be worth a few credits to someone.": "对某些人来说可能值几个信用点。",
    "May be worth a few coins.": "可能值几个硬币。",
    "Worth a small fortune.": "价值不菲。",
    "A small decorative statuette.": "一件小型装饰雕像。",
    "A snapshot of the world before, faded by sunlight and time.": "旧世界的快照，被阳光和时间褪色。",
    "A tattered piece of cloth.": "一块破烂碎布。",
    "A shining, shimmering set  of refinement and elegance.": "一套闪闪发光、精致优雅的套装。",
    "A waxy berry that grows only during a small window each year. People have depended on them to make candles, foods and medicine for ages.": "一种蜡质浆果，每年只在短暂窗口期生长。人们依赖它制作蜡烛、食物和药品已有数百年。",
    "Fun thing to put on a fridgerator.": "贴在冰箱上的有趣小玩意。",
    "Just by looking at this, you too start to feel slightly deflated.": "光看着它，你也开始感到有点泄气。",
    "Some rusted old bolts": "一些生锈的旧螺栓",
    "Some Raiders use it to practice dexterity. Others just like throwing things at other things.": "一些掠夺者用它练习手灵。其他人只是喜欢把东西扔向别的东西。",
    "If you stand close and squint your eyes, it's like the world never came crumbling down.": "如果你靠近、眯起眼睛，就好像世界从未崩塌。",
    "It is theorized that scooping things was a favorite pastime in the world before.": "据推测，舀东西是旧世界最受欢迎的消遣。",
    "It'll press garlic, olives, and probably many other things.": "它可以压蒜、压橄榄，还可能压很多其他东西。",
    "After all this time, you can still smell the goodness.": "过了这么久，你仍然能闻到那股美味的香气。",
    "After the grid fell candles became the preferred source of light for many. Unlike electricity, a good old candle will never fail you. Unless it's windy. Or raining. Or...": "电网崩溃后，蜡烛成为许多人首选的光源。不像电力，一支好蜡烛永远不会让你失望。除非刮风。或者下雨。或者……",
    "Without light, life underground would be impossible.": "没有光，地下生活将不可能。",
    "Yes, it really is empty.": "是的，它真的是空的。",
    "Way pasta its prime.": "已经过了最佳期限。",
    "Always there to lend an ear, should you need it.": "如果你需要倾诉，它总在那里。",
    "At least a tiny bit more comfortable than your face.": "至少比你的脸舒服那么一点点。",
    "The filters are clogged with sand and noxious fumes. Long past its lifespan.": "过滤器被沙子和有毒烟雾堵塞。早已超过使用寿命。",
    "The power to face a new day, one drip at a time.": "面对新一天的力量，一滴一滴来。",
    "The envy of every Raider. ": "每个掠夺者都羡慕不已。",
    "The envy of every Speranzan. Proof that this world was once thriving and magical.": "每个斯佩兰赞人都羡慕不已。证明这个世界曾经繁荣而神奇。",
    "The explosive pod from a Tick. ": "来自蜱虫的爆炸舱。",
    "Lance has personally planted a number of these around the Rust Belt, for some reason.": "由于某种原因，Lance亲自在锈带周围种植了许多这样的东西。",
    "Like sleeping on an especially ergonomic cloud.": "就像睡在一朵特别符合人体工学的云上。",
    "Valued for its fine craftmanship, and effortless ability to make your eyes pop.": "以精湛工艺和让你眼前一亮的能力而备受珍视。",
    "Perfect for relaxing nights at home, casual get-togethers, and private air and guitar concerts.": "完美适合在家放松的夜晚、休闲聚会和私人空气吉他演唱会。",
    "Perfect for telling the time, and showcasing that you're an exceedingly dignified person.": "完美适合看时间，并展示你是一个极其有尊严的人。",
    "Speranzans love to see who can build the tallest tower - before the tremors knock them down.": "斯佩兰赞人喜欢比赛谁能建最高的塔——在震动把它们推倒之前。",
    "What pages remain speak of chosen heroes, vampires, and lots of longing glances.": "残存的书页讲述着被选中的英雄、吸血鬼和许多渴望的目光。",
    "A remotely triggered arrangement of dazzling fireworks, sure to put on a show": "遥控触发的耀眼烟花组合，一定能带来精彩表演",

    # Cosmetics
    "Aviator outfit is a quest reward from Armored Transports.": "飞行员服装是装甲运输任务的奖励。",
    "Banana backpack charm from Medical Merchandise quest.": "来自医疗商品任务的香蕉背包挂件。",
    "Burgerboy backpack charm from Into The Fray quest.": "来自投入战斗任务的汉堡男孩背包挂件。",
    "Complete the quest The Root Of The Matter to get this charm.": "完成根源之谜任务获得此挂件。",
    "Blueprint to craft Launcher Ammo. Rewarded from The Majors Footlocker quest.": "制作发射器弹药的蓝图。来自少校储物柜任务的奖励。",
    "Blueprint to craft the Looting MK. 3 (Safekeeper) augment.": "制作拾取型 Mk.3（保管者）增强器的蓝图。",
    "Crimson Racer (Aviator Colour) is a quest reward from Communication Hideout": "深红赛车手（飞行员颜色）是通信藏身处任务的奖励",
    "Orange camo color is unlocked for completing The Trifecta quest.": "完成三连胜任务解锁橙色迷彩颜色。",
    "Radio Renegade cosmetic variant - unlocked by completing A Warm Place to Rest quest.": "无线电叛逆外观变体 - 完成温暖的休息之地任务解锁。",
    "Radio Renegade outfit is given to you as a reward from the quest Switching The Supply": "无线电叛逆服装是切换供给任务的奖励",
    "Radio Renegade Bag Variant - Unlock by completing Power Out Quest.": "无线电叛逆背包变体 - 完成断电任务解锁。",
    "Radio Renegade Helmet Variant - Unlocks by completing Flickering Threat Quest": "无线电叛逆头盔变体 - 完成闪烁威胁任务解锁",

    # Trials rewards
    "Emote is rewarded for maintaining at least a Wildcard III rank in trials until the season end.": "保持赛季结束前至少通配符III段位即可获得此表情。",
    "Maintain Wildcard I trials rank until the season end.": "保持赛季结束前通配符I段位。",
    "Maintain at least Rookie III rank in trials until season end.": "保持赛季结束前至少新手III段位。",
    "Maintain at least Tryhard III rank in Trials until the season end.": "保持赛季结束前至少拼搏者III段位。",
    "Maintain at least a  Rookie II rank in trials until season end.": "保持赛季结束前至少新手II段位。",
    "Rewarded for maintaining at least  a Daredevil I rank in the trials until the season ends.": "保持赛季结束前至少冒险家I段位即可获得奖励。",
    "Cheer Emote - Quest reward from The Right Tool": "欢呼表情 - 正确工具任务的奖励",
    "Location is currently unknown except that it is on Dam Battlegrounds.": "位置目前未知，只知位于大坝战场。",

    # ARC salvage
    "A salvaged component from a Bastion unit. Can be recycled into crafting materials.": "从堡垒单位回收的组件。可回收为制作材料。",
    "A salvaged component from a Rocketeer unit.": "从火箭兵单位回收的组件。",
    "A set of cans that are a backpack attachment from the quest Safe Passage.": "来自安全通道任务的一组罐子背包挂件。",

    # Instrument
    "A playable acoustic guitar, perfect for relaxing nights at home, casual get-togethers, and private air and guitar concerts.": "可演奏的原声吉他，完美适合在家放松的夜晚、休闲聚会和私人吉他音乐会。",
    "A playable recorder, perfect for grabbing ARC's attention and impress other Raiders.": "可演奏的竖笛，完美适合吸引ARC的注意力并给其他掠夺者留下深刻印象。",
    "A playable acoustic guitar used to attract ARC's attention and impress other Raiders.": "可演奏的原声吉他，用于吸引ARC的注意力并给其他掠夺者留下深刻印象。",
    "A playable recorder used to attract ARC's attention and impress other Raiders.": "可演奏的竖笛，用于吸引ARC的注意力并给其他掠夺者留下深刻印象。",
    "A rhythmic instrument used to attract ARC's attention and impress other Raiders.": "用于吸引ARC的注意力并给其他掠夺者留下深刻印象的节奏乐器。",
    "A pungent key used to operate the Flushing Terminals in the tunnels below Spaceport": "用于操作航天港地下隧道冲洗终端的刺鼻钥匙",
    "A makeshift key that lets you open the Outskirts Bunker on Spaceport": "可以打开航天港郊区地堡的临时钥匙",
    "The envy of every Raider. Like sleeping on an especially ergonomic cloud.": "每个掠夺者都羡慕不已。就像睡在一朵特别符合人体工学的云上。",
}

# ─── PATTERN-BASED TRANSLATIONS ────────────────────────
DESC_PATTERNS = [
    # "Lets you craft X" patterns
    (r"^Lets you craft (?:a |an |the )?(.+?)(?:\s*-\s*(.+))?$",
     lambda m: f"让你制作{NAME_MAP.get(m.group(1), m.group(1))}" + (f" - {m.group(2)}" if m.group(2) else "")),

    # "Allows you to craft the X" patterns
    (r"^Allows you to craft the (.+?)\.?$",
     lambda m: f"允许你制作{NAME_MAP.get(m.group(1), m.group(1))}。"),

    # "Unlocks a door in the X" patterns not already in exact map
    (r"^Unlocks a door (?:in |to |by )(?:the )?(.+?)\.?$",
     lambda m: f"打开{m.group(1)}的门。"),

    # Weapon descriptions
    (r"^Fully automatic assault rifle(.*)$", lambda m: "全自动突击步枪" + m.group(1)),
    (r"^Semi-automatic assault rifle(.*)$", lambda m: "半自动突击步枪" + m.group(1)),
    (r"^Fully automatic SMG(.*)$", lambda m: "全自动冲锋枪" + m.group(1)),
    (r"^Semi-automatic pistol(.*)$", lambda m: "半自动手枪" + m.group(1)),
    (r"^Single-action hand cannon(.*)$", lambda m: "单动手炮" + m.group(1)),
    (r"^Single-action pistol(.*)$", lambda m: "单动手枪" + m.group(1)),
    (r"^Pump-action shotgun(.*)$", lambda m: "泵动式霰弹枪" + m.group(1)),
    (r"^Semi-automatic shotgun(.*)$", lambda m: "半自动霰弹枪" + m.group(1)),
    (r"^Heavy break-action rifle(.*)$", lambda m: "重型折开式步枪" + m.group(1)),
    (r"^A scoped bolt-action sniper rifle(.*)$", lambda m: "带瞄准镜的栓动式狙击步枪" + m.group(1)),
    (r"^A bolt-action sniper rifle(.*)$", lambda m: "栓动式狙击步枪" + m.group(1)),
    (r"^A 3-round burst assault rifle(.*)$", lambda m: "三连发突击步枪" + m.group(1)),
    (r"^A high capacity experimental beam rifle(.*)$", lambda m: "高容量实验型光束步枪" + m.group(1)),
    (r"^A classic makeshift weapon(.*)$", lambda m: "经典的临时武器" + m.group(1)),

    # Grenades
    (r"^A grenade that detonates after a delay, dealing explosive damage(.*)$",
     lambda m: "延时引爆的手雷，造成爆炸伤害" + m.group(1)),
    (r"^A grenade that detonates after a delay, stunning(.*)$",
     lambda m: "延时引爆的手雷，眩晕" + m.group(1)),
    (r"^A grenade that detonates after a delay, tagging(.*)$",
     lambda m: "延时引爆的手雷，标记" + m.group(1)),
    (r"^A grenade that detonates on impact, covering an area in fire(.*)$",
     lambda m: "着弹即爆的手雷，覆盖区域造成持续火焰伤害" + m.group(1)),
    (r"^A grenade that detonates on impact, dealing explosive damage(.*)$",
     lambda m: "着弹即爆的手雷，造成范围爆炸伤害" + m.group(1)),
    (r"^A grenade that creates a lingering smoke cloud(.*)$",
     lambda m: "产生持续烟雾的手雷" + m.group(1)),
    (r"^A grenade that emits a trail of flammable gas(.*)$",
     lambda m: "释放易燃气体轨迹的手雷" + m.group(1)),
    (r"^A grenade that sticks to surfaces(.*)$",
     lambda m: "可粘附在表面的手雷" + m.group(1)),
    (r"^A grenade that scatters into multiple homing missiles(.*)$",
     lambda m: "碎裂成多枚追踪导弹的手雷" + m.group(1)),
    (r"^A grenade that pops a thick but small smoke cloud(.*)$",
     lambda m: "释放浓密但范围小的烟雾的手雷" + m.group(1)),
    (r"^A grenade that emites lingering toxic cloud(.*)$",
     lambda m: "释放持续有毒烟雾的手雷" + m.group(1)),
    (r"^A homing grenade that targets(.*)$",
     lambda m: "追踪手雷，瞄准" + m.group(1)),
    (r"^A remote-detonated grenade(.*)$",
     lambda m: "遥控引爆手雷" + m.group(1)),
    (r"^A makeshift fuze grenade(.*)$",
     lambda m: "临时引信手雷" + m.group(1)),

    # Mines
    (r"^A proximity[ -]triggered mine that pops up and explodes(.*)$",
     lambda m: "接近触发式弹跳地雷，弹起后爆炸" + m.group(1)),
    (r"^A proximity[ -]triggered mine that pops up and stuns(.*)$",
     lambda m: "接近触发式弹跳地雷，弹起后眩晕目标" + m.group(1)),
    (r"^A proximity-triggered mine that pops up and deploys a gas cloud(.*)$",
     lambda m: "接近触发式弹跳地雷，弹起后释放毒气" + m.group(1)),
    (r"^A proximity-triggered mine that pops up and knocks back(.*)$",
     lambda m: "接近触发式弹跳地雷，弹起后击退目标" + m.group(1)),
    (r"^A mine that deals damage(.*)$",
     lambda m: "造成伤害的地雷" + m.group(1)),

    # Traps
    (r"^A (?:deployable )?laser trip wire that detonates a (.+?)\.?$",
     lambda m: f"触发后引爆{m.group(1)}的激光绊线。"),

    # Gadgets
    (r"^A gadget that allows the user to conceal themselves(.*)$",
     lambda m: "使用户能够隐蔽自身的小工具" + m.group(1)),
    (r"^A gadget that allows the user to scale structures(.*)$",
     lambda m: "使用户能够攀爬建筑的小工具" + m.group(1)),
    (r"^A deployable cover that can block incoming damage(.*)$",
     lambda m: "可部署的掩体，能阻挡来袭伤害" + m.group(1)),
    (r"^A deployable zipline(.*)$", lambda m: "可部署的滑索" + m.group(1)),
    (r"^A deployable device that(.*)$", lambda m: "可部署的装置，" + m.group(1)),
    (r"^A deployable proximity sensor(.*)$", lambda m: "可部署的接近传感器" + m.group(1)),
    (r"^A noisy device that sticks to surfaces(.*)$",
     lambda m: "可粘附在表面的噪音装置" + m.group(1)),
    (r"^A handheld repair kit that recharges a shield(.*)$",
     lambda m: "可充能护盾的手持修复工具" + m.group(1)),
    (r"^A handkeld kit that recharges a shield(.*)$",
     lambda m: "可充能护盾的手持工具" + m.group(1)),

    # Shields
    (r"^A lightweight shield(.*)$", lambda m: "轻量级护盾" + m.group(1)),
    (r"^A heavy shield(.*)$", lambda m: "重型护盾" + m.group(1)),
    (r"^A medium weight shield(.*)$", lambda m: "中型护盾" + m.group(1)),

    # Augments
    (r"^A Combat augment(.*)$", lambda m: "战斗型增强器" + m.group(1)),
    (r"^A defence-focused augment(.*)$", lambda m: "防御型增强器" + m.group(1)),
    (r"^A healing-focused augment(.*)$", lambda m: "治疗型增强器" + m.group(1)),
    (r"^A looting augment(.*)$", lambda m: "拾取型增强器" + m.group(1)),
    (r"^A heavy-duty pack mule augment(.*)$", lambda m: "重型载物增强器" + m.group(1)),
    (r"^A balanced augment(.*)$", lambda m: "均衡型增强器" + m.group(1)),
    (r"^An all-around augment(.*)$", lambda m: "全能型增强器" + m.group(1)),
    (r"^A standard augment(.*)$", lambda m: "标准增强器" + m.group(1)),

    # Medical
    (r"^A medical item that restores a large amount of health(.*)$",
     lambda m: "恢复大量生命值的医疗物品" + m.group(1)),
    (r"^A medical item that gradually restores a large amount(.*)$",
     lambda m: "逐渐恢复大量生命值的医疗物品" + m.group(1)),
    (r"^A medical item that gradually restores health(.*)$",
     lambda m: "逐渐恢复生命值的医疗物品" + m.group(1)),
    (r"^A medical item that continuously restores health(.*)$",
     lambda m: "持续恢复生命值的医疗物品" + m.group(1)),

    # Materials
    (r"^Obtained from ARC enemies or activities\. Used to craft components(.*)$",
     lambda m: "从ARC敌人或活动中获得。用于制作组件" + m.group(1)),
    (r"^Used to craft a wide range of items(.*)$",
     lambda m: "用于制作多种物品" + m.group(1)),
    (r"^A bundle of old wires(.*)$", lambda m: "一捆旧电线" + m.group(1)),
    (r"^A device that adjusts electrical voltage(.*)$", lambda m: "调节电压的装置" + m.group(1)),
    (r"^A control module used to operate (.+?) drones(.*)$",
     lambda m: f"用于操控{m.group(1)}无人机的控制模块" + m.group(2)),
    (r"^A critical control component from a (.+?) vehicle(.*)$",
     lambda m: f"来自{m.group(1)}载具的关键控制组件" + m.group(2)),

    # Light sticks
    (r"^A throwable chemical light that illuminates(.*)$",
     lambda m: "可投掷的化学荧光棒，照亮" + m.group(1)),

    # Binoculars / Scanner
    (r"^A basic pair of binoculars(.*)$", lambda m: "基础望远镜" + m.group(1)),
    (r"^A laser-based scanner used to detect(.*)$", lambda m: "用于探测的激光扫描仪" + m.group(1)),

    # Cosmetics
    (r"^A new cosmetic variant will be added to your collection for the (.+)$",
     lambda m: f"新的{m.group(1)}外观变体将添加到您的收藏中"),
    (r"^A new cosmetic variant will be added to your collection\. Complete (.+) Quest\.$",
     lambda m: f"新外观变体将添加到您的收藏中。完成{m.group(1)}任务。"),
    (r"^This is the (.+) cosmetic outfit(.*)$",
     lambda m: f"这是{m.group(1)}外观服装" + m.group(2)),
    (r"^This is the (.+) cosmetic colour(.*)$",
     lambda m: f"这是{m.group(1)}外观颜色" + m.group(2)),

    # Fires X
    (r"^Fires explosive projectiles(.*)$", lambda m: "发射爆炸弹药" + m.group(1)),
    (r"^Has large ammo capacity(.*)$", lambda m: "拥有大弹药容量" + m.group(1)),
    (r"^Has slow fire rate(.*)$", lambda m: "射速较慢" + m.group(1)),
]

# ─── Word/phrase-level translations for remaining text ──
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
    " and extra grenade slots.": "和额外手雷槽位。",
    " and comes with extra space for grenades.": "，并配有额外的手雷空间。",
    " with extra space for grenades.": "，带有额外手雷空间。",
    ". Supports more shield types": "。支持更多护盾类型",
    ", and comes with extra space for grenades.": "，并配有额外的手雷空间。",
    " comes with extra space for grenades": "配有额外手雷空间",
}


def translate_name(name):
    if not name:
        return name
    if name in NAME_MAP:
        return NAME_MAP[name]
    # Blueprint pattern
    if name.endswith(' Blueprint'):
        base = name[:-len(' Blueprint')]
        return f"{NAME_MAP.get(base, base)}蓝图"
    if name.endswith(' Recipe'):
        base = name[:-len(' Recipe')]
        return f"{NAME_MAP.get(base, base)}配方"
    # Cosmetic patterns
    for suffix, zh_suf in [(' (Outfit)', '（服装）'), (' (Colour)', '（颜色）'), (' (Color)', '（颜色）'),
                            (' (Emote)', '（表情）'), (' (Backpack Attachment)', '（背包挂件）'),
                            (' (Backpack Charm)', '（背包挂件）'), (' (Face Style)', '（面部风格）')]:
        if name.endswith(suffix):
            base = name[:-len(suffix)]
            return f"{NAME_MAP.get(base, base)}{zh_suf}"
    return name


def translate_description(desc):
    if not desc or not desc.strip():
        return desc
    desc = desc.strip()

    # Exact match first
    if desc in DESC_MAP:
        return DESC_MAP[desc]

    # Pattern match
    for pattern, replacement in DESC_PATTERNS:
        m = re.match(pattern, desc, re.DOTALL)
        if m:
            result = replacement(m)
            for eng, zh in WORD_MAP.items():
                result = result.replace(eng, zh)
            return result

    # Fallback: apply word-level translations
    result = desc
    for eng, zh in WORD_MAP.items():
        result = result.replace(eng, zh)

    return result


# ─── APPLY ───────────────────────────────────────────────
translated = []
for item in items:
    t = copy.deepcopy(item)
    t['name'] = translate_name(item['name'])
    t['description'] = translate_description(item.get('description'))
    translated.append(t)

with open('src/data/zh/items_zh.json', 'w', encoding='utf-8') as f:
    json.dump(translated, f, ensure_ascii=False, indent=2)

# Stats
total = len(translated)
names_ch = sum(1 for o, t in zip(items, translated) if o['name'] != t['name'])
descs_ch = sum(1 for o, t in zip(items, translated)
               if (o.get('description') or '') != (t.get('description') or ''))
no_desc = sum(1 for i in items if not i.get('description'))
print(f"Total: {total}")
print(f"Names translated: {names_ch}/{total}")
print(f"Descriptions translated: {descs_ch}/{total - no_desc} (no desc: {no_desc})")
print(f"\n--- Sample remaining untranslated names ---")
for o,t in zip(items, translated):
    if o['name'] == t['name']:
        print(f"  {o['name']}")
