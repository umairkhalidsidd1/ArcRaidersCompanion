#!/usr/bin/env python3
"""Translate guides.json to Chinese (Simplified) for Arc Raiders Companion."""

import json
import re
import html

# Load data
with open("src/data/guides.json", "r", encoding="utf-8") as f:
    guides = json.load(f)

# ── Translation mappings ──

TYPE_MAP = {"quest": "任务", "general": "通用"}
AUTHOR_MAP = {"ARC Companion Team": "ARC助手团队"}

RARITY_MAP = {
    "Common": "普通",
    "Uncommon": "稀有",
    "Rare": "精良",
    "Epic": "史诗",
    "Legendary": "传说",
}

ITEM_TYPE_MAP = {
    "Basic Material": "基础材料",
    "Topside Material": "地表材料",
    "Recyclable": "可回收物",
    "Refined Material": "精炼材料",
    "Advanced Material": "高级材料",
    "Ammunition": "弹药",
    "Blueprint": "蓝图",
    "Quick Use": "快速使用",
    "Throwable": "投掷物",
    "Weapon": "武器",
    "Modification": "改装件",
    "Augment": "增强件",
    "Key": "钥匙",
    "Trinket": "饰品",
    "Misc": "杂项",
    "Shield": "护盾",
    "Gadget": "工具",
    "Explosives": "爆炸物",
}

MAP_NAMES = {
    "Blue Gate": "蓝门",
    "The Blue Gate": "蓝门",
    "Dam Battlegrounds": "大坝战场",
    "The Dam": "大坝",
    "Spaceport": "太空港",
    "The Spaceport": "太空港",
    "Stella Montis": "斯特拉蒙蒂斯",
    "Stella Montes": "斯特拉蒙蒂斯",
    "Buried City": "地下城",
    "All Maps": "所有地图",
}

NPC_NAMES = {
    "Shani": "沙尼",
    "Lance": "兰斯",
    "Celeste": "塞莱斯特",
    "Stani": "斯坦尼",
    "Apollo": "阿波罗",
    "Tian Wen": "天问",
}

ENEMY_NAMES = {
    "Bastion": "堡垒",
    "Bombardier": "轰炸者",
    "Fireball": "火球",
    "Hornet": "大黄蜂",
    "Leaper": "跳跃者",
    "Matriarch": "女族长",
    "Pop": "爆弹",
    "Queen": "女王",
    "Rocketeer": "火箭兵",
    "Sentinel": "哨兵",
    "Shredder": "碎裂者",
    "Snitch": "告密者",
    "Spotter": "勘测者",
    "Tick": "蜱虫",
    "Turret": "炮塔",
    "Wasp": "黄蜂",
    "Bison": "野牛",
    "Surveyor": "勘测兵",
}

# Game-term translations
GAME_TERMS = {
    "Overview": "概述",
    "Step 1": "步骤一",
    "Step 2": "步骤二",
    "Step 3": "步骤三",
    "Step 4": "步骤四",
    "Step 5": "步骤五",
    "Step 6": "步骤六",
    "Step 7": "步骤七",
    "Objectives": "目标",
    "quest": "任务",
    "Quest": "任务",
    "map": "地图",
    "Map": "地图",
    "extract": "撤离",
    "Extract": "撤离",
    "extraction": "撤离",
    "Extraction": "撤离",
    "exfil": "撤离",
    "Exfil": "撤离",
    "loot": "搜刮",
    "Loot": "搜刮",
    "looting": "搜刮",
    "Looting": "搜刮",
    "raid": "突袭",
    "Raid": "突袭",
    "Safe Pocket": "安全口袋",
    "safe pocket": "安全口袋",
    "inventory": "背包",
    "Inventory": "背包",
    "loadout": "装备方案",
    "Loadout": "装备方案",
    "waypoint": "路标",
    "Waypoint": "路标",
    "interact": "互动",
    "Interact": "互动",
    "breach": "破解",
    "Breach": "破解",
    "crafting": "制作",
    "Crafting": "制作",
    "craft": "制作",
    "Craft": "制作",
    "ARC": "ARC",
    "XP": "经验值",
    "PvP": "PvP",
    "PvE": "PvE",
    "Night Raid": "夜间突袭",
    "Electromagnetic Storm": "电磁风暴",
    "Hidden Bunker": "隐藏地堡",
    "Cold Snap": "寒潮",
    "Field Depot": "野外补给站",
    "Field Crate": "野外箱",
    "Supply Beacon": "补给信标",
    "Raider": "突袭者",
    "Raiders": "突袭者",
    "Raider Hatch": "突袭者舱门",
    "Raider Hatch Key": "突袭者舱门钥匙",
}

