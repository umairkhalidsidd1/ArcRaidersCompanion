#!/usr/bin/env python3
"""Fix all mixed Chinese/English text in items_zh.json by fully re-translating 
descriptions and names that still contain English fragments."""
import json, re

with open('src/data/items.json') as f:
    items_en = json.load(f)
with open('src/data/zh/items_zh.json') as f:
    items_zh = json.load(f)

# Build en_id -> index maps
en_by_id = {it['id']: it for it in items_en}

# ═══════════════════════════════════════════════════════════════
# FULL DESCRIPTION TRANSLATIONS (exact match from English)
# These replace the ENTIRE English description with Chinese
# ═══════════════════════════════════════════════════════════════
FULL_DESC = {
    # Weapon descriptions
    "Pump-action shotgun with large bullet spread, sharp falloff, and high damage output.":
        "泵动式霰弹枪，弹丸散布大、衰减明显、伤害输出高。",
    "Full automatic SMG. Deals good damage, but has quite a low fire-rate and can be hard to control.":
        "全自动冲锋枪。伤害不错，但射速较低且难以控制。",
    "Full-auto SMG with high fire rate but low accuracy.":
        "全自动冲锋枪，射速高但精度低。",
    "Full automatic assault rifle. A cheap offensive option, but has to be reloaded 2 bullets at a time.":
        "全自动突击步枪。廉价的进攻选择，但需要每次装填2发子弹。",
    "Semi-automatic assault rifle. Quick and accurate, but has low bullet velocity and takes a long time reload.":
        "半自动突击步枪。快速精准，但弹头速度低且装弹时间长。",
    "Semi-automatic pistol with decent damage output and accuracy. Can be fired as fast as you can pull the trigger.":
        "半自动手枪，伤害和精度不错。射速取决于你扣扳机的速度。",
    "Semi-auto shotgun with good bullet spread but sharp falloff":
        "半自动霰弹枪，弹丸散布好但衰减明显",
    "Single-action pistol with a built-in silencer. Great for stealth, but tricky in combat.":
        "单动式手枪，自带消音器。适合隐匿，但在战斗中使用不易。",
    "Single-action hand cannon with high damage output and headshot damage, but slow handling.":
        "单动式手炮，高伤害输出和爆头伤害，但操控缓慢。",
    "Lever-action battle rifle with high damage output, accuracy, and headshot damage.":
        "杠杆式战斗步枪，高伤害输出、精准度和爆头伤害。",
    "Heavy break-action rifle. Packs a punch, but must be reloaded between every shot.":
        "重型中折式步枪。威力强大，但每次射击后必须重新装弹。",
    "Scoped bolt-action sniper rifle with reliable damage output and accuracy.":
        "带瞄准镜的栓动式狙击步枪，可靠的伤害输出和精度。",
    "Fires explosive projectiles that only detonate when hitting ARC.":
        "发射爆炸弹头，仅在击中ARC时引爆。",
    "Fires explosive projectiles that only detonate when hitting ARC":
        "发射爆炸弹头，仅在击中ARC时引爆",
    "Semi-auto battle rifle with a slow fire-rate and high damage output.":
        "半自动战斗步枪，射速较慢，伤害输出高。",
    "Fires two bullets per shot.":
        "每次射击发射两发子弹。",
    "Anti-ARC payloads used mainly by the Hullcracker":
        "主要由破壳者使用的反ARC弹药",

    # Shield descriptions
    "A lightweight shield that offers limited protection without severely impacting mobility.":
        "一种轻型护盾，提供有限保护而不会严重影响机动性。",
    "A standard shield that blocks a medium portion of incoming damage at a moderate cost to mobility.":
        "一种标准护盾，以适度的机动性代价阻挡中等伤害。",
    "A heavy shield that blocks a large portion of incoming damage, but carries a significant cost to mobility.":
        "一种重型护盾，能阻挡大部分伤害，但严重影响机动性。",

    # Medical
    "A medical item that gradually restores health over time.":
        "一种医疗物品，随时间逐渐恢复生命值。",
    "A medical item that gradually restores a large amount health over time.":
        "一种医疗物品，随时间逐渐恢复大量生命值。",
    "An improvised medical item that gradually restores health over time.":
        "一种临时医疗物品，随时间逐渐恢复生命值。",
    "A medical item that restores a large amount of health.":
        "一种恢复大量生命值的医疗物品。",
    "An injection that quickly revives downed raiders and restores some health.":
        "一种注射剂，快速复活倒地的掠夺者并恢复部分生命值。",
    "A serum that fully restores stamina and temporarily increases stamina regeneration":
        "一种完全恢复体力并暂时提高体力恢复速度的血清",
    "Can be used to regain a small amount of health.":
        "可用于恢复少量生命值。",
    "A medical item that restores health during use. Can be used on self or teammates.":
        "使用时恢复生命值的医疗物品。可对自己或队友使用。",

    # Augments
    "A Combat augment is more focused on maneuverability than absorbing damage.":
        "战斗型强化装置更注重机动性而非吸收伤害。",
    "Basic combat augment. Supports stronger shields, but with limited backpack capacity and Quick Use slots.":
        "基础战斗型强化装置。支持更强的护盾，但背包容量和快速使用栏位有限。",
    "Basic looting augment. More backpack slots and weight capacity, but low defensive and tactical capability.":
        "基础拾取型强化装置。更多背包栏位和负重容量，但防御和战术能力较低。",
    "Basic tactical augment. More Quick Use slots for more tactical choice, but limited survivability and slightly lower loot":
        "基础战术型强化装置。更多快速使用栏位以提供更多战术选择，但生存能力有限且拾取能力略低",
    "Adds more backpack space and an extra utility item slot.":
        "增加更多背包空间和一个额外工具物品栏位。",
    "Significantly increases looting potential; adds slots for trinkets.":
        "显著提高拾取潜力；增加饰品栏位。",
    "Significantly improves stability.":
        "显著提高稳定性。",

    # Grenade / Mine descriptions
    "A grenade that creates a lingering smoke cloud on impact, blocking visibility from other Raiders.":
        "一种撞击后产生持续烟雾云的手雷，阻挡其他掠夺者的视线。",
    "A grenade that detonates after a delay, dealing explosive damage in its radius.":
        "一种延迟引爆的手雷，在其范围内造成爆炸伤害。",
    "A grenade that detonates on impact, dealing explosive damage in a small radius.":
        "一种撞击时引爆的手雷，在小范围内造成爆炸伤害。",
    "A grenade that sticks to surfaces, dealing explosive damage after a short delay.":
        "一种粘附在表面的手雷，短暂延迟后造成爆炸伤害。",
    "A homing grenade that targets a single nearby ARC dealing explosive damage on impact":
        "一种追踪手雷，锁定附近一个ARC并在撞击时造成爆炸伤害",
    "A mine that deals damage to anything within its radius once the timer runs out":
        "一种地雷，计时器结束后对其范围内的一切造成伤害",
    "A proximity triggered mine that pops up and stuns anything within its radius.":
        "一种近距离触发的地雷，弹出并眩晕其范围内的目标。",
    "A proximity-triggered mine that pops up and deploys a gas cloud that rapidly drains stamina":
        "一种近距离触发的地雷，弹出并释放迅速消耗体力的毒气云",
    "A proximity-triggered mine that pops up and knocks back anything within its radius":
        "一种近距离触发的地雷，弹出并击退其范围内的目标",
    "A proximity-triggered mine that pops up and explodes, dealing damage to anything within its radius.":
        "一种近距离触发的地雷，弹出后爆炸，对其范围内的一切造成伤害。",
    "A proximity-triggered mine that pops up and stuns anything within its radius.":
        "一种近距离触发的地雷，弹出并眩晕其范围内的目标。",
    "A remote-detonatable grenade that sticks to surfaces and ARC, dealing explosive damage when triggered.":
        "一种遥控引爆手雷，可粘附在表面和ARC上，触发时造成爆炸伤害。",
    "A grenade that splits into multiple homing missiles, each tracking an ARC target and dealing explosive damage on impact.":
        "一种碎裂成多枚追踪导弹的手雷，每枚追踪ARC目标并在撞击时造成爆炸伤害。",
    "A grenade that detonates after a delay, tagging Raiders and ARC within range, allowing you to briefly track their location.":
        "一种延时引爆的手雷，标记区域内的掠夺者和ARC，让你短暂追踪他们的位置。",
    "A grenade that detonates after a delay, stunning enemies within its radius.":
        "一种延时引爆的手雷，眩晕其范围内的敌人。",
    "A grenade that deploys a dense but small smoke cloud, blocking visibility from ARC and other Raiders.":
        "一种释放浓密但范围小的烟雾的手雷，阻挡ARC和其他掠夺者的视野。",
    "A laser tripwire that detonates a Blaze Grenade when triggered.":
        "触发后引爆燃烧弹的激光绊线。",
    "A laser tripwire that detonates a Gas Grenade when triggered.":
        "触发后引爆毒气手雷的激光绊线。",
    "A laser tripwire that detonates a Lure Grenade when triggered.":
        "触发后引爆诱饵手雷的激光绊线。",
    "A laser tripwire that detonates a Smoke Grenade when triggered.":
        "触发后引爆烟雾弹的激光绊线。",

    # Gadgets / Quick Use
    "A throwable chemical light that illuminates the area around it.":
        "一种可投掷的化学荧光棒，照亮周围区域。",
    "A deployable cover that can block incoming damage until it breaks.":
        "可部署的掩体，能够阻挡伤害直到被摧毁。",
    "A deployable zipline that allows you to quickly move between two locations.":
        "一种可部署的滑索，让你快速在两个位置之间移动。",
    "A deployable proximity sensor that sounds an alarm when enemy raiders are detected.":
        "一种可部署的近距离传感器，检测到敌方掠夺者时会发出警报。",
    "A deployable device that, when manually triggered, launches a Raider Distress Flare.":
        "一种可部署装置，手动触发时会发射掠夺者求救信号弹。",
    "A basic pair of binoculars with two levels of magnification.":
        "一对基本的望远镜，有两档放大倍率。",
    "A noise-making device that sticks to surfaces, disrupting nearby ARC machines and attracting their fire.":
        "可粘附在表面的噪音装置，干扰附近ARC机器并吸引火力。",
    "A handheld repair kit that recharges a shield on use.":
        "一种手持修理工具，使用时为护盾充能。",
    "A handkeld kit that recharges a shield":
        "一种手持工具，为护盾充能",
    "A locking mechanism that can be placed on large metal doors to limit access.":
        "一种锁定机制，可放置在大型金属门上限制通行。",
    "A gadget that cloaks the user from ARC detection.":
        "使用户能够隐蔽自身免受ARC发现的小工具。",
    "A portable radar that detects nearby ARC enemies and Raiders.":
        "检测附近ARC敌人和掠夺者的便携雷达。",

    # Instruments
    "A playable recorder used to attract ARC's attention and impress other Raiders.":
        "一种可演奏的竖笛，用于吸引ARC的注意力并给其他掠夺者留下深刻印象。",
    "A playable acoustic guitar used to attract ARC's attention and impress other Raiders.":
        "一种可演奏的原声吉他，用于吸引ARC的注意力并给其他掠夺者留下深刻印象。",
    "A rhythm instrument used to attract ARC's attention and impress other Raiders.":
        "用于吸引ARC的注意力并给其他掠夺者留下深刻印象的节奏乐器。",

    # Materials
    "A tightly wound coil of metal. Used to craft a wide range of items. Can be recycled into scrap metal.":
        "一圈紧密缠绕的金属线圈。用于制作多种物品。可回收为废金属。",
    "A bundle of old wires. Used to craft a wide range of items. Can be recycled into scrap metal.":
        "一捆旧电线。用于制作多种物品。可回收为废金属。",
    "A sterile syringe for medical use. Used to craft medical supplies. Can be recycled into plastic.":
        "一种无菌医用注射器。用于制作医疗用品。可回收为塑料。",
    "A device that adjusts electrical voltage for various crafting purposes.":
        "一种调节电压的设备，用于各种制作用途。",
    "Used directly in crafting items of all tiers.":
        "直接用于制作各等级物品。",
    "Used in crafting.": "用于制作。",
    "Used to craft a wide range of items.": "用于制作多种物品。",
    "Used to craft a wide range of items. Can be recycled into crafting materials":
        "用于制作多种物品。可回收为制作材料",
    "Used to craft a wide range of items. Can be recycled into crafting materials.":
        "用于制作多种物品。可回收为制作材料。",
    "Used to craft a wide range of items. Can be recycled into plastic.":
        "用于制作多种物品。可回收为塑料。",
    "Used to craft advanced weapons.": "用于制作高级武器。",
    "Used to craft medical supplies and shields.": "用于制作医疗用品和护盾。",
    "Used to craft medical supplies, explosives, and utility items.": "用于制作医疗用品、爆炸物和工具物品。",
    "Used to craft medical supplies.": "用于制作医疗用品。",
    "Used to craft medical supplies. Can be recycled into scrap metal.": "用于制作医疗用品。可回收为废金属。",
    "Used to craft utility items and explosives. Can be recycled into chemicals.": "用于制作工具物品和爆炸物。可回收为化学品。",
    "Used to craft utility items and explosives. Can be recycled into scrap metal.": "用于制作工具物品和爆炸物。可回收为废金属。",
    "Used to craft weapons and explosives. Can be recycled into chemicals.": "用于制作武器和爆炸物。可回收为化学品。",
    "Used to craft weapons. Can be recycled into scrap metal.": "用于制作武器。可回收为废金属。",
    "Unlocks a Raider Hatch.": "解锁掠夺者舱口。",

    # ARC materials
    "Obtained from ARC enemies or activities. Used to craft components. Can be recycled into ARC Alloy.":
        "从ARC敌人或活动中获得。用于制作组件。可回收为ARC合金。",
    "Obtained from ARC enemies or activities, or by recycling certain ARC parts. Used to craft components.":
        "从ARC敌人或活动中获得，或通过回收特定ARC零件获得。用于制作组件。",
    "Obtained from ARC enemies or activities. Can be recycled into chemicals.":
        "从ARC敌人或活动中获得。可回收为化学品。",
    "Obtained from ARC enemies or activities. Can be recycled into plastic.":
        "从ARC敌人或活动中获得。可回收为塑料。",
    "Obtained from ARC enemies or activities. Can be recycled into rubber.":
        "从ARC敌人或活动中获得。可回收为橡胶。",
    "Obtained from ARC enemies or activities. Can be recycled into cloth.":
        "从ARC敌人或活动中获得。可回收为布料。",
    "Obtained from ARC enemies and activities. Can be recycled into cloth.":
        "从ARC敌人和活动中获得。可回收为布料。",
    "Obtained from ARC enemies and activities. Can be recycled into scrap metal.":
        "从ARC敌人和活动中获得。可回收为废金属。",
    "Obtained from ARC enemies or activities. Can be recycled into scrap metal.":
        "从ARC敌人或活动中获得。可回收为废金属。",
    "A valuable resource dropped by all ARC enemies. Used to craft: Shield Recharger":
        "所有ARC敌人掉落的宝贵资源。用于制作：护盾充能器",
    "A valuable resource dropped by specific ARC enemies":
        "特定ARC敌人掉落的珍贵资源",
    "Can be recycled into ARC Alloy.": "可回收为ARC合金。",
    "Gathered from ARC Snitches. Can be recycled into ARC Alloy.":
        "从ARC告密者处收集。可回收为ARC合金。",
    "The explosive pod from a Tick. Can be recycled into ARC Alloy.":
        "来自Tick的爆炸舱。可回收为ARC合金。",

    # ARC enemy parts
    "A key control component from a Bison vehicle.":
        "来自野牛载具的关键控制组件。",
    "A LiDAR scanner used to detect the subtlest changes to the Earth's surface.":
        "用于探测地球表面最细微变化的激光雷达扫描仪。",
    "A control module used to pilot Hornet drones or vehicles. Can be recycled into ARC Alloy.":
        "用于操控大黄蜂无人机或载具的控制模块。可回收为ARC合金。",
    "A control module used to pilot Wasp drones or vehicles. Can be recycled into ARC Alloy.":
        "用于操控黄蜂无人机或载具的控制模块。可回收为ARC合金。",

    # Mods
    "Slightly reduces vertical recoil.": "略微降低垂直后坐力。",
    "Slightly reduces horizontal recoil.": "略微降低水平后坐力。",
    "Slightly reduces both vertical recoil & horizontal recoil.": "略微降低垂直和水平后坐力。",
    "Significantly reduces horizontal recoil.": "显著降低水平后坐力。",
    "Slightly reduces base dispersion.": "略微降低基础散布。",
    "Moderately reduces base dispersion.": "适度降低基础散布。",
    "Slightly reduces per-shot dispersion.": "略微降低每发散布。",
    "Slightly improves dispersion & recoil recovery time. Compatible with: Rattler, Ferro, Arpeggio, Bettina, Kettle.":
        "略微改善散布和后坐力恢复时间。兼容：响尾蛇、铁骑、琶音、贝蒂娜、壶。",
    "Moderately extends the ammo capacity of the compatible weapons that use light ammo.":
        "适度扩展使用轻型弹药的兼容武器的弹药容量。",
    "Slightly extends the ammo capacity of the compatible weapons that use light ammo.":
        "略微扩展使用轻型弹药的兼容武器的弹药容量。",
    "Slightly extends the ammo capacity of compatible weapons that use medium ammo.":
        "略微扩展使用中型弹药的兼容武器的弹药容量。",
    "Slightly extends the ammo capacity of compatible weapons that use shotgun ammo.":
        "略微扩展使用霰弹枪弹药的兼容武器的弹药容量。",
    "Moderately extends the ammo capacity of shotguns.":
        "适度扩展霰弹枪的弹药容量。",
    "Moderately reduces the amount of noise produced when firing.":
        "适度降低射击时产生的噪音。",

    # Ammo  
    "Light bullets used mainly with SMGs and light handguns. Such as Kettle, Stitcher, Burletta, Hairpin and Bobcat.":
        "主要用于冲锋枪和轻型手枪的轻型子弹。如壶、缝合者、滑稽剧、发卡和山猫。",
    "Medium bullets used mainly with medium-caliber weapons. Such as Rattler, Tempest, Arpeggio, Renegade and Torrente.":
        "主要用于中口径武器的中型子弹。如响尾蛇、风暴、琶音、叛逆者和激流。",
    "Heavy bullets used mainly with large-caliber weapons.":
        "主要用于大口径武器的重型子弹。",
    "Shotgun shells used for shotguns.": "霰弹枪使用的弹壳。",
    "Ammo used for energy weapons. One clip will fully charge a single weapon.":
        "能量武器使用的弹药。一个弹夹可完全充满一把武器。",

    # Keys
    "Opens the door to the Control Centre Tower on the top floor.":
        "打开控制中心塔顶层的门。",
    "Opens the door to the Testing Annex on Dam Battlegrounds.":
        "打开大坝战场测试附楼的门。",
    "Opens the door to the Water Treatment Control building in The Dam.":
        "打开大坝水处理控制大楼的门。",
    "Opens the door to the J Kozma Ventures building in Buried City.":
        "打开埋葬之城J Kozma Ventures公司大楼的门。",

    # Cosmetics
    "A new outfit variant will be added to your collection. Complete the Off the Radar quest.":
        "新外观变体将添加到您的收藏中。完成脱离雷达任务。",
    "A new outfit variant will be added to your collection. Complete the Switching the Supply quest.":
        "新外观变体将添加到您的收藏中。完成切换供给任务。",
    "A new Hiker backpack variant will be added to your collection":
        "新的徒步者背包外观变体将添加到您的收藏中",
    "Maintain at least Scrapper III rank before the end of the season.":
        "保持赛季结束前至少拼搏者III段位。",
    "Maintain at least Rookie III rank before the end of the season.":
        "保持赛季结束前至少新手III段位。",
    "Maintain at least Wildcard III rank before the end of the season to earn this emote.":
        "保持赛季结束前至少通配符III段位即可获得此表情。",
    "This is the Junior outfit cosmetic":
        "这是Junior外观服装",
    "This is the Warden outfit cosmetic":
        "这是守望者外观服装",
    "Fun thing to put on a fridgerator.":
        "放在冰箱上的有趣小玩意。",

    # Misc
    "A handful of seeds. Celeste might be looking for these.":
        "一把种子。Celeste可能正在寻找这些。",
    "For some reason, Lance has personally planted a lot of these around the Rustbelt.":
        "由于某种原因，Lance亲自在锈带周围种植了许多这样的东西。",
}

