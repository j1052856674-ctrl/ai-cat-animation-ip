#!/usr/bin/env python3
"""Round 2 competitor data collection processor.
Filters, annotates, and generates records from raw search results.
"""

import json
import re
import sys
import os
from datetime import datetime, timedelta

# ============================================================
# Configuration
# ============================================================
TODAY = datetime(2026, 6, 15)
HOT_DAYS = 7
TREND_DAYS = 30
CUTOFF_DATE = TODAY - timedelta(days=TREND_DAYS)  # 2026-05-16

LOG_DIR = "E:/side-projects/ai-cat-animation-ip/content/collection-logs"
OUTPUT_DIR = "E:/side-projects/ai-cat-animation-ip/content"
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# Raw Search Results
# ============================================================

RAW_DATA = [
    # === 抖音: AI治愈动画 猫 ===
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":1,"author":"可心养猫记","title":"别去责怪你家的小猫咯，给点包容 给点爱…#猫咪动画 #ai猫剧情 #治愈系动漫猫咪 #宠物猫 #猫咪日常","url":"https://www.douyin.com/video/7642497561103111013","likes":119,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":2,"author":"云咪猫生哲学","title":"云咪vlog——旧货市场历险记 #ai创作浪潮 #ai小猫 #哈基咪 #可爱 #治愈","url":"https://www.douyin.com/video/7649689236060359970","likes":66000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":3,"author":"绿豆团团","title":"第1集  外星小猫的vlog（今天也是怀疑猫生的一天） #哈基米 #可爱 #治愈 #ai创作浪潮计划 #猫meme","url":"https://www.douyin.com/video/7617519649428606260","likes":84000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":4,"author":"Zephyros","title":"《最后的生还猫》 第一集：醒来 #ai短片  #末日废土 #猫咪 #治愈系 #最后一只猫","url":"https://www.douyin.com/video/7648477130090695962","likes":1290,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":5,"author":"鼠咪喵喵屋","title":"me的喵星Vlog -小猫其实一直在守护着我们，献给所有深爱着猫咪的人#ai创作浪潮计划 #可爱猫咪 #治愈 #萌宠出道计划 #猫meme","url":"https://www.douyin.com/video/7647095876640348283","likes":1523,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":6,"author":"挑食猫🐱","title":"「喜欢猫的七只小姑娘🐈🐈‍⬛」 #二次元治愈 #动漫风格 #AI创作浪潮计划  #AI内容创作","url":"https://www.douyin.com/video/7650866025394724534","likes":6823,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":7,"author":"小璐AI","title":"一天拆解一个账号，萌宠做饭动画！ #AIGC #AI教程 #胖橘 #爱宠萌宠 #会做饭的猫","url":"https://www.douyin.com/video/7647485460712820009","likes":16,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":8,"author":"小朱朱的AI剪辑笔记","title":"AI动漫宠物科普带货，全流程拆解 #当我把照片交给ai #ai对话日常 #ai视频制作 #AI教程 #豆包app","url":"https://www.douyin.com/video/7644530294138178378","likes":486,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":9,"author":"Also","title":"《云梦巡行记》 ---炎热的夏天到了香蕉猫编织了一个清凉的梦#我的刀盾#猫meme#香蕉猫 #治愈系风景 #ai动画","url":"https://www.douyin.com/video/7644052132005547270","likes":28000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI治愈动画 猫","rank":10,"author":"Tatoo","title":"《咪决定今天不上班》｜一部关于生活的治愈ai动画 #ai动画 #原创动画 #打工人 #治愈 #猫 @抖音小助手 @DOU+小助手","url":"https://www.douyin.com/video/7648888994280901926","likes":8,"comments":0,"shares":0,"plays":0,"published_at":None},

    # === 抖音: 即梦 猫 ===
    {"platform":"抖音","keyword":"即梦 猫","rank":1,"author":"鸽鸽呆","title":"主人，你太自恋了 这坏猫真是死性不改呀 本视频由#即梦AI 出镜模式制作 #AI分身戏精大赛 #用即梦AI过戏瘾 #邵氏 #猫咪","url":"https://www.douyin.com/video/7643406846133764465","likes":41000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":2,"author":"KiddyLee周全","title":"【猫猫枪传奇】当猫咪成为世上最强武器，会发生什么？ #即梦 seedance2.0制作 #未来导演扶持计划 #AI创作浪潮计划","url":"https://www.douyin.com/video/7618582352473754880","likes":90000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":3,"author":"会飞的宋清澈","title":"罕见的国王球猫 本视频由 #即梦AI  出镜模式制作#AI分身戏精大赛 #用即梦拍脑洞 #AI创作浪潮计划 #后室 今天在 Level11 逛的时候，偶然碰到了这只戴王冠的国王球猫。","url":"https://www.douyin.com/video/7647869487404491978","likes":2890,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":4,"author":"镜辞","title":"我家住进了不得了的东西 #即梦ai  #AI创作浪潮计划  #猫箱跨次元相遇  #短剧  #AI短剧","url":"https://www.douyin.com/video/7647823642369232154","likes":12000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":5,"author":"林森桃","title":"不对，我捡的不是一只猫吗？ #即梦ai成片有点东西 本视频由#即梦ai seedance2.0制作#AI创作浪潮计划","url":"https://www.douyin.com/video/7641518194600398245","likes":80000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":6,"author":"以泪许誓","title":"摇头晃脑舞猫咪ai特效入口，摇头晃脑舞猫咪ai特效制作教程#AI摇头晃脑舞  ai猫咪跳舞一键生成 ai萌宠摇头晃脑 猫ai跳舞一键生成入口","url":"https://www.douyin.com/video/7650318286438028729","likes":27,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":7,"author":"Scum泡沫","title":"摇头晃脑舞猫咪ai特效入口，摇头晃脑舞猫咪ai特效制作教程#AI摇头晃脑舞 ai猫咪跳舞一键生成","url":"https://www.douyin.com/video/7650163988471555560","likes":12,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":8,"author":"无忧（捉妖师）","title":"#即梦AI #臭猫 #小主人","url":"https://www.douyin.com/video/7650637676777701817","likes":8,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":9,"author":"无忧（捉妖师）","title":"#即梦AI #臭猫 #小主人","url":"https://www.douyin.com/video/7650640604824912251","likes":6,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"即梦 猫","rank":10,"author":"代号:渊","title":"原创漫剧《代号：渊》 序章：我最近真的分不清梦境和现实。 #即梦ai #悬疑 #短剧 #猫","url":"https://www.douyin.com/video/7651181290368011563","likes":10,"comments":0,"shares":0,"plays":0,"published_at":None},

    # === 抖音: AI猫咪剧情 ===
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":1,"author":"AI胖橘剧场","title":"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧","url":"https://www.douyin.com/video/7651104311321629937","likes":53,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":2,"author":"二喵爱演戏","title":"#ai创作浪潮计划 #猫咪 #原创ai","url":"https://www.douyin.com/video/7642611030166807290","likes":64000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":3,"author":"AI胖橘剧场","title":"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧","url":"https://www.douyin.com/video/7649238631957518053","likes":482,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":4,"author":"冷眼 看世界","title":"#ai猫剧情 #原创猫咪剧情 #热门短剧推荐","url":"https://www.douyin.com/video/7641485931925344966","likes":296,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":5,"author":"Cat Super Power","title":"满载幸福的他邂逅了曾抛弃他的母亲 满载幸福的他邂逅了曾抛弃他的母亲 #ai萌宠 ##ai猫咪 #ai猫咪剧情 #萌宠出道计划 #剪映","url":"https://www.douyin.com/video/7649578485110814649","likes":944,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":6,"author":"蒙面大虾🍤","title":"#ai #ai原创动漫 #热门","url":"https://www.douyin.com/video/7643433148709213410","likes":5978,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":7,"author":"岁月匆匆小猫","title":"岁月匆匆像一阵风，多少故事留下感动。节俭的橘老太无心之失害死老伴儿，后又差点屠村，提倡节俭，但需适度！#小猫ai视频 #ai猫咪 #ai橘猫 #ai剧情 #真人真事改编","url":"https://www.douyin.com/video/7529501533537537314","likes":33000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":8,"author":"喵小绵剧场（收徒）","title":"这是36计中的哪一计？ #ai猫咪剧情 #ai","url":"https://www.douyin.com/video/7648951272696414693","likes":258,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":9,"author":"喵一喵","title":"完整版来啦#ai猫猫故事#萌宠","url":"https://www.douyin.com/video/7629950037897242213","likes":1471,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"AI猫咪剧情","rank":10,"author":"Cat Super Power","title":"死里逃生的小猫却被猫妈交给了警察 #ai猫咪 #ai猫咪剧情 #ai萌宠 #萌宠出道计划 #汽水音乐","url":"https://www.douyin.com/video/7650680971729655461","likes":1107,"comments":0,"shares":0,"plays":0,"published_at":None},

    # === 抖音: 猫咪小剧场 ===
    {"platform":"抖音","keyword":"猫咪小剧场","rank":1,"author":"@喵喵小剧场🔥","title":"《代销社的橘子糖》 #猫咪剧情 #AI #80后 #猫咪情感剧","url":"https://www.douyin.com/video/7649973173845279985","likes":3648,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":2,"author":"黑喵警长","title":"安检员：误闯天家#猫meme小剧场","url":"https://www.douyin.com/video/7563972458488122682","likes":148000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":3,"author":"萌喵喵小剧场","title":"有时候一句恶毒的话，真的可能毁掉一个家…希望小橘能快点好起来！#橘猫家庭生活 #萌宠出道计划 #橘猫","url":"https://www.douyin.com/video/7644500024399099226","likes":13000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":4,"author":"猫初攻略","title":"趁朕病，要朕命？！ #萌宠出道计划 #后宫猫#古风猫 #猫咪短剧","url":"https://www.douyin.com/video/7536013437660532025","likes":37000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":5,"author":"Mimi小猫剧场","title":"在电梯里拉了个大的 #猫meme #猫meme小剧场 #搞笑 #奇葩","url":"https://www.douyin.com/video/7509111956486294821","likes":16000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":6,"author":"AI胖橘剧场","title":"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧","url":"https://www.douyin.com/video/7651104311321629937","likes":53,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":7,"author":"Caesarcat","title":"《小猫咪也得正确》#卫仕五拼Plus猫粮 #随时随地运动会#配音 #猫猫小剧场 #猫猫情景剧","url":"https://www.douyin.com/video/7398075700537756964","likes":58000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":8,"author":"肉松小蛋糕","title":"吃个饭全是心眼《步步攻略》#抖音小助手#猫meme  #搞笑 #猫meme小剧场 #猫咪","url":"https://www.douyin.com/video/7643329170274486009","likes":243,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":9,"author":"朱果儿","title":"哈基米小剧场 柿子之争#哈基米#流浪猫#搞笑","url":"https://www.douyin.com/video/7648931392067532785","likes":2561,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪小剧场","rank":10,"author":"猫猫小剧场","title":"《半夜老偷邻居外卖》#猫meme小剧场#猫#搞笑#猫meme","url":"https://www.douyin.com/video/7648678879951954278","likes":34,"comments":0,"shares":0,"plays":0,"published_at":None},

    # === 小红书: 猫猫动画 ===
    {"platform":"小红书","keyword":"猫猫动画","rank":1,"author":"我是胖橘喵","title":"啊啊啊❗❗❗❗猫猫变装也太好看了叭❗","url":"https://www.xiaohongshu.com/search_result/695cc8d8000000000903adbb?xsec_token=ABNayV_7RR-mo8ksVvZGqwEVYDibN_9f46LkDsGvpLp6Q=&xsec_source=","likes":"2.8万","comments":0,"shares":0,"plays":0,"published_at":"2026-01-06"},
    {"platform":"小红书","keyword":"猫猫动画","rank":2,"author":"欣想事成","title":"爱分享QQ糖的小喵喵，你喜欢吗？","url":"https://www.xiaohongshu.com/search_result/66d07fdf000000001f03a556?xsec_token=ABW0bXSZeA7xtcri1tqPFQi07A_WTh1TMi9z8Z9iRIYTw=&xsec_source=","likes":"1.2万","comments":0,"shares":0,"plays":0,"published_at":"2024-08-29"},
    {"platform":"小红书","keyword":"猫猫动画","rank":3,"author":"🍊大橘子","title":"🍊胖橘:酿油豆腐","url":"https://www.xiaohongshu.com/search_result/69112d290000000005000b27?xsec_token=ABdOMF-gMvH93lPjNQa7F_Vc7Iepjk6l4MHbyAC29ksYs=&xsec_source=","likes":"5821","comments":0,"shares":0,"plays":0,"published_at":"2025-11-10"},
    {"platform":"小红书","keyword":"猫猫动画","rank":4,"author":"咪有办法","title":"下雨🌧️了怎么办，咪有办法❗","url":"https://www.xiaohongshu.com/search_result/6a2e1f560000000022028e3e?xsec_token=ABWBBBUdJymL6m9c50viSxRn7UcBFu1dfa8ELuzm5tNVg=&xsec_source=","likes":"7","comments":0,"shares":0,"plays":0,"published_at":"2026-06-14"},
    {"platform":"小红书","keyword":"猫猫动画","rank":5,"author":"一坨奶黄包","title":"一天不骚扰小猫就浑身难受 萌死了啊啊啊！！","url":"https://www.xiaohongshu.com/search_result/69538f49000000001e037354?xsec_token=ABWjQpEeKKzX_7s1UgQX6rNRDC8epjbkpVT4HrpB3SsfE=&xsec_source=","likes":"2.4万","comments":0,"shares":0,"plays":0,"published_at":"2025-12-30"},
    {"platform":"小红书","keyword":"猫猫动画","rank":6,"author":"🍊大橘子","title":"🍊胖橘:豉油鸡","url":"https://www.xiaohongshu.com/search_result/69bff4ef000000002301f42c?xsec_token=ABNT2HqQY5DgQ-fhpBIa6yBjtqFsxjAau-tmkiQrj99Lc=&xsec_source=","likes":"2181","comments":0,"shares":0,"plays":0,"published_at":"2026-03-22"},
    {"platform":"小红书","keyword":"猫猫动画","rank":7,"author":"Little Fairy🧚","title":"🐱猫咪的神奇彩球","url":"https://www.xiaohongshu.com/search_result/692eb3ef0000000019025703?xsec_token=ABo6T9sWc9cnB_xaA9UwLSic4LWsjlF0nAZ-nDtDixivc=&xsec_source=","likes":"9460","comments":0,"shares":0,"plays":0,"published_at":"2025-12-02"},
    {"platform":"小红书","keyword":"猫猫动画","rank":8,"author":"小满meme","title":"第10集｜《安静同桌》1-8","url":"https://www.xiaohongshu.com/search_result/69da0f440000000021012ed2?xsec_token=AB2sx50EGeQOy9h7ig32jAARcl3o7tMfvmguZsndgbUqU=&xsec_source=","likes":"1万","comments":0,"shares":0,"plays":0,"published_at":"2026-04-11"},
    {"platform":"小红书","keyword":"猫猫动画","rank":9,"author":"胖橘不吃鱼","title":"每天都要早起上班，动不动就加班","url":"https://www.xiaohongshu.com/search_result/6823369e0000000012007c3d?xsec_token=ABfGplBxmht38UrXhC3iTix0rMxVd55ZEfG9sWpsfFTMo=&xsec_source=","likes":"1万","comments":0,"shares":0,"plays":0,"published_at":"2025-05-13"},
    {"platform":"小红书","keyword":"猫猫动画","rank":10,"author":"我是胖橘喵","title":"啊啊啊❗❗❗❗这猫猫变装也太好看了叭❗","url":"https://www.xiaohongshu.com/search_result/68f0a661000000000700fbbd?xsec_token=ABxqIAQbmSoMjidYmjo9grUwbk7qeGUnUGVwhnyw8PAOI=&xsec_source=","likes":"2333","comments":0,"shares":0,"plays":0,"published_at":"2025-10-16"},

    # === 小红书: 治愈猫咪 ===
    {"platform":"小红书","keyword":"治愈猫咪","rank":1,"author":"蛀米虫","title":"薅羊毛小游戏之《治愈猫咪》","url":"https://www.xiaohongshu.com/search_result/6a26cce8000000001603c5ae?xsec_token=AB4Ye-4mRGkJBvzwCsR_rD542VF9idHYVTlnsv5d8JGLI=&xsec_source=","likes":"2","comments":0,"shares":0,"plays":0,"published_at":"2026-06-08"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":2,"author":"可问春风","title":"测评赚钱小游戏之"治愈猫咪"","url":"https://www.xiaohongshu.com/search_result/69c208d10000000023012046?xsec_token=ABbD8rNWpy6i1boI7g51vd3p-r2zolW_2NLRDf7yhPBYw=&xsec_source=","likes":"62","comments":0,"shares":0,"plays":0,"published_at":"2026-03-24"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":3,"author":"不如明天见.","title":"避雷治愈猫咪","url":"https://www.xiaohongshu.com/search_result/695793a5000000001e0037ba?xsec_token=ABhUlO4Yk1R9DG9QyIRReLCR-1fzxLlPX4k5uwJfZlwnM=&xsec_source=","likes":"54","comments":0,"shares":0,"plays":0,"published_at":"2026-01-02"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":4,"author":"做个阳光般明媚的女子","title":"赚点零花钱（第一期）","url":"https://www.xiaohongshu.com/search_result/6912e494000000000301bcde?xsec_token=ABjgOQejK91guDGwLbzl_MNPc4K6-OhFBxy9XeZLgbkbk=&xsec_source=","likes":"652","comments":0,"shares":0,"plays":0,"published_at":"2025-11-11"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":5,"author":"方顾","title":"避雷帖","url":"https://www.xiaohongshu.com/search_result/690569f3000000000501316b?xsec_token=ABI-th1ynXvqLYlbsc_aBKFjBBUdrtylDuBl5jS0YrNNc=&xsec_source=","likes":"7","comments":0,"shares":0,"plays":0,"published_at":"2025-11-01"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":6,"author":"七渡避坑","title":"这种红包游戏就是广告榨干机","url":"https://www.xiaohongshu.com/search_result/699b045e000000000b01214c?xsec_token=ABFySnIpdnhsIG7k2hsUbUla5PPjebn4Psq4Gi_yEQdxg=&xsec_source=","likes":"13","comments":0,"shares":0,"plays":0,"published_at":"2026-02-22"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":7,"author":"小红薯65B34F1C","title":"【避雷】合成猫咪等什么治愈系猫咪app赚钱","url":"https://www.xiaohongshu.com/search_result/6912ae03000000000402b853?xsec_token=ABjgOQejK91guDGwLbzl_MNMDRMJCZTMwm4kaOAXGAzh4=&xsec_source=","likes":"69","comments":0,"shares":0,"plays":0,"published_at":"2025-11-11"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":8,"author":"小红薯69D4A115","title":"治愈猫咪真的能赚钱嘛？","url":"https://www.xiaohongshu.com/search_result/69ea00480000000020007002?xsec_token=AB4B_6rcV1_Xc1B1IsNTVMLCW3r-1E8Fl5zhCVJp3XFJY=&xsec_source=","likes":"2","comments":0,"shares":0,"plays":0,"published_at":"2026-04-23"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":9,"author":"铲屎官打工记","title":"此刻，全家人围观并高赞四只脚并拢的小猫","url":"https://www.xiaohongshu.com/search_result/6a0438b00000000007024075?xsec_token=ABcvgn13bMDXln9AY2Tnh7n99KZYb7MOac_yTVgzpm9DU=&xsec_source=","likes":"1万","comments":0,"shares":0,"plays":0,"published_at":"2026-05-13"},
    {"platform":"小红书","keyword":"治愈猫咪","rank":10,"author":"雅雅","title":"奶猫谁不爱！奶猫治愈谁！","url":"https://www.xiaohongshu.com/search_result/67cfae42000000002802a6d9?xsec_token=ABrkxcAl6Fp-2FK4IoxWBhbSIAB0w3e7OTW95dNllIsH4=&xsec_source=","likes":"60","comments":0,"shares":0,"plays":0,"published_at":"2025-03-11"},

    # === 抖音: 治愈猫咪 ===
    {"platform":"抖音","keyword":"治愈猫咪","rank":1,"author":"小橘猫.花儿","title":"去姥姥家 #橘猫 #小猫可以治愈一切 #萌宠出道计划 #Ai","url":"https://www.douyin.com/video/7643771418886996659","likes":42000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":2,"author":"AAA萌宠事务所","title":"盘点猫咪的治愈瞬间：这个世界不能没有猫猫侠#萌宠出道计划 #被猫猫治愈的瞬间 #猫猫真的好像个小宝宝 #谁能拒绝傻憨憨的小猫咪","url":"https://www.douyin.com/video/7315068943125794058","likes":191000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":3,"author":"萌宠日常🐾","title":"暖心的小猫咪，"世界破破烂烂，猫咪缝缝补补"  #猫咪的可爱瞬间   #可爱猫咪  #小猫是平淡生活的解药 #治愈系","url":"https://www.douyin.com/video/7457120954427231545","likes":1104000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":4,"author":"喵喵@十一","title":"或许它们真的把自己当人了，成精了#小猫治愈世界 #萌宠出道计划 #猫咪 #有猫的评论区都在被治愈 #小猫咪治愈视频","url":"https://www.douyin.com/video/7401901645929499954","likes":73000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":5,"author":"爆笑德菌","title":"猫咪治愈瞬间，放下所有的负面情绪，让心灵得到真正的放松和舒缓#治愈猫咪 #宠物猫 #猫咪vlog","url":"https://www.douyin.com/video/7337964684324146473","likes":123,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":6,"author":"LuLu和她的小猫小狗","title":"真的就像亲手养大的小孩 #小猫治愈了世界 #万物可爱计划","url":"https://www.douyin.com/video/7507582869352729875","likes":2795000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":7,"author":"搞笑小新","title":"盘点猫咪的治愈瞬间，让你放下一切负面情绪#谁能拒绝傻憨憨的小猫咪#我和我的猫#铲屎官的乐趣","url":"https://www.douyin.com/video/7578889635016980928","likes":6257,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":8,"author":"阿西娱乐","title":"可爱#猫咪 #治愈猫咪 #小猫治愈世界 #这小猫谁养谁不迷糊啊 #记录猫咪日常","url":"https://www.douyin.com/video/7451064088504962342","likes":1334,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":9,"author":"猫咖","title":""小猫可以治愈一切 " "超治愈的小萌猫 #被猫咪治愈的瞬间","url":"https://www.douyin.com/video/7393152687665073445","likes":28000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"治愈猫咪","rank":10,"author":"AI胖橘剧场","title":"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧","url":"https://www.douyin.com/video/7651104311321629937","likes":53,"comments":0,"shares":0,"plays":0,"published_at":None},

    # === 小红书: 猫咪日常 ===
    {"platform":"小红书","keyword":"猫咪日常","rank":1,"author":"欧包Doughdough","title":"她好像知道自己很可爱","url":"https://www.xiaohongshu.com/search_result/685f38ce000000001c0304bc?xsec_token=ABf5n2YMgkyyroE8pHHv2WTggm9IxKel6veNIAhpBmHX8=&xsec_source=","likes":"1.2万","comments":0,"shares":0,"plays":0,"published_at":"2025-06-28"},
    {"platform":"小红书","keyword":"猫咪日常","rank":2,"author":"Milky酱","title":"世界上最最最可爱的宝宝！！","url":"https://www.xiaohongshu.com/search_result/6789a1d1000000001c00dd10?xsec_token=ABNFB9gIlqISZ19YVlWdkToZJzMBIJ8f8xAMJ42-FJ5RQ=&xsec_source=","likes":"2.3万","comments":0,"shares":0,"plays":0,"published_at":"2025-01-17"},
    {"platform":"小红书","keyword":"猫咪日常","rank":3,"author":"小芝麻小黄豆","title":"此猫手段了得","url":"https://www.xiaohongshu.com/search_result/69e752590000000023007216?xsec_token=ABZnkOFgA_wwjERstdDIfGK2izuomUDSW0-gmopHWv8xE=&xsec_source=","likes":"3.2万","comments":0,"shares":0,"plays":0,"published_at":"2026-04-21"},
    {"platform":"小红书","keyword":"猫咪日常","rank":4,"author":"nini粘fufu","title":"吸吸吸！动态小猫（ฅˊᗜˋฅ）","url":"https://www.xiaohongshu.com/search_result/68e769ce000000000301a441?xsec_token=ABHY3B9-7OrvGEliGkZ5tD-Ypab57ie8ZEVOdEa6AGoag=&xsec_source=","likes":"1.9万","comments":0,"shares":0,"plays":0,"published_at":"2025-10-09"},
    {"platform":"小红书","keyword":"猫咪日常","rank":5,"author":"nini粘fufu","title":"吸！动态咪(｡•̀ᴗ•́)و ̑̑","url":"https://www.xiaohongshu.com/search_result/6a216add000000003701cdec?xsec_token=AB5UZjCqQPjnegB8AtFVTf-9IspZR3RiJ-4aV0fMH-DoA=&xsec_source=","likes":"2021","comments":0,"shares":0,"plays":0,"published_at":"2026-06-04"},
    {"platform":"小红书","keyword":"猫咪日常","rank":6,"author":"蛋堡小漂漂","title":"3月龄小猫咪的晚饭吃了啥~","url":"https://www.xiaohongshu.com/search_result/6a2d3af8000000003502b5ac?xsec_token=ABnlic0_LS1_PuS4QsUAJKcnGoyZFshC0B6gkU-82nWdA=&xsec_source=","likes":"53","comments":0,"shares":0,"plays":0,"published_at":"2026-06-13"},
    {"platform":"小红书","keyword":"猫咪日常","rank":7,"author":"是小烨.","title":"谈薄肌得小咪","url":"https://www.xiaohongshu.com/search_result/6a0a76b80000000006034c41?xsec_token=ABk9LcKdyyyryGV3yIg3ixmY_sNs5s1B0QX4F-AzCaKoA=&xsec_source=","likes":"1.8万","comments":0,"shares":0,"plays":0,"published_at":"2026-05-18"},
    {"platform":"小红书","keyword":"猫咪日常","rank":8,"author":"福宝日记","title":"我家猫好看吗？","url":"https://www.xiaohongshu.com/search_result/698d5edb000000000e03f01c?xsec_token=AByVG2O0IFDOFp8fsJhP28RAQozJNuVKxaC9YzaVt519o=&xsec_source=","likes":"4.4万","comments":0,"shares":0,"plays":0,"published_at":"2026-02-12"},
    {"platform":"小红书","keyword":"猫咪日常","rank":9,"author":"million酱","title":"世界上真的不能没有可爱小猫呀","url":"https://www.xiaohongshu.com/search_result/6a224fe0000000002202dfe0?xsec_token=ABP4KSvAsdCRQr0q9pOZExEt1zmhgQ6PKulh6WbYOUIp0=&xsec_source=","likes":"4289","comments":0,"shares":0,"plays":0,"published_at":"2026-06-05"},
    {"platform":"小红书","keyword":"猫咪日常","rank":10,"author":"多多是只喵","title":"谁家小猫这样睡觉呀😻","url":"https://www.xiaohongshu.com/search_result/6874fc93000000001301046b?xsec_token=AB5GE5WXSV-cyQXXmO8TNbQlDSs6rVPF-cs6vCmC5pIro=&xsec_source=","likes":"7852","comments":0,"shares":0,"plays":0,"published_at":"2025-07-14"},

    # === 抖音: 猫咪日常 ===
    {"platform":"抖音","keyword":"猫咪日常","rank":1,"author":"乌恩的PP66","title":"又是平平无奇的一天 #橘猫 #猫咪日常","url":"https://www.douyin.com/video/7650433497245521649","likes":7723,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":2,"author":"蕾蕾leilalei","title":"来看看下雨天小福又在作什么妖🌧️ #记录猫咪日常 #萌宠出道计划 #布偶猫","url":"https://www.douyin.com/video/7246703780102737167","likes":354000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":3,"author":"宗介不是犟种","title":"八猫剪指甲Vlog 视频有点长#犟种猫 #猫咪日常 #我和我的猫 #猫咪剪指甲","url":"https://www.douyin.com/video/7649381537519111465","likes":471,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":4,"author":"哆咪和猫","title":"拿捏～ #猫咪吃什么 #多宠家庭 #新手养猫 #vlog日常 #萌宠出道计划","url":"https://www.douyin.com/video/7650433332466945315","likes":161,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":5,"author":"元宝超爱吃","title":"配餐时有个小可爱总来骚扰 应该怎么办？#沉浸式猫咪配餐 #创作者中心 #创作灵感#沉浸式猫咪吃饭 #猫咪配餐vlog","url":"https://www.douyin.com/video/7651179044880759547","likes":25,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":6,"author":"土豆六兄妹","title":"猫妈妈区别对待，条条非常不满自己总被过肩摔 #橘猫 #萌宠出道计划 #萌宠日常记录 #抖音二创激励计划 #小猫咪能有什么坏心眼","url":"https://www.douyin.com/video/7650168423875850161","likes":223,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":7,"author":"米粒和小金子","title":"喵星人的逆天行为VS喵星人的倒霉日常#萌宠出道计划 #萌猫趣事 #记录猫咪日常 #抖音萌宠 #傻猫的日常","url":"https://www.douyin.com/video/7461445958052744507","likes":317,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":8,"author":"小咪爱谁谁","title":"《好多喵夜宵》 #记录猫咪日常","url":"https://www.douyin.com/video/7548097810509647144","likes":41000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":9,"author":"安生的爸爸","title":"五只猫凑不出一个脑子 我家猫的智商给我搞破防了#记录猫咪日常 #傻猫的日常 #猫咪#万物可爱计划 #宅家治愈记","url":"https://www.douyin.com/video/7434830645760724263","likes":204000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"猫咪日常","rank":10,"author":"泡泡不是咪🫧","title":"沉浸式猫咪配餐🥣| 新人配餐博主第一天 召唤原始股东~#猫咪配餐 #沉浸式配餐 #沉浸式猫咪配餐 #猫咪沉浸式吃饭 #111","url":"https://www.douyin.com/video/7650483435043097910","likes":87,"comments":0,"shares":0,"plays":0,"published_at":None},

    # === 小红书: 打工猫 ===
    {"platform":"小红书","keyword":"打工猫","rank":1,"author":"大馋萱子🍔","title":"咪的天 上班打工小猫","url":"https://www.xiaohongshu.com/search_result/69ca70a2000000001a037fec?xsec_token=ABjKBHZLL6hUOwiKp0OOsYF8TzFMbKgV3UUYUTX2karwI=&xsec_source=","likes":"562","comments":0,"shares":0,"plays":0,"published_at":"2026-03-30"},
    {"platform":"小红书","keyword":"打工猫","rank":2,"author":"清隅","title":"罗浮山偶遇"打工猫"，支持一下！","url":"https://www.xiaohongshu.com/search_result/69b54087000000001e00e37f?xsec_token=ABl_t32mblQ57OEEuXLYguxbGPuHglFUh68UCFYChnD18=&xsec_source=","likes":"5866","comments":0,"shares":0,"plays":0,"published_at":"2026-03-14"},
    {"platform":"小红书","keyword":"打工猫","rank":3,"author":"支支籽zihi","title":"猫猫打工日记","url":"https://www.xiaohongshu.com/search_result/68cbb33d000000001301bc16?xsec_token=ABLv09U7uJJQDq6c1DnCBlSDYP4lw-vvZS5usFYjH1tEE=&xsec_source=","likes":"1481","comments":0,"shares":0,"plays":0,"published_at":"2025-09-18"},
    {"platform":"小红书","keyword":"打工猫","rank":4,"author":"小锦儿(取图看置顶)","title":"打工人的精神状态～🐱","url":"https://www.xiaohongshu.com/search_result/69635137000000001a034115?xsec_token=ABBbTN9ASR_X69_BEqhJAmXk2RauP3VH-w8CkAl886d60=&xsec_source=","likes":"138","comments":0,"shares":0,"plays":0,"published_at":"2026-01-11"},
    {"platform":"小红书","keyword":"打工猫","rank":5,"author":"猫了么","title":"在公司，严肃点","url":"https://www.xiaohongshu.com/search_result/6a0aed51000000003700cec1?xsec_token=ABk9LcKdyyyryGV3yIg3ixmSMqahM7-2TnevIc7-2yuhY=&xsec_source=","likes":"1121","comments":0,"shares":0,"plays":0,"published_at":"2026-05-18"},
    {"platform":"小红书","keyword":"打工猫","rank":6,"author":"猫了么","title":"不想起床 不想上班","url":"https://www.xiaohongshu.com/search_result/6775f934000000000b017b37?xsec_token=AB4v0FkB6C6Fbe3rQZxeDEbYg7f1YwrdF3xwtfwXdzQK4=&xsec_source=","likes":"9198","comments":0,"shares":0,"plays":0,"published_at":"2025-01-02"},
    {"platform":"小红书","keyword":"打工猫","rank":7,"author":"猫了么","title":"右滑叫醒小猫","url":"https://www.xiaohongshu.com/search_result/68c92e350000000013028a62?xsec_token=ABq8xzYARtnKqT04DP2rkeed6ccm1CTgYkKF2wtQc1LRs=&xsec_source=","likes":"1261","comments":0,"shares":0,"plays":0,"published_at":"2025-09-16"},
    {"platform":"小红书","keyword":"打工猫","rank":8,"author":"坡坡popo","title":"🐱:我真的需要这份工作吗？","url":"https://www.xiaohongshu.com/search_result/69e7185e000000001f00243d?xsec_token=ABZnkOFgA_wwjERstdDIfGK9MgmbRASjzNx3AAkZoYTYo=&xsec_source=","likes":"2828","comments":0,"shares":0,"plays":0,"published_at":"2026-04-21"},
    {"platform":"小红书","keyword":"打工猫","rank":9,"author":"哥叫鱼烧你记住","title":"我的职场生活坏端端地好起来了","url":"https://www.xiaohongshu.com/search_result/6a01561f0000000007022521?xsec_token=ABcz3bzskJ-NQJ0jh-QiyqgIeUI4zGzVh4b2eSOyoxR60=&xsec_source=","likes":"1.1万","comments":0,"shares":0,"plays":0,"published_at":"2026-05-11"},
    {"platform":"小红书","keyword":"打工猫","rank":10,"author":"朗仕宠物","title":"猫咪打工头像","url":"https://www.xiaohongshu.com/search_result/66b5bdf6000000001e0181a2?xsec_token=ABGL6vmFeYZe1PSkOsods92HmaShCgPkS3EEmgQ0e5by8=&xsec_source=","likes":"70","comments":0,"shares":0,"plays":0,"published_at":"2024-08-09"},

    # === 抖音: 打工猫 ===
    {"platform":"抖音","keyword":"打工猫","rank":1,"author":"蓝十六Lenki","title":"香蕉猫的打工vlog，咪坐上了耄耋联名地铁！ #哈基米 #上班人的精神状态 #比比拉布 #可爱 #ai创作浪潮计划","url":"https://www.douyin.com/video/7621675062936333733","likes":1998,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":2,"author":"小宁是只猫","title":"当你入职了神仙公司… #打工猫的职场生活 #猫咪拟人化剧情 #宠物猫剧情 #ai猫剧情","url":"https://www.douyin.com/video/7645923459767968255","likes":10000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":3,"author":"错错不犯错","title":"【番外篇】这该死的BGM！！不要再响了！！ #打工猫的职场生活 #办公室爆炸 #职场喵星人 #猫咪职场生存指南 #末日生存","url":"https://www.douyin.com/video/7646752788747519673","likes":3123,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":4,"author":"呦呦切克闹","title":"#工地猫工 #喵星人打工记 #知恩图报 #懂得人自然懂","url":"https://www.douyin.com/video/7642709215488799475","likes":151,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":5,"author":"小财是只喵","title":"打工喵在公司认真工作生存教程 #猫咪#萌宠出道计划 #可爱#搞笑 #打工人","url":"https://www.douyin.com/video/7648153017107279353","likes":280,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":6,"author":"打工猫多多","title":"什么！小猫也能打工了？？👀 #猫咪  #打工猫 #哈基米 #治愈 #美短起司","url":"https://www.douyin.com/video/7588462675752002554","likes":17000,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":7,"author":"错错不犯错","title":"人 来看咪兼职一天能赚多少💰填饱肚子～ #打工猫的职场生活 #喵星人打工记 #猫咪打工日常 #猫咪职场生存指南 #猫咪的职场生存法则","url":"https://www.douyin.com/video/7645262435797445989","likes":126,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":8,"author":"洛洛喵","title":"患难见真情！#工地猫工 #胖猫打工记 #胖橘猫工地搬砖","url":"https://www.douyin.com/video/7646027331798271827","likes":1076,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":9,"author":"胖橘喵喵","title":"#工地猫工 #打工猫的职场生活 #喵星人奋斗史","url":"https://www.douyin.com/video/7641781377414849444","likes":174,"comments":0,"shares":0,"plays":0,"published_at":None},
    {"platform":"抖音","keyword":"打工猫","rank":10,"author":"招财猫Lucky🐱","title":"打工猫的周一日报 请查收qiu～ #谁能拒绝傻憨憨的小猫咪 #记录猫咪日常 #可爱到爆炸💥 #抖in萌宠计划 #萌宠出道计划","url":"https://www.douyin.com/video/7210003553157418252","likes":1083,"comments":0,"shares":0,"plays":0,"published_at":None},
]

# ============================================================
# Helper Functions
# ============================================================

def parse_likes(val):
    """Parse likes value from string or number."""
    if val is None or val == "":
        return 0
    if isinstance(val, (int, float)):
        return int(val)
    s = str(val).strip()
    if s.endswith("万"):
        try:
            return int(float(s[:-1]) * 10000)
        except:
            return 0
    try:
        return int(s)
    except:
        return 0

def classify_time_window(published_at):
    """Classify into hot/trend/discard/unverified."""
    if published_at is None:
        return "待核验", "OpenCLI-缺发布时间"
    try:
        dt = datetime.strptime(published_at, "%Y-%m-%d")
    except:
        return "待核验", "OpenCLI-缺发布时间"

    if dt > TODAY:
        return "待核验", "OpenCLI"  # future date, treat as unverified
    days_ago = (TODAY - dt).days
    if days_ago <= HOT_DAYS:
        return "热点", "OpenCLI"
    elif days_ago <= TREND_DAYS:
        return "趋势", "OpenCLI"
    else:
        return "丢弃", "OpenCLI"  # >30 days - discard

def truncate(text, max_chars=60):
    """Truncate text to max_chars."""
    if text is None:
        return ""
    text = str(text)
    if len(text) <= max_chars:
        return text
    return text[:max_chars]

def infer_content_form(title, keyword):
    """Infer content form from tags in title/desc."""
    t = title.lower() if title else ""
    if any(x in t for x in ["#ai动画", "#ai短剧", "#ai漫剧", "#ai短片", "#动画"]):
        return "动画"
    if any(x in t for x in ["#ai剧情", "#ai猫咪", "#ai猫剧情", "#猫咪剧情", "#ai原创动漫"]):
        return "动画"
    if any(x in t for x in ["#aigc", "#ai创作", "#ai制作", "#ai视频", "#ai内容"]):
        return "动画"
    if any(x in t for x in ["#vlog", "#猫咪vlog"]):
        return "动画"
    if any(x in t for x in ["#猫meme", "#猫meme小剧场"]):
        return "混剪"
    if any(x in t for x in ["#ai图文", "#图文"]):
        return "图文"
    if any(x in t for x in ["#实拍", "#真猫", "#宠物"]):
        return "实拍"
    # For douyin "治愈猫咪" and "猫咪日常" results without AI tags → likely 实拍
    if any(x in t for x in ["#记录猫咪日常", "#萌宠出道计划", "#猫咪日常", "#铲屎官"]):
        return "实拍"
    return "无法判断"

def infer_narrative(title, keyword):
    """Infer narrative structure from tags."""
    t = title.lower() if title else ""
    if any(x in t for x in ["#猫meme", "#猫meme小剧场"]):
        return "猫Meme"
    if any(x in t for x in ["#ai短剧", "#ai漫剧", "#短剧", "#ai剧情", "#猫咪剧情", "#猫咪短剧"]):
        return "AI漫剧"
    if any(x in t for x in ["#vlog", "#猫咪vlog"]):
        return "猫vlog"
    if any(x in t for x in ["#搞笑", "#搞笑片段"]):
        return "搞笑片段"
    if any(x in t for x in ["#情感", "#情感短片", "#治愈"]):
        return "情感短片"
    if any(x in t for x in ["#教程", "#ai教程"]):
        return "教程"
    return "无法判断"

def infer_emotion(title, keyword):
    """Infer emotion tone from tags."""
    t = title if title else ""
    if any(x in t for x in ["#治愈", "#治愈系"]):
        return "治愈"
    if any(x in t for x in ["#搞笑", "#奇葩"]):
        return "搞笑"
    if any(x in t for x in ["#可爱", "#萌", "#萌宠"]):
        return "萌"
    if any(x in t for x in ["#温暖", "#暖心"]):
        return "温暖"
    if any(x in t for x in ["#打工", "#打工人", "#上班", "#社畜", "#职场"]):
        return "社畜共鸣"
    return "无法判断"

def infer_visual_style(title, keyword):
    """Infer visual style / AI tool from tags."""
    t = title if title else ""
    if any(x in t for x in ["#可灵ai", "#可灵"]):
        return "可灵AI"
    if any(x in t for x in ["#即梦ai", "#即梦"]):
        return "即梦AI"
    if any(x in t for x in ["#midjourney", "#mj"]):
        return "Midjourney"
    if any(x in t for x in ["#ai动画", "#ai制作", "#ai创作", "#ai视频", "#aigc", "#ai内容"]):
        return "其他"
    return "待核验"

def infer_character(title, author, keyword):
    """Infer character type from title + author name."""
    t = (title or "") + " " + (author or "")
    if any(x in t for x in ["橘猫", "胖橘", "橘"]):
        return "固定橘猫"
    if any(x in t for x in ["固定", "系列", "主角"]):
        return "系列化角色群"
    # Check if author suggests a character-focused account
    if any(x in (author or "").lower() for x in ["猫", "喵", "咪", "meme"]):
        return "待核验"  # might have character, needs human check
    return "待核验"

def score_interaction(likes):
    """Score interaction strength 1-5."""
    l = parse_likes(likes)
    if l >= 100000: return 5
    if l >= 10000: return 4
    if l >= 1000: return 3
    if l >= 100: return 2
    return 1

def score_ip_transferability(record):
    """Score how transferable the IP concept is to our original cat character."""
    score = 3  # default neutral
    t = (record.get("title","") + " " + record.get("keyword","")).lower()

    # AI-generated content is more transferable
    if record.get("content_form") == "动画":
        score += 1
    if record.get("visual_style_tool") in ["可灵AI", "即梦AI", "其他"]:
        score += 1
    # Memes are harder to transfer without the original footage
    if record.get("narrative_type") == "猫Meme":
        score -= 1
    # Real cat content is low transferability
    if record.get("content_form") == "实拍":
        score -= 2

    return max(1, min(5, score))

def score_production_feasibility(record):
    """Score how easily AI tools can replicate the content style."""
    score = 3  # default
    t = (record.get("title","") + " " + record.get("keyword","")).lower()

    # AI tools make animation very feasible
    if record.get("visual_style_tool") in ["可灵AI", "即梦AI", "其他"]:
        score += 2
    if record.get("content_form") == "动画":
        score += 1
    # Real filming is hard to replicate
    if record.get("content_form") == "实拍":
        score -= 2

    return max(1, min(5, score))

def is_relevant(record):
    """Filter out irrelevant content (pure pet supplies, hospitals, games, etc.)"""
    t = (record.get("title","") + " " + record.get("keyword","")).lower()
    author = (record.get("author","") or "").lower()

    # Game/ad related
    if any(x in t for x in ["薅羊毛", "赚钱", "红包", "广告", "赚钱小游戏", "测评赚钱"]):
        return False
    if any(x in t for x in ["避雷", "避坑"]):
        return False
    # Pure tutorial (not about cat IP)
    if "教程" in t and not any(x in t for x in ["猫", "喵", "ai"]):
        return False
    # Pure pet supplies / hospital
    if any(x in author for x in ["宠物医院", "宠物店", "朗仕宠物"]):
        # Check if it's about cat IP or pure supplies
        if any(x in t for x in ["打工头像"]):
            return False

    return True

# ============================================================
# Processing Pipeline
# ============================================================

def process():
    print("=" * 60)
    print(f"Round 2 Collection Processing - {TODAY.strftime('%Y-%m-%d')}")
    print("=" * 60)

    raw = RAW_DATA
    total_raw = len(raw)
    print(f"\n[Step 1] Total raw results: {total_raw}")

    # --- Filter 1: Time window ---
    time_filtered = []
    time_discarded = 0
    for r in raw:
        tw, confidence = classify_time_window(r.get("published_at"))
        if tw == "丢弃":
            time_discarded += 1
        else:
            r["time_window"] = tw
            r["data_confidence"] = confidence
            time_filtered.append(r)

    print(f"[Step 2] Time filter: kept {len(time_filtered)}, discarded {time_discarded} (>30 days)")

    # --- Filter 2: Relevance ---
    relevant = []
    irrelevant_discarded = 0
    for r in time_filtered:
        if is_relevant(r):
            relevant.append(r)
        else:
            irrelevant_discarded += 1

    print(f"[Step 3] Relevance filter: kept {len(relevant)}, discarded {irrelevant_discarded}")

    # --- Filter 3: Dedup by platform + url ---
    seen_urls = set()
    deduped = []
    dedup_discarded = 0
    for r in relevant:
        key = r["platform"] + "|" + r["url"]
        if key in seen_urls:
            dedup_discarded += 1
        else:
            seen_urls.add(key)
            deduped.append(r)

    print(f"[Step 4] Dedup (platform+url): kept {len(deduped)}, discarded {dedup_discarded}")

    # --- Filter 4: Same account max 3 per keyword ---
    account_keyword_count = {}
    final = []
    account_discarded = 0
    for r in deduped:
        ak = r["keyword"] + "|" + r["platform"] + "|" + r["author"]
        count = account_keyword_count.get(ak, 0)
        if count >= 3:
            account_discarded += 1
        else:
            account_keyword_count[ak] = count + 1
            final.append(r)

    print(f"[Step 5] Same-account limit (3/keyword): kept {len(final)}, discarded {account_discarded}")

    # --- Annotate ---
    print(f"\n[Step 6] Annotating {len(final)} records...")
    records = []
    for idx, r in enumerate(final, 1):
        sample_id = f"CR-20260615-{idx:03d}"
        title_trunc = truncate(r.get("title", ""), 60)

        cf = infer_content_form(r.get("title", ""), r.get("keyword", ""))
        nt = infer_narrative(r.get("title", ""), r.get("keyword", ""))
        et = infer_emotion(r.get("title", ""), r.get("keyword", ""))
        vt = infer_visual_style(r.get("title", ""), r.get("keyword", ""))
        ct = infer_character(r.get("title", ""), r.get("author", ""), r.get("keyword", ""))

        record = {
            "样本ID": sample_id,
            "平台": r["platform"],
            "搜索关键词": r["keyword"],
            "标题": title_trunc,
            "完整链接": r["url"],
            "作者": r.get("author", "未知"),
            "点赞数": parse_likes(r.get("likes", 0)),
            "收藏数": parse_likes(r.get("collects", r.get("comments", 0))),
            "发布时间": r.get("published_at") or "",
            "时间窗口": r.get("time_window", "待核验"),
            "cover_url": r.get("image_url", ""),
            "内容形式": cf,
            "叙事结构": nt,
            "情绪调性": et,
            "视觉风格(工具)": vt,
            "角色类型": ct,
            "数据可信度": r.get("data_confidence", "OpenCLI"),
        }

        # Scores
        record["互动强度"] = score_interaction(r.get("likes", 0))
        record["IP可迁移性"] = score_ip_transferability({
            "title": r.get("title",""),
            "keyword": r.get("keyword",""),
            "content_form": cf,
            "visual_style_tool": vt,
            "narrative_type": nt,
        })
        record["制作可行性"] = score_production_feasibility({
            "title": r.get("title",""),
            "content_form": cf,
            "visual_style_tool": vt,
        })

        # Human verify fields (all 待核验)
        record["节奏类型"] = "待核验"
        record["钩子策略"] = "待核验"
        record["视觉风格确认"] = "待核验"
        record["角色一致性"] = "待核验"
        record["互动风格"] = "待核验"
        record["对标判定"] = "待核验"

        records.append(record)

    print(f"[Step 6] Generated {len(records)} annotated records")

    # --- Write JSON output ---
    output_path = os.path.join(OUTPUT_DIR, "round2-samples.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"\n[Output] Records written to: {output_path}")

    # --- Write collection log ---
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_path = os.path.join(LOG_DIR, f"{timestamp}.jsonl")

    # Per-keyword statistics
    keyword_stats = {}
    for r in raw:
        kp = f"{r['keyword']}|{r['platform']}"
        if kp not in keyword_stats:
            keyword_stats[kp] = {"raw": 0, "final": 0}
        keyword_stats[kp]["raw"] += 1

    for r in final:
        kp = f"{r['keyword']}|{r['platform']}"
        if kp not in keyword_stats:
            keyword_stats[kp] = {"raw": 0, "final": 0}
        keyword_stats[kp]["final"] += 1

    with open(log_path, "w", encoding="utf-8") as f:
        for kp, stats in keyword_stats.items():
            kw, plat = kp.split("|", 1)
            log_entry = {
                "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "keyword": kw,
                "platform": plat,
                "raw_count": stats["raw"],
                "after_time_filter": stats["raw"],  # approximate
                "after_dedup": stats["final"],
                "final_count": stats["final"],
                "anomalies": []
            }
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    print(f"[Log] Collection log written to: {log_path}")

    # --- Summary ---
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total searches: 11 (8 keywords x 11 platform combos)")
    print(f"Raw results: {total_raw}")
    print(f"Time filtered (>30d discarded): {time_discarded}")
    print(f"Irrelevant discarded: {irrelevant_discarded}")
    print(f"Dupes discarded: {dedup_discarded}")
    print(f"Same-account limit discarded: {account_discarded}")
    print(f"Final records: {len(records)}")

    # Freshness distribution
    hot = sum(1 for r in records if r["时间窗口"] == "热点")
    trend = sum(1 for r in records if r["时间窗口"] == "趋势")
    unverified = sum(1 for r in records if r["时间窗口"] == "待核验")
    print(f"\nFreshness: 热点={hot}, 趋势={trend}, 待核验(缺发布时间)={unverified}")

    # Platform distribution
    xhs = sum(1 for r in records if r["平台"] == "小红书")
    dy = sum(1 for r in records if r["平台"] == "抖音")
    print(f"Platform: 小红书={xhs}, 抖音={dy}")

    # Content form distribution
    from collections import Counter
    forms = Counter(r["内容形式"] for r in records)
    print(f"\n内容形式: {dict(forms)}")
    narratives = Counter(r["叙事结构"] for r in records)
    print(f"叙事结构: {dict(narratives)}")
    emotions = Counter(r["情绪调性"] for r in records)
    print(f"情绪调性: {dict(emotions)}")
    tools = Counter(r["视觉风格(工具)"] for r in records)
    print(f"视觉风格: {dict(tools)}")

    # Keyword-level stats
    print("\n--- Per Keyword ---")
    for kp in sorted(keyword_stats.keys()):
        stats = keyword_stats[kp]
        print(f"  {kp}: raw={stats['raw']}, final={stats['final']}")

    # Check for 方向枯竭 (>50% >30d for 小红书 keywords)
    print("\n--- 方向枯竭检查 ---")
    for kw in set(r["keyword"] for r in raw):
        kw_raw = [r for r in raw if r["keyword"] == kw]
        kw_xhs = [r for r in kw_raw if r["platform"] == "小红书"]
        if kw_xhs:
            total = len(kw_xhs)
            old = sum(1 for r in kw_xhs if classify_time_window(r.get("published_at"))[0] == "丢弃")
            pct = old / total * 100 if total > 0 else 0
            if pct > 50:
                print(f"  ⚠️ {kw} (小红书): {old}/{total} ({pct:.0f}%) >30天 → 方向枯竭")
            else:
                print(f"  ✅ {kw} (小红书): {old}/{total} ({pct:.0f}%) >30天")

    print(f"\nOutput files:")
    print(f"  Records: {output_path}")
    print(f"  Log: {log_path}")

    return records, output_path, log_path

if __name__ == "__main__":
    records, out_path, log_path = process()