# Quest title translations (manually translated for accuracy)
TITLE_TRANSLATIONS = {
    "A Bad Feeling": "不好的预感",
    "A Balanced Harvest": "均衡的收获",
    "A Better Use": "更好的用途",
    "A First Foothold": "第一个据点",
    "A Lay of the Land": "勘察地形",
    "A New Type of Plant": "新型植物",
    "A Reveal in Ruins": "废墟中的发现",
    "A Symbol of Unification": "统一的象征",
    "A Warm Place to Rest": "温暖的休憩之所",
    "After Rain Comes": "雨后初晴",
    "Armored Transports": "装甲运输车",
    "Back on Top": "重回巅峰",
    "Bees!": "蜜蜂！",
    "Bringing Down a Bison": "击倒野牛",
    "Broken Monument": "破碎的纪念碑",
    "Building a Library": "建造图书馆",
    "Celeste's Journals": "塞莱斯特的日记",
    "Clearer Skies": "更晴朗的天空",
    "Cold Storage": "冷藏室",
    "Communication Hideout": "通讯据点",
    "Controlled Demolition": "控制爆破",
    "Digging Up Dirt": "挖掘线索",
    "Doctor's Orders": "医嘱",
    "Dormant Barons": "沉睡的男爵",
    "Down To Earth": "脚踏实地",
    "Echoes of Victory Ridge": "胜利山脊的回响",
    "Espresso": "浓缩咖啡",
    "Eyes in the Sky": "天空之眼",
    "Eyes on the Prize": "盯紧目标",
    "Fight Fire With Fire": "以火攻火",
    "Finders Keepers": "先到先得",
    "Flickering Threat": "闪烁的威胁",
    "From a Distance": "远距离",
    "Greasing Her Palms": "打点关系",
    "Handover": "交接",
    "Hatch Repairs": "舱门维修",
    "In My Image": "以我之像",
    "Industrial Espionage": "工业间谍",
    "Into the Fray": "投入战斗",
    "Keeping the Memory": "铭记记忆",
    "Lance's Tea Party": "兰斯的茶会",
    "Life of a Pharmacist": "药剂师的生活",
    "Marked for Death": "死亡标记",
    "Market Correction": "市场纠正",
    "Snap and Salvage": "拍摄与回收",
    "Straight Record Quest": "校正记录任务",
    "With A Trace": "留下痕迹",
    "Aphelion Breakdown": "远日点武器解析",
    "Arc Survival Guide": "ARC生存指南",
    "ARC Weaknesses": "ARC弱点",
    "Blue Gate Puzzles & Loot": "蓝门谜题与战利品",
    "Cash Farming Guide for Expedition": "远征赚钱攻略",
    "Cold Snap Patch Notes": "寒潮更新说明",
    "Easy coin farm using spotters": "利用勘测者轻松刷金币",
    "Glitched Queen Insta-Kill": "女王秒杀技巧",
    "Hidden Bunker Event Location Spaceport": "太空港隐藏地堡事件位置",
    "How to beat the Matriarch - NEW BOSS": "如何击败女族长 - 新BOSS",
    "Important Materials and Their Locations": "重要材料及其位置",
    "Is the security breach skill worth it?": "安全突破技能值得投入吗？",
    "Paving the Way Quest": "铺路任务",
    "Stella Montis Keys - Where To Use": "斯特拉蒙蒂斯钥匙 - 使用位置",
    "Stella Montis Overview and Looting Guide": "斯特拉蒙蒂斯概览与搜刮指南",
    "Stench of Corruption Quest": "腐败恶臭任务",
    "Trials 3 Star Guide": "试炼三星指南",
    "Trials High Scoring Guide for Week of Nov 10th": "11月10日周试炼高分指南",
    "Trials Week 5": "第五周试炼",
    "Trials Week 6 High Scoring Guide": "第六周试炼高分指南",
    "Trials Week 7": "第七周试炼",
    "Turnabout": "反转",
    "Weekly Trials Nov 17th": "11月17日周试炼",
}