# ═══════════════════════════════════════════════════════════════
# BLUEPRINT DESCRIPTION PATTERNS
# These handle "Allows you to craft the X" etc. blueprints
# ═══════════════════════════════════════════════════════════════
CRAFT_ITEM_NAMES = {
    "ARC Circuit": "ARC电路",
    "Anvil": "铁砧",
    "Blue Light Stick": "蓝色荧光棒",
    "Green Light Stick": "绿色荧光棒",
    "Red Light Stick": "红色荧光棒",
    "Yellow Light Stick": "黄色荧光棒",
    "Burletta": "滑稽剧",
    "Combat Mk. 3 (Flanking)": "战斗型 Mk.3（侧翼）",
    "Deadline Mine": "死线地雷",
    "Deadline": "死线",
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
    # Mod names for blueprints
    "Angled Grip III": "斜握把 III",
    "Compensator III": "补偿器 III",
    "Extended Light Mag III": "扩展轻型弹匣 III",
    "Extended Shotgun Mag II": "扩展霰弹枪弹匣 II",
    "Extended Shotgun Mag III": "扩展霰弹枪弹匣 III",
    "Muzzle Brake III": "枪口制退器 III",
    "Silencer III": "消音器 III",
    "Stable Stock III": "稳定枪托 III",
    "Shotgun Choke III": "霰弹枪收束器 III",
    "Vertical Grip III": "垂直握把 III",
    "Vita Shot": "维生素注射",
}

