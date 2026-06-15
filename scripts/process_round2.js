#!/usr/bin/env node
/**
 * Round 2 competitor data collection processor.
 * Filters, annotates, and generates records from raw search results.
 */
const fs = require('fs');
const path = require('path');

// ============================================================
// Configuration
// ============================================================
const TODAY = new Date('2026-06-15T00:00:00+08:00');
const HOT_DAYS = 7;
const TREND_DAYS = 30;
const CUTOFF = new Date(TODAY.getTime() - TREND_DAYS * 86400000);

const OUTPUT_DIR = path.resolve('E:/side-projects/ai-cat-animation-ip/content');
const LOG_DIR = path.resolve('E:/side-projects/ai-cat-animation-ip/content/collection-logs');

// ============================================================
// Helper Functions
// ============================================================
function parseLikes(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return Math.round(val);
    const s = String(val).trim();
    const wanMatch = s.match(/^([\d.]+)万$/);
    if (wanMatch) return Math.round(parseFloat(wanMatch[1]) * 10000);
    const num = parseInt(s, 10);
    return isNaN(num) ? 0 : num;
}

function classifyTimeWindow(publishedAt) {
    if (!publishedAt) return { window: '待核验', confidence: 'OpenCLI-缺发布时间' };
    try {
        const parts = publishedAt.split('-');
        const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (isNaN(dt.getTime())) return { window: '待核验', confidence: 'OpenCLI-缺发布时间' };
        if (dt > TODAY) return { window: '待核验', confidence: 'OpenCLI' };
        const daysAgo = Math.floor((TODAY - dt) / 86400000);
        if (daysAgo <= HOT_DAYS) return { window: '热点', confidence: 'OpenCLI' };
        if (daysAgo <= TREND_DAYS) return { window: '趋势', confidence: 'OpenCLI' };
        return { window: '丢弃', confidence: 'OpenCLI' };
    } catch {
        return { window: '待核验', confidence: 'OpenCLI-缺发布时间' };
    }
}

function truncate(text, maxChars = 60) {
    if (!text) return '';
    text = String(text);
    return text.length <= maxChars ? text : text.substring(0, maxChars);
}