# Summary translations
SUMMARY_TRANSLATIONS = {
    "58814510-c025-4db4-80cf-c33df2f307d5": "了解如何找到并调查ARC探测器或ARC信使，完成Arc Raiders中的\"不好的预感\"任务，提及大坝战场区域的信标位置。",
    "c600f65f-a8f6-4e60-b66c-457b3281b9be": "完成Arc Raiders中\"均衡的收获\"任务的详细攻略，重点介绍如何在研究与管理大楼内找到并收集Lucille Ludi的笔记。",
    "afbdbf52-8502-4987-8ed7-9645dd2cff38": "按照步骤完成Arc Raiders中的\"更好的用途\"任务，包括找到补给信标、请求资源投放，然后收集掉落物品。",
    "03c78860-d257-4be0-ac79-c4fe59a4a3c8": "完成Arc Raiders中\"第一个据点\"任务的详细指南。本指南概述了蓝门地图上四个不同位置，你需要在这些位置操作各种设施来推进并完成任务目标。",
    "5d54cbe3-f4fe-4a12-b0a1-2d88a92aa7a0": "这里提供Arc Raiders中\"勘察地形\"任务的完整攻略，涵盖如何找到运送单据和激光雷达扫描仪，以及在哪里撤离来上交任务。",
    "01291ace-5c46-4e10-9577-bc2ba4d5cffc": "本教程解释如何在Arc Raiders的大坝战场区域\"旧战场\"附近有效完成\"新型植物\"任务，包括寻找和采集\"可能有毒的植物\"并上交。",
    "d0693ddd-1a31-4398-ba6f-ddca29f72ee4": "经验值: 0",
    "03dd7934-2f52-4a3a-ab2b-54a0be2a2f58": "按照步骤完成Arc Raiders中的\"统一的象征\"任务，包括找到堡垒前哨、取回突袭者旗帜并将其升上旗杆。",
    "45a5c563-3d91-44f8-86a8-8f462e3a2ba3": "这里提供Arc Raiders中\"温暖的休憩之所\"任务的完整攻略。了解如何找到起点、跟随红色标记，以及找到坟墓来完成任务。",
    "f796b242-6629-48b6-9a8a-3a80b8e58f03": "以下是如何通过找到并修复Grandioso公寓区的太阳能板来完成Arc Raiders中\"雨后初晴\"任务的方法，包括所需材料。",
    "5a85fc6a-d1b6-49af-80ce-ccfe58e4fb1f": "本教程提供在Arc Raiders中找到装甲巡逻车及其钥匙的攻略。了解钥匙的位置和完成任务所需的所有巡逻车可能出现点。",
    "8af69139-a32e-43fd-a86c-0481d640b169": "经验值: 0",
    "012273b7-55c4-4652-8553-b89d4e879803": "本教程提供在蓝门区域橄榄园中找到\"蜜蜂\"任务所需蜜蜂的确切位置。",
    "a854cc46-b94d-4cc3-8e4e-49982737c242": "经验值: 34000",
    "c1d69b4d-ed2a-486c-b67e-98e52c66ddae": "本教程提供如何在Arc Raiders的大坝战场地图中找到指南针、录像带和旧野战口粮来完成\"破碎的纪念碑\"任务的详细说明。了解每个物品的隐藏位置和成功完成任务的关键技巧。",
    "431e4e1c-ff83-4c45-87b5-e00bdefc39dd": "本指南介绍如何在Arc Raiders的地下城中找到完成\"建造图书馆\"任务所需的全部三本书。",
    "9ddf705d-09fe-4ee4-b699-f16002d4f0ff": "经验值: 0",
    "74febe04-2aa6-4c0d-80e0-a0ebb09661c7": "在Arc Raiders中完成\"更晴朗的天空\"任务的全面指南，包括如何找到并摧毁ARC敌人以及获取ARC合金。",
    "8fd31a6c-44d5-4034-b55c-051d84a1cfcf": "经验值: 0",
    "3d458c61-1b92-4174-b171-212cfc419995": "完成Arc Raiders中\"通讯据点\"任务的详细攻略，涵盖电池获取、发电机激活和天线终端启动。",
    "fcf6009e-7d57-46e0-9bf7-25e79cf04990": "经验值: 5000",
    "3a390a85-3400-4811-8e37-9bf077125dc0": "这里提供在Arc Raiders旧城区Santa Maria街区中找到\"挖掘线索\"任务死信箱的完整攻略。",
    "2005e9d4-d4fb-4890-952f-c831063145ad": "在Arc Raiders中高效获取消毒液、注射器和大毛蕊花等必需医疗用品的简明指南。",
    "0685006a-22c9-4a75-afd3-4f3dbed7b735": "本教程解释如何找到并搜刮Baron外壳来完成Arc Raiders中的\"沉睡的男爵\"任务。",
    "1989f530-8b78-4e1b-a648-3b2b1d95c0d2": "经验值: 0",
    "c1aa0e2e-7aca-4e28-b823-75429084d7b3": "在Arc Raiders中完成\"胜利山脊的回响\"任务的简明攻略。了解任务物品的确切位置和快速撤离的最佳方式。",
    "da8c6777-b06c-4358-9a14-05e97310bc39": "这些步骤概述了如何在地下城中找到完成\"浓缩咖啡\"任务所需的咖啡机零件。了解确切位置和如何保护物品以成功撤离。",
    "e3f57f6e-638d-4c70-9c60-be9629cf5de9": "经验值: 0",
    "12b48bfb-1237-48f2-9c2f-dda94e01c12c": "这里提供完成Arc Raiders中\"盯紧目标\"任务的完整攻略，包括找到所需区域、获取电线和修复推进面板。",
    "96985556-cf9c-41e9-9f44-e036af26f86c": "经验值: 5000",
    "3d2adb99-3172-4c54-9aeb-16e1093a3eeb": "通过在Arc Raiders世界各地的突袭者营地中找到并搜刮容器来完成\"先到先得\"任务的简明攻略。本指南重点介绍两个主要位置和一个重要的任务进度技巧。",
    "6272b4f3-b3e5-4c54-b223-1f90c8b1c1dc": "这里提供完成Arc Raiders中\"闪烁的威胁\"任务的完整攻略。涵盖找到发电机房、修复发电机、找到通风井以及激活电源开关。",
    "d4c102cd-9217-442a-b838-95627353e5b2": "本教程提供在Arc Raiders中完成\"远距离\"任务的高效策略，重点介绍利用太空港地图的高处有利位置成功标记野牛和火箭兵。",
    "f90c79c5-ee0a-4671-8245-d37ccc103a50": "本教程提供在大坝战场、地下城和太空港地图上完成Arc Raiders中\"打点关系\"任务的详细说明，包括关键位置和所需物品。",
    "fac2f005-7a78-4453-9fd0-9d0508782e5d": "本教程提供快速简便地完成Arc Raiders中\"交接\"任务的攻略，涉及找到并标记Pattern House。",
    "acd1265e-bd36-4c11-b5a1-3cbd78c95244": "以下是完成Arc Raiders中\"舱门维修\"任务的完整攻略，包括如何找到突袭者舱门、修复它们并获得突袭者舱门钥匙。",
    "6411fa1d-6099-4289-bb3c-5385a60db1da": "完成\"以我之像\"任务的快速指南 - 在斯特拉蒙蒂斯各处找到并搜刮3个机器人体。",
    "a637ca4d-d295-4fe7-b969-6d8200cd0be7": "经验值: 0",
    "b601da26-a12d-4a58-9dcf-3839bc2c0ed9": "本教程介绍在Arc Raiders中消灭跳跃者的简单可重复方法，重点介绍一个特定的扼守点位置。此策略非常适合无需依赖Wolfpack手雷即可刷跳跃者零件的任务。",
    "1cc23af0-64b6-463f-879d-070c6e030d7f": "这里解释Arc Raiders中\"铭记记忆\"任务，说明如何找到丢失的头盔并将其送回纪念碑。",
    "fe259423-45b6-49e7-87c3-e7f175e0ff78": "在Arc Raiders中找到橡皮鸭和褪色照片来完成兰斯任务的快速指南，包括建议的搜刮位置和技巧。",
    "10ed4b7e-92b5-45bb-8f2e-9fdc99f71405": "经验值: 0",
    "e9b42884-76a2-4d97-947c-92c44b6fb66b": "经验值: 0",
    "fd9dc8d4-298c-4786-a652-afdb302fbd7a": "经验值: 0",
    "519805e3-5f19-46f4-bbce-f9f5dfae65c1": "本教程提供完成\"拍摄与回收\"任务目标的详细说明，包括查找文件、拍摄探测车以及获取磁控管和流量控制器。",
    "9d5ee438-2b11-4758-ae18-ea33f26e5050": "在大坝战场区域完成\"校正记录\"任务的详细攻略，包括找到并关闭旧EMP陷阱，按正确顺序激活三个电源开关。",
    "d3a300d2-0fa5-492e-a20a-249f37494e0a": "按照步骤在Arc Raiders的蓝门地图上完成\"留下痕迹\"任务，包括到达荒芜空地和检查关键残骸。",
    "24945363-aea4-45a7-a24b-fa16251547f8": "这里是Arc Raiders中远日点传奇战斗步枪的全面分析，涵盖其数据、对不同敌人类型（ARC和PvP）的有效性、理想玩法、最佳配件和制作要求。",
    "c1409478-cf99-4490-9348-3164d69f253c": "本教程提供在游戏中有效击败各种ARC敌人的详细策略和见解。了解每种敌人的弱点、推荐武器和战术方法以确保生存和成功。",
    "3942e4c4-c536-4f53-a0a6-53b28807a2c8": "本指南概述了针对游戏中各种ARC敌人的有效策略和特殊弱点，帮助你高效击败它们。",
    "aa55694a-b071-427a-8ead-0400cfec9e38": "本教程涵盖蓝门地区所有谜题位置及其解法，包括地表废墟和地下隧道，以最大化你的战利品。",
    "0616d22c-f4db-4131-9f1d-19fed06e7230": "本教程介绍在Arc Raiders中积累财富的高效方法，重点介绍最大化利润和最小化损失，这对即将到来的远征至关重要。",
    "67ac0908-00a0-45fd-866a-b691cf6578f0": "官方寒潮更新补丁说明。",
    "7a7a5bda-ac1d-4a13-84b5-bca6922a4230": "利用轰炸者的勘测者进行快速刷金币的方法，勘测者可以无限重生。",
    "38bce844-e4a1-4f52-939e-3b67d98ca119": "本指南向你展示如何使用燃烧手雷陷阱快速轻松地击败\"女王\"Boss，在几分钟内获取48,000经验值。学习理想的放置位置和策略，避免仇恨并保护你的战利品。",
    "f887696f-e255-48de-83b1-fe8e4b6834e2": "这里提供在太空港激活隐藏地堡事件的完整攻略，包括天线激活、进入地堡以及了解内部的数据下载控制台。还涵盖对付敌人和导航环境的技巧。",
    "26230950-b410-4bc7-b204-66d918cc9b5b": "本教程提供击败女族长Boss的全面策略，包括推荐装备方案、了解其攻击模式、识别弱点以及高效战斗和搜刮的技巧。",
    "22c0dfff-91c5-46c4-af45-615b2c898565": "这里详细介绍了Arc Raiders中工作台升级和远征进度所需的所有关键物品的位置和制作方法。",
    "e47edb2e-503b-46d5-a09d-0659895b1bea": "\"...技能树给玩家带来了艰难的选择，但很少有技能像安全储物柜突破技能一样神秘且可能回报丰厚\"",
    "40df0f05-5f67-48ae-b5c3-9c270014c261": "这里提供完成\"铺路\"任务的完整攻略，涵盖大坝战场和地下城的所有目标。",
    "9bade7e7-c611-48f3-9671-92c6c285e9bb": "本指南向你展示在斯特拉蒙蒂斯中各种钥匙的使用位置。装配管理员钥匙、医疗储藏室钥匙、档案室钥匙、安全检查站钥匙",
    "ffb90cfd-dc37-450e-827f-f1f603ed4d9a": "本指南识别斯特拉蒙蒂斯地图上最赚钱的搜刮区域和关键生存策略，帮助你在Arc Raiders中积累财富。",
    "5a252ca4-9f64-45b5-8f58-cfd11ab7def7": "以下是如何在ARC Raiders的太空港完成\"腐败恶臭\"任务的方法，涵盖关键位置和找到冲洗终端钥匙并使用它的步骤。",
    "904c1e02-4021-41a7-b372-b07fc0cbb35c": "",
    "a7762921-088c-41f7-87f1-822a0fef1de8": "本教程提供专家策略和理想路线，以在所有周试炼中获得3星评级，重点介绍堡垒、黄蜂、火球和数据下载的最大化得分。",
    "3dee99df-885c-43c1-9d88-fd059897d206": "",
    "74f6022e-c43f-48a8-895e-4dd87a8c9388": "这里解释如何高效完成当前周试炼，以及每个挑战的特定刷分方法，以最大化你的得分。",
    "d43eb4c0-61c4-4b58-ae5f-ca44aef8c668": "",
    "52e0a5df-6965-4e02-9a9b-8222f3611a2a": "",
    "245331a0-83a6-4925-8a6c-37a4d2c1cd2b": "",
}