# Apply translations
changed_descs = 0
changed_names = 0

for i, item_zh in enumerate(items_zh):
    item_id = item_zh.get('id', '')
    item_en = en_by_id.get(item_id)
    if not item_en:
        continue

    en_desc = item_en.get('description', '') or ''
    zh_desc = item_zh.get('description', '') or ''

    # Check if description has mixed content
    has_cn = any('\u4e00' <= c <= '\u9fff' for c in zh_desc)
    has_en = bool(re.search('[a-zA-Z]{3,}', zh_desc))

    if has_cn and has_en:
        # Try exact match from English source first
        if en_desc in FULL_DESC:
            items_zh[i]['description'] = FULL_DESC[en_desc]
            changed_descs += 1
        else:
            # Try to clean up blueprint descriptions
            # Pattern: "Allows you to craft the X" or "Allows you to craft X"
            bp_match = re.match(r'^Allows you to craft (?:the )?(.+?)\.?$', en_desc)
            if bp_match:
                craft_name = bp_match.group(1)
                # Remove trailing descriptions after " - " or ". "
                base_name = re.split(r'\s*[-–]\s*|\.\s+', craft_name)[0].strip()
                zh_craft = CRAFT_ITEM_NAMES.get(base_name, base_name)
                # Build full Chinese desc
                suffix = craft_name[len(base_name):]
                if suffix:
                    # Translate remaining suffix
                    suffix_desc = en_desc[en_desc.index(base_name) + len(base_name):]
                    suffix_desc = suffix_desc.rstrip('.')
                    if suffix_desc.startswith(' - '):
                        suffix_part = suffix_desc[3:]
                        if suffix_part in FULL_DESC:
                            items_zh[i]['description'] = f"让你制作{zh_craft} - {FULL_DESC[suffix_part]}"
                        else:
                            items_zh[i]['description'] = f"让你制作{zh_craft}"
                    else:
                        items_zh[i]['description'] = f"让你制作{zh_craft}"
                else:
                    items_zh[i]['description'] = f"让你制作{zh_craft}"
                changed_descs += 1

    # Also fix descriptions that are fully English (not mixed but still untranslated)
    if not has_cn and has_en and en_desc in FULL_DESC:
        items_zh[i]['description'] = FULL_DESC[en_desc]
        changed_descs += 1