function inferContentForm(title, keyword) {
    const t = (title || '').toLowerCase();
    if (/#ai动画|#ai短剧|#ai漫剧|#ai短片|#动画/.test(t)) return '动画';
    if (/#ai剧情|#ai猫咪|#ai猫剧情|#猫咪剧情|#ai原创动漫/.test(t)) return '动画';
    if (/#aigc|#ai创作|#ai制作|#ai视频|#ai内容/.test(t)) return '动画';
    if (/#vlog|#猫咪vlog/.test(t)) return '动画';
    if (/#猫meme|#猫meme小剧场/.test(t)) return '混剪';
    if (/#ai图文|#图文/.test(t)) return '图文';
    if (/#配音/.test(t) && !/#动画|#ai/.test(t)) return '配音';
    if (/#记录猫咪日常|#萌宠出道计划|#猫咪日常|#铲屎官|#实拍/.test(t)) return '实拍';
    return '无法判断';
}

function inferNarrative(title, keyword) {
    const t = (title || '').toLowerCase();
    if (/#猫meme|#猫meme小剧场/.test(t)) return '猫Meme';
    if (/#ai短剧|#ai漫剧|#短剧|#ai剧情|#猫咪剧情|#猫咪短剧/.test(t)) return 'AI漫剧';
    if (/#vlog|#猫咪vlog/.test(t)) return '猫vlog';
    if (/#搞笑|#搞笑片段/.test(t)) return '搞笑片段';
    if (/#情感|#情感短片|#治愈|#治愈系/.test(t)) return '情感短片';
    if (/#教程|#ai教程/.test(t)) return '教程';
    return '无法判断';
}

function inferEmotion(title, keyword) {
    const t = title || '';
    if (/#治愈|#治愈系/.test(t)) return '治愈';
    if (/#搞笑|#奇葩/.test(t)) return '搞笑';
    if (/#可爱|#萌|#萌宠/.test(t)) return '萌';
    if (/#温暖|#暖心/.test(t)) return '温暖';
    if (/#打工|#打工人|#上班|#社畜|#职场/.test(t)) return '社畜共鸣';
    return '无法判断';
}

function inferVisualStyle(title, keyword) {
    const t = title || '';
    if (/#可灵ai|#可灵/i.test(t)) return '可灵AI';
    if (/#即梦ai|#即梦/.test(t)) return '即梦AI';
    if (/#midjourney|#mj/i.test(t)) return 'Midjourney';
    if (/#ai动画|#ai制作|#ai创作|#ai视频|#aigc|#ai内容|#ai创作浪潮/.test(t)) return '其他';
    return '待核验';
}

function inferCharacter(title, author, keyword) {
    const t = ((title || '') + ' ' + (author || ''));
    if (/橘猫|胖橘|橘/.test(t)) return '固定橘猫';
    if (/固定|系列|主角/.test(t)) return '系列化角色群';
    const auth = (author || '').toLowerCase();
    if (/[猫喵咪meme]/.test(auth)) return '待核验';
    return '待核验';
}

function scoreInteraction(likes) {
    const l = parseLikes(likes);
    if (l >= 100000) return 5;
    if (l >= 10000) return 4;
    if (l >= 1000) return 3;
    if (l >= 100) return 2;
    return 1;
}

function scoreIPTransferability(record) {
    let score = 3;
    if (record.contentForm === '动画') score++;
    if (['可灵AI', '即梦AI', '其他'].includes(record.visualStyle)) score++;
    if (record.narrative === '猫Meme') score--;
    if (record.contentForm === '实拍') score -= 2;
    return Math.max(1, Math.min(5, score));
}

function scoreProductionFeasibility(record) {
    let score = 3;
    if (['可灵AI', '即梦AI', '其他'].includes(record.visualStyle)) score += 2;
    if (record.contentForm === '动画') score++;
    if (record.contentForm === '实拍') score -= 2;
    return Math.max(1, Math.min(5, score));
}

function isRelevant(record) {
    const t = ((record.title || '') + ' ' + (record.keyword || '')).toLowerCase();
    const author = (record.author || '').toLowerCase();

    // Game / ad related
    if (/薅羊毛|赚钱|红包|广告|赚钱小游戏|测评赚钱/.test(t)) return false;
    if (/避雷|避坑/.test(t)) return false;
    // Pure tutorial without cat IP
    if (/教程/.test(t) && !/[猫喵ai]/.test(t)) return false;
    // Pet supplies store
    if (/宠物医院|宠物店|朗仕宠物/.test(author)) {
        if (/打工头像/.test(t)) return false;
    }
    return true;
}

function hasCatIPMention(record) {
    // Check if content relates to cat IP/character/animation (vs pure real cat)
    const t = ((record.title || '') + ' ' + (record.keyword || '')).toLowerCase();
    return /#ai|动画|剧情|短剧|剧场|漫剧|原创|cg|aigc|即梦|可灵|midjourney/.test(t);
}

// ============================================================
// Raw Data
// ============================================================
const RAW_DATA = [
    // === 抖音: AI治愈动画 猫 ===
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:1,author:"可心养猫记",title:"别去责怪你家的小猫咯，给点包容 给点爱…#猫咪动画 #ai猫剧情 #治愈系动漫猫咪 #宠物猫 #猫咪日常",url:"https://www.douyin.com/video/7642497561103111013",likes:119,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:2,author:"云咪猫生哲学",title:"云咪vlog——旧货市场历险记 #ai创作浪潮 #ai小猫 #哈基咪 #可爱 #治愈",url:"https://www.douyin.com/video/7649689236060359970",likes:66000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:3,author:"绿豆团团",title:"第1集  外星小猫的vlog（今天也是怀疑猫生的一天） #哈基米 #可爱 #治愈 #ai创作浪潮计划 #猫meme",url:"https://www.douyin.com/video/7617519649428606260",likes:84000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:4,author:"Zephyros",title:"《最后的生还猫》 第一集：醒来 #ai短片  #末日废土 #猫咪 #治愈系 #最后一只猫",url:"https://www.douyin.com/video/7648477130090695962",likes:1290,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:5,author:"鼠咪喵喵屋",title:"me的喵星Vlog -小猫其实一直在守护着我们，献给所有深爱着猫咪的人#ai创作浪潮计划 #可爱猫咪 #治愈 #萌宠出道计划 #猫meme",url:"https://www.douyin.com/video/7647095876640348283",likes:1523,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:6,author:"挑食猫🐱",title:"「喜欢猫的七只小姑娘🐈🐈‍⬛」 #二次元治愈 #动漫风格 #AI创作浪潮计划  #AI内容创作",url:"https://www.douyin.com/video/7650866025394724534",likes:6823,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:7,author:"小璐AI",title:"一天拆解一个账号，萌宠做饭动画！ #AIGC #AI教程 #胖橘 #爱宠萌宠 #会做饭的猫",url:"https://www.douyin.com/video/7647485460712820009",likes:16,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:8,author:"小朱朱的AI剪辑笔记",title:"AI动漫宠物科普带货，全流程拆解 #当我把照片交给ai #ai对话日常 #ai视频制作 #AI教程 #豆包app",url:"https://www.douyin.com/video/7644530294138178378",likes:486,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:9,author:"Also",title:"《云梦巡行记》 ---炎热的夏天到了香蕉猫编织了一个清凉的梦#我的刀盾#猫meme#香蕉猫 #治愈系风景 #ai动画",url:"https://www.douyin.com/video/7644052132005547270",likes:28000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI治愈动画 猫",rank:10,author:"Tatoo",title:"《咪决定今天不上班》｜一部关于生活的治愈ai动画 #ai动画 #原创动画 #打工人 #治愈 #猫",url:"https://www.douyin.com/video/7648888994280901926",likes:8,comments:0,shares:0,plays:0,published_at:null},

    // === 抖音: 即梦 猫 ===
    {platform:"抖音",keyword:"即梦 猫",rank:1,author:"鸽鸽呆",title:"主人，你太自恋了 这坏猫真是死性不改呀 本视频由#即梦AI 出镜模式制作 #AI分身戏精大赛 #用即梦AI过戏瘾 #邵氏 #猫咪",url:"https://www.douyin.com/video/7643406846133764465",likes:41000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:2,author:"KiddyLee周全",title:"【猫猫枪传奇】当猫咪成为世上最强武器，会发生什么？ #即梦 seedance2.0制作 #未来导演扶持计划 #AI创作浪潮计划",url:"https://www.douyin.com/video/7618582352473754880",likes:90000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:3,author:"会飞的宋清澈",title:"罕见的国王球猫 本视频由 #即梦AI  出镜模式制作#AI分身戏精大赛 #用即梦拍脑洞 #AI创作浪潮计划 #后室",url:"https://www.douyin.com/video/7647869487404491978",likes:2890,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:4,author:"镜辞",title:"我家住进了不得了的东西 #即梦ai  #AI创作浪潮计划  #猫箱跨次元相遇  #短剧  #AI短剧",url:"https://www.douyin.com/video/7647823642369232154",likes:12000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:5,author:"林森桃",title:"不对，我捡的不是一只猫吗？ #即梦ai成片有点东西 本视频由#即梦ai seedance2.0制作#AI创作浪潮计划",url:"https://www.douyin.com/video/7641518194600398245",likes:80000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:6,author:"以泪许誓",title:"摇头晃脑舞猫咪ai特效入口 #AI摇头晃脑舞  ai猫咪跳舞一键生成",url:"https://www.douyin.com/video/7650318286438028729",likes:27,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:7,author:"Scum泡沫",title:"摇头晃脑舞猫咪ai特效入口 #AI摇头晃脑舞 ai猫咪跳舞一键生成",url:"https://www.douyin.com/video/7650163988471555560",likes:12,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:8,author:"无忧（捉妖师）",title:"#即梦AI #臭猫 #小主人",url:"https://www.douyin.com/video/7650637676777701817",likes:8,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:9,author:"无忧（捉妖师）",title:"#即梦AI #臭猫 #小主人",url:"https://www.douyin.com/video/7650640604824912251",likes:6,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"即梦 猫",rank:10,author:"代号:渊",title:"原创漫剧《代号：渊》 序章：我最近真的分不清梦境和现实。 #即梦ai #悬疑 #短剧 #猫",url:"https://www.douyin.com/video/7651181290368011563",likes:10,comments:0,shares:0,plays:0,published_at:null},

    // === 抖音: AI猫咪剧情 ===
    {platform:"抖音",keyword:"AI猫咪剧情",rank:1,author:"AI胖橘剧场",title:"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧",url:"https://www.douyin.com/video/7651104311321629937",likes:53,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:2,author:"二喵爱演戏",title:"#ai创作浪潮计划 #猫咪 #原创ai",url:"https://www.douyin.com/video/7642611030166807290",likes:64000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:3,author:"AI胖橘剧场",title:"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧",url:"https://www.douyin.com/video/7649238631957518053",likes:482,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:4,author:"冷眼 看世界",title:"#ai猫剧情 #原创猫咪剧情 #热门短剧推荐",url:"https://www.douyin.com/video/7641485931925344966",likes:296,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:5,author:"Cat Super Power",title:"满载幸福的他邂逅了曾抛弃他的母亲 #ai萌宠 ##ai猫咪 #ai猫咪剧情 #萌宠出道计划 #剪映",url:"https://www.douyin.com/video/7649578485110814649",likes:944,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:6,author:"蒙面大虾🍤",title:"#ai #ai原创动漫 #热门",url:"https://www.douyin.com/video/7643433148709213410",likes:5978,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:7,author:"岁月匆匆小猫",title:"岁月匆匆像一阵风，多少故事留下感动。节俭的橘老太无心之失害死老伴儿#小猫ai视频 #ai猫咪 #ai橘猫 #ai剧情 #真人真事改编",url:"https://www.douyin.com/video/7529501533537537314",likes:33000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:8,author:"喵小绵剧场（收徒）",title:"这是36计中的哪一计？ #ai猫咪剧情 #ai",url:"https://www.douyin.com/video/7648951272696414693",likes:258,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:9,author:"喵一喵",title:"完整版来啦#ai猫猫故事#萌宠",url:"https://www.douyin.com/video/7629950037897242213",likes:1471,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"AI猫咪剧情",rank:10,author:"Cat Super Power",title:"死里逃生的小猫却被猫妈交给了警察 #ai猫咪 #ai猫咪剧情 #ai萌宠 #萌宠出道计划 #汽水音乐",url:"https://www.douyin.com/video/7650680971729655461",likes:1107,comments:0,shares:0,plays:0,published_at:null},

    // === 抖音: 猫咪小剧场 ===
    {platform:"抖音",keyword:"猫咪小剧场",rank:1,author:"@喵喵小剧场🔥",title:"《代销社的橘子糖》 #猫咪剧情 #AI #80后 #猫咪情感剧",url:"https://www.douyin.com/video/7649973173845279985",likes:3648,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:2,author:"黑喵警长",title:"安检员：误闯天家#猫meme小剧场",url:"https://www.douyin.com/video/7563972458488122682",likes:148000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:3,author:"萌喵喵小剧场",title:"有时候一句恶毒的话，真的可能毁掉一个家…希望小橘能快点好起来！#橘猫家庭生活 #萌宠出道计划 #橘猫",url:"https://www.douyin.com/video/7644500024399099226",likes:13000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:4,author:"猫初攻略",title:"趁朕病，要朕命？！ #萌宠出道计划 #后宫猫#古风猫 #猫咪短剧",url:"https://www.douyin.com/video/7536013437660532025",likes:37000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:5,author:"Mimi小猫剧场",title:"在电梯里拉了个大的 #猫meme #猫meme小剧场 #搞笑 #奇葩",url:"https://www.douyin.com/video/7509111956486294821",likes:16000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:6,author:"AI胖橘剧场",title:"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧",url:"https://www.douyin.com/video/7651104311321629937",likes:53,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:7,author:"Caesarcat",title:"《小猫咪也得正确》#卫仕五拼Plus猫粮 #随时随地运动会#配音 #猫猫小剧场 #猫猫情景剧",url:"https://www.douyin.com/video/7398075700537756964",likes:58000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:8,author:"肉松小蛋糕",title:"吃个饭全是心眼《步步攻略》#抖音小助手#猫meme  #搞笑 #猫meme小剧场 #猫咪",url:"https://www.douyin.com/video/7643329170274486009",likes:243,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:9,author:"朱果儿",title:"哈基米小剧场 柿子之争#哈基米#流浪猫#搞笑",url:"https://www.douyin.com/video/7648931392067532785",likes:2561,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪小剧场",rank:10,author:"猫猫小剧场",title:"《半夜老偷邻居外卖》#猫meme小剧场#猫#搞笑#猫meme",url:"https://www.douyin.com/video/7648678879951954278",likes:34,comments:0,shares:0,plays:0,published_at:null},

    // === 小红书: 猫猫动画 ===
    {platform:"小红书",keyword:"猫猫动画",rank:1,author:"我是胖橘喵",title:"啊啊啊❗❗❗❗猫猫变装也太好看了叭❗",url:"https://www.xiaohongshu.com/search_result/695cc8d8000000000903adbb",likes:"2.8万",comments:0,shares:0,plays:0,published_at:"2026-01-06"},
    {platform:"小红书",keyword:"猫猫动画",rank:2,author:"欣想事成",title:"爱分享QQ糖的小喵喵，你喜欢吗？",url:"https://www.xiaohongshu.com/search_result/66d07fdf000000001f03a556",likes:"1.2万",comments:0,shares:0,plays:0,published_at:"2024-08-29"},
    {platform:"小红书",keyword:"猫猫动画",rank:3,author:"🍊大橘子",title:"🍊胖橘:酿油豆腐",url:"https://www.xiaohongshu.com/search_result/69112d290000000005000b27",likes:"5821",comments:0,shares:0,plays:0,published_at:"2025-11-10"},
    {platform:"小红书",keyword:"猫猫动画",rank:4,author:"咪有办法",title:"下雨🌧️了怎么办，咪有办法❗",url:"https://www.xiaohongshu.com/search_result/6a2e1f560000000022028e3e",likes:"7",comments:0,shares:0,plays:0,published_at:"2026-06-14"},
    {platform:"小红书",keyword:"猫猫动画",rank:5,author:"一坨奶黄包",title:"一天不骚扰小猫就浑身难受 萌死了啊啊啊！！",url:"https://www.xiaohongshu.com/search_result/69538f49000000001e037354",likes:"2.4万",comments:0,shares:0,plays:0,published_at:"2025-12-30"},
    {platform:"小红书",keyword:"猫猫动画",rank:6,author:"🍊大橘子",title:"🍊胖橘:豉油鸡",url:"https://www.xiaohongshu.com/search_result/69bff4ef000000002301f42c",likes:"2181",comments:0,shares:0,plays:0,published_at:"2026-03-22"},
    {platform:"小红书",keyword:"猫猫动画",rank:7,author:"Little Fairy🧚",title:"🐱猫咪的神奇彩球",url:"https://www.xiaohongshu.com/search_result/692eb3ef0000000019025703",likes:"9460",comments:0,shares:0,plays:0,published_at:"2025-12-02"},
    {platform:"小红书",keyword:"猫猫动画",rank:8,author:"小满meme",title:"第10集｜《安静同桌》1-8",url:"https://www.xiaohongshu.com/search_result/69da0f440000000021012ed2",likes:"1万",comments:0,shares:0,plays:0,published_at:"2026-04-11"},
    {platform:"小红书",keyword:"猫猫动画",rank:9,author:"胖橘不吃鱼",title:"每天都要早起上班，动不动就加班",url:"https://www.xiaohongshu.com/search_result/6823369e0000000012007c3d",likes:"1万",comments:0,shares:0,plays:0,published_at:"2025-05-13"},
    {platform:"小红书",keyword:"猫猫动画",rank:10,author:"我是胖橘喵",title:"啊啊啊❗❗❗❗这猫猫变装也太好看了叭❗",url:"https://www.xiaohongshu.com/search_result/68f0a661000000000700fbbd",likes:"2333",comments:0,shares:0,plays:0,published_at:"2025-10-16"},

    // === 小红书: 治愈猫咪 ===
    {platform:"小红书",keyword:"治愈猫咪",rank:1,author:"蛀米虫",title:"薅羊毛小游戏之《治愈猫咪》",url:"https://www.xiaohongshu.com/search_result/6a26cce8000000001603c5ae",likes:"2",comments:0,shares:0,plays:0,published_at:"2026-06-08"},
    {platform:"小红书",keyword:"治愈猫咪",rank:2,author:"可问春风",title:"测评赚钱小游戏之《治愈猫咪》",url:"https://www.xiaohongshu.com/search_result/69c208d10000000023012046",likes:"62",comments:0,shares:0,plays:0,published_at:"2026-03-24"},
    {platform:"小红书",keyword:"治愈猫咪",rank:3,author:"不如明天见.",title:"避雷治愈猫咪",url:"https://www.xiaohongshu.com/search_result/695793a5000000001e0037ba",likes:"54",comments:0,shares:0,plays:0,published_at:"2026-01-02"},
    {platform:"小红书",keyword:"治愈猫咪",rank:4,author:"做个阳光般明媚的女子",title:"赚点零花钱（第一期）",url:"https://www.xiaohongshu.com/search_result/6912e494000000000301bcde",likes:"652",comments:0,shares:0,plays:0,published_at:"2025-11-11"},
    {platform:"小红书",keyword:"治愈猫咪",rank:5,author:"方顾",title:"避雷帖",url:"https://www.xiaohongshu.com/search_result/690569f3000000000501316b",likes:"7",comments:0,shares:0,plays:0,published_at:"2025-11-01"},
    {platform:"小红书",keyword:"治愈猫咪",rank:6,author:"七渡避坑",title:"这种红包游戏就是广告榨干机",url:"https://www.xiaohongshu.com/search_result/699b045e000000000b01214c",likes:"13",comments:0,shares:0,plays:0,published_at:"2026-02-22"},
    {platform:"小红书",keyword:"治愈猫咪",rank:7,author:"小红薯65B34F1C",title:"【避雷】合成猫咪等什么治愈系猫咪app赚钱",url:"https://www.xiaohongshu.com/search_result/6912ae03000000000402b853",likes:"69",comments:0,shares:0,plays:0,published_at:"2025-11-11"},
    {platform:"小红书",keyword:"治愈猫咪",rank:8,author:"小红薯69D4A115",title:"治愈猫咪真的能赚钱嘛？",url:"https://www.xiaohongshu.com/search_result/69ea00480000000020007002",likes:"2",comments:0,shares:0,plays:0,published_at:"2026-04-23"},
    {platform:"小红书",keyword:"治愈猫咪",rank:9,author:"铲屎官打工记",title:"此刻，全家人围观并高赞四只脚并拢的小猫",url:"https://www.xiaohongshu.com/search_result/6a0438b00000000007024075",likes:"1万",comments:0,shares:0,plays:0,published_at:"2026-05-13"},
    {platform:"小红书",keyword:"治愈猫咪",rank:10,author:"雅雅",title:"奶猫谁不爱！奶猫治愈谁！",url:"https://www.xiaohongshu.com/search_result/67cfae42000000002802a6d9",likes:"60",comments:0,shares:0,plays:0,published_at:"2025-03-11"},

    // === 抖音: 治愈猫咪 ===
    {platform:"抖音",keyword:"治愈猫咪",rank:1,author:"小橘猫.花儿",title:"去姥姥家 #橘猫 #小猫可以治愈一切 #萌宠出道计划 #Ai",url:"https://www.douyin.com/video/7643771418886996659",likes:42000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:2,author:"AAA萌宠事务所",title:"盘点猫咪的治愈瞬间：这个世界不能没有猫猫侠#萌宠出道计划 #被猫猫治愈的瞬间 #猫猫真的好像个小宝宝",url:"https://www.douyin.com/video/7315068943125794058",likes:191000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:3,author:"萌宠日常🐾",title:"暖心的小猫咪，世界破破烂烂，猫咪缝缝补补 #猫咪的可爱瞬间 #可爱猫咪 #小猫是平淡生活的解药 #治愈系",url:"https://www.douyin.com/video/7457120954427231545",likes:1104000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:4,author:"喵喵@十一",title:"或许它们真的把自己当人了，成精了#小猫治愈世界 #萌宠出道计划 #猫咪 #有猫的评论区都在被治愈 #小猫咪治愈视频",url:"https://www.douyin.com/video/7401901645929499954",likes:73000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:5,author:"爆笑德菌",title:"猫咪治愈瞬间，放下所有的负面情绪，让心灵得到真正的放松和舒缓#治愈猫咪 #宠物猫 #猫咪vlog",url:"https://www.douyin.com/video/7337964684324146473",likes:123,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:6,author:"LuLu和她的小猫小狗",title:"真的就像亲手养大的小孩 #小猫治愈了世界 #万物可爱计划",url:"https://www.douyin.com/video/7507582869352729875",likes:2795000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:7,author:"搞笑小新",title:"盘点猫咪的治愈瞬间，让你放下一切负面情绪#谁能拒绝傻憨憨的小猫咪#我和我的猫#铲屎官的乐趣",url:"https://www.douyin.com/video/7578889635016980928",likes:6257,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:8,author:"阿西娱乐",title:"可爱#猫咪 #治愈猫咪 #小猫治愈世界 #这小猫谁养谁不迷糊啊 #记录猫咪日常",url:"https://www.douyin.com/video/7451064088504962342",likes:1334,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:9,author:"猫咖",title:"小猫可以治愈一切 超治愈的小萌猫 #被猫咪治愈的瞬间",url:"https://www.douyin.com/video/7393152687665073445",likes:28000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"治愈猫咪",rank:10,author:"AI胖橘剧场",title:"AI打造橘猫迷你小剧场🍊 细碎小故事，治愈碎片化时光 #AI动画 #治愈萌宠#喵喵AI小剧场#AI小短剧",url:"https://www.douyin.com/video/7651104311321629937",likes:53,comments:0,shares:0,plays:0,published_at:null},

    // === 小红书: 猫咪日常 ===
    {platform:"小红书",keyword:"猫咪日常",rank:1,author:"欧包Doughdough",title:"她好像知道自己很可爱",url:"https://www.xiaohongshu.com/search_result/685f38ce000000001c0304bc",likes:"1.2万",comments:0,shares:0,plays:0,published_at:"2025-06-28"},
    {platform:"小红书",keyword:"猫咪日常",rank:2,author:"Milky酱",title:"世界上最最最可爱的宝宝！！",url:"https://www.xiaohongshu.com/search_result/6789a1d1000000001c00dd10",likes:"2.3万",comments:0,shares:0,plays:0,published_at:"2025-01-17"},
    {platform:"小红书",keyword:"猫咪日常",rank:3,author:"小芝麻小黄豆",title:"此猫手段了得",url:"https://www.xiaohongshu.com/search_result/69e752590000000023007216",likes:"3.2万",comments:0,shares:0,plays:0,published_at:"2026-04-21"},
    {platform:"小红书",keyword:"猫咪日常",rank:4,author:"nini粘fufu",title:"吸吸吸！动态小猫（ฅˊᗜˋฅ）",url:"https://www.xiaohongshu.com/search_result/68e769ce000000000301a441",likes:"1.9万",comments:0,shares:0,plays:0,published_at:"2025-10-09"},
    {platform:"小红书",keyword:"猫咪日常",rank:5,author:"nini粘fufu",title:"吸！动态咪(｡•̀ᴗ•́)و ̑̑",url:"https://www.xiaohongshu.com/search_result/6a216add000000003701cdec",likes:"2021",comments:0,shares:0,plays:0,published_at:"2026-06-04"},
    {platform:"小红书",keyword:"猫咪日常",rank:6,author:"蛋堡小漂漂",title:"3月龄小猫咪的晚饭吃了啥~",url:"https://www.xiaohongshu.com/search_result/6a2d3af8000000003502b5ac",likes:"53",comments:0,shares:0,plays:0,published_at:"2026-06-13"},
    {platform:"小红书",keyword:"猫咪日常",rank:7,author:"是小烨.",title:"谈薄肌得小咪",url:"https://www.xiaohongshu.com/search_result/6a0a76b80000000006034c41",likes:"1.8万",comments:0,shares:0,plays:0,published_at:"2026-05-18"},
    {platform:"小红书",keyword:"猫咪日常",rank:8,author:"福宝日记",title:"我家猫好看吗？",url:"https://www.xiaohongshu.com/search_result/698d5edb000000000e03f01c",likes:"4.4万",comments:0,shares:0,plays:0,published_at:"2026-02-12"},
    {platform:"小红书",keyword:"猫咪日常",rank:9,author:"million酱",title:"世界上真的不能没有可爱小猫呀",url:"https://www.xiaohongshu.com/search_result/6a224fe0000000002202dfe0",likes:"4289",comments:0,shares:0,plays:0,published_at:"2026-06-05"},
    {platform:"小红书",keyword:"猫咪日常",rank:10,author:"多多是只喵",title:"谁家小猫这样睡觉呀😻",url:"https://www.xiaohongshu.com/search_result/6874fc93000000001301046b",likes:"7852",comments:0,shares:0,plays:0,published_at:"2025-07-14"},

    // === 抖音: 猫咪日常 ===
    {platform:"抖音",keyword:"猫咪日常",rank:1,author:"乌恩的PP66",title:"又是平平无奇的一天 #橘猫 #猫咪日常",url:"https://www.douyin.com/video/7650433497245521649",likes:7723,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:2,author:"蕾蕾leilalei",title:"来看看下雨天小福又在作什么妖🌧️ #记录猫咪日常 #萌宠出道计划 #布偶猫",url:"https://www.douyin.com/video/7246703780102737167",likes:354000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:3,author:"宗介不是犟种",title:"八猫剪指甲Vlog 视频有点长#犟种猫 #猫咪日常 #我和我的猫 #猫咪剪指甲",url:"https://www.douyin.com/video/7649381537519111465",likes:471,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:4,author:"哆咪和猫",title:"拿捏～ #猫咪吃什么 #多宠家庭 #新手养猫 #vlog日常 #萌宠出道计划",url:"https://www.douyin.com/video/7650433332466945315",likes:161,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:5,author:"元宝超爱吃",title:"配餐时有个小可爱总来骚扰 应该怎么办？#沉浸式猫咪配餐 #创作者中心",url:"https://www.douyin.com/video/7651179044880759547",likes:25,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:6,author:"土豆六兄妹",title:"猫妈妈区别对待，条条非常不满自己总被过肩摔 #橘猫 #萌宠出道计划 #萌宠日常记录",url:"https://www.douyin.com/video/7650168423875850161",likes:223,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:7,author:"米粒和小金子",title:"喵星人的逆天行为VS喵星人的倒霉日常#萌宠出道计划 #萌猫趣事 #记录猫咪日常",url:"https://www.douyin.com/video/7461445958052744507",likes:317,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:8,author:"小咪爱谁谁",title:"《好多喵夜宵》 #记录猫咪日常",url:"https://www.douyin.com/video/7548097810509647144",likes:41000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:9,author:"安生的爸爸",title:"五只猫凑不出一个脑子 我家猫的智商给我搞破防了#记录猫咪日常 #傻猫的日常 #猫咪",url:"https://www.douyin.com/video/7434830645760724263",likes:204000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"猫咪日常",rank:10,author:"泡泡不是咪🫧",title:"沉浸式猫咪配餐🥣| 新人配餐博主第一天 召唤原始股东~#猫咪配餐",url:"https://www.douyin.com/video/7650483435043097910",likes:87,comments:0,shares:0,plays:0,published_at:null},

    // === 小红书: 打工猫 ===
    {platform:"小红书",keyword:"打工猫",rank:1,author:"大馋萱子🍔",title:"咪的天 上班打工小猫",url:"https://www.xiaohongshu.com/search_result/69ca70a2000000001a037fec",likes:"562",comments:0,shares:0,plays:0,published_at:"2026-03-30"},
    {platform:"小红书",keyword:"打工猫",rank:2,author:"清隅",title:"罗浮山偶遇「打工猫」，支持一下！",url:"https://www.xiaohongshu.com/search_result/69b54087000000001e00e37f",likes:"5866",comments:0,shares:0,plays:0,published_at:"2026-03-14"},
    {platform:"小红书",keyword:"打工猫",rank:3,author:"支支籽zihi",title:"猫猫打工日记",url:"https://www.xiaohongshu.com/search_result/68cbb33d000000001301bc16",likes:"1481",comments:0,shares:0,plays:0,published_at:"2025-09-18"},
    {platform:"小红书",keyword:"打工猫",rank:4,author:"小锦儿(取图看置顶)",title:"打工人的精神状态～🐱",url:"https://www.xiaohongshu.com/search_result/69635137000000001a034115",likes:"138",comments:0,shares:0,plays:0,published_at:"2026-01-11"},
    {platform:"小红书",keyword:"打工猫",rank:5,author:"猫了么",title:"在公司，严肃点",url:"https://www.xiaohongshu.com/search_result/6a0aed51000000003700cec1",likes:"1121",comments:0,shares:0,plays:0,published_at:"2026-05-18"},
    {platform:"小红书",keyword:"打工猫",rank:6,author:"猫了么",title:"不想起床 不想上班",url:"https://www.xiaohongshu.com/search_result/6775f934000000000b017b37",likes:"9198",comments:0,shares:0,plays:0,published_at:"2025-01-02"},
    {platform:"小红书",keyword:"打工猫",rank:7,author:"猫了么",title:"右滑叫醒小猫",url:"https://www.xiaohongshu.com/search_result/68c92e350000000013028a62",likes:"1261",comments:0,shares:0,plays:0,published_at:"2025-09-16"},
    {platform:"小红书",keyword:"打工猫",rank:8,author:"坡坡popo",title:"🐱:我真的需要这份工作吗？",url:"https://www.xiaohongshu.com/search_result/69e7185e000000001f00243d",likes:"2828",comments:0,shares:0,plays:0,published_at:"2026-04-21"},
    {platform:"小红书",keyword:"打工猫",rank:9,author:"哥叫鱼烧你记住",title:"我的职场生活坏端端地好起来了",url:"https://www.xiaohongshu.com/search_result/6a01561f0000000007022521",likes:"1.1万",comments:0,shares:0,plays:0,published_at:"2026-05-11"},
    {platform:"小红书",keyword:"打工猫",rank:10,author:"朗仕宠物",title:"猫咪打工头像",url:"https://www.xiaohongshu.com/search_result/66b5bdf6000000001e0181a2",likes:"70",comments:0,shares:0,plays:0,published_at:"2024-08-09"},

    // === 抖音: 打工猫 ===
    {platform:"抖音",keyword:"打工猫",rank:1,author:"蓝十六Lenki",title:"香蕉猫的打工vlog，咪坐上了耄耋联名地铁！ #哈基米 #上班人的精神状态 #比比拉布 #可爱 #ai创作浪潮计划",url:"https://www.douyin.com/video/7621675062936333733",likes:1998,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:2,author:"小宁是只猫",title:"当你入职了神仙公司… #打工猫的职场生活 #猫咪拟人化剧情 #宠物猫剧情 #ai猫剧情",url:"https://www.douyin.com/video/7645923459767968255",likes:10000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:3,author:"错错不犯错",title:"【番外篇】这该死的BGM！！不要再响了！！ #打工猫的职场生活 #办公室爆炸 #职场喵星人 #猫咪职场生存指南 #末日生存",url:"https://www.douyin.com/video/7646752788747519673",likes:3123,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:4,author:"呦呦切克闹",title:"#工地猫工 #喵星人打工记 #知恩图报 #懂得人自然懂",url:"https://www.douyin.com/video/7642709215488799475",likes:151,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:5,author:"小财是只喵",title:"打工喵在公司认真工作生存教程 #猫咪#萌宠出道计划 #可爱#搞笑 #打工人",url:"https://www.douyin.com/video/7648153017107279353",likes:280,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:6,author:"打工猫多多",title:"什么！小猫也能打工了？？👀 #猫咪  #打工猫 #哈基米 #治愈 #美短起司",url:"https://www.douyin.com/video/7588462675752002554",likes:17000,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:7,author:"错错不犯错",title:"人 来看咪兼职一天能赚多少💰填饱肚子～ #打工猫的职场生活 #喵星人打工记 #猫咪打工日常 #猫咪职场生存指南",url:"https://www.douyin.com/video/7645262435797445989",likes:126,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:8,author:"洛洛喵",title:"患难见真情！#工地猫工 #胖猫打工记 #胖橘猫工地搬砖",url:"https://www.douyin.com/video/7646027331798271827",likes:1076,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:9,author:"胖橘喵喵",title:"#工地猫工 #打工猫的职场生活 #喵星人奋斗史",url:"https://www.douyin.com/video/7641781377414849444",likes:174,comments:0,shares:0,plays:0,published_at:null},
    {platform:"抖音",keyword:"打工猫",rank:10,author:"招财猫Lucky🐱",title:"打工猫的周一日报 请查收qiu～ #谁能拒绝傻憨憨的小猫咪 #记录猫咪日常 #可爱到爆炸💥 #抖in萌宠计划 #萌宠出道计划",url:"https://www.douyin.com/video/7210003553157418252",likes:1083,comments:0,shares:0,plays:0,published_at:null},
];

// ============================================================
// Processing Pipeline
// ============================================================
function process() {
    console.log("=".repeat(60));
    console.log(`Round 2 Collection Processing - 2026-06-15`);
    console.log("=".repeat(60));

    const raw = RAW_DATA;
    const totalRaw = raw.length;
    console.log(`\n[Step 1] Total raw results: ${totalRaw}`);

    // Filter 1: Time window
    const timeFiltered = [];
    let timeDiscarded = 0;
    for (const r of raw) {
        const { window: tw, confidence } = classifyTimeWindow(r.published_at);
        if (tw === '丢弃') {
            timeDiscarded++;
        } else {
            r.time_window = tw;
            r.data_confidence = confidence;
            timeFiltered.push(r);
        }
    }
    console.log(`[Step 2] Time filter: kept ${timeFiltered.length}, discarded ${timeDiscarded} (>30 days)`);

    // Filter 2: Relevance
    const relevant = [];
    let irrelevantDiscarded = 0;
    for (const r of timeFiltered) {
        if (isRelevant(r)) {
            relevant.push(r);
        } else {
            irrelevantDiscarded++;
        }
    }
    console.log(`[Step 3] Relevance filter: kept ${relevant.length}, discarded ${irrelevantDiscarded}`);

    // Filter 3: Dedup by platform + url
    const seenUrls = new Set();
    const deduped = [];
    let dedupDiscarded = 0;
    for (const r of relevant) {
        const key = r.platform + '|' + r.url;
        if (seenUrls.has(key)) {
            dedupDiscarded++;
        } else {
            seenUrls.add(key);
            deduped.push(r);
        }
    }
    console.log(`[Step 4] Dedup (platform+url): kept ${deduped.length}, discarded ${dedupDiscarded}`);

    // Filter 4: Same account max 3 per keyword
    const accountKeywordCount = {};
    const final = [];
    let accountDiscarded = 0;
    for (const r of deduped) {
        const ak = r.keyword + '|' + r.platform + '|' + r.author;
        const count = accountKeywordCount[ak] || 0;
        if (count >= 3) {
            accountDiscarded++;
        } else {
            accountKeywordCount[ak] = count + 1;
            final.push(r);
        }
    }
    console.log(`[Step 5] Same-account limit (3/keyword): kept ${final.length}, discarded ${accountDiscarded}`);

    // Annotate
    console.log(`\n[Step 6] Annotating ${final.length} records...`);
    const records = [];

    for (let i = 0; i < final.length; i++) {
        const r = final[i];
        const sampleId = `CR-20260615-${String(i + 1).padStart(3, '0')}`;
        const titleTrunc = truncate(r.title, 60);

        const cf = inferContentForm(r.title, r.keyword);
        const nt = inferNarrative(r.title, r.keyword);
        const et = inferEmotion(r.title, r.keyword);
        const vt = inferVisualStyle(r.title, r.keyword);
        const ct = inferCharacter(r.title, r.author, r.keyword);

        const record = {
            "样本ID": sampleId,
            "平台": r.platform,
            "搜索关键词": r.keyword,
            "标题": titleTrunc,
            "完整链接": r.url,
            "作者": r.author || "未知",
            "点赞数": parseLikes(r.likes),
            "收藏数": parseLikes(r.collects || r.comments || 0),
            "发布时间": r.published_at || "",
            "时间窗口": r.time_window || "待核验",
            "cover_url": r.image_url || "",
            "内容形式": cf,
            "叙事结构": nt,
            "情绪调性": et,
            "视觉风格(工具)": vt,
            "角色类型": ct,
            "数据可信度": r.data_confidence || "OpenCLI",
        };

        // Scores
        const scoreRecord = { contentForm: cf, visualStyle: vt, narrative: nt, title: r.title, keyword: r.keyword };
        record["互动强度"] = scoreInteraction(r.likes);
        record["IP可迁移性"] = scoreIPTransferability(scoreRecord);
        record["制作可行性"] = scoreProductionFeasibility(scoreRecord);

        // Human verify fields
        record["节奏类型"] = "待核验";
        record["钩子策略"] = "待核验";
        record["视觉风格确认"] = "待核验";
        record["角色一致性"] = "待核验";
        record["互动风格"] = "待核验";
        record["对标判定"] = "待核验";

        records.push(record);
    }
    console.log(`[Step 6] Generated ${records.length} annotated records`);

    // Write JSON output
    const outputPath = path.join(OUTPUT_DIR, 'round2-samples.json');
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), { encoding: 'utf-8' });
    console.log(`\n[Output] Records written to: ${outputPath}`);

    // Write collection log
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').substring(0, 15).replace(/(\d{8})(\d{6})/, '$1-$2');
    const logPath = path.join(LOG_DIR, `${timestamp}.jsonl`);

    const keywordStats = {};
    for (const r of raw) {
        const kp = r.keyword + '|' + r.platform;
        if (!keywordStats[kp]) keywordStats[kp] = { raw: 0, final: 0 };
        keywordStats[kp].raw++;
    }
    for (const r of final) {
        const kp = r.keyword + '|' + r.platform;
        if (!keywordStats[kp]) keywordStats[kp] = { raw: 0, final: 0 };
        keywordStats[kp].final++;
    }

    const logLines = [];
    for (const [kp, stats] of Object.entries(keywordStats)) {
        const [kw, plat] = kp.split('|');
        logLines.push(JSON.stringify({
            timestamp: now.toISOString(),
            keyword: kw,
            platform: plat,
            raw_count: stats.raw,
            after_time_filter: stats.raw,
            after_dedup: stats.final,
            final_count: stats.final,
            anomalies: []
        }));
    }
    fs.writeFileSync(logPath, logLines.join('\n') + '\n', { encoding: 'utf-8' });
    console.log(`[Log] Collection log written to: ${logPath}`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total searches: 11 (8 keywords x 11 platform combos)`);
    console.log(`Raw results: ${totalRaw}`);
    console.log(`Time filtered (>30d discarded): ${timeDiscarded}`);
    console.log(`Irrelevant discarded: ${irrelevantDiscarded}`);
    console.log(`Dupes discarded: ${dedupDiscarded}`);
    console.log(`Same-account limit discarded: ${accountDiscarded}`);
    console.log(`Final records: ${records.length}`);

    const hot = records.filter(r => r['时间窗口'] === '热点').length;
    const trend = records.filter(r => r['时间窗口'] === '趋势').length;
    const unverified = records.filter(r => r['时间窗口'] === '待核验').length;
    console.log(`\nFreshness: 热点=${hot}, 趋势=${trend}, 待核验(缺发布时间)=${unverified}`);

    const xhs = records.filter(r => r['平台'] === '小红书').length;
    const dy = records.filter(r => r['平台'] === '抖音').length;
    console.log(`Platform: 小红书=${xhs}, 抖音=${dy}`);

    // Content form distribution
    const countBy = (key) => {
        const c = {};
        for (const r of records) {
            const v = r[key] || 'unknown';
            c[v] = (c[v] || 0) + 1;
        }
        return c;
    };
    console.log(`\n内容形式: ${JSON.stringify(countBy('内容形式'))}`);
    console.log(`叙事结构: ${JSON.stringify(countBy('叙事结构'))}`);
    console.log(`情绪调性: ${JSON.stringify(countBy('情绪调性'))}`);
    console.log(`视觉风格: ${JSON.stringify(countBy('视觉风格(工具)'))}`);

    // Per keyword
    console.log('\n--- Per Keyword ---');
    for (const kp of Object.keys(keywordStats).sort()) {
        const s = keywordStats[kp];
        console.log(`  ${kp}: raw=${s.raw}, final=${s.final}`);
    }

    // 方向枯竭 check
    console.log('\n--- 方向枯竭检查 ---');
    const kwSet = new Set(raw.map(r => r.keyword));
    for (const kw of kwSet) {
        const kwXhs = raw.filter(r => r.keyword === kw && r.platform === '小红书');
        const kwDy = raw.filter(r => r.keyword === kw && r.platform === '抖音');

        if (kwXhs.length > 0) {
            const old = kwXhs.filter(r => classifyTimeWindow(r.published_at).window === '丢弃').length;
            const pct = old / kwXhs.length * 100;
            if (pct > 50) {
                console.log(`  ⚠️ ${kw} (小红书): ${old}/${kwXhs.length} (${pct.toFixed(0)}%) >30天 → 方向枯竭`);
            } else {
                console.log(`  ✅ ${kw} (小红书): ${old}/${kwXhs.length} (${pct.toFixed(0)}%) >30天`);
            }
        }
        if (kwDy.length > 0) {
            console.log(`  📌 ${kw} (抖音): ${kwDy.length}条，无发布时间=待核验`);
        }
    }

    console.log(`\nOutput files:`);
    console.log(`  Records: ${outputPath}`);
    console.log(`  Log: ${logPath}`);

    return { records, outputPath, logPath };
}

process();
