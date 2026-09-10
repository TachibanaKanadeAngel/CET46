// CET4_HIGH 词库：四级真题高频核心必考词（780 词）
// 结构与 level4/level6 保持完全一致，由 utils/series.ts 统一驱动路由
const WORDS = [
  {
    "id": 90001,
    "word": "abandon",
    "phonetic": "/əˈbæn.dən/",
    "meaning": "vt 离弃， 丢弃； 遗弃； 抛弃； 放弃",
    "example": "with abandon (恣意地，放纵地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90002,
    "word": "absolute",
    "phonetic": "/ˈæb.səˌljuːt/",
    "meaning": "adj 绝对的；纯粹的",
    "example": "absolute value (绝对值)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90003,
    "word": "abstract",
    "phonetic": "/ˈæbˌstɹækt/",
    "meaning": "adj 抽象的",
    "example": "in the abstract (抽象地；理论上；概括地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90004,
    "word": "abundant",
    "phonetic": "/əˈbʌn.dn̩t/",
    "meaning": "adj 丰富的， 富裕的； 大量的， 充足的",
    "example": "abundant in (富于；富有)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90005,
    "word": "academic",
    "phonetic": "/ˌækəˈdɛmɪk/",
    "meaning": "adj 学院的；学术的；纯理论的，不切实际的；n 大学教师",
    "example": "academic research (学术研究)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90006,
    "word": "access",
    "phonetic": "/ˈæksɛs/",
    "meaning": "v 取得，获取",
    "example": "access control (访问控制)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90007,
    "word": "accident",
    "phonetic": "/ˈæk.sə.dənt/",
    "meaning": "n 意外， 事故",
    "example": "traffic accident (交通事故)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90008,
    "word": "accommodate",
    "phonetic": "/əˈkɒməˌdeɪt/",
    "meaning": "v 适应，容纳",
    "example": "accommodate with (向…供应；提供；以…供应)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90009,
    "word": "accompany",
    "phonetic": "/ə.ˈkʌm.pə.ni/",
    "meaning": "v 陪同， 伴随； 为…伴奏",
    "example": "accompany with (伴随着，兼带着；陪…同行)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90010,
    "word": "accomplish",
    "phonetic": "/əˈkɐm.plɪʃ/",
    "meaning": "v 实现",
    "example": "accomplish nothing (一事无成；一无所成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90011,
    "word": "account",
    "phonetic": "/ə.ˈkaʊnt/",
    "meaning": "vi 说明…的原因； 占…；n 记述；解释；账目",
    "example": "account of (在某人帐上重视， 记帐)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90012,
    "word": "accurate",
    "phonetic": "/ˈæk.jə.ɹɪt/",
    "meaning": "adj 精确的",
    "example": "accurate measurement (精确测量)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90013,
    "word": "achieve",
    "phonetic": "/əˈtʃiːv/",
    "meaning": "v 达到，实现",
    "example": "achieve success (取得成功；获得成功)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90014,
    "word": "acknowledge",
    "phonetic": "/əkˈnɒ.lɪdʒ/",
    "meaning": "v 承认；告知收到",
    "example": "acknowledge receipt (证实收到)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90015,
    "word": "adapt",
    "phonetic": "/əˈdæpt/",
    "meaning": "vt 使适应； 改编",
    "example": "adapt to something (（使）适合；（使）适应)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90016,
    "word": "adequate",
    "phonetic": "/ˈæd.ɪ.kwət/",
    "meaning": "adj 足够的； 可以胜任的",
    "example": "adequate for (胜任……的；对……是足够的；适合……的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90017,
    "word": "adjust",
    "phonetic": "/əˈdʒʌst/",
    "meaning": "vi 适应；vt 调整，调节；校正",
    "example": "adjust and control (调控)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90018,
    "word": "admire",
    "phonetic": "/ədˈmaɪə/",
    "meaning": "v 钦佩，称赞",
    "example": "admire for (vt. 赞赏)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90019,
    "word": "admit",
    "phonetic": "/ədˈmɪt/",
    "meaning": "vi 承认；vt 承认，供认；准许…进入",
    "example": "admit of (容许，有…的可能)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90020,
    "word": "adopt",
    "phonetic": "/əˈdɒpt/",
    "meaning": "v 采纳",
    "example": "adopt various methods (采取不同办法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90021,
    "word": "advance",
    "phonetic": "/ədˈvaːns/",
    "meaning": "v & n 前进，提前",
    "example": "in advance (adv. 预先，提前)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90022,
    "word": "advantage",
    "phonetic": "/ədˈvɑːn.tɪdʒ/",
    "meaning": "n 优点， 优势； 好处",
    "example": "take advantage of (利用)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90023,
    "word": "adventure",
    "phonetic": "/ædˈvɛnt͡ʃɚ/",
    "meaning": "n 冒险",
    "example": "adventure film (惊险片)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90024,
    "word": "advertise",
    "phonetic": "/ˈadvə(ɹ)taɪz/",
    "meaning": "v 登广告",
    "example": "advertise for (登广告征求（寻找）某物；登招请（待聘等）广告)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90025,
    "word": "advise",
    "phonetic": "/ədˈvaɪz/",
    "meaning": "v 劝告；建议；通知",
    "example": "please advise (请指导；请指示)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90026,
    "word": "advocate",
    "phonetic": "/ˈæd.və.keɪt/",
    "meaning": "v 拥护；n 辩护律师",
    "example": "devil's advocate (故意持相反意见的人；故意唱反调的人)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90027,
    "word": "aesthetic",
    "phonetic": "/iːs.ˈθe.tɪk/",
    "meaning": "adj 美学的， 审美的； 悦目的， 雅致的",
    "example": "aesthetic education (美育；审美教育)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90028,
    "word": "afford",
    "phonetic": "/əˈfɔːd/",
    "meaning": "vt 担负得起； 提供",
    "example": "can afford (买得起；有能力负担)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90029,
    "word": "agency",
    "phonetic": "/ˈeɪ.dʒən.si/",
    "meaning": "n 机构",
    "example": "news agency (通讯社；新闻通讯社)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90030,
    "word": "agenda",
    "phonetic": "/əˈdʒɛn.də/",
    "meaning": "n 议程",
    "example": "item on the agenda (议程项目)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90031,
    "word": "agent",
    "phonetic": "/ˈeɪ.dʒənt/",
    "meaning": "n 代理人， 代理商； 政府代表； 动因， 原因； 剂",
    "example": "coupling agent ([化]偶联剂)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90032,
    "word": "aggressive",
    "phonetic": "/əˈɡɹɛs.ɪv/",
    "meaning": "adj 挑衅的",
    "example": "aggressive behavior (攻击行为；侵犯行为)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90033,
    "word": "agriculture",
    "phonetic": "/ˈæɡɹɪˌkʌltʃə/",
    "meaning": "n 农业，农艺；农学",
    "example": "ministry of agriculture (农业部)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90034,
    "word": "alert",
    "phonetic": "/əˈlɜːt/",
    "meaning": "adj 机警的；v 提醒",
    "example": "alert someone to sth (使...警觉；使...警惕)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90035,
    "word": "alien",
    "phonetic": "/ˈeɪ.li.ən/",
    "meaning": "adj 陌生的",
    "example": "alien from (相异的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90036,
    "word": "allocate",
    "phonetic": "/ˈæl.ə.keɪt/",
    "meaning": "vt 分配； 分派， 把…拨给",
    "example": "allocate funds (拨款；分配资金)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90037,
    "word": "alter",
    "phonetic": "/ˈɑl.tɚ/",
    "meaning": "vt 改变， 变更， 变动",
    "example": "alter ego (n. 密友；个性的另一面；至交)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90038,
    "word": "alternative",
    "phonetic": "/ɔːlˈtɜː.nə.tɪv/",
    "meaning": "n 代替品",
    "example": "alternative energy (替代能源；新能源)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90039,
    "word": "amend",
    "phonetic": "/əˈmɛnd/",
    "meaning": "v 修订",
    "example": "make amends for (补偿；赔偿…损失)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90040,
    "word": "amount",
    "phonetic": "/əˈmaʊnt/",
    "meaning": "n 总数；数量；和",
    "example": "large amount (大量；巨额；大批)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90041,
    "word": "amuse",
    "phonetic": "/əˈmjuːz/",
    "meaning": "v 逗…乐；给…娱乐",
    "example": "amuse oneself (自娱自乐，消遣)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90042,
    "word": "analyze",
    "phonetic": "/ˈæn.ə.laɪz/",
    "meaning": "v 分析",
    "example": "analyze data (分析数据；分析资料)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90043,
    "word": "ancestor",
    "phonetic": "/ˈæn.sɛs.tə/",
    "meaning": "n 祖宗， 祖先； 原型； 先驱",
    "example": "ancestor worship (祖先崇拜；祭祖；敬奉祖先)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90044,
    "word": "anchor",
    "phonetic": "/ˈæŋ.kə/",
    "meaning": "n 锚；v 抛锚，停泊",
    "example": "at anchor (停泊着；抛了锚)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90045,
    "word": "ancient",
    "phonetic": "/ˈeɪn.ʃənt/",
    "meaning": "adj 古代的",
    "example": "ancient chinese (n. 古代汉语)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90046,
    "word": "anniversary",
    "phonetic": "/ˌænɪˈvɜːs(ə)ɹi/",
    "meaning": "n 周年纪念日",
    "example": "wedding anniversary (结婚纪念日；结婚周年纪念日)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90047,
    "word": "annual",
    "phonetic": "/ˈæn.ju.əl/",
    "meaning": "adj 每年的，一年一次的；n 年报， 年鉴； 一年生的植物",
    "example": "annual meeting (年会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90048,
    "word": "anxiety",
    "phonetic": "/æŋˈzaɪ.ə.ti/",
    "meaning": "n 焦虑",
    "example": "anxiety disorder (焦虑症；焦虑性障碍；焦虑症候群)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90049,
    "word": "anxious",
    "phonetic": "/ˈaŋ(k)ʃəs/",
    "meaning": "adj 忧虑的；渴望的",
    "example": "anxious about (为……担心；对……着急)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90050,
    "word": "apparent",
    "phonetic": "/əˈpæ.ɹənt/",
    "meaning": "adj 显然的",
    "example": "apparent viscosity (表观粘度)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90051,
    "word": "appeal",
    "phonetic": "/əˈpiːl/",
    "meaning": "n 请求，呼吁, 上诉",
    "example": "appeal for (vt. 恳求，请求；要求)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90052,
    "word": "appetite",
    "phonetic": "/ˈæp.ə.taɪt/",
    "meaning": "n 欲望, 胃口",
    "example": "appetite for (对…的欲望)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90053,
    "word": "apply",
    "phonetic": "/əˈplaɪ/",
    "meaning": "vi 应用，实施，使用；适用；申请，请求；vt 涂， 敷， 施",
    "example": "apply oneself (减少对…之消耗量；努力，致力于…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90054,
    "word": "appoint",
    "phonetic": "/əˈpɔɪnt/",
    "meaning": "v 任命",
    "example": "make an appointment (约会，预约)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90055,
    "word": "appreciate",
    "phonetic": "/əˈpɹiː.si.eɪt/",
    "meaning": "v 感激，欣赏",
    "example": "aesthetic appreciation (审美)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90056,
    "word": "approach",
    "phonetic": "/əˈpɹəʊt͡ʃ/",
    "meaning": "n 方法",
    "example": "new approach (新方案；新做法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90057,
    "word": "appropriate",
    "phonetic": "/əˈprəʊ.pri.ət/",
    "meaning": "adj 适当的",
    "example": "as appropriate (酌情；[拉丁语]视情况而定)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90058,
    "word": "approve",
    "phonetic": "/əˈpɹuːv/",
    "meaning": "v 赞同",
    "example": "approve oneself ([古语]证明为，表明为)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90059,
    "word": "approximate",
    "phonetic": "/əˈprɒk.sɪ.mət/",
    "meaning": "adj 近似的；v 近似",
    "example": "approximate solution ([计]近似解)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90060,
    "word": "arbitrary",
    "phonetic": "/ˈɑɹ.bɪ.tɹɛ(ə).ɹi/",
    "meaning": "adj 随心所欲的； 专断的",
    "example": "arbitrary function (随意函数；任意函数)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90061,
    "word": "architect",
    "phonetic": "/ˈɑːkɪtɛkt/",
    "meaning": "n 建筑师；创造者",
    "example": "landscape architect (n. 造园技师；环境美化设计家)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90062,
    "word": "arise",
    "phonetic": "/əˈɹaɪz/",
    "meaning": "v 出现",
    "example": "arise from (由…引起，起因于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90063,
    "word": "arouse",
    "phonetic": "/əˈɹaʊz/",
    "meaning": "v 唤起",
    "example": "arouse the enthusiasm of (调动积极性)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90064,
    "word": "arrange",
    "phonetic": "/əˈɹeɪndʒ/",
    "meaning": "v 安排， 准备； 整理",
    "example": "arrange for (安排；为…做准备)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90065,
    "word": "arrest",
    "phonetic": "/əˈɹɛst/",
    "meaning": "vt 逮捕，拘留；停止，阻止；吸引；n 逮捕， 拘留， 扣留",
    "example": "cardiac arrest ([医]心搏停止)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90066,
    "word": "article",
    "phonetic": "/ˈɑːtɪkəl/",
    "meaning": "n 文章；条款；物品",
    "example": "in articles (根据契约当学徒，依雇用契约工作着)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90067,
    "word": "artificial",
    "phonetic": "/ɑː(ɹ)təˈfɪʃəl/",
    "meaning": "adj 人造的，虚伪的",
    "example": "artificial intelligence (人工智能)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90068,
    "word": "artistic",
    "phonetic": "/ɑːˈtɪstɪk/",
    "meaning": "adj 艺术的；艺术家的",
    "example": "artistic conception (意境)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90069,
    "word": "aspect",
    "phonetic": "/ˈæspɛkt/",
    "meaning": "n 方面",
    "example": "aspect ratio (纵横比；屏幕高宽比)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90070,
    "word": "assemble",
    "phonetic": "/əˈsɛmbl̩/",
    "meaning": "v 收集，组装",
    "example": "assemble language (n. 汇编语言)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90071,
    "word": "assert",
    "phonetic": "/əˈsɜːt/",
    "meaning": "v 主张，断言",
    "example": "assert oneself (坚持自己的权利或意见)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90072,
    "word": "assess",
    "phonetic": "/əˈsɛs/",
    "meaning": "vt 对估价； 评价， 评论",
    "example": "risk assessment (风险估计，危险率估计)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90073,
    "word": "asset",
    "phonetic": "/ˈæsɪt/",
    "meaning": "n 资产， 财产； 有价值的特性或技能， 优点",
    "example": "asset management (资产管理)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90074,
    "word": "assign",
    "phonetic": "/əˈsaɪn/",
    "meaning": "vt 指派， 分配； 布置； 指定",
    "example": "assign work (派活；指派工作)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90075,
    "word": "assist",
    "phonetic": "/əˈsɪst/",
    "meaning": "v 援助，帮助；搀扶",
    "example": "assist in (帮助)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90076,
    "word": "associate",
    "phonetic": "/əˈsəʊsi.ət/",
    "meaning": "v 把…联系在一起；使联合，结合；交往\t[ə'səuʃiət]；adj 副的；n 伙伴，同事",
    "example": "associate professor (副教授)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90077,
    "word": "assume",
    "phonetic": "/əˈsuːm/",
    "meaning": "v 假定，认为",
    "example": "assume responsibility (承担责任)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90078,
    "word": "assure",
    "phonetic": "/əˈʃɔː/",
    "meaning": "vt 使确信； 确保， 向…保证",
    "example": "assure oneself (弄清楚，查明)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90079,
    "word": "atmosphere",
    "phonetic": "/ˈæt.məsˌfɪə(ɹ)/",
    "meaning": "n 气氛，空气",
    "example": "earth's atmosphere (地球大气)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90080,
    "word": "attach",
    "phonetic": "/əˈtætʃ/",
    "meaning": "vt 缚， 系， 贴， 附加； 使依恋， 使喜爱； 使附属； 认为有",
    "example": "attached please find (附上…请查收[书信用语])",
    "level": "CET4_HIGH"
  },
  {
    "id": 90081,
    "word": "attempt",
    "phonetic": "/əˈtɛmpt/",
    "meaning": "vt 尝试， 试图， 努力",
    "example": "attempt at (企图，努力；尝试)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90082,
    "word": "attend",
    "phonetic": "/əˈtɛnd/",
    "meaning": "v 出席；照顾，护理",
    "example": "attend a meeting (参加会议)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90083,
    "word": "attitude",
    "phonetic": "/ˈætɪˌtjuːd/",
    "meaning": "n 态度， 看法； 姿势",
    "example": "attitude towards (态度，看法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90084,
    "word": "attract",
    "phonetic": "/əˈtɹækt/",
    "meaning": "vt 吸引， 引起…注意",
    "example": "attract foreign investment (吸引外商投资；对外招商)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90085,
    "word": "attribute",
    "phonetic": "/əˈtrɪb.juːt/",
    "meaning": "v 归因于",
    "example": "attribute data (属性资料（数据）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90086,
    "word": "audience",
    "phonetic": "/ˈɔːdi.əns/",
    "meaning": "n 正式会见；拜会",
    "example": "target audience (目标受众；目标观众；目标客户)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90087,
    "word": "author",
    "phonetic": "/ˈɔː.θə/",
    "meaning": "n 创造者，创始人",
    "example": "original author (原著者)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90088,
    "word": "authority",
    "phonetic": "/ɔːˈθɒɹəti/",
    "meaning": "n 权威",
    "example": "competent authority ([法]主管当局，主管部门)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90089,
    "word": "automatic",
    "phonetic": "/ˌɔːtəˈmætɪk/",
    "meaning": "adj 自动的",
    "example": "automatic control (自动控制)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90090,
    "word": "available",
    "phonetic": "/əˈveɪləb(ə)l/",
    "meaning": "adj 可获得的，可利用的",
    "example": "available for (可用于…的；对…有效的；能参加…的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90091,
    "word": "avenue",
    "phonetic": "/ˈæv.əˌnjuː/",
    "meaning": "n 林荫道，道路；大街",
    "example": "fifth avenue (（美国纽约的）第五大道)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90092,
    "word": "average",
    "phonetic": "/ˈævəɹɪd͡ʒ/",
    "meaning": "adj 平常的",
    "example": "an average of (平均是…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90093,
    "word": "avoid",
    "phonetic": "/əˈvɔɪd/",
    "meaning": "vt 避免， 躲开； 撤销",
    "example": "avoid doing (避免做某事；逃避…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90094,
    "word": "award",
    "phonetic": "/əˈwɔːd/",
    "meaning": "n 奖，奖品；判定；vt 授予， 给予； 判给， 裁定",
    "example": "academy award (奥斯卡金像奖；学院奖（美国电影艺术科学院颁发的年度奖项）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90095,
    "word": "aware",
    "phonetic": "/əˈweːɹ/",
    "meaning": "adj 知道的， 意识到的",
    "example": "aware of (意识到，知道)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90096,
    "word": "balance",
    "phonetic": "/ˈbæləns/",
    "meaning": "v 使平衡；称；n 天平",
    "example": "balance of (平衡)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90097,
    "word": "barrier",
    "phonetic": "/ˈbæɹi.ə(ɹ)/",
    "meaning": "n 障碍，阻碍",
    "example": "trade barrier (贸易壁垒)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90098,
    "word": "battery",
    "phonetic": "/ˈbætəɹi/",
    "meaning": "n 电池",
    "example": "battery of (一组；一套)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90099,
    "word": "battle",
    "phonetic": "/ˈbætəl/",
    "meaning": "n 激战，战役",
    "example": "in battle (在战斗中；在战争中)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90100,
    "word": "behalf",
    "phonetic": "/bɪˈhɑːf/",
    "meaning": "n 利益，维护，支持",
    "example": "behalf of (代表)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90101,
    "word": "behave",
    "phonetic": "/bəˈheɪv/",
    "meaning": "vi 表现，举止；运转，做出反应；vt 检点自己的行为",
    "example": "behave oneself (使举止规矩)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90102,
    "word": "behavior",
    "phonetic": "/[bɪˈheɪvjə]/",
    "meaning": "n 行为， 举止， 表现",
    "example": "dynamic behavior (动态行为；动态特性；能动行为)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90103,
    "word": "belief",
    "phonetic": "/bəˈliːf/",
    "meaning": "n 信任，相信；信念",
    "example": "belief in (相信；对…的信仰)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90104,
    "word": "benefit",
    "phonetic": "/ˈbɛn.ɪ.fɪt/",
    "meaning": "vi 得益；n 利益，恩惠；救济金，保险金，津贴；vt 有益于",
    "example": "economic benefit (经济效益)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90105,
    "word": "betray",
    "phonetic": "/bəˈtɹeɪ/",
    "meaning": "vt 背叛， 出卖； 失信于， 辜负； 泄露； 暴露， 显露",
    "example": "betray oneself (原形毕露)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90106,
    "word": "beyond",
    "phonetic": "/biˈjɒnd/",
    "meaning": "adv 在更远处， 再往后；prep 在…的那边，远于；迟于；越出",
    "example": "beyond oneself (精神错乱；忘形)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90107,
    "word": "bind",
    "phonetic": "/baɪnd/",
    "meaning": "v 捆绑；包扎；装钉",
    "example": "bind up (包扎；装订)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90108,
    "word": "bitter",
    "phonetic": "/ˈbɪtə/",
    "meaning": "adj 痛苦的",
    "example": "bitter taste (味苦，苦味)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90109,
    "word": "blame",
    "phonetic": "/bleɪm/",
    "meaning": "v 谴责",
    "example": "blame for (责备；因……责备)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90110,
    "word": "blank",
    "phonetic": "/blæŋk/",
    "meaning": "adj 空白的；茫然的，无表情的；n 空白； 空白表格",
    "example": "in blank (预留的空白位置；在空格里，在空白处)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90111,
    "word": "blast",
    "phonetic": "/blɑːst/",
    "meaning": "n 管乐器的声音",
    "example": "blast furnace (n. 鼓风炉，高炉)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90112,
    "word": "blend",
    "phonetic": "/blɛnd/",
    "meaning": "vt&vi&n 混和",
    "example": "blend in (混合，加入；调和)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90113,
    "word": "bless",
    "phonetic": "/blɛs/",
    "meaning": "v 祝福",
    "example": "god bless (上帝保佑)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90114,
    "word": "blind",
    "phonetic": "/blaɪnd/",
    "meaning": "n 百叶窗；窗帘；遮帘",
    "example": "blind date (n. 从未见面的男女经第三者安排所作的约会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90115,
    "word": "block",
    "phonetic": "/blɒk/",
    "meaning": "n 阻塞；障碍物",
    "example": "in block (块装；整批)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90116,
    "word": "blunder",
    "phonetic": "/ˈblʌn.də(ɹ)/",
    "meaning": "v 犯大错；n 大错",
    "example": "youth is a blunder (青年冒失莽撞)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90117,
    "word": "boast",
    "phonetic": "/bəʊst/",
    "meaning": "v 自夸",
    "example": "boast of (吹牛，自夸)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90118,
    "word": "bold",
    "phonetic": "/bəʊld/",
    "meaning": "adj 大胆的；冒失的",
    "example": "in bold (粗体地；黑体的；加粗地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90119,
    "word": "bond",
    "phonetic": "/bɒnd/",
    "meaning": "n 联结，联系；公债",
    "example": "bond market (债券市场)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90120,
    "word": "bonus",
    "phonetic": "/ˈbəʊ.nəs/",
    "meaning": "n 奖金， 红利； 额外给予的东西",
    "example": "annual bonus (年终分红)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90121,
    "word": "boom",
    "phonetic": "/buːm/",
    "meaning": "n 繁荣",
    "example": "economic boom (经济繁荣，经济腾飞)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90122,
    "word": "boost",
    "phonetic": "/buːst/",
    "meaning": "v 提高",
    "example": "boost up (向上推)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90123,
    "word": "border",
    "phonetic": "/ˈbɔədə/",
    "meaning": "vi 近似， 与…接壤；n 边，边缘，边界；vt 给…加上边，围；邻接",
    "example": "border area (边境区域)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90124,
    "word": "bother",
    "phonetic": "/[ˈbɔðə(ɹ)]/",
    "meaning": "v 困扰",
    "example": "don't bother (不用麻烦了；不打扰了)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90125,
    "word": "bounce",
    "phonetic": "/baʊns/",
    "meaning": "v 弹起，反弹，颠跳；n 弹， 反弹",
    "example": "bounce back (反弹；迅速恢复活力)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90126,
    "word": "boundary",
    "phonetic": "/ˈbaʊndɹi/",
    "meaning": "n 分界线，边界",
    "example": "boundary condition (边界条件，界面条件)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90127,
    "word": "bracket",
    "phonetic": "/ˈbɹækɪt/",
    "meaning": "n 括号；等级段，档次；壁架，托架；vt 把…置于括号内； 把…归入同一类",
    "example": "mounting bracket (安装支架；固定架)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90128,
    "word": "branch",
    "phonetic": "/bɹæntʃ/",
    "meaning": "n 分支，分公司",
    "example": "party branch (党支部)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90129,
    "word": "brand",
    "phonetic": "/bɹand/",
    "meaning": "v 在…上打烙印",
    "example": "famous brand (名牌，名牌货)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90130,
    "word": "breach",
    "phonetic": "/[bɹiːtʃ]/",
    "meaning": "n 破坏，违反；破裂，不和；缺口，裂口；vt 攻破， 在…造成缺口； 破坏， 违反",
    "example": "breach of contract (违约；违反合同)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90131,
    "word": "brief",
    "phonetic": "/bɹiːf/",
    "meaning": "adj 简短的，短暂的；vt 向…介绍基本情况，做…的提要；n 概要， 摘要",
    "example": "in brief (简言之)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90132,
    "word": "brilliant",
    "phonetic": "/ˈbɹɪljənt/",
    "meaning": "adj 才华横溢的；极好的",
    "example": "brilliant blue (鲜蓝；酞青；孔雀兰)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90133,
    "word": "broad",
    "phonetic": "/bɹɑd/",
    "meaning": "adj 宽的",
    "example": "broad market (广阔的市场；大量交易额；交易活跃的市场)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90134,
    "word": "broadcast",
    "phonetic": "/ˈbɹɑdkæst/",
    "meaning": "n 广播，播音",
    "example": "live broadcast (直接广播)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90135,
    "word": "brutal",
    "phonetic": "/ˈbɹuːtəl/",
    "meaning": "adj 残酷的",
    "example": "brutal violence (暴力)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90136,
    "word": "budget",
    "phonetic": "/ˈbʌdʒ.ɪt/",
    "meaning": "n 预算；〔政府的〕",
    "example": "budget deficit (预算赤字)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90137,
    "word": "bulk",
    "phonetic": "/bʌlk/",
    "meaning": "v 变得越来越大； 使更大；n 物体，体积；大批",
    "example": "the bulk of (大多数，大部)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90138,
    "word": "bulletin",
    "phonetic": "/ˈbʊlətɪn/",
    "meaning": "n 告示，公告，公报",
    "example": "bulletin board (布告牌；电子公告栏)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90139,
    "word": "burden",
    "phonetic": "/ˈbɜːdn/",
    "meaning": "n 负担",
    "example": "heavy burden (重负；重炉料)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90140,
    "word": "bureau",
    "phonetic": "/ˈbjʊɹ.oʊ/",
    "meaning": "n 局",
    "example": "security bureau (安全局；保安局)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90141,
    "word": "cabinet",
    "phonetic": "/ˈkæ.bɪ.nɪt/",
    "meaning": "n 橱， 柜； 内阁",
    "example": "control cabinet (控制柜；操纵室)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90142,
    "word": "calculate",
    "phonetic": "/ˈkælkjəleɪt/",
    "meaning": "v 计算， 推算； 计划， 打算",
    "example": "calculate on (指望；期待)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90143,
    "word": "calendar",
    "phonetic": "/ˈkæl.ən.də/",
    "meaning": "n 日历，历书；历法",
    "example": "lunar calendar (n. 阴历)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90144,
    "word": "campaign",
    "phonetic": "/kæmˈpeɪn/",
    "meaning": "n 活动",
    "example": "campaign for (为…助选；为…而进行活动)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90145,
    "word": "cancel",
    "phonetic": "/ˈkænsl̩/",
    "meaning": "v 取消",
    "example": "cancel button (取消按钮)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90146,
    "word": "cancer",
    "phonetic": "/ˈkæːnsə/",
    "meaning": "n 癌， 癌症， 肿瘤",
    "example": "breast cancer (乳腺癌)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90147,
    "word": "candidate",
    "phonetic": "/ˈkæn.dɪdət/",
    "meaning": "n 候选人， 投考者， 申请求职者",
    "example": "candidate for (候选人；人选)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90148,
    "word": "capacity",
    "phonetic": "/kəˈpæsɪti/",
    "meaning": "n 能力，容量",
    "example": "production capacity (生产能力；生产力)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90149,
    "word": "capital",
    "phonetic": "/ˈkæp.ɪ.təl/",
    "meaning": "adj 资金的，资本的",
    "example": "capital market (资本市场)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90150,
    "word": "capture",
    "phonetic": "/ˈkæp.t͡ʃə/",
    "meaning": "v 捕捉",
    "example": "video capture (视频捕捉)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90151,
    "word": "career",
    "phonetic": "/kəˈɹɪə/",
    "meaning": "n 生涯，职业，经历",
    "example": "career development (职业发展，职业培训)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90152,
    "word": "casual",
    "phonetic": "/ˈkɛʒɘl/",
    "meaning": "adj 偶然的； 非正式的； 临时的， 不定期的； 漠不关心的， 冷淡的",
    "example": "casual wear (便装，休闲服)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90153,
    "word": "catastrophe",
    "phonetic": "/kəˈtæstɹəfi/",
    "meaning": "n 大灾难， 灾祸",
    "example": "catastrophe theory ([数]突变理论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90154,
    "word": "category",
    "phonetic": "/ˈkætəˌɡɔɹi/",
    "meaning": "n 种类",
    "example": "product category (产品类别；产品目录；积范畴)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90155,
    "word": "caution",
    "phonetic": "/ˈkɔːʃ(ə)n/",
    "meaning": "n 小心；v 告诫，警告",
    "example": "with caution (adv. 慎重；留心)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90156,
    "word": "cease",
    "phonetic": "/siːs/",
    "meaning": "vi&vi&n 停止，停息",
    "example": "cease to be (不再是；停任)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90157,
    "word": "celebrate",
    "phonetic": "/ˈsɛl.ə.bɹeɪt/",
    "meaning": "v 庆祝；歌颂，赞美",
    "example": "celebrate with (庆祝)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90158,
    "word": "census",
    "phonetic": "/ˈsɛnsəs/",
    "meaning": "n 人口普查， 统计",
    "example": "census register (户籍登记簿)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90159,
    "word": "central",
    "phonetic": "/ˈsɛntɹəl/",
    "meaning": "adj 中心的；主要的",
    "example": "central committee (中央委员会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90160,
    "word": "ceremony",
    "phonetic": "/ˈsɛɹɪməni/",
    "meaning": "n 典礼，仪式",
    "example": "opening ceremony (开学典礼；开幕式；开幕仪式；开幕典礼)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90161,
    "word": "certificate",
    "phonetic": "/səˈtɪf.ɪ.kət/",
    "meaning": "n 证书，证件，执照",
    "example": "qualification certificate (资格证书)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90162,
    "word": "chain",
    "phonetic": "/ˈt͡ʃeɪn/",
    "meaning": "n 连锁店",
    "example": "supply chain (供应链；供给链；供需链)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90163,
    "word": "challenge",
    "phonetic": "/ˈtʃæl.əndʒ/",
    "meaning": "n 艰巨任务",
    "example": "meet the challenge (迎接挑战；满足要求)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90164,
    "word": "chamber",
    "phonetic": "/ˈtʃeɪmbə(ɹ)/",
    "meaning": "n 会议室；房间；腔",
    "example": "chamber of commerce (商会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90165,
    "word": "champion",
    "phonetic": "/ˈtʃæmpiən/",
    "meaning": "v 支持，拥护",
    "example": "olympic champion (奥运冠军；奥林匹克冠军)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90166,
    "word": "channel",
    "phonetic": "/ˈtʃænəl/",
    "meaning": "n 海峡；渠道；频道",
    "example": "marketing channel (销售渠道，行销通道)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90167,
    "word": "chaos",
    "phonetic": "/ˈkeɪ.ɒs/",
    "meaning": "n 混乱",
    "example": "in chaos (混乱；纷乱)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90168,
    "word": "characteristic",
    "phonetic": "/ˌkæɹəktəˈɹɪstɪk/",
    "meaning": "adj 特有的，典型的；n 特性",
    "example": "characteristic of (特有的；表示…特性的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90169,
    "word": "charge",
    "phonetic": "/t͡ʃɑːd͡ʒ/",
    "meaning": "n 负荷；充电；v 装满",
    "example": "in charge (负责，主管；在…看管下)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90170,
    "word": "charity",
    "phonetic": "/ˈtʃæɹɪti/",
    "meaning": "n 慈善（行为）",
    "example": "in charity (◎出于恻隐之心)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90171,
    "word": "charm",
    "phonetic": "/tʃɑːm/",
    "meaning": "n 魅力；妩媚；v 迷人",
    "example": "prince charming (对女子假装殷勤的男子；女子理想中的求婚者)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90172,
    "word": "chart",
    "phonetic": "/tʃɑːt/",
    "meaning": "n 图，图表；海图",
    "example": "charter party (佣船契约；包船契约；租船方)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90173,
    "word": "chase",
    "phonetic": "/tʃeɪs/",
    "meaning": "n&vt 追逐， 追赶， 追求",
    "example": "chase after (追逐；追赶)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90174,
    "word": "cheat",
    "phonetic": "/tʃiːt/",
    "meaning": "n 欺诈；骗取",
    "example": "cheat on (vt. 对...不忠)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90175,
    "word": "chemical",
    "phonetic": "/ˈkɛmɪkəl/",
    "meaning": "adj 化学的 n. 化学制品",
    "example": "chemical industry (化学工业)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90176,
    "word": "cherish",
    "phonetic": "/ˈtʃɛɹɪʃ/",
    "meaning": "v 珍爱；怀有（感情）",
    "example": "cherish time (珍惜时间)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90177,
    "word": "chronic",
    "phonetic": "/ˈkɹɒnɪk/",
    "meaning": "adj 长期的；慢性的",
    "example": "chronic disease ([医]慢性病)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90178,
    "word": "circuit",
    "phonetic": "/[ˈsəɾ.kɪʈ]/",
    "meaning": "n 电路；环行；巡行",
    "example": "control circuit (控制电路)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90179,
    "word": "circular",
    "phonetic": "/ˈsɜːk.jə.lə(ɹ)/",
    "meaning": "n 传单，通报，通函",
    "example": "circular arc (圆弧)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90180,
    "word": "circulate",
    "phonetic": "/ˈsɚˌkju.leɪt/",
    "meaning": "v 使循环；v 循环",
    "example": "blood circulation (血液循环，血循环)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90181,
    "word": "circumstance",
    "phonetic": "/-æns/",
    "meaning": "n 情况，环境",
    "example": "in the circumstances (在这种情况下；既然这样)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90182,
    "word": "cite",
    "phonetic": "/saɪt/",
    "meaning": "v 引证；引用；〔法院〕传召，传讯",
    "example": "cite an example (举例；引用一个例子)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90183,
    "word": "citizen",
    "phonetic": "/ˈsɪtɪzən/",
    "meaning": "n 公民",
    "example": "senior citizen (老年人)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90184,
    "word": "civil",
    "phonetic": "/ˈsɪv.əl/",
    "meaning": "adj 公民的；文职的",
    "example": "civil law (民法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90185,
    "word": "claim",
    "phonetic": "/kleɪm/",
    "meaning": "v 索取，声称",
    "example": "claim for (要求；索取)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90186,
    "word": "clarify",
    "phonetic": "/ˈklæɹɪfaɪ/",
    "meaning": "v 澄清，明确",
    "example": "customs declaration (报关单；申报关税)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90187,
    "word": "classic",
    "phonetic": "/ˈklæ.sɪk/",
    "meaning": "n 名著；adj 不朽的",
    "example": "classic style (古典风格)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90188,
    "word": "classify",
    "phonetic": "/ˈklæsɪfaɪ/",
    "meaning": "v 分类",
    "example": "classify as (把…分类为…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90189,
    "word": "clause",
    "phonetic": "/klɔːz/",
    "meaning": "n 条款",
    "example": "arbitration clause (仲裁条款；公断条款)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90190,
    "word": "clerk",
    "phonetic": "/klɐːk/",
    "meaning": "n 店员； 办事员， 职员",
    "example": "bank clerk (银行办事人员)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90191,
    "word": "client",
    "phonetic": "/ˈklʌɪənt/",
    "meaning": "n 顾客；诉讼委托人",
    "example": "client service (客户服务；向委托部门提供服务)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90192,
    "word": "climate",
    "phonetic": "/ˈklaɪmɪt/",
    "meaning": "n 气候； 风土， 地带； 风气， 气氛",
    "example": "climate change (气候变化；气候变迁)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90193,
    "word": "climax",
    "phonetic": "/ˈklaɪmæks/",
    "meaning": "n 顶点",
    "example": "climax community (顶极群落（在不受骚扰的情况下能生长的所有植物）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90194,
    "word": "cling",
    "phonetic": "/ˈklɪŋ/",
    "meaning": "v 粘住；依附；坚持",
    "example": "cling film (食品薄膜)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90195,
    "word": "clinic",
    "phonetic": "/ˈklɪnɪk/",
    "meaning": "n 诊所，医务室；会诊；会诊时间；门诊时间",
    "example": "dental clinic (牙科诊所，牙科诊室；牙科门诊部)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90196,
    "word": "clue",
    "phonetic": "/kluː/",
    "meaning": "n 线索",
    "example": "clue in (向...提供情况)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90197,
    "word": "cluster",
    "phonetic": "/ˈklʌstə/",
    "meaning": "n 串，束，簇；群，组；v 群聚；聚集",
    "example": "cluster analysis (聚类分析；群集分析)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90198,
    "word": "clutch",
    "phonetic": "/klʌt͡ʃ/",
    "meaning": "v 抓住，掌握，攫",
    "example": "in the clutch ([口语]在关键时刻)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90199,
    "word": "coalition",
    "phonetic": "/koʊəˈlɪʃən/",
    "meaning": "n 结合体， 同盟； 结合， 联合",
    "example": "coalition government (联合政府)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90200,
    "word": "coarse",
    "phonetic": "/kɔːs/",
    "meaning": "adj 粗的， 粗糙的； 粗劣的； 粗俗的",
    "example": "coarse aggregate (粗集料；粗骨料)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90201,
    "word": "coincide",
    "phonetic": "/ˌkoʊɪnˈsaɪd/",
    "meaning": "v 相巧合；相符合",
    "example": "coincide with (符合；与...相一致)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90202,
    "word": "collaborate",
    "phonetic": "/kəˈlabəɹeɪt/",
    "meaning": "v 合作",
    "example": "collaborate with (合作；通敌；与敌人合作)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90203,
    "word": "collapse",
    "phonetic": "/kəˈlæps/",
    "meaning": "v 坍塌，崩塌",
    "example": "collapse mechanism (破坏机构)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90204,
    "word": "combat",
    "phonetic": "/ˈkɒmˌbæt/",
    "meaning": "v 跟…战斗，格斗",
    "example": "combat with (v. 与…战斗)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90205,
    "word": "combine",
    "phonetic": "/kəmˈbaɪn/",
    "meaning": "v 结合，联合；化合；n 联合企业； 联合收割机",
    "example": "combine with (vt. 与...结合)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90206,
    "word": "comedy",
    "phonetic": "/ˈkɒmədi/",
    "meaning": "n 喜剧；喜剧场面",
    "example": "divine comedy (n. 神曲（意大利诗人但丁作的叙事诗）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90207,
    "word": "comfort",
    "phonetic": "/ˈkʊm.fət/",
    "meaning": "n 舒适；安慰；v 安慰",
    "example": "fort worth (沃思堡市（美国城市）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90208,
    "word": "command",
    "phonetic": "/kəˈmɑːnd/",
    "meaning": "n&vt 命令， 指挥； 控制",
    "example": "command line (命令行)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90209,
    "word": "commemorate",
    "phonetic": "/kəˈmɛməˌɹeɪt/",
    "meaning": "vt 纪念， 庆祝",
    "example": "in memory of (纪念…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90210,
    "word": "commence",
    "phonetic": "/kəˈmɛns/",
    "meaning": "v 开始；获得学位",
    "example": "commence business (开始营业)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90211,
    "word": "commend",
    "phonetic": "/kəˈmɛnd/",
    "meaning": "v 称赞，表扬；推荐",
    "example": "highly commended (高度赞赏；受到好评的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90212,
    "word": "comment",
    "phonetic": "/ˈkɒmɛnt/",
    "meaning": "n 评论",
    "example": "comment on (对……评论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90213,
    "word": "commerce",
    "phonetic": "/kɒˈmɜːs/",
    "meaning": "n 商业",
    "example": "industry and commerce (工商业)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90214,
    "word": "commercial",
    "phonetic": "/kəˈmɜːʃəl/",
    "meaning": "adj 商业的， 商务的； 商品化的， 商业性的",
    "example": "commercial bank (商业银行)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90215,
    "word": "commission",
    "phonetic": "/kəˈmɪʃən/",
    "meaning": "n 委托，委任；委托状",
    "example": "arbitration commission ([经]仲裁委员会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90216,
    "word": "commit",
    "phonetic": "/kəˈmɪt/",
    "meaning": "vt 犯， 干； 使承诺； 把…托付给； 调拨…供使用， 拨出",
    "example": "commit oneself (承诺，答应负责)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90217,
    "word": "commodity",
    "phonetic": "/kəˈmɒdəti/",
    "meaning": "n 商品",
    "example": "commodity inspection (商品检验)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90218,
    "word": "common",
    "phonetic": "/ˈkɒmən/",
    "meaning": "adj 普通的；共同的",
    "example": "in common (共同的；共有的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90219,
    "word": "communicate",
    "phonetic": "/kəˈmjuːnɪkeɪt/",
    "meaning": "v 通讯， 交际， 交流； 连接， 相通； 传达， 传播； 传染",
    "example": "communicate with (沟通；通话)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90220,
    "word": "community",
    "phonetic": "/k(ə)ˈmjunəti/",
    "meaning": "n 社区， 社会， 公社； 团体， 界； 群落",
    "example": "international community (国际社会；国际共同体)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90221,
    "word": "commute",
    "phonetic": "/kəˈmjuːt/",
    "meaning": "vi 乘公交车上下班，经常乘车往返于两地；vt 减； 折合， 折偿； 上下班交通",
    "example": "deaf mute (聋哑人；聋哑的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90222,
    "word": "compact",
    "phonetic": "/kəmˈpækt/",
    "meaning": "adj 紧密的，紧凑的",
    "example": "compact structure (密实结构；致密结构)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90223,
    "word": "companion",
    "phonetic": "/kəmˈpænjən/",
    "meaning": "n 同伴， 共事者； 伴侣",
    "example": "companion animal (宠物；同伴动物)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90224,
    "word": "company",
    "phonetic": "/ˈkʌmp(ə)ni/",
    "meaning": "n 公司，商号；同伴",
    "example": "limited company (有限公司；（英）股份有限公司（等于limited-liability company）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90225,
    "word": "comparable",
    "phonetic": "/kəmˈpæɹəbl̩/",
    "meaning": "adj 可比较的；类似的",
    "example": "comparable with (可比较的，比得上的；与…相容；可同…比较)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90226,
    "word": "compare",
    "phonetic": "/kəmˈpɛə/",
    "meaning": "vt 比较， 对照； 把…比作",
    "example": "compare with (与…相比较)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90227,
    "word": "compassion",
    "phonetic": "/kəmˈpæʃ.ən/",
    "meaning": "n 同情， 怜悯",
    "example": "passion for (对…的强烈爱好)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90228,
    "word": "compatible",
    "phonetic": "/kəmˈpætəbəl/",
    "meaning": "adj 兼容的",
    "example": "compatible with (adj. 与……和谐相处；与……相配的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90229,
    "word": "compel",
    "phonetic": "/kəmˈpɛl/",
    "meaning": "v 强迫",
    "example": "expel from (v. 驱逐出；开除；排出)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90230,
    "word": "compensate",
    "phonetic": "/ˈkɒm.pən.seɪt/",
    "meaning": "v 弥补",
    "example": "compensate for (赔偿，补偿)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90231,
    "word": "competent",
    "phonetic": "/ˈkɒmpətənt/",
    "meaning": "adj 能胜任的，有能力的",
    "example": "competent authority ([法]主管当局，主管部门)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90232,
    "word": "compile",
    "phonetic": "/kəmpʌɪl/",
    "meaning": "vt 汇编； 编制， 编纂",
    "example": "compile time (编译时间)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90233,
    "word": "complain",
    "phonetic": "/kəmˈpleɪn/",
    "meaning": "vi 抱怨， 诉苦； 控告， 投诉",
    "example": "complain about (抱怨)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90234,
    "word": "complex",
    "phonetic": "/ˈkɒm.pleks/",
    "meaning": "adj 由许多部分组成的，复合的；复杂的，难懂的；n 综合体， 集合体； 情结， 夸大的情绪反应",
    "example": "complex system (复杂系统)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90235,
    "word": "complicated",
    "phonetic": "/ˈkɒmplɪkeɪtɪd/",
    "meaning": "adj 复杂的",
    "example": "complicated structure (复式构造)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90236,
    "word": "compliment",
    "phonetic": "/ˈkɒmplɪmənt/",
    "meaning": "n 致意，问候；v 赞美，祝贺",
    "example": "compliment someone on (称赞某人的…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90237,
    "word": "comply",
    "phonetic": "/kəmˈplaɪ/",
    "meaning": "v 应允，遵照，照做",
    "example": "comply with (照做，遵守)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90238,
    "word": "component",
    "phonetic": "/kʌmˈpoʊnənt/",
    "meaning": "adj 组成的， 构成的；n 组成部分，部件，组件",
    "example": "component analysis (分量分析；[化]组分分析；组成成分分析)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90239,
    "word": "compose",
    "phonetic": "/kəmˈpəʊz/",
    "meaning": "vt 组成， 构成； 创作， 为…谱曲； 使平静， 使镇静",
    "example": "compose oneself (镇静)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90240,
    "word": "compound",
    "phonetic": "/ˈkɒmpaʊnd/",
    "meaning": "adj 复合的，化合的；n 化合物，复合物；复合词；vt 使恶化， 加重； 使化合， 使合成",
    "example": "compound fertilizer (复合肥料)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90241,
    "word": "comprehensive",
    "phonetic": "/ˌkɒm.pɹɪˈhɛn.sɪv/",
    "meaning": "adj 综合的，全面的",
    "example": "comprehensive evaluation (综合评价，综合评价法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90242,
    "word": "compress",
    "phonetic": "/kəmˈpɹɛs/",
    "meaning": "v 压紧，压缩",
    "example": "hot compress (热敷法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90243,
    "word": "comprise",
    "phonetic": "/kəmˈpɹaɪz/",
    "meaning": "v 包含，包括；构成",
    "example": "be comprised of (由…组成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90244,
    "word": "compromise",
    "phonetic": "/ˈkɒmpɹəˌmaɪz/",
    "meaning": "v 妥协；危害",
    "example": "reach a compromise (达成妥协)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90245,
    "word": "compulsory",
    "phonetic": "/kəmˈpʌlsəri/",
    "meaning": "adj 强迫的，义务的",
    "example": "compulsory education (义务教育)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90246,
    "word": "compute",
    "phonetic": "/kəmˈpjuːt/",
    "meaning": "v 计算， 估算",
    "example": "beyond compute (不可计量，无法计算；难以估计)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90247,
    "word": "concede",
    "phonetic": "/kənˈsiːd/",
    "meaning": "vi 让步， 认输；vt 承认，承认…为真；承认失败；允许，让予",
    "example": "recede from (v. 收回；撤回)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90248,
    "word": "conceive",
    "phonetic": "/kənˈsiːv/",
    "meaning": "v 设想，以为；怀孕",
    "example": "conceive of (设想；想象)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90249,
    "word": "concentrate",
    "phonetic": "/ˈkɒn.sən.tɹeɪt/",
    "meaning": "v 浓缩，提浓",
    "example": "concentrate on (集中精力于；全神贯注于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90250,
    "word": "concept",
    "phonetic": "/ˈkɒn.sɛpt/",
    "meaning": "n 概念， 观念； 设想",
    "example": "new concept (新概念)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90251,
    "word": "conception",
    "phonetic": "/kənˈsɛpʃən/",
    "meaning": "n 概念，观念，想法",
    "example": "artistic conception (意境)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90252,
    "word": "concern",
    "phonetic": "/kənˈsɜːn/",
    "meaning": "n 所关切的事；商行",
    "example": "concern oneself (◎从事,忙于(常与with, about, in, over连用))",
    "level": "CET4_HIGH"
  },
  {
    "id": 90253,
    "word": "conclude",
    "phonetic": "/kən.ˈkluːd/",
    "meaning": "vi 结束， 终了；vt 推断出，推论出；缔结，议定",
    "example": "conclude with (以…结束)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90254,
    "word": "concrete",
    "phonetic": "/kɵnˈkɹiːt/",
    "meaning": "adj 具体的",
    "example": "reinforced concrete (n. 钢筋混凝土)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90255,
    "word": "condense",
    "phonetic": "/kənˈdɛns/",
    "meaning": "vt 使冷凝， 使凝结； 浓缩， 压缩， 简缩",
    "example": "condense into (把…缩短；把…压缩)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90256,
    "word": "condition",
    "phonetic": "/kənˈdɪʃən/",
    "meaning": "n 状况，状态；环境",
    "example": "present condition (目前的状态)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90257,
    "word": "conduct",
    "phonetic": "/ˈkɒndʌkt/",
    "meaning": "v 引导，管理",
    "example": "conduct oneself (（行为）表现)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90258,
    "word": "confer",
    "phonetic": "/kənˈfɜː/",
    "meaning": "v 授予",
    "example": "confer with (协商；交换意见)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90259,
    "word": "conference",
    "phonetic": "/ˈkɒn.fə.ɹəns/",
    "meaning": "n 会议， 讨论会； 讨论， 商谈",
    "example": "press conference (记者招待会，新闻发布会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90260,
    "word": "confidence",
    "phonetic": "/ˈkɒnfɪdəns/",
    "meaning": "n 私房话，秘密，机密",
    "example": "confidence in (对……信任)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90261,
    "word": "confident",
    "phonetic": "/ˈkɒn.fɪ.dənt/",
    "meaning": "adj 确信的， 肯定的； 自信的",
    "example": "confident in (自信的；确信的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90262,
    "word": "confine",
    "phonetic": "/ˈkɒnfaɪn/",
    "meaning": "v 限制",
    "example": "refine on (精于；改进)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90263,
    "word": "confirm",
    "phonetic": "/kənˈfɜːm/",
    "meaning": "vt 证实， 肯定； 确认； 批准",
    "example": "confirm in (v. 使更坚定)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90264,
    "word": "conflict",
    "phonetic": "/kənˈflɪkt/",
    "meaning": "n 冲突",
    "example": "in conflict with (和…冲突)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90265,
    "word": "conform",
    "phonetic": "/kənˈfɔːm/",
    "meaning": "v 使遵守；一致",
    "example": "conform with (符合；与…一致)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90266,
    "word": "confront",
    "phonetic": "/kɒnˈfɹɒnt/",
    "meaning": "v 使面对；使对证",
    "example": "confront with (使面临)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90267,
    "word": "confuse",
    "phonetic": "/kənˈfjuːz/",
    "meaning": "v 使混淆，迷惑",
    "example": "confuse with (混淆)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90268,
    "word": "congress",
    "phonetic": "/ˈkɒŋˌɡɹɛs/",
    "meaning": "n 代表大会； 国会， 议会",
    "example": "national people's congress (全国人民代表大会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90269,
    "word": "conjunction",
    "phonetic": "/kənˈdʒʌŋkʃən/",
    "meaning": "n 接合，连接；连接词",
    "example": "in conjunction with (连同，共同；与…协力)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90270,
    "word": "connect",
    "phonetic": "/kəˈnɛkt/",
    "meaning": "v 连接，连结；联系",
    "example": "connect with (连接；与…联系)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90271,
    "word": "conquer",
    "phonetic": "/ˈkɒŋkə/",
    "meaning": "v 征服",
    "example": "divide and conquer (分而治之；各个击破)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90272,
    "word": "conscious",
    "phonetic": "/ˈkɒn.ʃəs/",
    "meaning": "adj 意识到的， 自觉的； 神志清醒的； 有意的， 存心的",
    "example": "conscious of (意识到)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90273,
    "word": "consecutive",
    "phonetic": "/kɒnsɛkjʊtɪv/",
    "meaning": "adj 连续的， 连贯的",
    "example": "consecutive days (连续营业日；连续作业日)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90274,
    "word": "consensus",
    "phonetic": "/kənˈsen.səs/",
    "meaning": "n 共识，一致",
    "example": "reach a consensus (达成共识)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90275,
    "word": "consent",
    "phonetic": "/kənˈsɛnt/",
    "meaning": "n 同意",
    "example": "informed consent (知情同意，知会同意；知后同意)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90276,
    "word": "consequence",
    "phonetic": "/ˈkɒnsɪkwɛns/",
    "meaning": "n 重要（性），重大意义",
    "example": "as a consequence (因此，结果)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90277,
    "word": "conservative",
    "phonetic": "/kənˈsɜːvətɪv/",
    "meaning": "adj 保守的",
    "example": "conservative party (n. 保守党)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90278,
    "word": "considerable",
    "phonetic": "/kənˈsɪdəɹəbl̩/",
    "meaning": "adj 相当多的",
    "example": "be considerate of (体谅)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90279,
    "word": "considerate",
    "phonetic": "/kənˈsɪdəɹət/",
    "meaning": "adj 考虑周到的， 体贴的， 体谅的",
    "example": "be considerate of (体谅)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90280,
    "word": "consist",
    "phonetic": "/kənˈsɪst/",
    "meaning": "vi 由…组成； 在于； 一致",
    "example": "consist of (由…构成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90281,
    "word": "consistent",
    "phonetic": "/kənˈsɪstənt/",
    "meaning": "adj 一致的",
    "example": "consistent with (符合；与…一致)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90282,
    "word": "console",
    "phonetic": "/ˈkɒn.səʊl/",
    "meaning": "v 安慰",
    "example": "game console (游戏机；游戏控制器)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90283,
    "word": "consolidate",
    "phonetic": "/kənˈsɒlɪdeɪt/",
    "meaning": "v 巩固；合并",
    "example": "solid foundation (基础雄厚；实体基础)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90284,
    "word": "conspicuous",
    "phonetic": "/kənˈspɪk.ju.əs/",
    "meaning": "adj 显著的",
    "example": "conspicuous consumption (炫耀性消费；摆阔，挥霍)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90285,
    "word": "constant",
    "phonetic": "/ˈkɒnstənt/",
    "meaning": "adj 不断的",
    "example": "constant temperature (恒温；定温；等温)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90286,
    "word": "constituent",
    "phonetic": "/kənˈstɪt.ju.ənt/",
    "meaning": "adj 构成的；n 选民",
    "example": "constituent structure (句子结构；成分结构)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90287,
    "word": "constitute",
    "phonetic": "/ˈkɒnstɪtjuːt/",
    "meaning": "v 构成，组成",
    "example": "constitute a crime (构成犯罪；进行犯罪)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90288,
    "word": "constitution",
    "phonetic": "/ˌkɒnstɪˈtjuːʃən/",
    "meaning": "n （人的）体格，素质",
    "example": "chemical constitution (化学结构；化学组成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90289,
    "word": "constrain",
    "phonetic": "/kənˈstɹeɪn/",
    "meaning": "v 限制",
    "example": "strain rate (应变速率；应变率；变形速度)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90290,
    "word": "construct",
    "phonetic": "/ˈkɒn.stɹʌkt/",
    "meaning": "vt 建造； 构思；n 建筑物； 构想； 观念",
    "example": "construct validity (结构效度；建构效度)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90291,
    "word": "consult",
    "phonetic": "/kənˈsʌlt/",
    "meaning": "v 咨询",
    "example": "consult with (商量，协商)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90292,
    "word": "consume",
    "phonetic": "/kənˈsjuːm/",
    "meaning": "vi 消灭， 毁灭；vt 消费；吃完，喝光",
    "example": "propensity to consume (消费倾向)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90293,
    "word": "consumer",
    "phonetic": "/kənˈsjuːmə/",
    "meaning": "n 消费者，用户",
    "example": "consumer goods (生活消费品，日用消费品)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90294,
    "word": "contact",
    "phonetic": "/ˈkɒn.tækt/",
    "meaning": "n 接触，联系，交往；vt 与…接触， 与…取得联系",
    "example": "contact us (联系我们；联络我们；联系方式)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90295,
    "word": "contain",
    "phonetic": "/kənˈteɪn/",
    "meaning": "v 包含，容纳；等于",
    "example": "said to contain (据称内装)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90296,
    "word": "contemporary",
    "phonetic": "/kənˈtɛm.p(ə).ɹi/",
    "meaning": "adj 现代的， 当代的； 同时代的",
    "example": "contemporary art (当代艺术)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90297,
    "word": "contempt",
    "phonetic": "/kənˈtɛmpt/",
    "meaning": "n 轻视， 蔑视",
    "example": "contempt of court (蔑视法庭；对法院的藐视罪)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90298,
    "word": "contend",
    "phonetic": "/kənˈtɛnd/",
    "meaning": "v 竞争；坚决主张",
    "example": "contend with (对付；与…作斗争)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90299,
    "word": "contest",
    "phonetic": "/ˈkɒn.tɛst/",
    "meaning": "n 竞赛， 争夺；vt 争夺， 与…竞争； 对…提出质疑， 辩驳",
    "example": "speech contest (演讲比赛)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90300,
    "word": "context",
    "phonetic": "/ˈkɒntɛkst/",
    "meaning": "n 上下文；来龙去脉",
    "example": "in the context of (在…情况下；在…背景下)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90301,
    "word": "continual",
    "phonetic": "/kənˈtɪnjuəl/",
    "meaning": "adj 连续的； 频频的",
    "example": "continual improvement (持续改进)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90302,
    "word": "continue",
    "phonetic": "/kənˈtɪnjuː/",
    "meaning": "v 继续，连续；延伸",
    "example": "continue with (继续做)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90303,
    "word": "continuous",
    "phonetic": "/kənˈtɪn.juː.əs/",
    "meaning": "adj 连续不断的，持续的",
    "example": "continuous casting (全连铸；连续浇铸)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90304,
    "word": "contract",
    "phonetic": "/ˈkɒntɹækt/",
    "meaning": "v 缩小； 订合同； 感染， 染上；n 契约， 合同",
    "example": "contract with (承包；与…订有合约)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90305,
    "word": "contradict",
    "phonetic": "/kɒntɹəˈdɪkt/",
    "meaning": "v 反驳，否认",
    "example": "contradict oneself (自相矛盾)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90306,
    "word": "contrary",
    "phonetic": "/ˈkɒntɹəɹi/",
    "meaning": "adj 相反的",
    "example": "on the contrary (正相反)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90307,
    "word": "contrast",
    "phonetic": "/ˈkɒntɹɑːst/",
    "meaning": "v 使对比；形成对比",
    "example": "in contrast (与此相反；比较起来)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90308,
    "word": "control",
    "phonetic": "/kənˈtɹəʊl/",
    "meaning": "v 控制，克制；n 控制",
    "example": "control system (控制系统)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90309,
    "word": "convenience",
    "phonetic": "/kənˈviːnɪəns/",
    "meaning": "n 方便； 便利设施",
    "example": "for the convenience of (为了…的方便)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90310,
    "word": "convenient",
    "phonetic": "/kənˈviːniənt/",
    "meaning": "adj 方便的",
    "example": "convenient for (adj. 便于…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90311,
    "word": "convention",
    "phonetic": "/kənˈvɛn.ʃən/",
    "meaning": "n 公约，（换俘等）协定",
    "example": "international convention (国际惯例；国际公约；国际协定)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90312,
    "word": "conventional",
    "phonetic": "/kənˈvɛnʃənl/",
    "meaning": "adj 传统的",
    "example": "conventional method (常规方法；习用方法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90313,
    "word": "converge",
    "phonetic": "/kən.ˈvɜːdʒ/",
    "meaning": "vi 会合， 互相靠拢； 聚集， 集中； 趋近",
    "example": "on the verge of (濒临于；接近于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90314,
    "word": "conversation",
    "phonetic": "/ˌkɒn.vəˈseɪ.ʃən/",
    "meaning": "n 会话，非正式会谈",
    "example": "in conversation (在谈话；交谈中)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90315,
    "word": "convert",
    "phonetic": "/ˈkɒn.vəːt/",
    "meaning": "v 转换，改变",
    "example": "convert into (使转变；把…转化成；折合)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90316,
    "word": "convince",
    "phonetic": "/kənˈvɪns/",
    "meaning": "v 使……相信",
    "example": "guangdong province (（中国）广东省)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90317,
    "word": "cooperate",
    "phonetic": "/koʊˈɒpəɹeɪt/",
    "meaning": "v 合作，协作；配合",
    "example": "cooperate with (与…合作)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90318,
    "word": "coordinate",
    "phonetic": "/kəʊˈɔː.dɪ.nət/",
    "meaning": "adj 同等的",
    "example": "coordinate system ([数]坐标系)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90319,
    "word": "copper",
    "phonetic": "/ˈkɔp.ə/",
    "meaning": "n 铜；铜币，铜制器",
    "example": "copper mine (铜矿)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90320,
    "word": "core",
    "phonetic": "/kɔː/",
    "meaning": "n 果实的心，核心",
    "example": "core competence (核心竞争力；核心才能)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90321,
    "word": "corporate",
    "phonetic": "/ˈkɔːp(ə)ɹət/",
    "meaning": "adj 法人团体的， 公司的； 全体的， 共同的",
    "example": "corporate governance (公司治理；企业管治，企业治理；公司管治)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90322,
    "word": "corporation",
    "phonetic": "/ˌkɔː.pəˈreɪ.ʃən/",
    "meaning": "n 公司，企业；社团",
    "example": "transnational corporation (跨国公司)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90323,
    "word": "correspond",
    "phonetic": "/ˌkɒɹəˈspɒnd/",
    "meaning": "v 相符合；相当",
    "example": "correspond with (符合，一致；与……通信)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90324,
    "word": "corridor",
    "phonetic": "/ˈkɒɹɪˌdɔː(ɹ)/",
    "meaning": "n 走廊，回廊，通路",
    "example": "long corridor (长廊（颐和园旅游景点之一）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90325,
    "word": "corrupt",
    "phonetic": "/kəˈɹʌpt/",
    "meaning": "v 使腐化；adj 腐败的",
    "example": "corrupt practice (弊端；行贿；舞弊行为)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90326,
    "word": "costume",
    "phonetic": "/ˈkɒs.tjuːm/",
    "meaning": "n 服装",
    "example": "costume jewelry (（用作服饰的）人造珠宝)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90327,
    "word": "counsel",
    "phonetic": "/ˈkaʊn.səl/",
    "meaning": "v 建议，忠告",
    "example": "legal counsel (法律顾问；法律指导)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90328,
    "word": "counter",
    "phonetic": "/ˈkaʊntə/",
    "meaning": "adv 相反地；adj 相反的",
    "example": "counter measure (对策；防范措施；反措施)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90329,
    "word": "courage",
    "phonetic": "/ˈkʌɹɪdʒ/",
    "meaning": "n 勇气，胆量，胆识",
    "example": "moral courage (道德勇气，道义勇气)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90330,
    "word": "coward",
    "phonetic": "/ˈkaʊəd/",
    "meaning": "adj 懦怯的，胆小的",
    "example": "reward for (因…的酬谢；作为…的回报)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90331,
    "word": "cradle",
    "phonetic": "/ˈkreɪ.dəl/",
    "meaning": "n 摇篮；发源地",
    "example": "in the cradle (在摇篮里；在婴儿时期；初期)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90332,
    "word": "craft",
    "phonetic": "/kɹɑːft/",
    "meaning": "n 手艺；v 精巧地制作",
    "example": "craft brother (n. 同行)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90333,
    "word": "crash",
    "phonetic": "/kɹæʃ/",
    "meaning": "v （发出巨响的） 猛撞",
    "example": "car crash (车祸；汽车碰撞)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90334,
    "word": "crawl",
    "phonetic": "/kɹɔl/",
    "meaning": "n&v 爬行， 蠕动； 缓慢行进",
    "example": "crawl space (慢行通过的空间；供电线或水管等通过的槽隙)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90335,
    "word": "crazy",
    "phonetic": "/ˈkɹeɪzi/",
    "meaning": "adj 疯狂的，荒唐的",
    "example": "crazy about (热衷，着迷；狂热的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90336,
    "word": "creative",
    "phonetic": "/kɹiˈeɪtɪv/",
    "meaning": "adj 创造性的，创作的",
    "example": "creative thinking (创造性思维)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90337,
    "word": "credit",
    "phonetic": "/ˈkɹɛdɪt/",
    "meaning": "v 相信，信任；n 相信，信任",
    "example": "credit card (信用卡；记帐卡)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90338,
    "word": "creep",
    "phonetic": "/kɹiːp/",
    "meaning": "v 爬行；缓慢地行进",
    "example": "creep deformation (蠕变)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90339,
    "word": "crew",
    "phonetic": "/kruː/",
    "meaning": "n 机组人员",
    "example": "crew member (乘务员)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90340,
    "word": "crime",
    "phonetic": "/kɹaɪm/",
    "meaning": "n 罪， 罪行， 犯罪",
    "example": "crime rate (犯罪率)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90341,
    "word": "criminal",
    "phonetic": "/ˈkɹɪmənəl/",
    "meaning": "adj 犯罪的；n 罪犯",
    "example": "criminal law (刑法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90342,
    "word": "crisis",
    "phonetic": "/ˈkɹaɪsɪs/",
    "meaning": "n 危机；转折点",
    "example": "financial crisis (金融危机；财政危机)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90343,
    "word": "criteria",
    "phonetic": "/kɹaɪˈtɪəɹ.i.ə/",
    "meaning": "n 标准",
    "example": "evaluation criteria (评估标准；评定标准)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90344,
    "word": "critic",
    "phonetic": "/ˈkɹɪt.ɪk/",
    "meaning": "n 批评家， 爱挑剔的人",
    "example": "art critic (艺术评论家)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90345,
    "word": "critical",
    "phonetic": "/ˈkɹɪtɪkəl/",
    "meaning": "adj 挑剔的，批评的；关键的",
    "example": "critical point (临界点)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90346,
    "word": "criticize",
    "phonetic": "/ˈkɹɪtɪsaɪz/",
    "meaning": "vt 批评， 评论， 非难",
    "example": "literary criticism (n. 文艺评论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90347,
    "word": "crude",
    "phonetic": "/kɹʉd/",
    "meaning": "adj 简陋的；天然的",
    "example": "crude oil ([化]原油)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90348,
    "word": "cruel",
    "phonetic": "/kɹuː(ə)l/",
    "meaning": "adj 残忍的，残酷的",
    "example": "extremely cruel (极其残忍；惨绝人寰)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90349,
    "word": "cruise",
    "phonetic": "/kruːz/",
    "meaning": "v 巡航，巡航于…",
    "example": "tom cruise (汤姆·克鲁斯（美国著名影星）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90350,
    "word": "crush",
    "phonetic": "/kɹʌʃ/",
    "meaning": "v 压碎，压榨",
    "example": "get a crush on (迷恋)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90351,
    "word": "cue",
    "phonetic": "/kjuː/",
    "meaning": "n 暗示，信号；提示；vt 提示； 暗示",
    "example": "on cue (恰好在这个时候)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90352,
    "word": "culminate",
    "phonetic": "/ˈkʌlmɪneɪt/",
    "meaning": "vi 告终",
    "example": "culminate in (达到顶点；以…告终)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90353,
    "word": "cultivate",
    "phonetic": "/ˈkʌltɪveɪt/",
    "meaning": "v 培养",
    "example": "cultivate talents (培养人才)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90354,
    "word": "culture",
    "phonetic": "/ˈkʌlt͡ʃə/",
    "meaning": "n 文化， 文明； 教养； 培养； 培养菌",
    "example": "traditional culture (传统文化)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90355,
    "word": "cumulative",
    "phonetic": "/ˈkjuːmjʊlətɪv/",
    "meaning": "adj 积累的",
    "example": "cumulative effect (累积效应；蓄积作用)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90356,
    "word": "curb",
    "phonetic": "/kɜːb/",
    "meaning": "v 限制，控制",
    "example": "curb inflation (抑制通货膨胀)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90357,
    "word": "cure",
    "phonetic": "/kɜː(ɹ)/",
    "meaning": "v 医治；消除；n 治愈",
    "example": "(prevention and) cure (防治)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90358,
    "word": "curious",
    "phonetic": "/ˈkjɔː-/",
    "meaning": "adj 好奇的",
    "example": "curious about (好奇；想知道)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90359,
    "word": "currency",
    "phonetic": "/ˈkʌɹ.ən.si/",
    "meaning": "n 货币",
    "example": "foreign currency (n. 外币)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90360,
    "word": "current",
    "phonetic": "/ˈkʌɹənt/",
    "meaning": "adj 当前的，通用的；流行的，流传的；n 潮流； 电流； 趋势， 倾向",
    "example": "current situation (现状，目前形势；现况)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90361,
    "word": "curriculum",
    "phonetic": "/kəˈɹɪk.jə.ləm/",
    "meaning": "n 课程",
    "example": "curriculum reform (课程改革)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90362,
    "word": "curse",
    "phonetic": "/kɜːs/",
    "meaning": "v 诅咒，咒骂，天谴；n 祸害， 祸根； 咒骂， 诅咒， 咒语",
    "example": "be cursed with (深受…之害；因…而遭殃)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90363,
    "word": "cushion",
    "phonetic": "/ˈkʊʃən/",
    "meaning": "n 垫子，坐垫，靠垫",
    "example": "air cushion (气垫)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90364,
    "word": "custom",
    "phonetic": "/ˈkʌstəm/",
    "meaning": "n 海关",
    "example": "folk custom (n. 民间习俗)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90365,
    "word": "damage",
    "phonetic": "/ˈdæmɪdʒ/",
    "meaning": "v 损害，毁坏；n 损害",
    "example": "serious damage (严重损害；严重损坏)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90366,
    "word": "deadline",
    "phonetic": "/ˈdɛdˌlaɪn/",
    "meaning": "n 最后期限",
    "example": "meet the deadline (赶上最后期限；按期完成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90367,
    "word": "debate",
    "phonetic": "/dɪˈbeɪt/",
    "meaning": "n&v 争论， 辩论",
    "example": "debate on (关于…进行辩论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90368,
    "word": "decade",
    "phonetic": "/dəˈkeɪd/",
    "meaning": "n 十年， 十年期",
    "example": "over the past decade (在过去的十年里)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90369,
    "word": "decay",
    "phonetic": "/dɪˈkeɪ/",
    "meaning": "v 使腐朽，使腐烂",
    "example": "tooth decay (蛀牙；龋齿；齵齿)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90370,
    "word": "deceive",
    "phonetic": "/dɪˈsiːv/",
    "meaning": "vi 行骗；vt 欺骗，蒙蔽",
    "example": "deceive oneself (自欺；误解，想错)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90371,
    "word": "decent",
    "phonetic": "/ˈdiːsənt/",
    "meaning": "adj 体面的",
    "example": "incentive mechanism (激励机制)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90372,
    "word": "decide",
    "phonetic": "/dɪˈsaɪd/",
    "meaning": "v 决定，决心；解决",
    "example": "decide on (决定；选定)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90373,
    "word": "decision",
    "phonetic": "/dɪˈsɪʒən/",
    "meaning": "n 决定，决心；果断",
    "example": "decision making (判定，决策)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90374,
    "word": "decisive",
    "phonetic": "/dɪˈsaɪsɪv/",
    "meaning": "adj 决定性的",
    "example": "decisive factor (决定性因素)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90375,
    "word": "declare",
    "phonetic": "/dɪˈkleə/",
    "meaning": "v 断言；声明；表明",
    "example": "declare oneself (显露身分；发表意见)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90376,
    "word": "decline",
    "phonetic": "/dɪˈklaɪn/",
    "meaning": "v 拒绝",
    "example": "on the decline (在走下坡路；在衰退中)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90377,
    "word": "decorate",
    "phonetic": "/ˈdɛkəɹeɪt/",
    "meaning": "vt 装饰， 装潢， 修饰",
    "example": "decorate with (以…来装饰)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90378,
    "word": "decrease",
    "phonetic": "/dɪˈkriːs/",
    "meaning": "v 减少；n [dI'kriːs]",
    "example": "on the decrease (在减少中)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90379,
    "word": "dedicate",
    "phonetic": "/ˈdɛdɪkeɪt/",
    "meaning": "v 奉献；献身",
    "example": "prediction model (预测模型；推算模型)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90380,
    "word": "deduce",
    "phonetic": "/dɪˈdjuːs/",
    "meaning": "vt 推论， 推断， 演绎",
    "example": "deduce from (推断；从…得出结论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90381,
    "word": "defeat",
    "phonetic": "/dɪˈfiːt/",
    "meaning": "n&vt 战胜， 挫败",
    "example": "suffer defeat (遭受失败)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90382,
    "word": "defect",
    "phonetic": "/dɪˈfekt/",
    "meaning": "n 缺点",
    "example": "zero defect (零缺陷；零缺点；无差错)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90383,
    "word": "defend",
    "phonetic": "/dɪˈfɛnd/",
    "meaning": "v 保卫，防守",
    "example": "defend oneself (自卫；申辩；自行辩护)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90384,
    "word": "deficit",
    "phonetic": "/ˈdɛfɪsɪt/",
    "meaning": "n 赤字",
    "example": "trade deficit (n. 贸易逆差；贸易赤字)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90385,
    "word": "define",
    "phonetic": "/dɪˈfaɪn/",
    "meaning": "v 规定；立（界限）",
    "example": "define as (vt. 解释为)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90386,
    "word": "definite",
    "phonetic": "/ˈdɛfɪnɪt/",
    "meaning": "adj 一定的，确切的",
    "example": "definite integral (定积分)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90387,
    "word": "definition",
    "phonetic": "/ˌdɛfɪˈnɪʃ(ə)n/",
    "meaning": "n 定义， 释义， 定界； 清晰， 鲜明",
    "example": "definition of (定义)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90388,
    "word": "degrade",
    "phonetic": "/diˈɡɹeɪd/",
    "meaning": "v 使降低；使堕落",
    "example": "high grade (高品位；高级的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90389,
    "word": "delay",
    "phonetic": "/dɪˈleɪ/",
    "meaning": "v 推迟，延期",
    "example": "without delay (立即；毫不迟延地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90390,
    "word": "deliberate",
    "phonetic": "/dɪˈlɪb.ər.ət/",
    "meaning": "adj 故意的",
    "example": "take time to deliberate (做事要深思熟虑)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90391,
    "word": "delicate",
    "phonetic": "/ˈdɛlɪkət/",
    "meaning": "adj 精细的，细微的",
    "example": "delicate balance (微妙的平衡)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90392,
    "word": "delicious",
    "phonetic": "/dɪˈlɪʃəs/",
    "meaning": "adj 美味的，怡人的",
    "example": "delicious food (美味食品)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90393,
    "word": "delight",
    "phonetic": "/dəˈlaɪt/",
    "meaning": "n 高兴",
    "example": "delight in (因…感到快乐)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90394,
    "word": "deliver",
    "phonetic": "/dɪˈlɪvə(ɹ)/",
    "meaning": "v 发表，递送",
    "example": "deliver the goods (交货；履行诺言)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90395,
    "word": "demand",
    "phonetic": "/dɪˈmɑːnd/",
    "meaning": "vt 要求，需要；询问；n 要求， 需要",
    "example": "demand of (v. 要求；向…索取)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90396,
    "word": "democracy",
    "phonetic": "/dɪˈmɒkɹəsi/",
    "meaning": "n 民主",
    "example": "social democracy (n. 社会主义；社会民主主义)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90397,
    "word": "demonstrate",
    "phonetic": "/ˈdɛmənstɹeɪt/",
    "meaning": "vt 说明， 论证； 表露",
    "example": "demonstration project (示范项目，示范工程)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90398,
    "word": "dense",
    "phonetic": "/dɛns/",
    "meaning": "adj 密集的；浓厚的",
    "example": "dense fog (浓雾)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90399,
    "word": "deny",
    "phonetic": "/dɪˈnaɪ/",
    "meaning": "v 否认",
    "example": "deny oneself (节制；戒除)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90400,
    "word": "depart",
    "phonetic": "/dɪˈpɑːt/",
    "meaning": "v 离开，起程；出发",
    "example": "depart from (离开；开出；从……出发)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90401,
    "word": "departure",
    "phonetic": "/dɪˈpɑː(ɹ)tjə(ɹ)/",
    "meaning": "n 离开，出发，起程",
    "example": "departure from (离开；违反，违背)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90402,
    "word": "depend",
    "phonetic": "/dɪˈpɛnd/",
    "meaning": "v 依靠，依赖；相信",
    "example": "depend on (取决于；依赖；依靠)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90403,
    "word": "dependent",
    "phonetic": "/dɪˈpɛndənt/",
    "meaning": "adj 依靠的，依赖的",
    "example": "dependent on (依赖于；依靠)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90404,
    "word": "deposit",
    "phonetic": "/dɪˈpɒzɪt/",
    "meaning": "v 存放；n 存款",
    "example": "ore deposit (矿床；矿层)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90405,
    "word": "depress",
    "phonetic": "/dɪˈpɹɛs/",
    "meaning": "vt 使沮丧， 使不景气； 按下",
    "example": "press conference (记者招待会，新闻发布会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90406,
    "word": "deprive",
    "phonetic": "/dɪˈpɹaɪv/",
    "meaning": "v 剥夺",
    "example": "deprive of (vt. 剥夺；失去)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90407,
    "word": "derive",
    "phonetic": "/dəˈɹaɪv/",
    "meaning": "v 获得",
    "example": "derive from (源出，来自，得自；衍生于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90408,
    "word": "descend",
    "phonetic": "/dɪˈsɛnd/",
    "meaning": "vi 下来，下降；vt 走下， 爬下",
    "example": "descend from (由…传下来的；起源于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90409,
    "word": "describe",
    "phonetic": "/dəˈskɹaɪb/",
    "meaning": "vt 形容， 描写； 画出",
    "example": "describe as (v. 描述为)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90410,
    "word": "description",
    "phonetic": "/dɪˈskɹɪpʃən/",
    "meaning": "n 描写，形容；种类",
    "example": "detailed description (详细描述；详细说明)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90411,
    "word": "deserve",
    "phonetic": "/dɪˈzɜːv/",
    "meaning": "v 值得",
    "example": "preserve food (保藏食物)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90412,
    "word": "design",
    "phonetic": "/dɪˈzaɪn/",
    "meaning": "vt 设计；预定，指定；n 设计， 构想； 图样； 企图",
    "example": "design method (设计方法，设计法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90413,
    "word": "designate",
    "phonetic": "/ˈdɛzɪɡ.neɪt/",
    "meaning": "v 指定，委派",
    "example": "resign from (辞职)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90414,
    "word": "desire",
    "phonetic": "/dɪˈzaɪə/",
    "meaning": "vt 想要，渴望；n 愿望， 欲望",
    "example": "desire for (渴望)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90415,
    "word": "despair",
    "phonetic": "/dɪˈspɛə(ɹ)/",
    "meaning": "n 绝望；v 绝望",
    "example": "in despair (绝望地，失望地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90416,
    "word": "desperate",
    "phonetic": "/ˈdɛsp(ə)ɹət/",
    "meaning": "adj 绝望的，不顾一切的",
    "example": "common prosperity (共同繁荣；共同富裕)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90417,
    "word": "despite",
    "phonetic": "/dɪˈspaɪt/",
    "meaning": "prep 不管， 不顾",
    "example": "despite of (不管；不顾)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90418,
    "word": "destination",
    "phonetic": "/dɛstɪˈneɪʃən/",
    "meaning": "n 目的地",
    "example": "tourist destination (旅游胜地；旅游目的地；旅游景点)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90419,
    "word": "destiny",
    "phonetic": "/ˈdɛstɪni/",
    "meaning": "n 命运，天数",
    "example": "manifest destiny (天定命运)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90420,
    "word": "destruction",
    "phonetic": "/ˌdɪsˈtɹʌkʃən/",
    "meaning": "n 破坏， 毁灭； 消灭",
    "example": "destruction of (摧毁)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90421,
    "word": "detach",
    "phonetic": "/dəˈtætʃ/",
    "meaning": "v 分开；派遣（军队）",
    "example": "detach from (从…分离；拆卸)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90422,
    "word": "detail",
    "phonetic": "/ˈdiːteɪl/",
    "meaning": "n 琐碎，小事",
    "example": "in detail (详细地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90423,
    "word": "detain",
    "phonetic": "/dɪˈteɪn/",
    "meaning": "v 扣押，拘留；耽搁",
    "example": "said to contain (据称内装)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90424,
    "word": "detect",
    "phonetic": "/dɪˈtɛkt/",
    "meaning": "v 发现",
    "example": "detective story (侦探小说)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90425,
    "word": "deteriorate",
    "phonetic": "/dɪˈtɪəɹɪəɹeɪt/",
    "meaning": "v 恶化",
    "example": "environmental deterioration (环境恶化)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90426,
    "word": "develop",
    "phonetic": "/dɛˈvɛ.ləp/",
    "meaning": "v 使（底片）显影",
    "example": "(begin to) develop (开展；（开始）成长)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90427,
    "word": "deviate",
    "phonetic": "/ˈdiːvi.ət/",
    "meaning": "v 偏离",
    "example": "deviate from (偏离；脱离)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90428,
    "word": "device",
    "phonetic": "/dəˈvaɪs/",
    "meaning": "n 器械， 装置； 设计； 手段， 策略",
    "example": "control device (控制装置，控制器)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90429,
    "word": "devise",
    "phonetic": "/dɪˈvaɪz/",
    "meaning": "vt 设计， 发明",
    "example": "supervise the manufacture of (监制)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90430,
    "word": "devote",
    "phonetic": "/dɪˈvəʊt/",
    "meaning": "vt 将…奉献给， 把…专用",
    "example": "vote for (投票赞成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90431,
    "word": "diagram",
    "phonetic": "/ˈdaɪ.ə.ɡɹæm/",
    "meaning": "n 图解，图表，简图",
    "example": "block diagram (框图；方块图)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90432,
    "word": "dialect",
    "phonetic": "/ˈdaɪ.əˌlɛkt/",
    "meaning": "n 方言，土语，地方话",
    "example": "chinese dialect (中国方言)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90433,
    "word": "differentiate",
    "phonetic": "/dɪf.əˈɹɛn.ʃi.eɪt/",
    "meaning": "vi 区分，区别；vt 区分， 区别； 使不同， 使有差异",
    "example": "differentiate from (将…区别开来)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90434,
    "word": "diffuse",
    "phonetic": "/dɪˈfjuːz/",
    "meaning": "v 扩散， 弥漫； 传播， 散布；adj 冗长的， 漫无边际的； 四散的， 弥漫的",
    "example": "diffuse reflectance (漫反射率；漫反射系数；护散反射率)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90435,
    "word": "digital",
    "phonetic": "/ˈdɪd͡ʒɪtəɫ/",
    "meaning": "adj 数字的，计数的",
    "example": "digital library (数字图书馆)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90436,
    "word": "dilemma",
    "phonetic": "/daɪˈlɛmə/",
    "meaning": "n 窘境， 困境",
    "example": "in a dilemma (进退两难，左右为难)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90437,
    "word": "dimension",
    "phonetic": "/daɪˈmɛnʃən/",
    "meaning": "n 尺寸；维",
    "example": "fractal dimension (分形维数；碎形維度)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90438,
    "word": "diminish",
    "phonetic": "/dɪˈmɪnɪʃ/",
    "meaning": "v 减少",
    "example": "diminish inflammation (消炎)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90439,
    "word": "diplomat",
    "phonetic": "/ˈdɪ.plə.mæt/",
    "meaning": "n 外交官， 外交家； 有交际手腕的人， 圆滑的人",
    "example": "career diplomat (职业外交家)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90440,
    "word": "disagree",
    "phonetic": "/dɪsəˈɡɹiː/",
    "meaning": "v 有分歧；不一致",
    "example": "disagree with (不同意；不一致；不适合)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90441,
    "word": "disappear",
    "phonetic": "/dɪsəˈpiːɹ/",
    "meaning": "v 消失",
    "example": "disappear from (从…处消失)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90442,
    "word": "disappoint",
    "phonetic": "/dɪsəˈpɔɪnt/",
    "meaning": "v 使失望，使受挫折",
    "example": "make an appointment (约会，预约)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90443,
    "word": "disaster",
    "phonetic": "/dɪˈzæs.tə/",
    "meaning": "n 灾难， 灾祸， 天灾； 彻底的失败",
    "example": "natural disaster (自然灾难，自然灾害)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90444,
    "word": "discern",
    "phonetic": "/dɪˈsɜːn/",
    "meaning": "v 识别",
    "example": "concern oneself (◎从事,忙于(常与with, about, in, over连用))",
    "level": "CET4_HIGH"
  },
  {
    "id": 90445,
    "word": "discharge",
    "phonetic": "/ˈdɪstʃɑːdʒ/",
    "meaning": "v 释放，排出；卸货；n 释放， 放电",
    "example": "discharge of (v. 卸下)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90446,
    "word": "discipline",
    "phonetic": "/ˈdɪ.sə.plɪn/",
    "meaning": "n 学科",
    "example": "academic discipline (n. 学术科目)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90447,
    "word": "disclose",
    "phonetic": "/dɪsˈkləʊz/",
    "meaning": "vt 揭露， 泄露， 透露",
    "example": "pay close attention to (密切注意)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90448,
    "word": "discount",
    "phonetic": "/dɪsˈkaʊnt/",
    "meaning": "n 折扣；v 打折扣卖",
    "example": "at a discount (打折扣；不受欢迎，没销路)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90449,
    "word": "discourage",
    "phonetic": "/dɪsˈkʌɹɪd͡ʒ/",
    "meaning": "v 阻止；使气馁",
    "example": "encourage investment (鼓励投资)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90450,
    "word": "discourse",
    "phonetic": "/dɪsˈkɔː(ɹ)s/",
    "meaning": "n 讲话，演说，讲道",
    "example": "discourse analysis (话语分析)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90451,
    "word": "discover",
    "phonetic": "/dɪsˈkʊvə/",
    "meaning": "v 发现",
    "example": "recover from (恢复；恢复知觉)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90452,
    "word": "discriminate",
    "phonetic": "/dɪsˈkɹɪmɪneɪt/",
    "meaning": "v 歧视；区别",
    "example": "discriminate against (歧视；排斥)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90453,
    "word": "discuss",
    "phonetic": "/dɪsˈkʊs/",
    "meaning": "v 讨论，谈论；论述",
    "example": "discuss with (商洽；与…谈论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90454,
    "word": "disease",
    "phonetic": "/dɪˈziːz/",
    "meaning": "n 病， 疾病； 不健全， 弊端",
    "example": "heart disease (心脏病)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90455,
    "word": "disguise",
    "phonetic": "/dɪsˈɡaɪz/",
    "meaning": "vt 假扮，化装，伪装；掩盖，掩饰；n 用来伪装的东西； 伪装， 掩饰",
    "example": "in disguise (伪装；乔装)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90456,
    "word": "disgust",
    "phonetic": "/dɪsˈɡʌst/",
    "meaning": "n&vt 厌恶， 憎恶",
    "example": "in disgust (厌恶的；讨厌)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90457,
    "word": "dishonest",
    "phonetic": "/dɪˈsɒnɪst/",
    "meaning": "adj 不诚实的",
    "example": "honest man (诚实的人；正直的人)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90458,
    "word": "disillusion",
    "phonetic": "/dɪs.ɪˈluːʒən/",
    "meaning": "v 觉醒，使觉醒",
    "example": "optical illusion (视错觉，错视；光幻觉)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90459,
    "word": "dislike",
    "phonetic": "/dɪsˈlaɪk/",
    "meaning": "vt&n 不喜爱，厌恶",
    "example": "(strongly) dislike (反感；不喜欢)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90460,
    "word": "dismiss",
    "phonetic": "/dɪsˈmɪs/",
    "meaning": "v 忽视",
    "example": "dismiss from (解雇；开除)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90461,
    "word": "disorder",
    "phonetic": "/dɪsˈɔːdə(ɹ)/",
    "meaning": "n 疾病，小病",
    "example": "in order (整齐，秩序井然；按顺序；状况良好)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90462,
    "word": "dispatch",
    "phonetic": "/dəˈspætʃ/",
    "meaning": "v 发送，派遣",
    "example": "economic dispatch (经济调度；经济分配)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90463,
    "word": "disperse",
    "phonetic": "/dɪˈspɜːs/",
    "meaning": "v （使）分散；驱散",
    "example": "disperse dye (分散染料)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90464,
    "word": "displace",
    "phonetic": "/dɪsˈpleɪs/",
    "meaning": "v 取代",
    "example": "hormone replacement therapy (n. 激素取代疗法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90465,
    "word": "display",
    "phonetic": "/dɪsˈpleɪ/",
    "meaning": "n&vt 陈列， 展览； 显示",
    "example": "on display (展览，公开展出)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90466,
    "word": "disposal",
    "phonetic": "/[dɪsˈpəʊzəɫ]/",
    "meaning": "n 支配；处理",
    "example": "sewage disposal (污水处理)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90467,
    "word": "dispose",
    "phonetic": "/dɪˈspəʊz/",
    "meaning": "v 去掉， 销毁； 处理， 解决； 使倾向于",
    "example": "dispose of (处理；转让；解决；吃光；除掉；卖掉)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90468,
    "word": "dispute",
    "phonetic": "/ˈdɪs.pjuːt/",
    "meaning": "n & v 辩论，争论",
    "example": "dispute resolution ([法律]调解纠纷)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90469,
    "word": "disregard",
    "phonetic": "/dɪsɹɪˈɡɑːd/",
    "meaning": "v 不管，不顾；n 忽视",
    "example": "in disregard of (不顾；无视)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90470,
    "word": "disrupt",
    "phonetic": "/dɪsˈɹʌpt/",
    "meaning": "vt 使中断； 扰乱",
    "example": "interrupt handling (中断处置)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90471,
    "word": "dissolve",
    "phonetic": "/dɪˈzɒlv/",
    "meaning": "v 解除（婚约等）",
    "example": "dissolve in (vt. 溶入)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90472,
    "word": "distant",
    "phonetic": "/ˈdɪstənt/",
    "meaning": "adj 遥远的",
    "example": "distant view (远景)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90473,
    "word": "distinct",
    "phonetic": "/dɪsˈtɪŋkt/",
    "meaning": "adj 清楚的",
    "example": "distinct from (vt. 与……不同)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90474,
    "word": "distinguish",
    "phonetic": "/dɪsˈtɪŋɡwɪʃ/",
    "meaning": "v 使显出特色，使杰出",
    "example": "distinguish oneself (使扬名；使杰出)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90475,
    "word": "distort",
    "phonetic": "/dɪsˈtɔːt/",
    "meaning": "v 扭曲",
    "example": "retort pouch (蒸煮袋；杀菌袋)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90476,
    "word": "distract",
    "phonetic": "/dɪsˈtɹækt/",
    "meaning": "v 分心，分散注意",
    "example": "distract from (转移；使从…分心)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90477,
    "word": "distress",
    "phonetic": "/dɪˈstɹɛs/",
    "meaning": "v 使痛苦，悲痛",
    "example": "in distress (遇难；在困境中)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90478,
    "word": "district",
    "phonetic": "/ˈdɪstɹɪkt/",
    "meaning": "n 区",
    "example": "business district (商务区)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90479,
    "word": "disturb",
    "phonetic": "/dɪsˈtɜːb/",
    "meaning": "v 打扰，扰乱；弄乱",
    "example": "do not disturb (请勿打扰（美国连续剧）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90480,
    "word": "diverge",
    "phonetic": "/daɪˈvɜːdʒ/",
    "meaning": "v 分岔；分歧",
    "example": "diverge from (背道而驰；背离)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90481,
    "word": "divert",
    "phonetic": "/daɪˈvɜːt/",
    "meaning": "v 转移",
    "example": "divert attention from (把注意力从…转移开来；分散注意力)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90482,
    "word": "divide",
    "phonetic": "/dɪˈvaɪd/",
    "meaning": "v 分开",
    "example": "divide into (把……分成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90483,
    "word": "divine",
    "phonetic": "/dɪˈvaɪn/",
    "meaning": "adj 神的；敬神的",
    "example": "divine comedy (n. 神曲（意大利诗人但丁作的叙事诗）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90484,
    "word": "division",
    "phonetic": "/dɪˈvɪʒən/",
    "meaning": "n 分歧",
    "example": "division of labor (劳动力的分工)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90485,
    "word": "divorce",
    "phonetic": "/dɪˈvɔːs/",
    "meaning": "n 离婚，离异；vt 离婚； 分离， 脱离",
    "example": "divorce rate (离婚率)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90486,
    "word": "document",
    "phonetic": "/ˈdɒkjʊmənt/",
    "meaning": "n 文件",
    "example": "document management (文件管理；资料管理)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90487,
    "word": "domestic",
    "phonetic": "/dəˈmɛstɪk/",
    "meaning": "adj 国内的",
    "example": "domestic market (国内市场)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90488,
    "word": "dominant",
    "phonetic": "/ˈdɒmɪnənt/",
    "meaning": "adj 统治的；n 主因",
    "example": "dominant role (主要角色)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90489,
    "word": "dominate",
    "phonetic": "/ˈdɒməˌneɪt/",
    "meaning": "v 主导，主宰",
    "example": "dominate the market (欺行霸市)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90490,
    "word": "donate",
    "phonetic": "/dəʊˈneɪt/",
    "meaning": "vt 捐赠， 赠送",
    "example": "donate money (捐款)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90491,
    "word": "dread",
    "phonetic": "/dɹɛd/",
    "meaning": "vt 担忧，忧虑；惧怕；n 担忧， 畏惧",
    "example": "dread lord (暗黑之主（游戏中任务名称）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90492,
    "word": "duplicate",
    "phonetic": "/ˈdjuː.plɪ.kət/",
    "meaning": "n 副本，复制品",
    "example": "in duplicate (一式二份)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90493,
    "word": "durable",
    "phonetic": "/ˈd(j)ʊəɹəbəl/",
    "meaning": "adj 持久的，耐用的",
    "example": "durable goods (耐用品)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90494,
    "word": "duration",
    "phonetic": "/djʊˈɹeɪʃn̩/",
    "meaning": "n 持续，持久",
    "example": "for the duration (在整个非常时期内)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90495,
    "word": "dynamic",
    "phonetic": "/daɪˈnæ.mɪk/",
    "meaning": "adj 动力的， 动力学的； 动态的； 有活力的， 有生气的",
    "example": "dynamic model (动态模型；动力模型)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90496,
    "word": "earnest",
    "phonetic": "/ˈɜːnɪst/",
    "meaning": "adj 认真的，诚恳的",
    "example": "in earnest (认真的；诚挚地；正经的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90497,
    "word": "eccentric",
    "phonetic": "/ɪkˈsɛntɹɪk/",
    "meaning": "adj 古怪的",
    "example": "eccentric wheel (偏心轮)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90498,
    "word": "echo",
    "phonetic": "/ˈɛkəʊ/",
    "meaning": "v 随声附和，发出回声",
    "example": "radar echo (雷达回波)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90499,
    "word": "ecology",
    "phonetic": "/ɛˈkɒlədʒi/",
    "meaning": "n 生态学；个体生态学",
    "example": "landscape ecology (景观生态学；园林生态)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90500,
    "word": "economic",
    "phonetic": "/ˌiːkəˈnɒmɪk/",
    "meaning": "adj 经济的；经济学的；n 经济学； 经济状况",
    "example": "economic development (经济发展；经济开发)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90501,
    "word": "economy",
    "phonetic": "/iːˈkɒn.ə.mi/",
    "meaning": "n 经济； 节约， 节省",
    "example": "market economy ([经]市场经济)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90502,
    "word": "edge",
    "phonetic": "/ɛdʒ/",
    "meaning": "n 边缘，边；刀口",
    "example": "on the edge of (adv. 几乎；濒于；在…边缘)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90503,
    "word": "edit",
    "phonetic": "/ˈɛdɪt/",
    "meaning": "v 剪辑，编辑",
    "example": "edit box ([计]编辑框)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90504,
    "word": "edition",
    "phonetic": "/əˈdɪʃən/",
    "meaning": "n 版，版本，版次",
    "example": "new edition (修订版，新版；新版本)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90505,
    "word": "editor",
    "phonetic": "/ˈɛdɪtə/",
    "meaning": "n 编辑，编者，校订者",
    "example": "chief editor (总编辑)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90506,
    "word": "educate",
    "phonetic": "/ˈedʒɘkæet/",
    "meaning": "v 教育；培养；训练",
    "example": "higher education (高等教育（指含大学以上的教育）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90507,
    "word": "effective",
    "phonetic": "/əˈfɛktɪv/",
    "meaning": "adj 有效的； 有影响的",
    "example": "effective management (有效管理)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90508,
    "word": "efficiency",
    "phonetic": "/ɪˈfɪʃn̩si/",
    "meaning": "n 效率； 功效， 效能",
    "example": "high efficiency (高效率)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90509,
    "word": "efficient",
    "phonetic": "/əˈfɪʃənt/",
    "meaning": "adj 效率高的； 有能力的",
    "example": "energy efficient (节能)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90510,
    "word": "effort",
    "phonetic": "/ˈɛfət/",
    "meaning": "n 努力；努力的成果",
    "example": "in an effort to (企图（努力想）；试图要)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90511,
    "word": "elaborate",
    "phonetic": "/ɪˈlæbəɹeɪt/",
    "meaning": "adj 复杂的； 精心制作的；v 详述， 详细制定",
    "example": "elaborate on (详细说明)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90512,
    "word": "elastic",
    "phonetic": "/iˈlæstɪk/",
    "meaning": "adj 有弹性的； 灵活的；n 松紧带",
    "example": "elastic modulus ([机]弹性系数；弹性模数)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90513,
    "word": "elderly",
    "phonetic": "/ˈɛldəli/",
    "meaning": "adj 较老的，年长的；n 到了晚年的人， 老年人",
    "example": "elderly persons priority scheme (共享颐年优先配屋计划)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90514,
    "word": "elect",
    "phonetic": "/iːˈlɛkt/",
    "meaning": "v 选举，推选；选择",
    "example": "president elect (当选总统（尚未就职的）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90515,
    "word": "election",
    "phonetic": "/ɪˈlɛkʃ(ə)n/",
    "meaning": "n 选举",
    "example": "presidential election (总统选举；总统大选)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90516,
    "word": "element",
    "phonetic": "/ˈɛlɪmənt/",
    "meaning": "n 成分， 要素， 元素； 基础， 纲要； 自然力",
    "example": "finite element (有限元)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90517,
    "word": "elementary",
    "phonetic": "/(ˌ)ɛlɪ̈ˈmɛnt(ə)ɹɪ/",
    "meaning": "adj 基本的， 初级的",
    "example": "elementary school (小学)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90518,
    "word": "elevate",
    "phonetic": "/ˈɛləveɪt/",
    "meaning": "v 提升，举起；使高兴",
    "example": "elevation angle (仰角；倾斜角；升运角)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90519,
    "word": "eligible",
    "phonetic": "/ˈɛlɪdʒəb(ə)l/",
    "meaning": "adj 适合的；胜任的",
    "example": "eligible for (合格；够资格)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90520,
    "word": "eliminate",
    "phonetic": "/ɪˈlɪməneɪt/",
    "meaning": "v 消除",
    "example": "eliminate poverty (消除贫困)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90521,
    "word": "elite",
    "phonetic": "/eɪˈliːt/",
    "meaning": "n 精英",
    "example": "elite education (精英教育，英才教育)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90522,
    "word": "embark",
    "phonetic": "/ɛmˈbɑːk/",
    "meaning": "vi 上船； 着手， 开始工作",
    "example": "embark on (从事，着手；登上船)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90523,
    "word": "embarrass",
    "phonetic": "/ɪmˈbæ.ɹəs/",
    "meaning": "v 使…陷入困境",
    "example": "feel embarrassed (感到尴尬)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90524,
    "word": "embrace",
    "phonetic": "/ɛmˈbɹeɪs/",
    "meaning": "v 采纳，接受",
    "example": "warm embrace (温暖的拥抱)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90525,
    "word": "emerge",
    "phonetic": "/iˈmɜːd͡ʒ/",
    "meaning": "v 出现",
    "example": "emerge from (自…出现；从…显露出来)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90526,
    "word": "emergency",
    "phonetic": "/ɪˈmɝ.dʒən.si/",
    "meaning": "n 紧急情况， 突然事件",
    "example": "in an emergency (在紧急情况下)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90527,
    "word": "emission",
    "phonetic": "/ɪˈmɪʃn̩/",
    "meaning": "n 散发；传播；发出物",
    "example": "acoustic emission (声发射，声频发射；声发射检验)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90528,
    "word": "emotion",
    "phonetic": "/iˈmoʊʃən/",
    "meaning": "n 情感， 感情； 激动",
    "example": "with emotion (激动地；感动地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90529,
    "word": "emotional",
    "phonetic": "/ɪˈməʊʃnəl/",
    "meaning": "adj 情绪的；容易激动的；感动人的",
    "example": "emotional intelligence (情绪智力；情商；情绪智商)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90530,
    "word": "emperor",
    "phonetic": "/ˈempɘɹɘ/",
    "meaning": "n 皇帝",
    "example": "emperor penguin (n. 皇企鹅)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90531,
    "word": "emphasis",
    "phonetic": "/ˈɛmfəsɪs/",
    "meaning": "n 强调； 重视； 重要性",
    "example": "emphasis on (着重于；对…的强调)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90532,
    "word": "empirical",
    "phonetic": "/ɪmˈpɪɹɪkəl/",
    "meaning": "adj 经验主义的",
    "example": "empirical study (实证研究；经验研究)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90533,
    "word": "employ",
    "phonetic": "/ɛmˈplɔɪ/",
    "meaning": "v 雇用；用；使忙于",
    "example": "employ in (被…雇佣；受聘于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90534,
    "word": "employee",
    "phonetic": "/(ˌ)ɪm-/",
    "meaning": "n 受雇者，雇员，雇工",
    "example": "employee turnover (员工流动；职工离职)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90535,
    "word": "employer",
    "phonetic": "/ɛmplɔɪˈə/",
    "meaning": "n 雇佣者，雇主",
    "example": "equal opportunity employer (招工一视同仁的雇主)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90536,
    "word": "employment",
    "phonetic": "/ɛmˈplɔɪmənt/",
    "meaning": "n 工作； 雇用； 使用",
    "example": "obtain employment (就业，找到工作)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90537,
    "word": "enable",
    "phonetic": "/ɪˈneɪbəl/",
    "meaning": "v 使能够……",
    "example": "will be able to (将能够)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90538,
    "word": "encounter",
    "phonetic": "/ɪnˈkaʊntə/",
    "meaning": "v 遭遇",
    "example": "encounter with (遭遇，遇到)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90539,
    "word": "encourage",
    "phonetic": "/ɪnˈkʌɹɪdʒ/",
    "meaning": "v 鼓励",
    "example": "encourage investment (鼓励投资)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90540,
    "word": "endless",
    "phonetic": "/ˈɛndləs/",
    "meaning": "adj 无限的，没完没了的",
    "example": "endless love (无尽的爱；永无止境的爱)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90541,
    "word": "energy",
    "phonetic": "/ˈɛnəd͡ʒi/",
    "meaning": "n 活力；精力；能",
    "example": "energy consumption ([化]能量损耗)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90542,
    "word": "enforce",
    "phonetic": "/ɪnˈfɔːs/",
    "meaning": "v 强迫，迫使",
    "example": "enforce the law (执法；执行法律)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90543,
    "word": "engage",
    "phonetic": "/ɛnˈɡeɪdʒ/",
    "meaning": "v 忙于，从事；雇佣",
    "example": "engage in (从事于（参加）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90544,
    "word": "engine",
    "phonetic": "/end͡ʒən/",
    "meaning": "n 引擎， 发动机； 机车",
    "example": "diesel engine (柴油机（等于diesel）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90545,
    "word": "enlighten",
    "phonetic": "/ənˈlaɪtn̩/",
    "meaning": "v 启发，开导；启蒙",
    "example": "cigarette lighter (香烟打火机)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90546,
    "word": "enquire",
    "phonetic": "/ɪŋˈkwaɪə/",
    "meaning": "v 询问",
    "example": "inquire into (调查，探究)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90547,
    "word": "ensure",
    "phonetic": "/ɪnˈʃɔː/",
    "meaning": "v 确保",
    "example": "ensure public security (保安)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90548,
    "word": "enterprise",
    "phonetic": "/ˈɛntɚˌpɹaɪz/",
    "meaning": "n 艰巨的事业；事业心",
    "example": "enterprise management (企业管理)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90549,
    "word": "entertain",
    "phonetic": "/ˌɛntəˈteɪn/",
    "meaning": "v 使欢乐；招待",
    "example": "entertainment industry (娱乐业)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90550,
    "word": "enthusiasm",
    "phonetic": "/-θuː-/",
    "meaning": "n 热情， 热心， 热忱； 巨大兴趣",
    "example": "enthusiasm for (热爱……)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90551,
    "word": "entire",
    "phonetic": "/ənˈtaɪə/",
    "meaning": "adj 全部的，整个的",
    "example": "entire life (总寿命)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90552,
    "word": "entitle",
    "phonetic": "/ənˈtaɪtəl/",
    "meaning": "v 使具有资格",
    "example": "job title (n. 职称)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90553,
    "word": "entity",
    "phonetic": "/ˈen.tɪ.ti/",
    "meaning": "n 实体， 独立存在体， 实际存在物",
    "example": "legal entity (法人实体)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90554,
    "word": "entrepreneur",
    "phonetic": "/ˌɒn.tɹə.pɹəˈnɜː/",
    "meaning": "n 企业家",
    "example": "entrepreneur spirit (企业家精神；事业心)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90555,
    "word": "environment",
    "phonetic": "/-mɪnt/",
    "meaning": "n 环境； 外界； 围绕",
    "example": "ecological environment (生态环境)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90556,
    "word": "epoch",
    "phonetic": "/ˈiːˌpɒk/",
    "meaning": "n （新）时代；历元",
    "example": "pleistocene epoch (更新世)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90557,
    "word": "equal",
    "phonetic": "/ˈiːkwəl/",
    "meaning": "adj 相等的，平等的",
    "example": "is equal to (等于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90558,
    "word": "equality",
    "phonetic": "/ɪˈkwɒl.ɪ.ti/",
    "meaning": "n 等同； 平等； 相等",
    "example": "equality and mutual benefit (平等互利)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90559,
    "word": "equation",
    "phonetic": "/ɪˈkweɪʃən/",
    "meaning": "n 平衡；反应式",
    "example": "differential equation (微分方程)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90560,
    "word": "equip",
    "phonetic": "/ɪˈkwɪp/",
    "meaning": "vt 装备， 配备； 使有准备",
    "example": "equip with (装备，配备；备有…，以…装备)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90561,
    "word": "equipment",
    "phonetic": "/ɪˈkwɪpmənt/",
    "meaning": "n 装备，设备，配备",
    "example": "production equipment (生产设备；生产装备)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90562,
    "word": "equivalent",
    "phonetic": "/ɪˈkwɪvələnt/",
    "meaning": "adj 等面（体）积的",
    "example": "equivalent circuit (等效电路)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90563,
    "word": "erosion",
    "phonetic": "/əˈɹəʊʒən/",
    "meaning": "n 腐蚀，侵蚀；糜烂",
    "example": "soil erosion (n. 水土流失；土壤侵蚀；土壤流失；泥土流失)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90564,
    "word": "escape",
    "phonetic": "/əˈskeɪp/",
    "meaning": "v 逃跑；逸出；n 逃跑",
    "example": "escape from (vt. 逃脱)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90565,
    "word": "essential",
    "phonetic": "/ɪˈsɛn.ʃəl/",
    "meaning": "adj 本质的，必须的",
    "example": "essential oil (香精油，精油)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90566,
    "word": "establish",
    "phonetic": "/ɪˈstæb.lɪʃ/",
    "meaning": "v 使…被接受",
    "example": "establish oneself in (在…落户，定居在)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90567,
    "word": "estate",
    "phonetic": "/ɪsˈteɪt/",
    "meaning": "n 财产，产业；房地产",
    "example": "real estate (n. 不动产，房地产)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90568,
    "word": "esteem",
    "phonetic": "/[ɛsˈtiːm]/",
    "meaning": "v 尊重",
    "example": "self esteem (自尊)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90569,
    "word": "estimate",
    "phonetic": "/ˈɛstɨmɨt/",
    "meaning": "vt 估计； 评价；n 估计； 评价； 看法",
    "example": "estimate for (对…估价、估计)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90570,
    "word": "eternal",
    "phonetic": "/ɪˈtɜːnəl/",
    "meaning": "adj 永久的；不朽的",
    "example": "eternal life ([宗]永生；来世)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90571,
    "word": "ethnic",
    "phonetic": "/ˈɛθ.nɪk/",
    "meaning": "adj 种族的",
    "example": "ethnic group (n. 同种同文化之民族)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90572,
    "word": "evaluate",
    "phonetic": "/ɨˈvaljʊeɪt/",
    "meaning": "v 评价",
    "example": "comprehensive evaluation (综合评价，综合评价法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90573,
    "word": "evaluation",
    "phonetic": "/ɪˌvæljuˈeɪʃən/",
    "meaning": "n 评价",
    "example": "comprehensive evaluation (综合评价，综合评价法)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90574,
    "word": "evidence",
    "phonetic": "/[ˈɛvəɾəns]/",
    "meaning": "n 根据， 证据； 证人",
    "example": "in evidence (明显的；[法]作为证据)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90575,
    "word": "evident",
    "phonetic": "/ˈɛ.vɪ.dənt/",
    "meaning": "adj 明显的， 明白的",
    "example": "self evident (不言而喻的；不证自明的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90576,
    "word": "evolution",
    "phonetic": "/ˈɛvəluːʃ(ə)n/",
    "meaning": "n 演变；进化；发展",
    "example": "theory of evolution (进化学说，进化论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90577,
    "word": "evolve",
    "phonetic": "/ɪˈvɒlv/",
    "meaning": "v 进化",
    "example": "evolve into (vt. 发展成，进化成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90578,
    "word": "exceed",
    "phonetic": "/ɪkˈsiːd/",
    "meaning": "v 超过",
    "example": "exceed in (在…方面超过)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90579,
    "word": "excel",
    "phonetic": "/ɪkˈsɛl/",
    "meaning": "v 胜过，杰出",
    "example": "excel in (v. 在……方面胜过；在……方面很擅长)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90580,
    "word": "excellent",
    "phonetic": "/ˈɛksələnt/",
    "meaning": "adj 卓越的，杰出的，极好的",
    "example": "excellent quality (优良品质；优良质量)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90581,
    "word": "exceptional",
    "phonetic": "/ɪkˈsɛpʃənəl/",
    "meaning": "adj 例外的",
    "example": "exceptional circumstances (特殊情况；例外情况)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90582,
    "word": "excess",
    "phonetic": "/əkˈsɛs/",
    "meaning": "n 过量，过度",
    "example": "in excess (过度；过量地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90583,
    "word": "excessive",
    "phonetic": "/ɪkˈsɛsɪv/",
    "meaning": "adj 过度的",
    "example": "excessive competition (过度竞争)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90584,
    "word": "exchange",
    "phonetic": "/ɛksˈtʃeɪndʒ/",
    "meaning": "n&vt 交换； 交流； 兑换",
    "example": "exchange rate (汇率；兑换率)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90585,
    "word": "exclude",
    "phonetic": "/ɪksˈkluːd/",
    "meaning": "vt 把…排除在外",
    "example": "conclude with (以…结束)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90586,
    "word": "exclusive",
    "phonetic": "/ɪkˈsklu.sɪv/",
    "meaning": "adj 除外的",
    "example": "an exclusive (独家新闻，独家采访)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90587,
    "word": "execute",
    "phonetic": "/ˈɛksɪˌkjuːt/",
    "meaning": "vt 将…处死； 实施",
    "example": "execute plan (执行计划)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90588,
    "word": "executive",
    "phonetic": "/ɛɡˈzɛkjʊtɪv/",
    "meaning": "n 执行官",
    "example": "chief executive (行政长官；董事长；美国总统；（美国的）州长)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90589,
    "word": "exempt",
    "phonetic": "/ɛɡˈzɛm(p)t/",
    "meaning": "adj 被免除的， 被豁免的；vt 免除，豁免",
    "example": "exempt from (豁免，免除)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90590,
    "word": "exert",
    "phonetic": "/ɪɡˈzɜːt/",
    "meaning": "v 施加",
    "example": "exert oneself (努力；尽力)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90591,
    "word": "exhaust",
    "phonetic": "/ɪɡˈzɔːst/",
    "meaning": "vt 使筋疲力尽，用尽；详尽论述；n 排气装置； 废气",
    "example": "exhaust gas (废气)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90592,
    "word": "exhibit",
    "phonetic": "/ɛɡ-/",
    "meaning": "vt 显示；陈列，展览；n 展览品",
    "example": "on exhibit (展出)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90593,
    "word": "exhibition",
    "phonetic": "/ɛksɪˈbɪʃən/",
    "meaning": "n 展览",
    "example": "exhibition hall (展览厅)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90594,
    "word": "exile",
    "phonetic": "/ˈɛkˌsaɪl/",
    "meaning": "v 流放；n 被流放者",
    "example": "exile from (使流亡；把…从…流放出去)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90595,
    "word": "exist",
    "phonetic": "/ɪɡˈzɪst/",
    "meaning": "v 存在；生存，生活",
    "example": "exist in (vt. 存在于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90596,
    "word": "existence",
    "phonetic": "/ɛɡ.ˈzɪs.təns/",
    "meaning": "n 存在，生存",
    "example": "in existence (现有的；现存的；实际存在的；实有的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90597,
    "word": "expand",
    "phonetic": "/ɛkˈspænd/",
    "meaning": "v 扩大， 膨胀",
    "example": "expand market (开拓市场)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90598,
    "word": "expansion",
    "phonetic": "/ɪkˈspænʃən/",
    "meaning": "n 扩大",
    "example": "thermal expansion (热膨胀)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90599,
    "word": "expect",
    "phonetic": "/ɛkˈspɛkt/",
    "meaning": "v 料想，认为",
    "example": "expect too much of (对(某人)期望过高)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90600,
    "word": "expedition",
    "phonetic": "/ɛkspəˈdɪʃən/",
    "meaning": "n 探险，远征",
    "example": "fishing expedition (审前盘问；非法调查)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90601,
    "word": "expel",
    "phonetic": "/ɪkˈspɛl/",
    "meaning": "v 开除，驱逐",
    "example": "expel from (v. 驱逐出；开除；排出)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90602,
    "word": "expense",
    "phonetic": "/ɪkˈspɛns/",
    "meaning": "n 花费， 消费， 费用； 开支， 业务费用",
    "example": "at the expense of (以…为代价；由…支付费用)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90603,
    "word": "expensive",
    "phonetic": "/ɛkˈspɛnsɪv/",
    "meaning": "adj 昂贵的，花钱多的",
    "example": "less expensive (adj. 比较便宜的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90604,
    "word": "experience",
    "phonetic": "/ɪkˈspɪə.ɹɪəns/",
    "meaning": "n 经验，感受；经历",
    "example": "experience in (有经验；有…的经验)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90605,
    "word": "experiment",
    "phonetic": "/ɛk.ˈspɛ.ɹɪ.mənt/",
    "meaning": "n 实验；试验",
    "example": "experiment on (vt. 对…进行实验；试用)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90606,
    "word": "expert",
    "phonetic": "/ˈɛkspəːt/",
    "meaning": "adj 熟练的；n 专家",
    "example": "expert system (专家系统)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90607,
    "word": "expertise",
    "phonetic": "/ˌɛkspɚˈtiːs/",
    "meaning": "n 专业知识",
    "example": "technical expertise (专业技术)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90608,
    "word": "expire",
    "phonetic": "/ɛkˈspaɪ.ə(ɹ)/",
    "meaning": "v 满期，到期；断气",
    "example": "roman empire (罗马帝国（指公元前27年到公元476年的罗马奴隶制国家）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90609,
    "word": "explicit",
    "phonetic": "/ɪkˈsplɪsɪt/",
    "meaning": "adj 明晰的；直率的",
    "example": "explicit expression (显式表达式)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90610,
    "word": "explode",
    "phonetic": "/ɪkˈspləʊd/",
    "meaning": "v 使爆炸；v 爆炸",
    "example": "explode into (爆发出…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90611,
    "word": "explosion",
    "phonetic": "/ɪkˈspləʊ.ʒən/",
    "meaning": "n 爆炸",
    "example": "gas explosion (瓦斯爆炸)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90612,
    "word": "export",
    "phonetic": "/ˈɛks.pɔːt/",
    "meaning": "v 输出，出口；运走",
    "example": "import and export (进出口；导入和导出；输入和输出)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90613,
    "word": "expose",
    "phonetic": "/ɪkˈspəʊz/",
    "meaning": "vt 使暴露， 揭露",
    "example": "impose on (利用；欺骗；施加影响于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90614,
    "word": "exposition",
    "phonetic": "/ɛkspəˈzɪʃən/",
    "meaning": "n 说明，解释；展览会，博览会",
    "example": "leading position (基础地位；首要地位)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90615,
    "word": "exposure",
    "phonetic": "/ɪkˈspoʊʒɚ/",
    "meaning": "n 暴露；揭露",
    "example": "exposure time (曝光时间)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90616,
    "word": "express",
    "phonetic": "/ɛk.ˈspɹɛs/",
    "meaning": "v 表示；n 快车，快递",
    "example": "express oneself (表达自己的思想)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90617,
    "word": "expression",
    "phonetic": "/ɪkˈspɹɛʃ.ən/",
    "meaning": "n 词语； 表达， 表情",
    "example": "gene expression ([化]基因表达；基因表现)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90618,
    "word": "exquisite",
    "phonetic": "/ɪkˈskwɪzɪt/",
    "meaning": "adj 精美的， 精致的； 敏锐的， 有高度鉴赏力的； 剧烈的， 感觉强烈的",
    "example": "small and exquisite (小巧玲珑；小而灵巧)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90619,
    "word": "extend",
    "phonetic": "/ɛkˈstɛnd/",
    "meaning": "v 延伸；延期",
    "example": "extend one's business (扩大其营业)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90620,
    "word": "extension",
    "phonetic": "/ɪkˈstɛnʃən/",
    "meaning": "n 分机",
    "example": "brand extension (品牌延伸)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90621,
    "word": "extensive",
    "phonetic": "/ɛksˈtɛn.sɪv/",
    "meaning": "adj 广阔的； 广泛的",
    "example": "extensive use (广泛应用；有系统应用)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90622,
    "word": "extent",
    "phonetic": "/ɪksˈtɛnt/",
    "meaning": "n 程度",
    "example": "some extent (有几分，在某种程度上；在一定程度上)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90623,
    "word": "external",
    "phonetic": "/əksˈtɜːnəl/",
    "meaning": "adj 外部的， 外面的",
    "example": "external environment (外环境)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90624,
    "word": "extinct",
    "phonetic": "/ɛkˈstɪŋkt/",
    "meaning": "adj 绝种的",
    "example": "become extinct (灭绝；绝种)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90625,
    "word": "extinguish",
    "phonetic": "/ɪkˈstɪŋ.ɡwɪʃ/",
    "meaning": "v 熄灭；使消亡",
    "example": "distinguish oneself (使扬名；使杰出)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90626,
    "word": "extra",
    "phonetic": "/ˈɛkstɹə/",
    "meaning": "n 附加物；额外的东西",
    "example": "extra time (额外时间；[体]加赛时间)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90627,
    "word": "extract",
    "phonetic": "/ɪkˈstrækt/",
    "meaning": "v 取出；提取；n 摘录",
    "example": "extract from (从…提取，文件的摘录)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90628,
    "word": "extraordinary",
    "phonetic": "/ɪksˈtɹɔː(ɹ)dɪnəɹi/",
    "meaning": "adj 非同寻常的， 特别的",
    "example": "extraordinary general meeting (特别会员大会；非常股东大会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90629,
    "word": "extreme",
    "phonetic": "/ɛkˈstɹiːm/",
    "meaning": "adj 极端的",
    "example": "to the extreme (走向极端)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90630,
    "word": "fabric",
    "phonetic": "/ˈfæb.ɹɪk/",
    "meaning": "n 布料",
    "example": "cotton fabric (棉布；棉纤物)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90631,
    "word": "fabricate",
    "phonetic": "/ˈfæb.ɹɪ.keɪt/",
    "meaning": "v 捏造；制作",
    "example": "fabrication process (制造工艺)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90632,
    "word": "facility",
    "phonetic": "/fəˈsɪlɪti/",
    "meaning": "n 设施",
    "example": "manufacturing facility (制造设施，生产设施；生产设备)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90633,
    "word": "factor",
    "phonetic": "/ˈfæktə/",
    "meaning": "n 因素， 因子； 系数",
    "example": "factor in (…的因素；将…纳入)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90634,
    "word": "faculty",
    "phonetic": "/ˈfæ.kəl.ti/",
    "meaning": "n 教工，教员",
    "example": "faculty member (教职工)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90635,
    "word": "failure",
    "phonetic": "/ˈfeɪl.jɚ/",
    "meaning": "n 失败；失败的人",
    "example": "failure in (…的失败)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90636,
    "word": "fairly",
    "phonetic": "/ˈfɛə(ɹ).li/",
    "meaning": "adv 相当；公平地",
    "example": "fair play (公平竞争；公平比赛；平等对待)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90637,
    "word": "faith",
    "phonetic": "/feɪθ/",
    "meaning": "n 信任， 信心； 信仰， 信条",
    "example": "good faith (诚实；善意；真挚)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90638,
    "word": "faithful",
    "phonetic": "/ˈfeɪθ.fəl/",
    "meaning": "adj 忠诚的；如实的",
    "example": "old faithful (追随者；忠实的支持者)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90639,
    "word": "fake",
    "phonetic": "/feɪk/",
    "meaning": "n 假货",
    "example": "fake commodity (假货)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90640,
    "word": "fame",
    "phonetic": "/feɪm/",
    "meaning": "n 名声，名望",
    "example": "hall of fame (名人纪念馆)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90641,
    "word": "familiar",
    "phonetic": "/fəˈmɪl.i.ə/",
    "meaning": "adj 熟悉的",
    "example": "familiar with (熟悉)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90642,
    "word": "famous",
    "phonetic": "/ˈfeɪməs/",
    "meaning": "adj 著名的，出名的",
    "example": "famous brand (名牌，名牌货)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90643,
    "word": "fancy",
    "phonetic": "/ˈfæn.si/",
    "meaning": "adj 华丽的，别致的",
    "example": "take a fancy to (喜欢；爱上)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90644,
    "word": "fantastic",
    "phonetic": "/fænˈtæstɪk/",
    "meaning": "adj 空想的；奇异的",
    "example": "fantastic job (干的太好了；好样的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90645,
    "word": "farewell",
    "phonetic": "/fɛəˈwɛl/",
    "meaning": "int 再会；n 告别",
    "example": "farewell party (n. 欢送会；惜别会)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90646,
    "word": "fashion",
    "phonetic": "/ˈfæʃən/",
    "meaning": "n 样子，方式；风尚",
    "example": "fashion design (服装设计；时尚设计)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90647,
    "word": "fatal",
    "phonetic": "/[ˈfeɪ.ɾɫ̩]/",
    "meaning": "adj 致命的",
    "example": "fatal accident (死亡事故)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90648,
    "word": "fatigue",
    "phonetic": "/fəˈtiːɡ/",
    "meaning": "n 疲惫",
    "example": "fatigue life (疲劳寿命)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90649,
    "word": "fault",
    "phonetic": "/fɒlt/",
    "meaning": "n 过失",
    "example": "fault diagnosis (故障诊断)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90650,
    "word": "feasible",
    "phonetic": "/ˈfiːzəbəl/",
    "meaning": "adj 可行的",
    "example": "feasible solution (可行解释；适宜解)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90651,
    "word": "feature",
    "phonetic": "/ˈfiːtʃə/",
    "meaning": "n 特征，特色；面貌；特写，专题节目；故事片；vt 突出； 由…主演",
    "example": "distinguishing feature (特点；特征)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90652,
    "word": "federal",
    "phonetic": "/ˈfɛdəɹəl/",
    "meaning": "adj 联邦的， 联盟的",
    "example": "federal reserve (（美国）联邦储备系统)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90653,
    "word": "feedback",
    "phonetic": "/ˈfiːdˌbæk/",
    "meaning": "n 反馈",
    "example": "feedback control ([计]反馈控制；回馈控制)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90654,
    "word": "fertile",
    "phonetic": "/ˈfɝːtaɪl/",
    "meaning": "adj （创造力）丰富的",
    "example": "fertile soil (沃土，肥沃的土壤)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90655,
    "word": "fiction",
    "phonetic": "/ˈfɪk.ʃən/",
    "meaning": "n 小说； 虚构， 杜撰",
    "example": "science fiction (科幻小说)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90656,
    "word": "fierce",
    "phonetic": "/fɪəs/",
    "meaning": "adj 激烈的",
    "example": "fierce competition (激烈的竞争)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90657,
    "word": "figure",
    "phonetic": "/ˈfɪɡjɚ/",
    "meaning": "n 数字",
    "example": "public figure (社会名人)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90658,
    "word": "filter",
    "phonetic": "/ˈfɪltə/",
    "meaning": "v 过滤",
    "example": "kalman filter (卡尔曼滤波器)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90659,
    "word": "finance",
    "phonetic": "/faɪˈnæns/",
    "meaning": "v 提供资金",
    "example": "ministry of finance (财政部)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90660,
    "word": "financial",
    "phonetic": "/faɪˈnænʃəl/",
    "meaning": "adj 财政的， 金融的",
    "example": "financial crisis (金融危机；财政危机)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90661,
    "word": "finite",
    "phonetic": "/ˈfaɪnaɪt/",
    "meaning": "adj 有限的；有尽的",
    "example": "definite integral (定积分)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90662,
    "word": "firm",
    "phonetic": "/fɜːm/",
    "meaning": "n 商行，商号，公司",
    "example": "law firm (法律事务所)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90663,
    "word": "fixture",
    "phonetic": "/ˈfɪkstʃə/",
    "meaning": "n 固定装置",
    "example": "test fixture (测试夹具)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90664,
    "word": "flame",
    "phonetic": "/fleɪm/",
    "meaning": "n 火焰",
    "example": "flame retardant ([化]阻燃剂)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90665,
    "word": "flatter",
    "phonetic": "/ˈflætə/",
    "meaning": "v 奉承，阿谀，谄媚",
    "example": "flatter oneself (自鸣得意；自以为是)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90666,
    "word": "flavor",
    "phonetic": "/ˈfleɪvə/",
    "meaning": "n 口味",
    "example": "natural flavor (天然香辛料；天然调味料)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90667,
    "word": "flaw",
    "phonetic": "/ˈflɔː/",
    "meaning": "n 缺点，瑕疵",
    "example": "flaw detection (探伤检验；缺陷检验)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90668,
    "word": "fleet",
    "phonetic": "/fliːt/",
    "meaning": "n 舰队；船队，机群",
    "example": "a fleet of (机群；一队…)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90669,
    "word": "flexible",
    "phonetic": "/ˈflɛk.sə.bəl/",
    "meaning": "adj 灵活的",
    "example": "flexible packaging (软包装；软质包装)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90670,
    "word": "flourish",
    "phonetic": "/ˈflʌ.ɹɪʃ/",
    "meaning": "v 繁荣，茂盛，兴旺",
    "example": "a flourish of trumpets (大肆宣扬)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90671,
    "word": "fluctuate",
    "phonetic": "/ˈflʌk.tʃu.eɪt/",
    "meaning": "v 波动",
    "example": "economic fluctuation (经济波动)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90672,
    "word": "fluent",
    "phonetic": "/ˈfluːənt/",
    "meaning": "adj 流利的，流畅的",
    "example": "fluent english (流利英语；英语流利)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90673,
    "word": "focus",
    "phonetic": "/ˈfəʊ.kəs/",
    "meaning": "v 聚焦；集中；n 焦点， 中心",
    "example": "focus on (集中于)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90674,
    "word": "forecast",
    "phonetic": "/ˈfɔːkɑːst/",
    "meaning": "n 预报，预测",
    "example": "weather forecast (天气预测，天气预报)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90675,
    "word": "forehead",
    "phonetic": "/ˈfɒɹɛd/",
    "meaning": "n 额头，前部",
    "example": "head office (总公司；总行)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90676,
    "word": "foreign",
    "phonetic": "/ˈfɒɹən/",
    "meaning": "adj 外国的，国外的",
    "example": "foreign trade (外贸，对外贸易)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90677,
    "word": "format",
    "phonetic": "/ˈfɔː(ɹ).mæt/",
    "meaning": "n 形式",
    "example": "file format ([计]文件格式)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90678,
    "word": "formula",
    "phonetic": "/ˈfɔː.mjʊ.lə/",
    "meaning": "n 公式",
    "example": "empirical formula (经验式；实验式)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90679,
    "word": "formulate",
    "phonetic": "/ˈfɔː.mjə.leɪt/",
    "meaning": "v 制定，规划",
    "example": "strategy formulation (战略制定；策略形成；战略形成)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90680,
    "word": "fortune",
    "phonetic": "/ˈfɔːtʃuːn/",
    "meaning": "n 命运，运气；财产",
    "example": "good fortune (好财运，好运；顺景)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90681,
    "word": "foster",
    "phonetic": "/ˈfɒstə/",
    "meaning": "v 促进；培养",
    "example": "foster care (看护；照顾)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90682,
    "word": "foundation",
    "phonetic": "/faʊnˈdeɪʃən/",
    "meaning": "n 基金会",
    "example": "on the foundation ([英国英语]领取基金会提供奖学金(或津贴)的；属于由基金维持的机构的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90683,
    "word": "fraction",
    "phonetic": "/ˈfɹæk.ʃən/",
    "meaning": "n 分数",
    "example": "volume fraction (体积分率，体积分数；容积率)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90684,
    "word": "fracture",
    "phonetic": "/ˈfɹæk.tjə/",
    "meaning": "n 破裂；裂痕；v 破裂",
    "example": "fracture toughness (断裂韧性)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90685,
    "word": "fragile",
    "phonetic": "/ˈfɹædʒaɪl/",
    "meaning": "adj 脆弱的；体质弱的",
    "example": "fragile goods (易碎商品；易碎货物)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90686,
    "word": "fragment",
    "phonetic": "/ˈfɹæɡmənt/",
    "meaning": "n 碎片，破片，碎块",
    "example": "fragment length polymorphism (片段长度多态性)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90687,
    "word": "framework",
    "phonetic": "/ˈfɹeɪm.wɜːk/",
    "meaning": "n 体制",
    "example": "basic framework (基本框架)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90688,
    "word": "fraud",
    "phonetic": "/fɹɔːd/",
    "meaning": "n 欺诈， 诈骗； 骗子",
    "example": "accounting fraud (假帐；做假账)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90689,
    "word": "freight",
    "phonetic": "/fɹeɪt/",
    "meaning": "n 货运；运费",
    "example": "freight forwarding (货运代理；货物发运；运费由提货方支付)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90690,
    "word": "friction",
    "phonetic": "/ˈfɹɪkʃən̩/",
    "meaning": "n 摩擦",
    "example": "friction coefficient (磨擦系数)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90691,
    "word": "frighten",
    "phonetic": "/ˈfɹaɪtn̩/",
    "meaning": "v 使害怕",
    "example": "stage fright (怯场)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90692,
    "word": "fringe",
    "phonetic": "/fɹɪndʒ/",
    "meaning": "n 穗，毛边；边缘",
    "example": "fringe pattern (条纹图形，干涉图样)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90693,
    "word": "fulfill",
    "phonetic": "/fəˈfɪl/",
    "meaning": "v 实现",
    "example": "fulfill oneself (v. 完全实现自己的抱负)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90694,
    "word": "function",
    "phonetic": "/ˈfʌŋ(k)ʃən/",
    "meaning": "vi 工作， 运行； 起作用；n 功能，职务；【数】函数；重大聚会",
    "example": "and function ([计]与酌)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90695,
    "word": "fundamental",
    "phonetic": "/ˌfʌndəˈmɛntəl/",
    "meaning": "adj 基础的，基本的；n 基本原则",
    "example": "fundamental principle (基本原则)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90696,
    "word": "furnish",
    "phonetic": "/ˈfɜːnɪʃ/",
    "meaning": "v 提供",
    "example": "furnish with (供给，提供；用…装饰)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90697,
    "word": "galaxy",
    "phonetic": "/ˈɡaləksi/",
    "meaning": "n 星系； 银河系， 银河； 一群",
    "example": "milky way galaxy (银河系)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90698,
    "word": "gamble",
    "phonetic": "/ˈɡæm.bəl/",
    "meaning": "n 赌博；v 冒…的险",
    "example": "gamble on (对…打赌)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90699,
    "word": "gap",
    "phonetic": "/ɡæp/",
    "meaning": "n 差距",
    "example": "income gap (收入差距)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90700,
    "word": "garbage",
    "phonetic": "/ˈɡɑːbɪd͡ʒ/",
    "meaning": "n 垃圾， 废物； 废话； 无用的资料",
    "example": "garbage disposal (垃圾处理)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90701,
    "word": "garment",
    "phonetic": "/ˈɡɑː.mənt/",
    "meaning": "n 衣服；服装，衣着",
    "example": "garment industry (制衣业；成衣业)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90702,
    "word": "gauge",
    "phonetic": "/ˈɡeɪdʒ/",
    "meaning": "n 测量仪表；厚度，直径；规格、尺寸；vt 估计， 判断； 计量， 度量",
    "example": "pressure gauge (压力计，测压表)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90703,
    "word": "gender",
    "phonetic": "/ˈdʒɛndə/",
    "meaning": "n 性别",
    "example": "gender difference (性别差异)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90704,
    "word": "general",
    "phonetic": "/ˈd͡ʒɛnɹəl/",
    "meaning": "adj 总的；一般的n将军",
    "example": "(army) general (将军)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90705,
    "word": "generate",
    "phonetic": "/ˈdʒɛn.əɹ.eɪt/",
    "meaning": "v 产生",
    "example": "generate electricity (发电)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90706,
    "word": "generation",
    "phonetic": "/ˌd͡ʒɛnəˈɹeɪʃən/",
    "meaning": "n 一代人，产生",
    "example": "new generation (新世代，新一代；新生代)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90707,
    "word": "generous",
    "phonetic": "/ˈdʒɛn(ə)ɹəs/",
    "meaning": "adj 慷慨的",
    "example": "be generous with (用…很大方)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90708,
    "word": "genius",
    "phonetic": "/ˈdʒiː.nɪəs/",
    "meaning": "n 天才",
    "example": "universal genius (宇宙级天才；全能之才)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90709,
    "word": "genuine",
    "phonetic": "/ˈdʒɛnjuːˌaɪn/",
    "meaning": "adj 真的；由衷的",
    "example": "genuine leather (真皮)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90710,
    "word": "geography",
    "phonetic": "/dʒɪˈɒɡɹəfi/",
    "meaning": "n 地理，地理学",
    "example": "economic geography (经济地理学)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90711,
    "word": "gesture",
    "phonetic": "/ˈdʒɛs.tʃɚ/",
    "meaning": "n 姿势，手势",
    "example": "gesture recognition (手势识别)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90712,
    "word": "giant",
    "phonetic": "/ˈdʒaɪ.ənt/",
    "meaning": "n 巨人；巨物",
    "example": "giant panda ([动]大熊猫；大猫熊)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90713,
    "word": "glance",
    "phonetic": "/ɡlɑːns/",
    "meaning": "vi 看一下；n 一瞥",
    "example": "at a glance (一瞥；看一眼)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90714,
    "word": "glimpse",
    "phonetic": "/ɡlɪmps/",
    "meaning": "v 瞥见；n 一瞥，一看",
    "example": "glimpse of (瞥见；一瞥)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90715,
    "word": "glory",
    "phonetic": "/ˈɡlo(ː)ɹi/",
    "meaning": "n 光荣，荣誉",
    "example": "in one's glory (得意；踌躇满志；在某人的鼎盛时期)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90716,
    "word": "gorgeous",
    "phonetic": "/ˈɡɔːdʒəs/",
    "meaning": "adj 极其漂亮的，极其吸引人的；绚丽的，华丽的",
    "example": "drop-dead gorgeous ([口]极其动人的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90717,
    "word": "govern",
    "phonetic": "/ˈɡʌvən/",
    "meaning": "v 管理",
    "example": "chinese government (中国政府)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90718,
    "word": "governor",
    "phonetic": "/ˈɡʌv(ə)nə(ɹ)/",
    "meaning": "n 州长；主管人员",
    "example": "speed governor (调速器，限速器；蒂器)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90719,
    "word": "grace",
    "phonetic": "/ɡɹeɪs/",
    "meaning": "n 优美，文雅；雅致",
    "example": "in disgrace (很不讨人喜欢)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90720,
    "word": "gradient",
    "phonetic": "/ˈɡreɪ.di.ənt/",
    "meaning": "n 斜坡",
    "example": "pressure gradient (气压梯度)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90721,
    "word": "gradual",
    "phonetic": "/ˈɡɹɛdʒɘl/",
    "meaning": "adj 逐渐的；渐进的",
    "example": "gradual change (渐变柔光，渐变)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90722,
    "word": "graduate",
    "phonetic": "/ˈɡrædʒ.u.ət/",
    "meaning": "adj 研究生的；v 毕业；n 毕业生；研究生",
    "example": "graduate student (n. 研究生；毕业生)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90723,
    "word": "grain",
    "phonetic": "/ɡɹeɪn/",
    "meaning": "n 谷物， 谷粒， 颗粒； 少量， 微量",
    "example": "grain size (晶粒大小，晶粒尺寸)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90724,
    "word": "grant",
    "phonetic": "/ɡɹɑːnt/",
    "meaning": "n 拨款",
    "example": "take for granted (认为…理所当然)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90725,
    "word": "graph",
    "phonetic": "/ɡɹæf/",
    "meaning": "n (曲线)图，图表",
    "example": "graph theory (图论)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90726,
    "word": "grasp",
    "phonetic": "/ɡɹɑːsp/",
    "meaning": "v 抓住，理解",
    "example": "grasp at (v. 想抓住；攫取)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90727,
    "word": "grateful",
    "phonetic": "/ˈɡɹeɪtfəl/",
    "meaning": "adj 感激的",
    "example": "grateful for (为…而感谢)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90728,
    "word": "gratitude",
    "phonetic": "/ˈɡɹætɪt(j)ud/",
    "meaning": "n 感激",
    "example": "gratitude to sb (感激某人)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90729,
    "word": "grave",
    "phonetic": "/ɡɹeɪv/",
    "meaning": "adj 严重的",
    "example": "watery grave (葬身鱼腹，溺死)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90730,
    "word": "gravity",
    "phonetic": "/ˈɡɹævɪti/",
    "meaning": "n 重力，引力；严重性",
    "example": "specific gravity (比重)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90731,
    "word": "grief",
    "phonetic": "/ɡɹiːf/",
    "meaning": "n 悲哀，悲痛，悲伤",
    "example": "come to grief (遭难，失败)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90732,
    "word": "grim",
    "phonetic": "/ɡɹɪm/",
    "meaning": "adj 严厉的",
    "example": "grim reaper (狰狞持镰收割者（指死神）)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90733,
    "word": "grip",
    "phonetic": "/ɡɹɪp/",
    "meaning": "n 抓住",
    "example": "in the grip of (受...控制)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90734,
    "word": "gross",
    "phonetic": "/ɡɹəʊs/",
    "meaning": "adj （语言、举止）粗俗的",
    "example": "gross domestic product (gdp) (国内生产总值)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90735,
    "word": "guarantee",
    "phonetic": "/ˌɡæɹənˈtiː/",
    "meaning": "v 保证",
    "example": "quality guarantee (品质保证，质量保证)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90736,
    "word": "guidance",
    "phonetic": "/ˈɡaɪdəns/",
    "meaning": "n 引导，指导，领导",
    "example": "under the guidance of (在…的指引下)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90737,
    "word": "guideline",
    "phonetic": "/ˈɡaɪd.laɪn/",
    "meaning": "n 指导原则",
    "example": "design guideline (设计方针；设计准则)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90738,
    "word": "guilt",
    "phonetic": "/ɡɪlt/",
    "meaning": "n 内疚；有罪，犯罪",
    "example": "guilty of (有……之过错；对……感到内疚)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90739,
    "word": "habitual",
    "phonetic": "/-tjʊ-/",
    "meaning": "adj 习惯的",
    "example": "habitual abortion (习惯性流产)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90740,
    "word": "halt",
    "phonetic": "/hɔːlt/",
    "meaning": "v 停止；立定；n 停住",
    "example": "come to a halt (停止前进；停下来)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90741,
    "word": "handicap",
    "phonetic": "/ˈhændɪkæp/",
    "meaning": "v 妨碍，使不利",
    "example": "mental handicap (心理缺陷；心智障碍)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90742,
    "word": "handle",
    "phonetic": "/ˈhæn.dl/",
    "meaning": "n 把手",
    "example": "handle with (处理)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90743,
    "word": "handy",
    "phonetic": "/ˈhæn.di/",
    "meaning": "adj 方便的；便于使用的",
    "example": "come in handy (迟早有用)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90744,
    "word": "hardship",
    "phonetic": "/ˈhɑːdˌʃɪp/",
    "meaning": "n 艰难",
    "example": "economic hardship (经济困难)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90745,
    "word": "harm",
    "phonetic": "/hɑːm/",
    "meaning": "n & v 有害",
    "example": "do harm to someone (加害某人;让某人不满意[亦作do someone harm])",
    "level": "CET4_HIGH"
  },
  {
    "id": 90746,
    "word": "harmony",
    "phonetic": "/ˈhɑːməni/",
    "meaning": "n 调和； 协调； 和谐",
    "example": "in harmony (adj. 和谐无间)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90747,
    "word": "harsh",
    "phonetic": "/hɑːʃ/",
    "meaning": "adj 严酷的，严峻的",
    "example": "harsh reality (严酷的现实；残酷的现实)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90748,
    "word": "harvest",
    "phonetic": "/ˈhaːvəst/",
    "meaning": "n 丰收，收获",
    "example": "bumper harvest (丰收)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90749,
    "word": "haste",
    "phonetic": "/heɪst/",
    "meaning": "n 急速，急忙；草率",
    "example": "in haste (急忙地；草率的；慌张地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90750,
    "word": "hazard",
    "phonetic": "/ˈhazəd/",
    "meaning": "n 危险",
    "example": "moral hazard (道德危机；由于投保人可能不可靠所冒的风险)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90751,
    "word": "heading",
    "phonetic": "/[ˈhɛɾ.ɪŋ]/",
    "meaning": "n 标题，题词，题名",
    "example": "cold heading (冷镦；冷作头)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90752,
    "word": "heal",
    "phonetic": "/hiːl/",
    "meaning": "v 治愈；使和解",
    "example": "heal up (痊愈；治愈)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90753,
    "word": "healthy",
    "phonetic": "/ˈhɛl.θi/",
    "meaning": "adj 健康的；有益健康的",
    "example": "healthy life (健康人生)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90754,
    "word": "heap",
    "phonetic": "/heːp/",
    "meaning": "n 堆， 大量",
    "example": "heaps of (大量；许多)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90755,
    "word": "hearing",
    "phonetic": "/ˈhiːɹ.ɪŋ/",
    "meaning": "n 听力， 听觉； 听力所及之距离； 意见听取会； 申辩的机会",
    "example": "hearing loss (听觉损耗；听觉损失)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90756,
    "word": "heavy",
    "phonetic": "/ˈhe.vi/",
    "meaning": "adj 重的；大的；充满的",
    "example": "heavy metal (重金属摇滚乐)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90757,
    "word": "hedge",
    "phonetic": "/hɛdʒ/",
    "meaning": "n 篱笆，树篱；障碍物",
    "example": "hedge fund (避险基金；套保基金)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90758,
    "word": "heir",
    "phonetic": "/ɛəɹ/",
    "meaning": "n 继承人",
    "example": "heir apparent ([律]法定继承人，有确定继承权的人)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90759,
    "word": "heritage",
    "phonetic": "/ˈhɛɹɪtɪd͡ʒ/",
    "meaning": "n 遗产； 继承物； 传统",
    "example": "cultural heritage (文化遗产)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90760,
    "word": "heroic",
    "phonetic": "/hɪˈɹəʊ.ɪk/",
    "meaning": "adj 英雄的；英勇的",
    "example": "national hero (民族英雄；国家英雄)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90761,
    "word": "hesitate",
    "phonetic": "/ˈhɛzɪteɪt/",
    "meaning": "v 犹豫",
    "example": "don't hesitate (别再犹豫了)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90762,
    "word": "hierarchy",
    "phonetic": "/ˈhaɪ.ə.ɹɑː(ɹ).ki/",
    "meaning": "n 等级制度； 统治集团， 领导层",
    "example": "social hierarchy (社会等级；社会阶层)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90763,
    "word": "highway",
    "phonetic": "/ˈhaɪweɪ/",
    "meaning": "n 公路；大路",
    "example": "national highway (n. 国道)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90764,
    "word": "hint",
    "phonetic": "/hɪnt/",
    "meaning": "n 暗示，示意；建议",
    "example": "a hint of (少许，一点点)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90765,
    "word": "historian",
    "phonetic": "/hɪˈstɔəɹɪən/",
    "meaning": "n 历史学家；编史家",
    "example": "natural historian (博物学家)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90766,
    "word": "historic",
    "phonetic": "/(h)ɪˈstɒɹɪk/",
    "meaning": "adj 历史的；历史性的",
    "example": "historic site (古迹；历史遗迹；历史地段)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90767,
    "word": "hollow",
    "phonetic": "/ˈhɒl.əʊ/",
    "meaning": "v 凿空，挖空",
    "example": "hollow fiber (中空纤维)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90768,
    "word": "homogeneous",
    "phonetic": "/ˌhɒ.mə(ʊ)ˈdʒiː.nɪəs/",
    "meaning": "adj 同类的",
    "example": "homogeneous catalysis (均相催化)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90769,
    "word": "horizon",
    "phonetic": "/həˈɹaɪzən/",
    "meaning": "n 地平线",
    "example": "on the horizon (在地平线上；即将来临的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90770,
    "word": "horizontal",
    "phonetic": "/ˌhɒɹɪˈzɒntəl/",
    "meaning": "adj 地平的；水平的",
    "example": "horizontal displacement (水平位移；水平变位)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90771,
    "word": "horrible",
    "phonetic": "/ˈhɑɹɪbəl/",
    "meaning": "adj 令人恐惧的， 可怕的； 骇人听闻的； 极讨厌的， 使人不愉快的； 糟透的",
    "example": "in horror (惊恐地)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90772,
    "word": "hospitality",
    "phonetic": "/hɒs.pɪˈtæl.ɪ.ti/",
    "meaning": "n 友好",
    "example": "hospitality industry (酒店业；服务业)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90773,
    "word": "hostile",
    "phonetic": "/ˈhɒstaɪl/",
    "meaning": "adj 有敌意的",
    "example": "hostile takeover (恶性接收；敌意接管)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90774,
    "word": "household",
    "phonetic": "/ˈhaʊshəʊld/",
    "meaning": "n 家庭，一家人",
    "example": "household goods (家庭用品；日用商品)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90775,
    "word": "hover",
    "phonetic": "/ˈhɒ.və(ɹ)/",
    "meaning": "v 徘徊；傍徨；翱翔；盘旋",
    "example": "hover over (在…盘旋)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90776,
    "word": "huge",
    "phonetic": "/[hʊudʒ]/",
    "meaning": "adj 巨大的，庞大的",
    "example": "huge amounts of (大量的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90777,
    "word": "humanity",
    "phonetic": "/hjuˈmænɪti/",
    "meaning": "n 人类；人性，人情",
    "example": "crime against humanity (违反人道罪；危害人类罪)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90778,
    "word": "humid",
    "phonetic": "/ˈhjuːmɪd/",
    "meaning": "adj 湿的，湿气重的",
    "example": "humid climate (湿润气候；潮湿气候)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90779,
    "word": "hunger",
    "phonetic": "/ˈhʌŋɡə/",
    "meaning": "n 饿，饥饿；渴望",
    "example": "from hunger (极差的，蹩脚的，低劣的)",
    "level": "CET4_HIGH"
  },
  {
    "id": 90780,
    "word": "hypothesis",
    "phonetic": "/-əsəs/",
    "meaning": "n 假设，假说",
    "example": "hypothesis testing (假设检验；假设测算)",
    "level": "CET4_HIGH"
  }
];

module.exports = { WORDS };