def translate_html_content(content_html):
    """Translate text within HTML, preserving tags."""
    if not content_html:
        return content_html

    # We'll do simple global replacements for known terms within text
    result = content_html

    # Translate step headings
    for i, zh in [(1, "一"), (2, "二"), (3, "三"), (4, "四"), (5, "五"), (6, "六"), (7, "七")]:
        result = result.replace(f">Step {i}:", f">步骤{zh}:")
        result = result.replace(f">Step {i} -", f">步骤{zh} -")

    result = result.replace(">Overview<", ">概述<")
    result = result.replace(">Overview:", ">概述:")
    result = result.replace(">Objectives<", ">目标<")

    # Map names (longer first to avoid partial replacement)
    sorted_maps = sorted(MAP_NAMES.items(), key=lambda x: -len(x[0]))
    for en, zh in sorted_maps:
        result = result.replace(en, zh)

    # NPC names 
    for en, zh in NPC_NAMES.items():
        result = result.replace(en, zh)

    # Enemy names - be careful with word boundaries
    sorted_enemies = sorted(ENEMY_NAMES.items(), key=lambda x: -len(x[0]))
    for en, zh in sorted_enemies:
        # Replace plurals first
        result = result.replace(en + "s", zh)
        result = result.replace(en + "'s", zh + "的")
        result = result.replace(en, zh)

    # Game terms
    sorted_terms = sorted(GAME_TERMS.items(), key=lambda x: -len(x[0]))
    for en, zh in sorted_terms:
        # Only replace standalone terms, not inside already-replaced text
        result = result.replace(en, zh)

    return result


