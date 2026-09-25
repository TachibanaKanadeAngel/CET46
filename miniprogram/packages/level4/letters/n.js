// LEVEL4 词库：以 "N" 开头（105 词）
// 自动从 public/data/vocab.json 生成
const WORDS_N = [
  {
    "id": 480,
    "word": "narrow",
    "phonetic": "/ˈnæɹəʊ/",
    "meaning": "v 变窄，缩小",
    "example": "narrow sense (狭义)",
    "level": "CET4"
  },
  {
    "id": 481,
    "word": "necessity",
    "phonetic": "/nɪˈsɛsəti/",
    "meaning": "n 必须，必要性",
    "example": "of necessity (必然地；不可避免地)",
    "level": "CET4"
  },
  {
    "id": 482,
    "word": "needy",
    "phonetic": "/ˈniːdi/",
    "meaning": "adj 贫穷的",
    "example": "needy student (家庭经济困难的学生)",
    "level": "CET4"
  },
  {
    "id": 483,
    "word": "neglect",
    "phonetic": "/nɪˈɡlɛkt/",
    "meaning": "v 忽视",
    "example": "neglect of (疏忽)",
    "level": "CET4"
  },
  {
    "id": 485,
    "word": "neighborhood",
    "phonetic": "/ˈneɪbə.hʊd/",
    "meaning": "n 附近",
    "example": "in the neighborhood of (在…附近；大约)",
    "level": "CET4"
  },
  {
    "id": 487,
    "word": "nightmare",
    "phonetic": "/ˈnaɪt.mɛə/",
    "meaning": "n 噩梦",
    "example": "at night (在夜里)",
    "level": "CET4",
    "exampleRoot": "night"
  },
  {
    "id": 489,
    "word": "notion",
    "phonetic": "/ˈnəʊʃən/",
    "meaning": "n 想法，观点",
    "example": "no longer (不再)",
    "level": "CET4",
    "exampleRoot": "no"
  },
  {
    "id": 490,
    "word": "numerous",
    "phonetic": "/ˈnjuːməɹəs/",
    "meaning": "adj 无数的",
    "example": "numerical simulation ([化]数值模拟)",
    "level": "CET4",
    "exampleRoot": "numerical"
  },
  {
    "id": 491,
    "word": "nutritious",
    "phonetic": "/njuːˈtɹɪʃəs/",
    "meaning": "adj 有营养的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 994,
    "word": "nap",
    "phonetic": "/nap/",
    "meaning": "n 小睡",
    "example": "take a nap (睡午觉；小睡一下)",
    "level": "CET4"
  },
  {
    "id": 1111,
    "word": "needle",
    "phonetic": "/ˈniː.dl/",
    "meaning": "n 指针，针",
    "example": "pins and needles (如坐针毡；焦躁不安；手脚发麻)",
    "level": "CET4"
  },
  {
    "id": 1177,
    "word": "novel",
    "phonetic": "/ˈnɒvl̩/",
    "meaning": "adj 新颖的",
    "example": "historical novel (历史小说)",
    "level": "CET4"
  },
  {
    "id": 1274,
    "word": "nest",
    "phonetic": "/nɛst/",
    "meaning": "v 筑巢，为…筑巢",
    "example": "bird's nest (n. 燕窝；鸟巢)",
    "level": "CET4"
  },
  {
    "id": 1373,
    "word": "nucleus",
    "phonetic": "/ˈnjuː.kli.əs/",
    "meaning": "n 原子核，细胞核",
    "example": "cell nucleus (细胞核)",
    "level": "CET4"
  },
  {
    "id": 1415,
    "word": "net",
    "phonetic": "/net/",
    "meaning": "v 用网捕；用网覆盖",
    "example": "on the net (在网上)",
    "level": "CET4"
  },
  {
    "id": 1584,
    "word": "nice",
    "phonetic": "/naɪs/",
    "meaning": "adj 细微的，微妙的",
    "example": "nice and (很，挺)",
    "level": "CET4"
  },
  {
    "id": 1656,
    "word": "network",
    "phonetic": "/nɛtwɜːk/",
    "meaning": "n 网络；广播网",
    "example": "neural network (神经网络)",
    "level": "CET4"
  },
  {
    "id": 1688,
    "word": "nose",
    "phonetic": "/nəʊz/",
    "meaning": "n 突出部分（如船头等）",
    "example": "on the nose (正好，恰恰)",
    "level": "CET4"
  },
  {
    "id": 1704,
    "word": "notify",
    "phonetic": "/ˈnoʊtɪfaɪ/",
    "meaning": "v 通知，告知；报告",
    "example": "notify party (到货受通知人)",
    "level": "CET4"
  },
  {
    "id": 1730,
    "word": "nourish",
    "phonetic": "/ˈnʌɹ.ɪʃ/",
    "meaning": "v 提供养分，养育",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 1744,
    "word": "negotiate",
    "phonetic": "/nəˈɡəʊ.ʃi.eɪt/",
    "meaning": "v 谈判，交涉，议定",
    "example": "negotiate about (协商；谈判)",
    "level": "CET4"
  },
  {
    "id": 2079,
    "word": "nursery",
    "phonetic": "/ˈnɜːsəɹi/",
    "meaning": "n 苗圃",
    "example": "nursery stock (苗木)",
    "level": "CET4"
  },
  {
    "id": 2101,
    "word": "nut",
    "phonetic": "/[nɐt]/",
    "meaning": "n 螺帽，螺母",
    "example": "nuts and bolts (具体细节，基本要素)",
    "level": "CET4"
  },
  {
    "id": 2437,
    "word": "number",
    "phonetic": "/ˈnʌmbə/",
    "meaning": "v 共计，达…之数",
    "example": "number of (许多；数目；若干)",
    "level": "CET4"
  },
  {
    "id": 2479,
    "word": "negative",
    "phonetic": "/ˈnɛ(e)ɡəˌɾɪv/",
    "meaning": "adj 负的；（结果）阴性的",
    "example": "negative effect (负面影响；负效应；负磁力效应)",
    "level": "CET4"
  },
  {
    "id": 2991,
    "word": "neutral",
    "phonetic": "/ˈnjuːtɹəl/",
    "meaning": "adj 中立的， 中性的",
    "example": "neutral point (中性点；中和点)",
    "level": "CET4"
  },
  {
    "id": 3309,
    "word": "navigation",
    "phonetic": "/nævɪˈɡeɪʃən/",
    "meaning": "n 航行， 航海， 航空； 导航， 领航",
    "example": "inertial navigation ([电]惯性导航（等于inertial guidance）)",
    "level": "CET4"
  },
  {
    "id": 3601,
    "word": "nasty",
    "phonetic": "/ˈnaː.sti/",
    "meaning": "adj 令人讨厌的， 令人厌恶的； 难弄的， 困难的； 严重的， 恶劣的， 险恶的； 下流的， 道德败坏的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3966,
    "word": "nuisance",
    "phonetic": "/ˈnjuːsəns/",
    "meaning": "n 讨厌的人； 麻烦事",
    "example": "public nuisance (n. 妨害公众安宁；妨害公众利益的人或事物)",
    "level": "CET4"
  },
  {
    "id": 4307,
    "word": "namely",
    "phonetic": "/ˈneɪmli/",
    "meaning": "adv 即，也就是",
    "example": "in the name of (以…的名义)",
    "level": "CET4",
    "exampleRoot": "name"
  },
  {
    "id": 5831,
    "word": "nail",
    "phonetic": "/neɪl/",
    "meaning": "n 钉；指甲；v 钉",
    "example": "nail polish (指甲油，趾甲油)",
    "level": "CET4"
  },
  {
    "id": 5832,
    "word": "naked",
    "phonetic": "/ˈnɛkɪd/",
    "meaning": "adj 裸体的；无遮敝的",
    "example": "naked eye (n. 肉眼)",
    "level": "CET4"
  },
  {
    "id": 5833,
    "word": "name",
    "phonetic": "/neɪm/",
    "meaning": "n 名字；名誉；v 说出",
    "example": "in the name of (以…的名义)",
    "level": "CET4"
  },
  {
    "id": 5834,
    "word": "nation",
    "phonetic": "/ˈneɪ.ʃən/",
    "meaning": "n 民族；国家",
    "example": "chinese nation (中华民族)",
    "level": "CET4"
  },
  {
    "id": 5835,
    "word": "national",
    "phonetic": "/ˈnæʃ(ə)nəl/",
    "meaning": "adj 民族的；国家的",
    "example": "national economy (国民经济)",
    "level": "CET4"
  },
  {
    "id": 5836,
    "word": "nationality",
    "phonetic": "/-ˈnæl.ti/",
    "meaning": "n 国籍；民族，族",
    "example": "minority nationality (少数民族)",
    "level": "CET4"
  },
  {
    "id": 5837,
    "word": "native",
    "phonetic": "/ˈneɪtɪv/",
    "meaning": "adj 本土的；n 本地人",
    "example": "native place (籍贯)",
    "level": "CET4"
  },
  {
    "id": 5838,
    "word": "natural",
    "phonetic": "/ˈnætʃəɹəl/",
    "meaning": "adj 自然界的；天然的",
    "example": "natural gas (天然气)",
    "level": "CET4"
  },
  {
    "id": 5839,
    "word": "naturally",
    "phonetic": "/ˈnætʃ(ə)ɹəli/",
    "meaning": "adv 自然地；天然地",
    "example": "natural gas (天然气)",
    "level": "CET4",
    "exampleRoot": "natural"
  },
  {
    "id": 5840,
    "word": "nature",
    "phonetic": "/ˈnæɪ̯tʃə/",
    "meaning": "n 大自然；本性；性质",
    "example": "in nature (本质上，事实上)",
    "level": "CET4"
  },
  {
    "id": 5841,
    "word": "naughty",
    "phonetic": "/ˈnɔːti/",
    "meaning": "adj 顽皮的，淘气的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5842,
    "word": "naval",
    "phonetic": "/ˈneɪvəl/",
    "meaning": "adj 海军的，军舰的",
    "example": "naval vessel (海军舰艇)",
    "level": "CET4"
  },
  {
    "id": 5843,
    "word": "navy",
    "phonetic": "/ˈneɪvi/",
    "meaning": "n 海军",
    "example": "navy blue (深蓝色；藏青色)",
    "level": "CET4"
  },
  {
    "id": 5844,
    "word": "near",
    "phonetic": "/nɪə(ɹ)/",
    "meaning": "adv 近，接近；adj 近的",
    "example": "come near (走进；险些；可与…相比（多用于否定句）)",
    "level": "CET4"
  },
  {
    "id": 5845,
    "word": "nearby",
    "phonetic": "/ˈnɪə.baɪ/",
    "meaning": "adj 附近的；adv 在附近",
    "example": "come near (走进；险些；可与…相比（多用于否定句）)",
    "level": "CET4",
    "exampleRoot": "near"
  },
  {
    "id": 5846,
    "word": "nearly",
    "phonetic": "/ˈniːɹli/",
    "meaning": "adv 差不多；密切地",
    "example": "nearly every day (几乎每一天)",
    "level": "CET4"
  },
  {
    "id": 5847,
    "word": "neat",
    "phonetic": "/niːt/",
    "meaning": "adj 整洁的；熟练的",
    "example": "neat cement (净水泥，净水泥浆)",
    "level": "CET4"
  },
  {
    "id": 5848,
    "word": "necessarily",
    "phonetic": "/ˌnɛsəˈsɛɹəli/",
    "meaning": "adv 必然，必定",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5849,
    "word": "necessary",
    "phonetic": "/ˈnɛsəsɹɪ/",
    "meaning": "adj 必要的；必然的",
    "example": "if necessary (如果必要的话)",
    "level": "CET4"
  },
  {
    "id": 5850,
    "word": "neck",
    "phonetic": "/nɛk/",
    "meaning": "n 颈，脖子",
    "example": "neck and neck (并驾齐驱，不分上下)",
    "level": "CET4"
  },
  {
    "id": 5851,
    "word": "necklace",
    "phonetic": "/ˈnɛkləs/",
    "meaning": "n 项链，项圈",
    "example": "diamond necklace (钻石项链)",
    "level": "CET4"
  },
  {
    "id": 5852,
    "word": "need",
    "phonetic": "/niːd/",
    "meaning": "v 需要；v aux需要",
    "example": "in need (在危难中；在穷困中的)",
    "level": "CET4"
  },
  {
    "id": 5853,
    "word": "needless",
    "phonetic": "/ˈniːdləs/",
    "meaning": "adj 不需要的",
    "example": "needy student (家庭经济困难的学生)",
    "level": "CET4",
    "exampleRoot": "needy"
  },
  {
    "id": 5854,
    "word": "Negro",
    "phonetic": "/ˈniːɡɹəʊ/",
    "meaning": "n 黑人",
    "example": "negro spiritual (n. 黑人灵歌)",
    "level": "CET4"
  },
  {
    "id": 5855,
    "word": "neighbour",
    "phonetic": "/ˈneɪbə/",
    "meaning": "n 邻居，邻国，邻人",
    "example": "in the neighbourhood of (大约；在...附近)",
    "level": "CET4",
    "exampleRoot": "neighbouring"
  },
  {
    "id": 5856,
    "word": "neighbourhood",
    "phonetic": "/ˈneɪ.bə.hʊd/",
    "meaning": "n 邻居关系；邻近",
    "example": "in the neighbourhood of (大约；在...附近)",
    "level": "CET4"
  },
  {
    "id": 5857,
    "word": "neither",
    "phonetic": "/ˈnaɪð.ə(ɹ)/",
    "meaning": "adj (两者)都不的",
    "example": "neither one (没有一个)",
    "level": "CET4"
  },
  {
    "id": 5858,
    "word": "nephew",
    "phonetic": "/ˈnɛf.ju/",
    "meaning": "n 侄子，外甥",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5859,
    "word": "nerve",
    "phonetic": "/nɛɾv/",
    "meaning": "n 神经；勇敢，胆量",
    "example": "nerve oneself (鼓起勇气；振作)",
    "level": "CET4"
  },
  {
    "id": 5860,
    "word": "nervous",
    "phonetic": "/ˈnɜːvəs/",
    "meaning": "adj 神经的；易激动的",
    "example": "nervous system (神经系统)",
    "level": "CET4"
  },
  {
    "id": 5861,
    "word": "never",
    "phonetic": "/ˈnɛv.ə(ɹ)/",
    "meaning": "adv 永不，决不；不",
    "example": "never forget (永不忘记)",
    "level": "CET4"
  },
  {
    "id": 5862,
    "word": "nevertheless",
    "phonetic": "/ˈnɛvəðəlɛs/",
    "meaning": "conj 然而；adv 仍然",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5863,
    "word": "new",
    "phonetic": "/njʉː/",
    "meaning": "adj 新的；新近出现的",
    "example": "new type (新型)",
    "level": "CET4"
  },
  {
    "id": 5864,
    "word": "newly",
    "phonetic": "/ˈnjuːli/",
    "meaning": "adv 新近，最近",
    "example": "new type (新型)",
    "level": "CET4",
    "exampleRoot": "renewable"
  },
  {
    "id": 5865,
    "word": "news",
    "phonetic": "/njuːz/",
    "meaning": "n 新闻，消息",
    "example": "good news (好消息；福音；喜讯；福音)",
    "level": "CET4"
  },
  {
    "id": 5866,
    "word": "newspaper",
    "phonetic": "/ˈnjuːsˌpeɪpə/",
    "meaning": "n 报纸，报",
    "example": "in the newspaper (在报纸上)",
    "level": "CET4"
  },
  {
    "id": 5867,
    "word": "next",
    "phonetic": "/nɛkst/",
    "meaning": "adj 紧接的；贴近的",
    "example": "come next (紧随其后；再下来)",
    "level": "CET4"
  },
  {
    "id": 5868,
    "word": "niece",
    "phonetic": "/niːs/",
    "meaning": "n 侄女，外甥女",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5869,
    "word": "night",
    "phonetic": "/naɪt/",
    "meaning": "n 夜，夜间",
    "example": "at night (在夜里)",
    "level": "CET4"
  },
  {
    "id": 5870,
    "word": "nine",
    "phonetic": "/naɪn/",
    "meaning": "num 九，九个",
    "example": "nine out of ten (十分之九，百分之九十)",
    "level": "CET4"
  },
  {
    "id": 5871,
    "word": "nineteen",
    "phonetic": "/naɪnˈtiːn/",
    "meaning": "num 十九，十九个",
    "example": "nine out of ten (十分之九，百分之九十)",
    "level": "CET4",
    "exampleRoot": "nine"
  },
  {
    "id": 5872,
    "word": "ninety",
    "phonetic": "/ˈnaɪn.ti/",
    "meaning": "num 九十，九十个",
    "example": "nine out of ten (十分之九，百分之九十)",
    "level": "CET4",
    "exampleRoot": "nine"
  },
  {
    "id": 5873,
    "word": "ninth",
    "phonetic": "/naɪnθ/",
    "meaning": "num 第九；九分之一",
    "example": "double ninth festival (重阳节)",
    "level": "CET4"
  },
  {
    "id": 5874,
    "word": "nitrogen",
    "phonetic": "/ˈnaɪ.tɹə.dʒən/",
    "meaning": "n 氮",
    "example": "ammonia nitrogen (氨氮；氨型氮，氨基氮)",
    "level": "CET4"
  },
  {
    "id": 5875,
    "word": "no",
    "phonetic": "/nəʊ/",
    "meaning": "adv 不；并不；adj 没有",
    "example": "no longer (不再)",
    "level": "CET4"
  },
  {
    "id": 5876,
    "word": "noble",
    "phonetic": "/ˈnəʊbəl/",
    "meaning": "adj 贵族的；高尚的",
    "example": "noble metal (贵金属)",
    "level": "CET4"
  },
  {
    "id": 5877,
    "word": "nobody",
    "phonetic": "/ˈnəʊ.bɒ.di/",
    "meaning": "pron 谁也不；无人",
    "example": "nobody could (没人能做到；那么别人也休想)",
    "level": "CET4"
  },
  {
    "id": 5878,
    "word": "nod",
    "phonetic": "/nɔd/",
    "meaning": "v 点(头)；点头表示",
    "example": "get the nod ([美国口语]得到认可；被选中)",
    "level": "CET4"
  },
  {
    "id": 5879,
    "word": "noise",
    "phonetic": "/nɔɪz/",
    "meaning": "n 喧闹声；响声；噪声",
    "example": "low noise (低噪声，低噪声的)",
    "level": "CET4"
  },
  {
    "id": 5880,
    "word": "noisy",
    "phonetic": "/ˈnɔːɪzɪ/",
    "meaning": "adj 嘈杂的；喧闹的",
    "example": "noisy channel (有噪声信道；噪声信道)",
    "level": "CET4"
  },
  {
    "id": 5881,
    "word": "none",
    "phonetic": "/nɒn/",
    "meaning": "pron 没有人；adv 毫不",
    "example": "no longer (不再)",
    "level": "CET4",
    "exampleRoot": "no"
  },
  {
    "id": 5882,
    "word": "nonsense",
    "phonetic": "/ˈnɒnsəns/",
    "meaning": "n 胡说，废话",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5883,
    "word": "noon",
    "phonetic": "/nuːn/",
    "meaning": "n 正午，中午",
    "example": "at noon (adv. 在中午)",
    "level": "CET4"
  },
  {
    "id": 5884,
    "word": "nor",
    "phonetic": "/nɔː/",
    "meaning": "conj 也不；不",
    "example": "nor yet (也没有，也不)",
    "level": "CET4"
  },
  {
    "id": 5885,
    "word": "normal",
    "phonetic": "/ˈnɔːməl/",
    "meaning": "adj 正常的，普通的",
    "example": "normal university (师范大学)",
    "level": "CET4"
  },
  {
    "id": 5886,
    "word": "normally",
    "phonetic": "/ˈnɔː.məl.i/",
    "meaning": "adv 通常，正常地",
    "example": "normally open (常开的；正常断开的)",
    "level": "CET4"
  },
  {
    "id": 5887,
    "word": "north",
    "phonetic": "/noːθ/",
    "meaning": "n 北，北方；adj 北方的",
    "example": "north america (北美洲)",
    "level": "CET4"
  },
  {
    "id": 5888,
    "word": "northeast",
    "phonetic": "/ˌnɔːθˈiːst/",
    "meaning": "n 东北；adj 位于东北的",
    "example": "north america (北美洲)",
    "level": "CET4",
    "exampleRoot": "north"
  },
  {
    "id": 5889,
    "word": "northern",
    "phonetic": "/ˈnɔːðn̩/",
    "meaning": "adj 北方的，北部的",
    "example": "northern ireland (北爱尔兰自治区（在爱尔兰东北部）)",
    "level": "CET4"
  },
  {
    "id": 5890,
    "word": "northwest",
    "phonetic": "/ˌnɔːθˈwest/",
    "meaning": "n 西北；adj 位于西北的",
    "example": "northwest airlines (西北航空（财富500强公司之一，总部位于美国，主要经营航空公司）)",
    "level": "CET4"
  },
  {
    "id": 5891,
    "word": "not",
    "phonetic": "/nɒt/",
    "meaning": "adv 不，没有",
    "example": "so as not to (vt. 以便不（未到...的程度）)",
    "level": "CET4"
  },
  {
    "id": 5892,
    "word": "note",
    "phonetic": "/nəʊt/",
    "meaning": "n 笔记；便条；注释",
    "example": "please note (清注意)",
    "level": "CET4"
  },
  {
    "id": 5893,
    "word": "notebook",
    "phonetic": "/ˈnəʊtˌbʊk/",
    "meaning": "n 笔记本，期票簿",
    "example": "notebook computer (笔记型电脑)",
    "level": "CET4"
  },
  {
    "id": 5894,
    "word": "nothing",
    "phonetic": "/ˈnʌθɪŋ/",
    "meaning": "n 没有东西；adv 毫不",
    "example": "nothing but (只有；只不过)",
    "level": "CET4"
  },
  {
    "id": 5895,
    "word": "notice",
    "phonetic": "/ˈnəʊtɪs/",
    "meaning": "v 注意；n 通知；注意",
    "example": "without notice (不预先通知地；没有事先通知)",
    "level": "CET4"
  },
  {
    "id": 5896,
    "word": "noticeable",
    "phonetic": "/ˈnəʊtɪsəbl̩/",
    "meaning": "adj 显而易见的；重要的",
    "example": "without notice (不预先通知地；没有事先通知)",
    "level": "CET4",
    "exampleRoot": "notice"
  },
  {
    "id": 5897,
    "word": "noun",
    "phonetic": "/naʊn/",
    "meaning": "n 名词",
    "example": "noun phrase (名词短语)",
    "level": "CET4"
  },
  {
    "id": 5898,
    "word": "November",
    "phonetic": "/nəʊˈvem.bər/",
    "meaning": "n 十一月",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5899,
    "word": "now",
    "phonetic": "/naʊ/",
    "meaning": "adv 现在；立刻；于是",
    "example": "up to now (到目前为止)",
    "level": "CET4"
  },
  {
    "id": 5900,
    "word": "nowadays",
    "phonetic": "/ˈnaʊ.ə.deɪz/",
    "meaning": "adv 现今，现在",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 5901,
    "word": "nowhere",
    "phonetic": "/ˈnəʊ.wɛə/",
    "meaning": "adv 任何地方都不",
    "example": "out of nowhere (不知打哪儿来；突然冒出来；莫名其妙的出现)",
    "level": "CET4"
  },
  {
    "id": 5902,
    "word": "nuclear",
    "phonetic": "/ˈn(j)ukliɚ/",
    "meaning": "adj 原子核的；核心的",
    "example": "nuclear power (核能；核动力)",
    "level": "CET4"
  },
  {
    "id": 5903,
    "word": "nurse",
    "phonetic": "/nɜːs/",
    "meaning": "n 保姆；护士；v 看护",
    "example": "head nurse (护士长)",
    "level": "CET4"
  },
  {
    "id": 5904,
    "word": "nylon",
    "phonetic": "/ˈnaɪlɒn/",
    "meaning": "n 尼龙，耐纶",
    "example": "nylon bag (尼龙袋)",
    "level": "CET4"
  },
  {
    "id": 6570,
    "word": "newsstand",
    "phonetic": "/ˈnjuːz.stænd/",
    "meaning": "n 报摊， 杂志摊",
    "example": "",
    "level": "CET4"
  }
];

module.exports = { WORDS_N };
