// LEVEL6 词库：以 "A" 开头（128 词）
// 自动从 public/data/vocab.json 生成
const WORDS_A = [
  {
    "id": 1,
    "word": "abandonment",
    "phonetic": "/əˈbæn.dn̩.mn̩t/",
    "meaning": "n 放弃",
    "example": "with abandon (恣意地，放纵地)",
    "level": "CET6",
    "exampleRoot": "abandon"
  },
  {
    "id": 2,
    "word": "abnormally",
    "phonetic": "/æbˈnɔɹ.mə.li/",
    "meaning": "adv 不正常的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 9,
    "word": "accrue",
    "phonetic": "/əˈkɹuː/",
    "meaning": "v 积累",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 15,
    "word": "activate",
    "phonetic": "/ˈæktɪˌveɪt/",
    "meaning": "v 激活",
    "example": "economic activity (经济活动)",
    "level": "CET6",
    "exampleRoot": "activity"
  },
  {
    "id": 16,
    "word": "acutely",
    "phonetic": "/əˈkjuːt.li/",
    "meaning": "adv 敏锐地",
    "example": "acutely aware (清醒地看到)",
    "level": "CET6"
  },
  {
    "id": 17,
    "word": "addict",
    "phonetic": "/ˈæ.dɪkt/",
    "meaning": "v 上瘾，沉溺",
    "example": "drug addict (吸毒者；滥用药物者)",
    "level": "CET6"
  },
  {
    "id": 22,
    "word": "adventurer",
    "phonetic": "/ædˈvɛn.tʃɚ.ɚ/",
    "meaning": "n 冒险者",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 23,
    "word": "adverse",
    "phonetic": "/ədˈvɜ(ɹ)s/",
    "meaning": "adj 相反的，敌对的",
    "example": "adverse effect (不利影响；副作用)",
    "level": "CET6"
  },
  {
    "id": 24,
    "word": "adversely",
    "phonetic": "/ədˈvɜːs.li/",
    "meaning": "adv 不利地",
    "example": "adverse effect (不利影响；副作用)",
    "level": "CET6",
    "exampleRoot": "adverse"
  },
  {
    "id": 27,
    "word": "aggravate",
    "phonetic": "/ˈæɡ.ɹə.veɪ̯t/",
    "meaning": "v 加重，加剧",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 28,
    "word": "agonize",
    "phonetic": "/ˈæ.ɡən.aɪz/",
    "meaning": "v 使痛苦",
    "example": "agony of ((感情上的)突然而强烈的爆发，任何精神上的激动)",
    "level": "CET6",
    "exampleRoot": "agony"
  },
  {
    "id": 31,
    "word": "alien",
    "phonetic": "/ˈeɪ.li.ən/",
    "meaning": "adj 陌生的",
    "example": "alien from (相异的)",
    "level": "CET6"
  },
  {
    "id": 32,
    "word": "allergic",
    "phonetic": "/əˈlɜː.dʒɪk/",
    "meaning": "adj 过敏的",
    "example": "allergic rhinitis (过敏性鼻炎)",
    "level": "CET6"
  },
  {
    "id": 34,
    "word": "analytical",
    "phonetic": "/ˌæn.əˈlɪt.ɪ.kəl/",
    "meaning": "adj 分析的",
    "example": "analytical method (分析法)",
    "level": "CET6"
  },
  {
    "id": 41,
    "word": "apathy",
    "phonetic": "/ˈæp.ə.θi/",
    "meaning": "n 冷漠",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 46,
    "word": "appreciative",
    "phonetic": "/əˈpriː.ʃə.tɪv/",
    "meaning": "adj 表示赞赏的，感谢的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 53,
    "word": "arrogant",
    "phonetic": "/ˈæɹəɡənt/",
    "meaning": "adj 傲慢无礼的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 56,
    "word": "assassinate",
    "phonetic": "/əˈsasɪneɪt/",
    "meaning": "v 刺杀，暗杀",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 58,
    "word": "assessment",
    "phonetic": "/əˈses.mənt/",
    "meaning": "n 评估，评价",
    "example": "risk assessment (风险估计，危险率估计)",
    "level": "CET6"
  },
  {
    "id": 60,
    "word": "athletic",
    "phonetic": "/æθˈlɛt.ɪk/",
    "meaning": "adj 运动的，运动员的",
    "example": "athletic sports (体育运动)",
    "level": "CET6"
  },
  {
    "id": 62,
    "word": "attendant",
    "phonetic": "/əˈtɛndənt/",
    "meaning": "n 服务人员",
    "example": "flight attendant (空中服务人员)",
    "level": "CET6"
  },
  {
    "id": 63,
    "word": "authorities",
    "phonetic": "/ɔːˈθɒr.ə.tiz/",
    "meaning": "n 当局",
    "example": "taiwan authorities (台湾当局)",
    "level": "CET6"
  },
  {
    "id": 65,
    "word": "authorization",
    "phonetic": "/ˌɔː.θər.aɪˈzeɪ.ʃən/",
    "meaning": "n 授权",
    "example": "authentication and authorization (鉴别与授权；验证和授权)",
    "level": "CET6"
  },
  {
    "id": 70,
    "word": "awesome",
    "phonetic": "/ˈɔːsəm/",
    "meaning": "adj 极好的，令人敬畏的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 808,
    "word": "aptly",
    "phonetic": "/ˈæp(t).li/",
    "meaning": "adv 适当地",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 809,
    "word": "assimilate",
    "phonetic": "/əˈsɪm.ɪ.leɪt/",
    "meaning": "v 同化",
    "example": "cultural assimilation (文化训练)",
    "level": "CET6",
    "exampleRoot": "assimilation"
  },
  {
    "id": 827,
    "word": "assault",
    "phonetic": "/əˈsɔːlt/",
    "meaning": "n 攻击",
    "example": "sexual assault (性侵犯；性暴行)",
    "level": "CET6"
  },
  {
    "id": 834,
    "word": "abolition",
    "phonetic": "/ˌæb.əˈlɪʃ.n̩/",
    "meaning": "n 废除",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 859,
    "word": "alphabetical",
    "phonetic": "/ˌæl.fəˈbɛt.ɪ.kəl/",
    "meaning": "adj 按字母表顺序的",
    "example": "alphabetical order (字母顺序；字顺排列法)",
    "level": "CET6"
  },
  {
    "id": 863,
    "word": "affiliate",
    "phonetic": "/əˈfɪl.i.et/",
    "meaning": "v 使隶属于",
    "example": "affiliate marketing (联盟营销；从属营销)",
    "level": "CET6"
  },
  {
    "id": 908,
    "word": "allegedly",
    "phonetic": "/əˈledʒ.ɪd.li/",
    "meaning": "adv 据说",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 925,
    "word": "amend",
    "phonetic": "/əˈmɛnd/",
    "meaning": "v 修订",
    "example": "make amends for (补偿；赔偿…损失)",
    "level": "CET6"
  },
  {
    "id": 970,
    "word": "accidentally",
    "phonetic": "/ˌæksəˈdɛnt(ə)li/",
    "meaning": "adv 偶然地，意外地",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 981,
    "word": "assert",
    "phonetic": "/əˈsɜːt/",
    "meaning": "v 主张，断言",
    "example": "assert oneself (坚持自己的权利或意见)",
    "level": "CET6"
  },
  {
    "id": 1009,
    "word": "athletics",
    "phonetic": "/æθˈlɛtɪks/",
    "meaning": "n 体育运动",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1025,
    "word": "alleviate",
    "phonetic": "/əˈli.vi.eɪt/",
    "meaning": "v 减轻，缓解",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1044,
    "word": "aspirational",
    "phonetic": "/ˌæspəˈɹeɪʃənəl/",
    "meaning": "adj 渴望的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1075,
    "word": "appropriation",
    "phonetic": "/əˌpɹoʊpɹiˈeɪʃən/",
    "meaning": "n 挪用",
    "example": "appropriation bill (n. 政府年出预算案)",
    "level": "CET6"
  },
  {
    "id": 1105,
    "word": "accountable",
    "phonetic": "/ə.ˈkaʊn.tə.bəl/",
    "meaning": "adj 应负责的，有责任的",
    "example": "accountable for (负责，对…应付责任)",
    "level": "CET6"
  },
  {
    "id": 1140,
    "word": "affiliation",
    "phonetic": "/əˌfɪliˈeɪʃən/",
    "meaning": "n 隶属关系，单位团体",
    "example": "political affiliation (政治背景；政治立场；政治面貌)",
    "level": "CET6"
  },
  {
    "id": 1155,
    "word": "alternatively",
    "phonetic": "/ɔːlˈtɜː.nə.tɪv.li/",
    "meaning": "adv 二选一地；非此即彼",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1165,
    "word": "astronomical",
    "phonetic": "/ˌæs.tɹəˈnɒm.ɪk.əl/",
    "meaning": "adj 天文数字的",
    "example": "astronomical observatory (天文台)",
    "level": "CET6"
  },
  {
    "id": 1166,
    "word": "Automatically",
    "phonetic": "/ˈɔːtəʊˌmæt.ɪk(.ə)li/",
    "meaning": "adv 自动地；不经思考地",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1184,
    "word": "adaptation",
    "phonetic": "/ˌædæpˈteɪʃən/",
    "meaning": "n 适应；改编",
    "example": "social adaptation (社会适应，适应能力)",
    "level": "CET6"
  },
  {
    "id": 1189,
    "word": "ascend",
    "phonetic": "/əˈsɛnd/",
    "meaning": "v 上升",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1238,
    "word": "abide",
    "phonetic": "/əˈbaɪd/",
    "meaning": "v 忍受；遵守",
    "example": "abide by (遵守；信守；承担…的后果)",
    "level": "CET6"
  },
  {
    "id": 1247,
    "word": "ample",
    "phonetic": "/ˈæm.pəl/",
    "meaning": "adj 足够的；宽敞的",
    "example": "ample evidence (充分证据)",
    "level": "CET6"
  },
  {
    "id": 1268,
    "word": "array",
    "phonetic": "/əˈɹeɪ/",
    "meaning": "v （美观地）排列；n 陈列",
    "example": "an array of (一排；一批；大量)",
    "level": "CET6"
  },
  {
    "id": 1286,
    "word": "axial",
    "phonetic": "/ˈæksi.əl/",
    "meaning": "adj 轴的；轴向的",
    "example": "axial force (轴向力)",
    "level": "CET6"
  },
  {
    "id": 1288,
    "word": "ambient",
    "phonetic": "/ˈæm.biː.ənt/",
    "meaning": "adj 周围的，包围着的",
    "example": "ambient temperature (环境温度；室温；周围温度)",
    "level": "CET6"
  },
  {
    "id": 1346,
    "word": "adhere",
    "phonetic": "/ædˈhiɹ/",
    "meaning": "v 粘附；追随；坚持",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1359,
    "word": "ashore",
    "phonetic": "/əˈʃɔː/",
    "meaning": "adv 在岸上，上岸",
    "example": "go ashore (上岸)",
    "level": "CET6"
  },
  {
    "id": 1392,
    "word": "amusement",
    "phonetic": "/əˈmjuzmənt/",
    "meaning": "n 乐趣；娱乐，消遣",
    "example": "amusement park (游乐园)",
    "level": "CET6"
  },
  {
    "id": 1399,
    "word": "availability",
    "phonetic": "/[əˌveɪləˈbɪlɪtɪ]/",
    "meaning": "n 有效（性）；可得性",
    "example": "water availability (水有效性；水资源可利用量)",
    "level": "CET6"
  },
  {
    "id": 1402,
    "word": "advantageous",
    "phonetic": "/ˌædvənˈteɪd͡ʒəs/",
    "meaning": "adj 有利的，有助的",
    "example": "at a disadvantage (处于不利地位)",
    "level": "CET6",
    "exampleRoot": "disadvantage"
  },
  {
    "id": 1480,
    "word": "anode",
    "phonetic": "/ˈæn.əʊd/",
    "meaning": "n 阳极，正极，板极",
    "example": "anode slime (阳极泥；阳极残渣；阳极沉积层)",
    "level": "CET6"
  },
  {
    "id": 1565,
    "word": "analogy",
    "phonetic": "/əˈnæləd͡ʒi/",
    "meaning": "n 相似，类似；比拟",
    "example": "by analogy (用类推的方法；同样)",
    "level": "CET6"
  },
  {
    "id": 1597,
    "word": "absorption",
    "phonetic": "/əbˈsɔːp.ʃn̩/",
    "meaning": "n 吸收；专注",
    "example": "atomic absorption (原子吸收；原子吸收作用)",
    "level": "CET6"
  },
  {
    "id": 1700,
    "word": "accessory",
    "phonetic": "/ækˈsɛs(ə)ɹi/",
    "meaning": "n 同谋，帮凶；adj 附属的",
    "example": "accessory equipment (辅助设备)",
    "level": "CET6"
  },
  {
    "id": 1715,
    "word": "adjoin",
    "phonetic": "/əˈdʒɔɪn/",
    "meaning": "v 贴近，毗连；靠近",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 1727,
    "word": "astronomy",
    "phonetic": "/æˈstɹɑnəˌmi/",
    "meaning": "n 天文学",
    "example": "radio astronomy (n. 射电天文学)",
    "level": "CET6"
  },
  {
    "id": 1795,
    "word": "adoption",
    "phonetic": "/əˈdɒp.ʃən/",
    "meaning": "n 收养；采纳，采取",
    "example": "adoption process (采购程序，采用过程)",
    "level": "CET6"
  },
  {
    "id": 1810,
    "word": "automate",
    "phonetic": "/ˈɔtoʊˌmeɪt/",
    "meaning": "v 使自动化",
    "example": "soul mate (情人；性情相投的人；心心相印的伙伴)",
    "level": "CET6",
    "exampleRoot": "mate"
  },
  {
    "id": 1834,
    "word": "alternate",
    "phonetic": "/ɔːlˈtɜː.nət/",
    "meaning": "v 使交替；adj 交替的",
    "example": "alternate with (相间)",
    "level": "CET6"
  },
  {
    "id": 1956,
    "word": "agreeable",
    "phonetic": "/əˈɡɹiːəbl/",
    "meaning": "adj 惬意的；同意的",
    "example": "agree with (同意，和…意见一致)",
    "level": "CET6",
    "exampleRoot": "agree"
  },
  {
    "id": 1973,
    "word": "apt",
    "phonetic": "/æpt/",
    "meaning": "adj 恰当的；聪明的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2013,
    "word": "adjacent",
    "phonetic": "/əˈdʒeɪ.sənt/",
    "meaning": "adj 毗连的；紧接着的",
    "example": "adjacent rock (围岩)",
    "level": "CET6"
  },
  {
    "id": 2065,
    "word": "ambiguous",
    "phonetic": "/æmˈbɪɡjuəs/",
    "meaning": "adj 模棱两可的；分歧的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2098,
    "word": "ass",
    "phonetic": "/æs/",
    "meaning": "n 傻瓜，蠢笨的人；驴",
    "example": "kick ass (打屁股；打败；了不起)",
    "level": "CET6"
  },
  {
    "id": 2134,
    "word": "allied",
    "phonetic": "/əˈlaɪd/",
    "meaning": "adj 联合的；联姻的",
    "example": "allied forces (盟军；联军)",
    "level": "CET6"
  },
  {
    "id": 2137,
    "word": "attachment",
    "phonetic": "/əˈtætʃmənt/",
    "meaning": "n 爱慕；附件；连接物",
    "example": "emotional attachment (情绪依恋；情感依附)",
    "level": "CET6"
  },
  {
    "id": 2156,
    "word": "analogue",
    "phonetic": "/ˈæn.ə.lɒɡ/",
    "meaning": "n 类似物",
    "example": "analogue method (相似法；模拟法；类比法)",
    "level": "CET6"
  },
  {
    "id": 2181,
    "word": "aerial",
    "phonetic": "/ˈɛː.ɹi.əl/",
    "meaning": "adj 空气的；航空的",
    "example": "aerial photography (n. 空中摄影；空中照相术)",
    "level": "CET6"
  },
  {
    "id": 2188,
    "word": "adjustable",
    "phonetic": "/əˈdʒʌs.tə.bəl/",
    "meaning": "adj 可调整的，可校准的",
    "example": "adjustable range (可调节范围)",
    "level": "CET6"
  },
  {
    "id": 2195,
    "word": "appreciable",
    "phonetic": "/əˈpɹiːʃəbl/",
    "meaning": "adj 可察觉的",
    "example": "aesthetic appreciation (审美)",
    "level": "CET6",
    "exampleRoot": "appreciation"
  },
  {
    "id": 2246,
    "word": "astonishment",
    "phonetic": "/əˈstɒnɪʃmənt/",
    "meaning": "n 惊奇，惊讶",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2268,
    "word": "abbreviation",
    "phonetic": "/əˌbɹiː.viˈeɪ.ʃən/",
    "meaning": "n 节略，缩写，缩短",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2369,
    "word": "arc",
    "phonetic": "/ɑːk/",
    "meaning": "n 弧，弓形物；弧光",
    "example": "arc welding (电弧焊，弧焊；电弧焊接)",
    "level": "CET6"
  },
  {
    "id": 2384,
    "word": "applaud",
    "phonetic": "/əˈplɔːd/",
    "meaning": "v 鼓掌；喝彩",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2388,
    "word": "aerospace",
    "phonetic": "/ˈeə.rəʊ.speɪs/",
    "meaning": "n 航空航天工业",
    "example": "aerospace industry (航空和航天工业)",
    "level": "CET6"
  },
  {
    "id": 2414,
    "word": "amplitude",
    "phonetic": "/ˈæm.plɪ.tud/",
    "meaning": "n 振幅；广大；充足",
    "example": "amplitude modulation (AM) (幅度调制；振幅调制)",
    "level": "CET6"
  },
  {
    "id": 2428,
    "word": "agitation",
    "phonetic": "/ad͡ʒɪˈteɪʃ(ə)n/",
    "meaning": "n 鼓动，煸动；搅动",
    "example": "air agitation (充气搅动)",
    "level": "CET6"
  },
  {
    "id": 2439,
    "word": "arch",
    "phonetic": "/ɑːt͡ʃ/",
    "meaning": "n 拱门；v （使）拱起",
    "example": "arch bridge (拱形桥)",
    "level": "CET6"
  },
  {
    "id": 2476,
    "word": "appendix",
    "phonetic": "/əˈpɛn.dɪks/",
    "meaning": "n 附录；阑尾",
    "example": "vermiform appendix (n. 阑尾；蚓突)",
    "level": "CET6"
  },
  {
    "id": 2496,
    "word": "abundance",
    "phonetic": "/əˈbʌn.dn̩s/",
    "meaning": "n 丰富，充裕",
    "example": "in abundance (大量的；丰富的；充足的)",
    "level": "CET6"
  },
  {
    "id": 2510,
    "word": "abolish",
    "phonetic": "/əˈbɒlɪʃ/",
    "meaning": "v 废除，取消",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2561,
    "word": "alignment",
    "phonetic": "/[əˈɫaɪnmənt]/",
    "meaning": "n 排成直线；结盟，联合",
    "example": "in alignment (成一直线；排列整齐；校准)",
    "level": "CET6"
  },
  {
    "id": 2615,
    "word": "algebra",
    "phonetic": "/ˈæl.dʒɪ.bɹə/",
    "meaning": "n 代数学",
    "example": "linear algebra (线性代数)",
    "level": "CET6"
  },
  {
    "id": 2676,
    "word": "antenna",
    "phonetic": "/ænˈtɛn.ə/",
    "meaning": "n 触角；天线",
    "example": "antenna array (天线阵)",
    "level": "CET6"
  },
  {
    "id": 2683,
    "word": "adore",
    "phonetic": "/əˈdɔː/",
    "meaning": "v 崇拜，爱慕；很喜欢",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2721,
    "word": "ascertain",
    "phonetic": "/ˌæsəˈteɪn/",
    "meaning": "vt 查明，确定，弄清",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2757,
    "word": "absurd",
    "phonetic": "/æbˈzɝd/",
    "meaning": "adj 不合理的，荒唐的",
    "example": "theatre of the absurd (荒谬剧场；荒诞派戏剧)",
    "level": "CET6"
  },
  {
    "id": 2782,
    "word": "alteration",
    "phonetic": "/ɒl.tə(ɹ)ˈeɪ.ʃən/",
    "meaning": "n 变更，改变",
    "example": "hydrothermal alteration (热液蚀变；水热蚀变)",
    "level": "CET6"
  },
  {
    "id": 2796,
    "word": "arctic",
    "phonetic": "/ˈɑːk.tɪk/",
    "meaning": "adj 北极的；n 北极",
    "example": "arctic ocean (n. 北冰洋)",
    "level": "CET6"
  },
  {
    "id": 2811,
    "word": "assurance",
    "phonetic": "/əˈʃɔːɹəns/",
    "meaning": "n 保证",
    "example": "quality assurance (质量保证；品质保证)",
    "level": "CET6"
  },
  {
    "id": 2840,
    "word": "ascribe",
    "phonetic": "/əˈskɹaɪb/",
    "meaning": "v 把…归于",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2848,
    "word": "alas",
    "phonetic": "/ɘˈlɛs/",
    "meaning": "int 唉，哎呀",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2889,
    "word": "axle",
    "phonetic": "/ˈæksəl/",
    "meaning": "n （轮）轴，车轴，心棒",
    "example": "rear axle (后桥；后轴)",
    "level": "CET6"
  },
  {
    "id": 2976,
    "word": "abrupt",
    "phonetic": "/aˈbɹʌpt/",
    "meaning": "adj 突然的， 意外的； 唐突的， 鲁莽的",
    "example": "abrupt change (突变；陡变)",
    "level": "CET6"
  },
  {
    "id": 2982,
    "word": "afflict",
    "phonetic": "/əˈflɪkt/",
    "meaning": "vt 使苦恼， 折磨",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 2986,
    "word": "authorize",
    "phonetic": "/ˈɑθəɹaɪz/",
    "meaning": "vt 授权， 批准",
    "example": "competent authority ([法]主管当局，主管部门)",
    "level": "CET6",
    "exampleRoot": "authority"
  },
  {
    "id": 3022,
    "word": "avert",
    "phonetic": "/əˈvɜːt/",
    "meaning": "vt 防止， 避免； 转移",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3038,
    "word": "atlas",
    "phonetic": "/ˈætləs/",
    "meaning": "n 地图集",
    "example": "atlas mountains (阿特拉斯山脉（阿尔卑斯山系的一部分）)",
    "level": "CET6"
  },
  {
    "id": 3096,
    "word": "ammunition",
    "phonetic": "/ˌæmjuˈnɪʃən/",
    "meaning": "n 弹药， 军火",
    "example": "live ammunition ([军]实弹)",
    "level": "CET6"
  },
  {
    "id": 3101,
    "word": "assimilation",
    "phonetic": "/əˌsɪməˈleɪʃən/",
    "meaning": "n 同化， 同化作用； 消化",
    "example": "cultural assimilation (文化训练)",
    "level": "CET6"
  },
  {
    "id": 3178,
    "word": "assassination",
    "phonetic": "/əˌsæs.ɪ.ˈneɪ.ʃən/",
    "meaning": "n 刺杀， 暗杀",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3285,
    "word": "armor",
    "phonetic": "/ˈɑː.mə/",
    "meaning": "n 盔甲， 装甲； 保护物",
    "example": "armor plate (装甲板)",
    "level": "CET6"
  },
  {
    "id": 3321,
    "word": "appease",
    "phonetic": "/əˈpiːz/",
    "meaning": "vt 平息， 抚慰； 姑息",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3332,
    "word": "allege",
    "phonetic": "/əˈlɛdʒ/",
    "meaning": "vt 断言， 宣称， 硬说",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3338,
    "word": "aisle",
    "phonetic": "/aɪ̯l/",
    "meaning": "n 过道， 通道",
    "example": "down the aisle ([口语] 沿教堂走道而去(至圣坛举行婚礼))",
    "level": "CET6"
  },
  {
    "id": 3352,
    "word": "adolescent",
    "phonetic": "/ˌædəˈlɛsənt/",
    "meaning": "adj 青春期的； 青少年的；n 青少年",
    "example": "adolescent health (青少年健康)",
    "level": "CET6"
  },
  {
    "id": 3368,
    "word": "authentic",
    "phonetic": "/ɒ.ˈθɛn.tɪk/",
    "meaning": "adj 真的， 真正的； 可靠的， 可信的",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3418,
    "word": "abortion",
    "phonetic": "/əˈbɔɹ.ʃn̩/",
    "meaning": "n 流产， 堕胎",
    "example": "induced abortion (n. [医]人工流产)",
    "level": "CET6"
  },
  {
    "id": 3425,
    "word": "arena",
    "phonetic": "/əˈɹiːnə/",
    "meaning": "n 表演场地， 竞技场； 活动场所",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3445,
    "word": "auction",
    "phonetic": "/ˈɒkʃən/",
    "meaning": "n&vt 拍卖",
    "example": "auction house (拍卖行)",
    "level": "CET6"
  },
  {
    "id": 3494,
    "word": "aggregate",
    "phonetic": "/ˈæɡ.rɪ.ɡət/",
    "meaning": "adj 总计的， 合计的；n 总数，合计；vt 总计达， 合计； 使聚集， 使积聚",
    "example": "in the aggregate (总计；总共，作为总体)",
    "level": "CET6"
  },
  {
    "id": 3535,
    "word": "autonomy",
    "phonetic": "/ɑˈtɑnəmi/",
    "meaning": "n 自治， 自治权； 人身自由， 自主权",
    "example": "autonomous region (自治区)",
    "level": "CET6",
    "exampleRoot": "autonomous"
  },
  {
    "id": 3538,
    "word": "artillery",
    "phonetic": "/ɑːˈtɪləɹi/",
    "meaning": "n 火炮， 大炮； 炮兵",
    "example": "heavy artillery (重型火炮，重型炮兵)",
    "level": "CET6"
  },
  {
    "id": 3569,
    "word": "aesthetic",
    "phonetic": "/iːs.ˈθe.tɪk/",
    "meaning": "adj 美学的， 审美的； 悦目的， 雅致的",
    "example": "aesthetic education (美育；审美教育)",
    "level": "CET6"
  },
  {
    "id": 3597,
    "word": "assertive",
    "phonetic": "/əˈsɝtɪv/",
    "meaning": "adj 断定的； 过分自信的",
    "example": "assert oneself (坚持自己的权利或意见)",
    "level": "CET6",
    "exampleRoot": "assert"
  },
  {
    "id": 3598,
    "word": "autonomous",
    "phonetic": "/ɔːˈtɒnəməs/",
    "meaning": "adj 自治的； 独立自主的",
    "example": "autonomous region (自治区)",
    "level": "CET6"
  },
  {
    "id": 3603,
    "word": "articulate",
    "phonetic": "/ɑː(ɹ)ˈtɪk.jʊ.lət/",
    "meaning": "adj 善于表达的， 发音清晰的； 表达得清楚有力的；vt 明确有力地表达； 清楚地吐， 清晰地发",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3619,
    "word": "air-conditioning",
    "phonetic": "/ˈeər kənˌdɪʃ.ən.ɪŋ/",
    "meaning": "n 空调设备， 空调系统",
    "example": "air-conditioning unit (空调机组；空调装置)",
    "level": "CET6"
  },
  {
    "id": 3677,
    "word": "analogous",
    "phonetic": "/əˈnæl.ə.ɡəs/",
    "meaning": "adj 类似的， 相似的； 可比拟的",
    "example": "by analogy (用类推的方法；同样)",
    "level": "CET6",
    "exampleRoot": "analogy"
  },
  {
    "id": 3744,
    "word": "alienate",
    "phonetic": "/ˈeɪ.li.ə.neɪt/",
    "meaning": "vt 使疏远， 使不友好， 离间； 转让， 让渡",
    "example": "",
    "level": "CET6"
  },
  {
    "id": 3754,
    "word": "artery",
    "phonetic": "/ˈɑː.tə.ɹi/",
    "meaning": "n 动脉； 干线， 要道",
    "example": "coronary artery ([解]冠状动脉)",
    "level": "CET6"
  },
  {
    "id": 3777,
    "word": "aspiration",
    "phonetic": "/ˌæspəˈɹeɪʃən/",
    "meaning": "n 强烈的愿望； 志向， 抱负",
    "example": "aspiration biopsy (针吸活组织检查)",
    "level": "CET6"
  },
  {
    "id": 3986,
    "word": "appraisal",
    "phonetic": "/əˈpɹeɪzəl/",
    "meaning": "n 估计， 估量； 评价",
    "example": "performance appraisal (成绩评价，业绩评价)",
    "level": "CET6"
  }
];

module.exports = { WORDS_A };