def translate_objectives(objectives):
    """Translate objective strings."""
    translated = []
    for obj in objectives:
        t = obj
        # Apply map, NPC, enemy name translations
        sorted_maps = sorted(MAP_NAMES.items(), key=lambda x: -len(x[0]))
        for en, zh in sorted_maps:
            t = t.replace(en, zh)
        for en, zh in NPC_NAMES.items():
            t = t.replace(en, zh)
        sorted_enemies = sorted(ENEMY_NAMES.items(), key=lambda x: -len(x[0]))
        for en, zh in sorted_enemies:
            t = t.replace(en + "s", zh)
            t = t.replace(en, zh)

        # Common objective patterns
        t = t.replace("In One Round:", "在单次突袭中:")
        t = t.replace("In One Round", "在单次突袭中")
        t = t.replace("In one round:", "在单次突袭中:")
        t = t.replace("In one round", "在单次突袭中")
        t = t.replace("In One Round -", "在单次突袭中 -")
        t = t.replace("All Objectives in one round", "所有目标在单次突袭中完成")
        t = t.replace("Destroy", "摧毁")
        t = t.replace("Deliver", "交付")
        t = t.replace("Find", "找到")
        t = t.replace("Reach", "到达")
        t = t.replace("Search", "搜索")
        t = t.replace("Locate", "定位")
        t = t.replace("Retrieve", "取回")
        t = t.replace("Repair", "修复")
        t = t.replace("Obtain", "获取")
        t = t.replace("Loot", "搜刮")
        t = t.replace("Ping", "标记")
        t = t.replace("Get", "获取")
        t = t.replace("Deploy into", "部署到")
        t = t.replace("Mark", "标记")
        t = t.replace("mark", "标记")
        t = t.replace("visit", "前往")
        t = t.replace("Visit", "前往")
        t = t.replace("Install", "安装")
        t = t.replace("install", "安装")
        t = t.replace("Enable", "启用")
        t = t.replace("Inspect", "检查")
        t = t.replace("Follow", "跟随")
        t = t.replace("Return", "归还")
        t = t.replace("Sabotage", "破坏")
        t = t.replace("On ", "在")

        translated.append(t)
    return translated