# Now handle remaining mixed descriptions via fragment replacement
FRAGMENT_REPLACEMENTS = [
    # English fragments that appear in partially translated Chinese text
    ("with large bullet spread, sharp falloff, and high damage output.", "弹丸散布大、衰减明显、伤害输出高。"),
    ("with high fire rate but low accuracy.", "射速高但精度低。"),
    (". A cheap offensive option, but has to be reloaded 2 bullets at a time.", "。廉价的进攻选择，但需要每次装填2发子弹。"),
    (". Quick and accurate, but has low bullet velocity and takes a long time reload.", "。快速精准，但弹头速度低且装弹时间长。"),
    ("Can be fired as fast as you can pull the trigger.", "射速取决于你扣扳机的速度。"),
    ("with good bullet spread but sharp falloff", "弹丸散布好但衰减明显"),
    ("with a built-in silencer. Great for stealth, but tricky in combat.", "自带消音器。适合隐匿，但在战斗中使用不易。"),
    ("with reliable damage output and accuracy.", "可靠的伤害输出和精度。"),
    ("and high damage output.", "伤害输出高。"),
    ("that only detonate when hitting ARC.", "仅在击中ARC时引爆。"),
    ("that only detonate when hitting ARC", "仅在击中ARC时引爆"),
    ("during use. 可对自己或队友使用。", "。可对自己或队友使用。"),
    ("during use.", "。"),
    ("health。", "生命值。"),
    ("enemies范围内的一切。", "其范围内的敌人。"),
    ("anything within its radius", "其范围内的目标"),
    ("anything范围内的一切。", "其范围内的一切。"),
    (", dealing damage to anything范围内的一切。", "，对其范围内的一切造成伤害。"),
    ("the area around it.", "周围区域。"),
    ("the subtlest changer to the Earth's surface.", "地球表面最细微变化的激光雷达扫描仪。"),
    ("the subtlest changes to the Earth's surface.", "地球表面最细微变化。"),
    ("or vehicles.", "或载具。"),
    ("or vehicles. 可回收为ARC合金。", "或载具。可回收为ARC合金。"),
    (". Can be recycled into crafting materials.", "。可回收为制作材料。"),
    (". Can be recycled into crafting materials", "。可回收为制作材料"),
    (". Can be recycled into plastic.", "。可回收为塑料。"),
    ("Can be recycled into scrap metal.", "可回收为废金属。"),
    ("Used to craft a wide range of items", "用于制作多种物品"),
    ("Used to craft medical supplies", "用于制作医疗用品"),
    ("Used to craft weapons", "用于制作武器"),
    ("Used to craft utility items and explosives", "用于制作工具物品和爆炸物"),
    ("for various crafting purposes.", "用于各种制作用途。"),
    ("Control Centre Tower on the top floor", "控制中心塔顶层"),
    ("Testing Annex on Dam Battlegrounds", "大坝战场测试附楼"),
    ("Water Treatment Control building in The Dam", "大坝水处理控制大楼"),
    ("Off the Radar", "脱离雷达"),
    ("the Switching the Supply", "切换供给"),
    ("Hiker backpack", "徒步者背包"),
    ("Blaze Grenade", "燃烧弹"),
    ("Gas Grenade", "毒气手雷"),
    ("Lure Grenade", "诱饵手雷"),
    ("Smoke Grenade", "烟雾弹"),
    ("Bison", "野牛"),
    ("Hornet", "大黄蜂"),
    ("Wasp", "黄蜂"),
    ("Celeste", "Celeste"),
    ("Lance", "Lance"),
    # Blueprint craft patterns
    ("Anvil - Has high damage output and headshot damage, but slow handling.", "铁砧"),
    ("Blue Light Stick.", "蓝色荧光棒。"),
    ("Green Light Stick.", "绿色荧光棒。"),
    ("Red Light Stick.", "红色荧光棒。"),
    ("Burletta", "滑稽剧"),
    ("Combat Mk. 3 (Flanking)", "战斗型 Mk.3（侧翼）"),
    ("Deadline Mine", "死线地雷"),
    ("Energy Ammo", "能量弹药"),
    ("Heavy Fuse Grenade", "重型引信手雷"),
    ("Hullcracker", "破壳者"),
    ("Il Toro", "公牛"),
    ("Laser Trap: Fire", "激光陷阱：火焰"),
    ("Laser Trap: Gas", "激光陷阱：毒气"),
    ("Medium Mag III", "中型弹匣 III"),
    ("Renegade", "叛逆者"),
    ("Shotgun Silencer. Moderately reduces the amount of noise produced when firing.", "霰弹枪消音器。适度降低射击时产生的噪音。"),
    ("Showstopper.", "惊鸿一击。"),
    ("Tactical MK. 3 (Revival).", "战术型 Mk.3（复活）。"),
    ("Torrente", "激流"),
    ("Venator。每次发射两发子弹。", "猎人。每次发射两发子弹。"),
    ("Wolfpack", "狼群"),
    ("Vulcano", "火山"),
    ("Obtained from ARC enemies or activities", "从ARC敌人或活动中获得"),
    ("Obtained from ARC enemies and activities", "从ARC敌人和活动中获得"),
    ("- Moderately extends the ammo capacity of shotguns.", "- 适度扩展霰弹枪的弹药容量。"),
    ("- A medical item that restores a large amount of health.", "- 恢复大量生命值的医疗物品。"),
    ("Gathered from ARC Snitches.", "从ARC告密者处收集。"),
    ("ARC Alloy", "ARC合金"),
    (" - Has high damage output and headshot damage, but slow handling.", ""),
    ("Tick", "蜱虫"),
]