def translate_reward_item(item):
    """Translate a reward item's fields."""
    new_item = dict(item)
    # rarity
    if item.get("rarity") in RARITY_MAP:
        new_item["rarity"] = RARITY_MAP[item["rarity"]]
    # item_type
    if item.get("item_type") in ITEM_TYPE_MAP:
        new_item["item_type"] = ITEM_TYPE_MAP[item["item_type"]]
    # name stays the same (it's a proper item name in-game)
    return new_item


def translate_guide(guide):
    """Translate a single guide entry."""
    g = dict(guide)

    # title
    g["title"] = TITLE_TRANSLATIONS.get(guide["title"], guide["title"])

    # content  
    g["content"] = translate_html_content(guide.get("content", ""))

    # summary
    if guide["id"] in SUMMARY_TRANSLATIONS:
        g["summary"] = SUMMARY_TRANSLATIONS[guide["id"]]
    else:
        g["summary"] = guide.get("summary", "")

    # author
    if guide.get("author") in AUTHOR_MAP:
        g["author"] = AUTHOR_MAP[guide["author"]]

    # type
    if guide.get("type") in TYPE_MAP:
        g["type"] = TYPE_MAP[guide["type"]]

    # objectives
    if guide.get("objectives"):
        g["objectives"] = translate_objectives(guide["objectives"])

    # rewards
    if guide.get("rewards"):
        new_rewards = []
        for reward in guide["rewards"]:
            new_reward = dict(reward)
            if "item" in reward:
                new_reward["item"] = translate_reward_item(reward["item"])
            new_rewards.append(new_reward)
        g["rewards"] = new_rewards

    return g


# Translate all guides
translated_guides = [translate_guide(g) for g in guides]

# Write output
with open("src/data/zh/guides_zh.json", "w", encoding="utf-8") as f:
    json.dump(translated_guides, f, ensure_ascii=False, indent=2)

print(f"Done! Translated {len(translated_guides)} guides to src/data/zh/guides_zh.json")