for i, item_zh in enumerate(items_zh):
    desc = item_zh.get('description', '') or ''
    has_cn = any('\u4e00' <= c <= '\u9fff' for c in desc)
    has_en = bool(re.search('[a-zA-Z]{3,}', desc))
    if has_cn and has_en:
        for en_frag, zh_frag in FRAGMENT_REPLACEMENTS:
            if en_frag in desc:
                desc = desc.replace(en_frag, zh_frag)
        items_zh[i]['description'] = desc

# ═══════════════════════════════════════════════════════════════
# Fix mixed names
# ═══════════════════════════════════════════════════════════════
NAME_FRAGMENTS = {
    "Anvil": "铁砧",
    "Bettina": "贝蒂娜",
    "Blueprint": "蓝图",
}

# Save
with open('src/data/zh/items_zh.json', 'w', encoding='utf-8') as f:
    json.dump(items_zh, f, ensure_ascii=False, indent=2)

# Stats
mixed_descs = 0
mixed_names = 0
for item in items_zh:
    desc = item.get('description', '') or ''
    has_cn = any('\u4e00' <= c <= '\u9fff' for c in desc)
    has_en = bool(re.search('[a-zA-Z]{3,}', desc))
    if has_cn and has_en:
        mixed_descs += 1
        print(f'MIXED DESC: {item["name"]}: {desc[:120]}')
    
    name = item.get('name', '')
    has_cn_n = any('\u4e00' <= c <= '\u9fff' for c in name)
    has_en_n = bool(re.search('[a-zA-Z]{3,}', name))
    if has_cn_n and has_en_n:
        mixed_names += 1

print(f'\nRemaining mixed descriptions: {mixed_descs}')
print(f'Remaining mixed names: {mixed_names}')
