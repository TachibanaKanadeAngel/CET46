// LEVEL4 词库：以 "A" 开头（350 词）
// 自动从 public/data/vocab.json 生成
const WORDS_A = [
  {
    "id": 3,
    "word": "absolutely",
    "phonetic": "/æb.səˈl(j)uːt.lɪ/",
    "meaning": "adv 当然",
    "example": "absolutely necessary (绝对必要)",
    "level": "CET4"
  },
  {
    "id": 4,
    "word": "abstract",
    "phonetic": "/ˈæbˌstɹækt/",
    "meaning": "adj 抽象的",
    "example": "in the abstract (抽象地；理论上；概括地)",
    "level": "CET4"
  },
  {
    "id": 5,
    "word": "abuse",
    "phonetic": "/əˈbjuːs/",
    "meaning": "n 虐待；v 滥用",
    "example": "drug abuse (药物滥用；毒品滥用)",
    "level": "CET4"
  },
  {
    "id": 6,
    "word": "accelerate",
    "phonetic": "/æk.ˈsɛl.ə.ˌɹeɪt/",
    "meaning": "v 加速",
    "example": "angular acceleration (角加速度)",
    "level": "CET4",
    "exampleRoot": "acceleration"
  },
  {
    "id": 7,
    "word": "accomplish",
    "phonetic": "/əˈkɐm.plɪʃ/",
    "meaning": "v 实现",
    "example": "accomplish nothing (一事无成；一无所成)",
    "level": "CET4"
  },
  {
    "id": 8,
    "word": "accountant",
    "phonetic": "/ə.ˈkæʊn.(t)ən̩(t)/",
    "meaning": "n 会计",
    "example": "certified public accountant (有合格证件的会计师)",
    "level": "CET4"
  },
  {
    "id": 10,
    "word": "accurate",
    "phonetic": "/ˈæk.jə.ɹɪt/",
    "meaning": "adj 精确的",
    "example": "accurate measurement (精确测量)",
    "level": "CET4"
  },
  {
    "id": 11,
    "word": "accuse",
    "phonetic": "/əˈkjuːz/",
    "meaning": "v 指控",
    "example": "accuse of (谴责，控告)",
    "level": "CET4"
  },
  {
    "id": 12,
    "word": "accustom",
    "phonetic": "/əˈkʌs.təm/",
    "meaning": "v 使习惯",
    "example": "become accustomed to (习惯于；对…变得习以为常)",
    "level": "CET4",
    "exampleRoot": "accustomed"
  },
  {
    "id": 13,
    "word": "achieve",
    "phonetic": "/əˈtʃiːv/",
    "meaning": "v 达到，实现",
    "example": "achieve success (取得成功；获得成功)",
    "level": "CET4"
  },
  {
    "id": 14,
    "word": "acquaintance",
    "phonetic": "/əˈkweɪntəns/",
    "meaning": "n 熟人",
    "example": "acquaintance with (相识)",
    "level": "CET4"
  },
  {
    "id": 18,
    "word": "address",
    "phonetic": "/æˈdɹɛs/",
    "meaning": "v 解决",
    "example": "email address (电子邮箱信箱)",
    "level": "CET4"
  },
  {
    "id": 19,
    "word": "administration",
    "phonetic": "/ədˌmɪnəˈstɹeɪʃən/",
    "meaning": "n 管理，政府",
    "example": "administration of (◎(法律、惩罚等的)施行，执行，实行，实施；(药的)服用；用法；给与；(庄严的誓言或诺言的)提出，宣誓)",
    "level": "CET4"
  },
  {
    "id": 20,
    "word": "adopt",
    "phonetic": "/əˈdɒpt/",
    "meaning": "v 采纳",
    "example": "adopt various methods (采取不同办法)",
    "level": "CET4"
  },
  {
    "id": 21,
    "word": "adventure",
    "phonetic": "/ædˈvɛnt͡ʃɚ/",
    "meaning": "n 冒险",
    "example": "adventure film (惊险片)",
    "level": "CET4"
  },
  {
    "id": 25,
    "word": "affection",
    "phonetic": "/əˈfɛkʃən/",
    "meaning": "n 喜爱",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 26,
    "word": "agenda",
    "phonetic": "/əˈdʒɛn.də/",
    "meaning": "n 议程",
    "example": "item on the agenda (议程项目)",
    "level": "CET4"
  },
  {
    "id": 29,
    "word": "aid",
    "phonetic": "/eɪd/",
    "meaning": "v 援助，有助于",
    "example": "with the aid of (在…的帮助下，在…援助下)",
    "level": "CET4"
  },
  {
    "id": 30,
    "word": "alert",
    "phonetic": "/əˈlɜːt/",
    "meaning": "adj 机警的；v 提醒",
    "example": "alert someone to sth (使...警觉；使...警惕)",
    "level": "CET4"
  },
  {
    "id": 33,
    "word": "alternative",
    "phonetic": "/ɔːlˈtɜː.nə.tɪv/",
    "meaning": "n 代替品",
    "example": "alternative energy (替代能源；新能源)",
    "level": "CET4"
  },
  {
    "id": 35,
    "word": "ancient",
    "phonetic": "/ˈeɪn.ʃənt/",
    "meaning": "adj 古代的",
    "example": "ancient chinese (n. 古代汉语)",
    "level": "CET4"
  },
  {
    "id": 36,
    "word": "ankle",
    "phonetic": "/ˈæŋ.kəl/",
    "meaning": "n 脚踝",
    "example": "ankle joint (踝关节)",
    "level": "CET4"
  },
  {
    "id": 37,
    "word": "anonymous",
    "phonetic": "/əˈnɒn.ɪ.məs/",
    "meaning": "adj 匿名的",
    "example": "alcoholics anonymous (匿名戒酒互助社；慝名戒毒会)",
    "level": "CET4"
  },
  {
    "id": 38,
    "word": "anticipate",
    "phonetic": "/ænˈtɪs.ɪ.peɪt/",
    "meaning": "v 期望，预期",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 39,
    "word": "anxiety",
    "phonetic": "/æŋˈzaɪ.ə.ti/",
    "meaning": "n 焦虑",
    "example": "anxiety disorder (焦虑症；焦虑性障碍；焦虑症候群)",
    "level": "CET4"
  },
  {
    "id": 40,
    "word": "apartment",
    "phonetic": "/əˈpɑːt.mənt/",
    "meaning": "n 公寓",
    "example": "apartment building (（美）公寓大楼)",
    "level": "CET4"
  },
  {
    "id": 42,
    "word": "apologize",
    "phonetic": "/əˈpɒl.ə.dʒaɪz/",
    "meaning": "v 道歉",
    "example": "apologize for (道歉)",
    "level": "CET4"
  },
  {
    "id": 43,
    "word": "applicable",
    "phonetic": "/əˈplɪk.ə.bəl/",
    "meaning": "adj 可应用的",
    "example": "applicable scope (适用范围)",
    "level": "CET4"
  },
  {
    "id": 44,
    "word": "applicant",
    "phonetic": "/ˈæp.lə.kɪnt/",
    "meaning": "n 申请者",
    "example": "job applicant (求职人员)",
    "level": "CET4"
  },
  {
    "id": 45,
    "word": "appoint",
    "phonetic": "/əˈpɔɪnt/",
    "meaning": "v 任命",
    "example": "make an appointment (约会，预约)",
    "level": "CET4",
    "exampleRoot": "appointment"
  },
  {
    "id": 47,
    "word": "approach",
    "phonetic": "/əˈpɹəʊt͡ʃ/",
    "meaning": "n 方法",
    "example": "new approach (新方案；新做法)",
    "level": "CET4"
  },
  {
    "id": 48,
    "word": "appropriate",
    "phonetic": "/əˈprəʊ.pri.ət/",
    "meaning": "adj 适当的",
    "example": "as appropriate (酌情；[拉丁语]视情况而定)",
    "level": "CET4"
  },
  {
    "id": 49,
    "word": "approve",
    "phonetic": "/əˈpɹuːv/",
    "meaning": "v 赞同",
    "example": "approve oneself ([古语]证明为，表明为)",
    "level": "CET4"
  },
  {
    "id": 50,
    "word": "approximately",
    "phonetic": "/əˈpɹɒk.sɪ.mət.li/",
    "meaning": "adv 大约",
    "example": "approximately equal (约等于，近似等于)",
    "level": "CET4"
  },
  {
    "id": 51,
    "word": "arm",
    "phonetic": "/ɑːm/",
    "meaning": "v 装备，武装",
    "example": "in arms (怀抱着的；武装起来的)",
    "level": "CET4"
  },
  {
    "id": 52,
    "word": "arouse",
    "phonetic": "/əˈɹaʊz/",
    "meaning": "v 唤起",
    "example": "arouse the enthusiasm of (调动积极性)",
    "level": "CET4"
  },
  {
    "id": 54,
    "word": "artificial",
    "phonetic": "/ɑː(ɹ)təˈfɪʃəl/",
    "meaning": "adj 人造的，虚伪的",
    "example": "artificial intelligence (人工智能)",
    "level": "CET4"
  },
  {
    "id": 55,
    "word": "aspect",
    "phonetic": "/ˈæspɛkt/",
    "meaning": "n 方面",
    "example": "aspect ratio (纵横比；屏幕高宽比)",
    "level": "CET4"
  },
  {
    "id": 57,
    "word": "assemble",
    "phonetic": "/əˈsɛmbl̩/",
    "meaning": "v 收集，组装",
    "example": "assemble language (n. 汇编语言)",
    "level": "CET4"
  },
  {
    "id": 59,
    "word": "association",
    "phonetic": "/əˌsəʊsiˈeɪʃən/",
    "meaning": "n 联系",
    "example": "association with (与…的交往；与…联合)",
    "level": "CET4"
  },
  {
    "id": 61,
    "word": "atmosphere",
    "phonetic": "/ˈæt.məsˌfɪə(ɹ)/",
    "meaning": "n 气氛，空气",
    "example": "earth's atmosphere (地球大气)",
    "level": "CET4"
  },
  {
    "id": 64,
    "word": "authority",
    "phonetic": "/ɔːˈθɒɹəti/",
    "meaning": "n 权威",
    "example": "competent authority ([法]主管当局，主管部门)",
    "level": "CET4"
  },
  {
    "id": 66,
    "word": "automatic",
    "phonetic": "/ˌɔːtəˈmætɪk/",
    "meaning": "adj 自动的",
    "example": "automatic control (自动控制)",
    "level": "CET4"
  },
  {
    "id": 67,
    "word": "auxiliary",
    "phonetic": "/ɔːkˈsɪli.əɹi/",
    "meaning": "adj 辅助的",
    "example": "auxiliary equipment (辅助设备，附属设备；备用设备)",
    "level": "CET4"
  },
  {
    "id": 68,
    "word": "available",
    "phonetic": "/əˈveɪləb(ə)l/",
    "meaning": "adj 可获得的，可利用的",
    "example": "available for (可用于…的；对…有效的；能参加…的)",
    "level": "CET4"
  },
  {
    "id": 69,
    "word": "awareness",
    "phonetic": "/əˈwɛənəs/",
    "meaning": "n 意识",
    "example": "awareness of (意识到)",
    "level": "CET4"
  },
  {
    "id": 807,
    "word": "aggressive",
    "phonetic": "/əˈɡɹɛs.ɪv/",
    "meaning": "adj 挑衅的",
    "example": "aggressive behavior (攻击行为；侵犯行为)",
    "level": "CET4"
  },
  {
    "id": 822,
    "word": "ambition",
    "phonetic": "/æmˈbɪ.ʃən/",
    "meaning": "n 野心，报复",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 927,
    "word": "access",
    "phonetic": "/ˈæksɛs/",
    "meaning": "v 取得，获取",
    "example": "access control (访问控制)",
    "level": "CET4"
  },
  {
    "id": 934,
    "word": "accumulate",
    "phonetic": "/əˈkjuːmjʊˌleɪt/",
    "meaning": "v 积累",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 937,
    "word": "assume",
    "phonetic": "/əˈsuːm/",
    "meaning": "v 假定，认为",
    "example": "assume responsibility (承担责任)",
    "level": "CET4"
  },
  {
    "id": 974,
    "word": "assumption",
    "phonetic": "/əˈsʌmp.ʃən/",
    "meaning": "n 假设",
    "example": "on the assumption that (假设)",
    "level": "CET4"
  },
  {
    "id": 979,
    "word": "adversity",
    "phonetic": "/ædˈvɜː.sɪ.ti/",
    "meaning": "n 逆境",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 986,
    "word": "attribute",
    "phonetic": "/əˈtrɪb.juːt/",
    "meaning": "v 归因于",
    "example": "attribute data (属性资料（数据）)",
    "level": "CET4"
  },
  {
    "id": 991,
    "word": "appeal",
    "phonetic": "/əˈpiːl/",
    "meaning": "n 请求，呼吁, 上诉",
    "example": "appeal for (vt. 恳求，请求；要求)",
    "level": "CET4"
  },
  {
    "id": 1012,
    "word": "accommodate",
    "phonetic": "/əˈkɒməˌdeɪt/",
    "meaning": "v 适应，容纳",
    "example": "accommodate with (向…供应；提供；以…供应)",
    "level": "CET4"
  },
  {
    "id": 1066,
    "word": "awkward",
    "phonetic": "/ˈɑkwɚd/",
    "meaning": "adj 尴尬的，棘手的，笨拙的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 1097,
    "word": "agony",
    "phonetic": "/ˈæ.ɡə.niː/",
    "meaning": "n 痛苦",
    "example": "agony of ((感情上的)突然而强烈的爆发，任何精神上的激动)",
    "level": "CET4"
  },
  {
    "id": 1188,
    "word": "arise",
    "phonetic": "/əˈɹaɪz/",
    "meaning": "v 出现",
    "example": "arise from (由…引起，起因于)",
    "level": "CET4"
  },
  {
    "id": 1232,
    "word": "action",
    "phonetic": "/ˈæk.ʃən/",
    "meaning": "n 行动",
    "example": "take action (采取行动；提出诉讼)",
    "level": "CET4"
  },
  {
    "id": 1287,
    "word": "axis",
    "phonetic": "/ˈæksəs/",
    "meaning": "n 轴，轴线",
    "example": "principal axis ([物]主轴)",
    "level": "CET4"
  },
  {
    "id": 1290,
    "word": "anniversary",
    "phonetic": "/ˌænɪˈvɜːs(ə)ɹi/",
    "meaning": "n 周年纪念日",
    "example": "wedding anniversary (结婚纪念日；结婚周年纪念日)",
    "level": "CET4"
  },
  {
    "id": 1293,
    "word": "anybody",
    "phonetic": "/ˈɛn.i.bɒd.i/",
    "meaning": "n 重要人物",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 1317,
    "word": "audience",
    "phonetic": "/ˈɔːdi.əns/",
    "meaning": "n 正式会见；拜会",
    "example": "target audience (目标受众；目标观众；目标客户)",
    "level": "CET4"
  },
  {
    "id": 1343,
    "word": "album",
    "phonetic": "/ˈælbəm/",
    "meaning": "n （收存照片或邮票的） 册子",
    "example": "photo album (相册；相簿)",
    "level": "CET4"
  },
  {
    "id": 1362,
    "word": "alongside",
    "phonetic": "/ə.lɒŋˈsaɪd/",
    "meaning": "prep 在…旁边",
    "example": "alongside of (与…并肩；在旁边)",
    "level": "CET4"
  },
  {
    "id": 1397,
    "word": "avail",
    "phonetic": "/əˈveɪl/",
    "meaning": "v 有益于，有用；n 效用",
    "example": "to no avail (无效，完全无用)",
    "level": "CET4"
  },
  {
    "id": 1398,
    "word": "ambitious",
    "phonetic": "/æmˈbɪʃ.əs/",
    "meaning": "adj 有雄心的；热望的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 1468,
    "word": "amateur",
    "phonetic": "/ˈæ.mə.tə/",
    "meaning": "adj 业余的；n 业余爱好者",
    "example": "amateur radio (业余无线电；业余无线电爱好者)",
    "level": "CET4"
  },
  {
    "id": 1527,
    "word": "appreciation",
    "phonetic": "/əˌpɹiː.ʃiˈeɪ.ʃən/",
    "meaning": "n 欣赏；感激",
    "example": "aesthetic appreciation (审美)",
    "level": "CET4"
  },
  {
    "id": 1574,
    "word": "apparent",
    "phonetic": "/əˈpæ.ɹənt/",
    "meaning": "adj 显然的",
    "example": "apparent viscosity (表观粘度)",
    "level": "CET4"
  },
  {
    "id": 1645,
    "word": "atom",
    "phonetic": "/ˈatəm/",
    "meaning": "n 原子",
    "example": "hydrogen atom (氢原子)",
    "level": "CET4"
  },
  {
    "id": 1650,
    "word": "awful",
    "phonetic": "/ˈɔːfəl/",
    "meaning": "adj 威严的；令人崇敬的",
    "example": "an awful lot (◎经常)",
    "level": "CET4"
  },
  {
    "id": 1705,
    "word": "advertise",
    "phonetic": "/ˈadvə(ɹ)taɪz/",
    "meaning": "v 登广告",
    "example": "advertise for (登广告征求（寻找）某物；登招请（待聘等）广告)",
    "level": "CET4"
  },
  {
    "id": 1722,
    "word": "accord",
    "phonetic": "/əˈkɔːd/",
    "meaning": "n 符合；协议",
    "example": "accord with (同…相符合；与…一致)",
    "level": "CET4"
  },
  {
    "id": 1820,
    "word": "acquaint",
    "phonetic": "/əˈkweɪnt/",
    "meaning": "v 使认识，使了解",
    "example": "acquaint with (熟悉；使认识，使了解)",
    "level": "CET4"
  },
  {
    "id": 1917,
    "word": "awake",
    "phonetic": "/əˈweɪk/",
    "meaning": "v 认识到",
    "example": "stay awake (保持清醒；保持醒着的)",
    "level": "CET4"
  },
  {
    "id": 1955,
    "word": "admiration",
    "phonetic": "/ˌæd.mɚˈeɪʃ.ən/",
    "meaning": "n 钦佩；赞美，羡慕",
    "example": "admiration for (钦佩；对…赞赏)",
    "level": "CET4"
  },
  {
    "id": 2046,
    "word": "annually",
    "phonetic": "/ˈæn.jʊə.li/",
    "meaning": "adv 年年，每年",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 2087,
    "word": "ally",
    "phonetic": "/ˈæl.aɪ/",
    "meaning": "n 盟国；同盟者，伙伴",
    "example": "ally with (与…结盟)",
    "level": "CET4"
  },
  {
    "id": 2287,
    "word": "architect",
    "phonetic": "/ˈɑːkɪtɛkt/",
    "meaning": "n 建筑师；创造者",
    "example": "landscape architect (n. 造园技师；环境美化设计家)",
    "level": "CET4"
  },
  {
    "id": 2383,
    "word": "applause",
    "phonetic": "/əˈplɔːz/",
    "meaning": "n 喝彩；夸奖，称赞",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 2432,
    "word": "antique",
    "phonetic": "/ænˈtiːk/",
    "meaning": "adj 古代的；n 古物",
    "example": "antique furniture (古董家具；古典家具；古式家具)",
    "level": "CET4"
  },
  {
    "id": 2483,
    "word": "answer",
    "phonetic": "/ˈan.sə/",
    "meaning": "v 符合，适合",
    "example": "in answer to (回答；应…要求)",
    "level": "CET4"
  },
  {
    "id": 2514,
    "word": "aviation",
    "phonetic": "/eɪviˈeɪʃən/",
    "meaning": "n 飞行（术）",
    "example": "civil aviation (民用航空)",
    "level": "CET4"
  },
  {
    "id": 2562,
    "word": "affirm",
    "phonetic": "/əˈfɜːm/",
    "meaning": "v 断言，证实",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 2606,
    "word": "attendance",
    "phonetic": "/əˈtɛn.dəns/",
    "meaning": "n 到场；出席人数",
    "example": "attendance at (出席)",
    "level": "CET4"
  },
  {
    "id": 2616,
    "word": "attorney",
    "phonetic": "/əˈtɜː(ɹ)ni/",
    "meaning": "n 代理人；辩护律师",
    "example": "power of attorney (委托书)",
    "level": "CET4"
  },
  {
    "id": 2624,
    "word": "ambassador",
    "phonetic": "/æmˈbæs.ə.də(ɹ)/",
    "meaning": "n 大使，使节",
    "example": "an ambassador (大使)",
    "level": "CET4"
  },
  {
    "id": 2664,
    "word": "author",
    "phonetic": "/ˈɔː.θə/",
    "meaning": "n 创造者，创始人",
    "example": "original author (原著者)",
    "level": "CET4"
  },
  {
    "id": 2694,
    "word": "acknowledge",
    "phonetic": "/əkˈnɒ.lɪdʒ/",
    "meaning": "v 承认；告知收到",
    "example": "acknowledge receipt (证实收到)",
    "level": "CET4"
  },
  {
    "id": 2739,
    "word": "absent",
    "phonetic": "/ˈæb.sn̩t/",
    "meaning": "adj 不在的",
    "example": "absent from (缺席)",
    "level": "CET4"
  },
  {
    "id": 2780,
    "word": "advocate",
    "phonetic": "/ˈæd.və.keɪt/",
    "meaning": "v 拥护；n 辩护律师",
    "example": "devil's advocate (故意持相反意见的人；故意唱反调的人)",
    "level": "CET4"
  },
  {
    "id": 2808,
    "word": "announce",
    "phonetic": "/əˈnaʊns/",
    "meaning": "v 报告…的来到",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 2973,
    "word": "allowance",
    "phonetic": "/əˈlaʊəns/",
    "meaning": "n 津贴，补助费",
    "example": "allowance for (…的留量；…的修正值)",
    "level": "CET4"
  },
  {
    "id": 2975,
    "word": "analyse",
    "phonetic": "/ˈæn.əl.aɪz/",
    "meaning": "vt 分析； 分解， 解析",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 2992,
    "word": "analysis",
    "phonetic": "/əˈnælɪsɪs/",
    "meaning": "n 分析， 分析报告； 分解， 解析",
    "example": "analysis method (解析法；离子微探针质谱仪分析法)",
    "level": "CET4"
  },
  {
    "id": 3032,
    "word": "approval",
    "phonetic": "/əˈpɹuːvəl/",
    "meaning": "n 赞成， 同意； 认可， 批准",
    "example": "approval of (批准；同意)",
    "level": "CET4"
  },
  {
    "id": 3070,
    "word": "associate",
    "phonetic": "/əˈsəʊsi.ət/",
    "meaning": "v 把…联系在一起；使联合，结合；交往\t[ə'səuʃiət]；adj 副的；n 伙伴，同事",
    "example": "associate professor (副教授)",
    "level": "CET4"
  },
  {
    "id": 3072,
    "word": "academic",
    "phonetic": "/ˌækəˈdɛmɪk/",
    "meaning": "adj 学院的；学术的；纯理论的，不切实际的；n 大学教师",
    "example": "academic research (学术研究)",
    "level": "CET4"
  },
  {
    "id": 3109,
    "word": "apparatus",
    "phonetic": "/æpəˈɹɑːtəs/",
    "meaning": "n 器械， 器具， 仪器； 机构， 组织",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3112,
    "word": "absorb",
    "phonetic": "/əbˈsɔːb/",
    "meaning": "vt 吸收； 吸引…的注意， 使全神贯注； 把…并入， 同化",
    "example": "absorb in (集中精力做某事；全神贯注于)",
    "level": "CET4"
  },
  {
    "id": 3117,
    "word": "abundant",
    "phonetic": "/əˈbʌn.dn̩t/",
    "meaning": "adj 丰富的， 富裕的； 大量的， 充足的",
    "example": "abundant in (富于；富有)",
    "level": "CET4"
  },
  {
    "id": 3122,
    "word": "abnormal",
    "phonetic": "/əbˈnɔɹ.ml̩/",
    "meaning": "adj 反常的， 异常的",
    "example": "abnormal phenomena (异常现象)",
    "level": "CET4"
  },
  {
    "id": 3128,
    "word": "accident",
    "phonetic": "/ˈæk.sə.dənt/",
    "meaning": "n 意外， 事故",
    "example": "traffic accident (交通事故)",
    "level": "CET4"
  },
  {
    "id": 3129,
    "word": "attack",
    "phonetic": "/əˈtæk/",
    "meaning": "n&vt 攻击， 进攻； 突然发作",
    "example": "heart attack (心脏病发作)",
    "level": "CET4"
  },
  {
    "id": 3132,
    "word": "attach",
    "phonetic": "/əˈtætʃ/",
    "meaning": "vt 缚， 系， 贴， 附加； 使依恋， 使喜爱； 使附属； 认为有",
    "example": "attached please find (附上…请查收[书信用语])",
    "level": "CET4"
  },
  {
    "id": 3156,
    "word": "adapt",
    "phonetic": "/əˈdæpt/",
    "meaning": "vt 使适应； 改编",
    "example": "adapt to something (（使）适合；（使）适应)",
    "level": "CET4"
  },
  {
    "id": 3181,
    "word": "attain",
    "phonetic": "/əˈteɪn/",
    "meaning": "vt 达到， 获得； 完成",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3188,
    "word": "allocate",
    "phonetic": "/ˈæl.ə.keɪt/",
    "meaning": "vt 分配； 分派， 把…拨给",
    "example": "allocate funds (拨款；分配资金)",
    "level": "CET4"
  },
  {
    "id": 3194,
    "word": "assure",
    "phonetic": "/əˈʃɔː/",
    "meaning": "vt 使确信； 确保， 向…保证",
    "example": "assure oneself (弄清楚，查明)",
    "level": "CET4"
  },
  {
    "id": 3207,
    "word": "alliance",
    "phonetic": "/əˈlaɪ.əns/",
    "meaning": "n 结盟； 联盟",
    "example": "strategic alliance (战略联盟（两家公司的合作安排，两者决定分享资源，互补长短）；策略联盟)",
    "level": "CET4"
  },
  {
    "id": 3215,
    "word": "accustomed",
    "phonetic": "/ə.ˈkʌs.təmd/",
    "meaning": "adj 惯常的， 习惯的",
    "example": "become accustomed to (习惯于；对…变得习以为常)",
    "level": "CET4"
  },
  {
    "id": 3234,
    "word": "account",
    "phonetic": "/ə.ˈkaʊnt/",
    "meaning": "vi 说明…的原因； 占…；n 记述；解释；账目",
    "example": "account of (在某人帐上重视， 记帐)",
    "level": "CET4"
  },
  {
    "id": 3248,
    "word": "attitude",
    "phonetic": "/ˈætɪˌtjuːd/",
    "meaning": "n 态度， 看法； 姿势",
    "example": "attitude towards (态度，看法)",
    "level": "CET4"
  },
  {
    "id": 3284,
    "word": "accompany",
    "phonetic": "/ə.ˈkʌm.pə.ni/",
    "meaning": "v 陪同， 伴随； 为…伴奏",
    "example": "accompany with (伴随着，兼带着；陪…同行)",
    "level": "CET4"
  },
  {
    "id": 3286,
    "word": "acceptance",
    "phonetic": "/ək.ˈsɛp.təns/",
    "meaning": "n 接受， 承认； 容忍",
    "example": "final acceptance (验收；最终验收；最后验收)",
    "level": "CET4"
  },
  {
    "id": 3290,
    "word": "additional",
    "phonetic": "/əˈdɪʃənəl/",
    "meaning": "adj 附加的， 追加的",
    "example": "additional information (附加信息；其他信息)",
    "level": "CET4"
  },
  {
    "id": 3305,
    "word": "attempt",
    "phonetic": "/əˈtɛmpt/",
    "meaning": "vt 尝试， 试图， 努力",
    "example": "attempt at (企图，努力；尝试)",
    "level": "CET4"
  },
  {
    "id": 3318,
    "word": "afford",
    "phonetic": "/əˈfɔːd/",
    "meaning": "vt 担负得起； 提供",
    "example": "can afford (买得起；有能力负担)",
    "level": "CET4"
  },
  {
    "id": 3340,
    "word": "arrangement",
    "phonetic": "/əˈɹeɪnd͡ʒmənt/",
    "meaning": "n 整理， 排列； 安排； 准备工作",
    "example": "arrangement for (对…的安排)",
    "level": "CET4"
  },
  {
    "id": 3345,
    "word": "alter",
    "phonetic": "/ˈɑl.tɚ/",
    "meaning": "vt 改变， 变更， 变动",
    "example": "alter ego (n. 密友；个性的另一面；至交)",
    "level": "CET4"
  },
  {
    "id": 3370,
    "word": "accommodation",
    "phonetic": "/ə.ˌkɒm.ə.ˈdeɪ.ʃən/",
    "meaning": "n 住处， 膳宿",
    "example": "accommodation space (起居舱室)",
    "level": "CET4"
  },
  {
    "id": 3373,
    "word": "annoy",
    "phonetic": "/əˈnɔɪ/",
    "meaning": "vt 使恼怒； 打搅",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3404,
    "word": "accordance",
    "phonetic": "/ə.ˈkɔɹd.əns/",
    "meaning": "n 一致， 和谐， 符合",
    "example": "in accordance (按照；与…一致)",
    "level": "CET4"
  },
  {
    "id": 3412,
    "word": "abandon",
    "phonetic": "/əˈbæn.dən/",
    "meaning": "vt 离弃， 丢弃； 遗弃； 抛弃； 放弃",
    "example": "with abandon (恣意地，放纵地)",
    "level": "CET4"
  },
  {
    "id": 3417,
    "word": "agent",
    "phonetic": "/ˈeɪ.dʒənt/",
    "meaning": "n 代理人， 代理商； 政府代表； 动因， 原因； 剂",
    "example": "coupling agent ([化]偶联剂)",
    "level": "CET4"
  },
  {
    "id": 3436,
    "word": "appliance",
    "phonetic": "/əˈplaɪəns/",
    "meaning": "n 用具， 器具， 器械",
    "example": "home appliance (家电产品；家用电器)",
    "level": "CET4"
  },
  {
    "id": 3437,
    "word": "alloy",
    "phonetic": "/ˈæl.ɔɪ/",
    "meaning": "n 合金；vt 将…铸成合金",
    "example": "aluminum alloy ([冶金]铝合金)",
    "level": "CET4"
  },
  {
    "id": 3444,
    "word": "assistance",
    "phonetic": "/əˈsɪs.təns/",
    "meaning": "n 协助， 援助",
    "example": "technical assistance (技术援助)",
    "level": "CET4"
  },
  {
    "id": 3446,
    "word": "admit",
    "phonetic": "/ədˈmɪt/",
    "meaning": "vi 承认；vt 承认，供认；准许…进入",
    "example": "admit of (容许，有…的可能)",
    "level": "CET4"
  },
  {
    "id": 3448,
    "word": "apply",
    "phonetic": "/əˈplaɪ/",
    "meaning": "vi 应用，实施，使用；适用；申请，请求；vt 涂， 敷， 施",
    "example": "apply oneself (减少对…之消耗量；努力，致力于…)",
    "level": "CET4"
  },
  {
    "id": 3456,
    "word": "achievement",
    "phonetic": "/əˈtʃiːvmənt/",
    "meaning": "n 完成； 成就， 成绩",
    "example": "outstanding achievement (业绩；杰出成就)",
    "level": "CET4"
  },
  {
    "id": 3479,
    "word": "appearance",
    "phonetic": "/əˈpɪəɹəns/",
    "meaning": "n 出现， 来到； 外观",
    "example": "in appearance (adv. 在外表上)",
    "level": "CET4"
  },
  {
    "id": 3485,
    "word": "arrange",
    "phonetic": "/əˈɹeɪndʒ/",
    "meaning": "v 安排， 准备； 整理",
    "example": "arrange for (安排；为…做准备)",
    "level": "CET4"
  },
  {
    "id": 3495,
    "word": "advantage",
    "phonetic": "/ədˈvɑːn.tɪdʒ/",
    "meaning": "n 优点， 优势； 好处",
    "example": "take advantage of (利用)",
    "level": "CET4"
  },
  {
    "id": 3534,
    "word": "acid",
    "phonetic": "/ˈæs.ɪd/",
    "meaning": "adj 酸的， 酸性的； 尖刻的， 刻薄的；n 酸",
    "example": "amino acid (n. [化]氨基酸)",
    "level": "CET4"
  },
  {
    "id": 3622,
    "word": "application",
    "phonetic": "/aplɪˈkeɪʃ(ə)n/",
    "meaning": "n 申请， 申请书； 施用， 涂抹； 应用， 实施； 实用性",
    "example": "practical application (实际应用)",
    "level": "CET4"
  },
  {
    "id": 3632,
    "word": "annual",
    "phonetic": "/ˈæn.ju.əl/",
    "meaning": "adj 每年的，一年一次的；n 年报， 年鉴； 一年生的植物",
    "example": "annual meeting (年会)",
    "level": "CET4"
  },
  {
    "id": 3642,
    "word": "acquire",
    "phonetic": "/əˈkwaɪə/",
    "meaning": "vt 取得， 获得； 学到",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3660,
    "word": "attractive",
    "phonetic": "/əˈtɹæktɪv/",
    "meaning": "adj 有吸引力的， 引起注意的",
    "example": "attractive appearance (造型美观)",
    "level": "CET4"
  },
  {
    "id": 3668,
    "word": "absence",
    "phonetic": "/ˈæb.s(ə)n̩s/",
    "meaning": "n 缺席， 不在； 缺席的时间， 外出期； 缺乏， 不存在",
    "example": "absence of (缺乏)",
    "level": "CET4"
  },
  {
    "id": 3669,
    "word": "attract",
    "phonetic": "/əˈtɹækt/",
    "meaning": "vt 吸引， 引起…注意",
    "example": "attract foreign investment (吸引外商投资；对外招商)",
    "level": "CET4"
  },
  {
    "id": 3717,
    "word": "arrest",
    "phonetic": "/əˈɹɛst/",
    "meaning": "vt 逮捕，拘留；停止，阻止；吸引；n 逮捕， 拘留， 扣留",
    "example": "cardiac arrest ([医]心搏停止)",
    "level": "CET4"
  },
  {
    "id": 3730,
    "word": "acute",
    "phonetic": "/əˈkjuːt/",
    "meaning": "adj 严重的； 急性的； 灵敏的， 敏锐的； 精明的",
    "example": "acute myocardial infarction (急性心肌梗塞)",
    "level": "CET4"
  },
  {
    "id": 3740,
    "word": "assignment",
    "phonetic": "/əˈsaɪn.mənt/",
    "meaning": "n 任务； 指定的作业； 分配， 指派",
    "example": "assignment problem (指派问题；分配问题；分派问题；配置问题)",
    "level": "CET4"
  },
  {
    "id": 3750,
    "word": "addition",
    "phonetic": "/æˈdɪʃən/",
    "meaning": "n 加， 加法； 附加物",
    "example": "in addition (另外，此外)",
    "level": "CET4"
  },
  {
    "id": 3753,
    "word": "ancestor",
    "phonetic": "/ˈæn.sɛs.tə/",
    "meaning": "n 祖宗， 祖先； 原型； 先驱",
    "example": "ancestor worship (祖先崇拜；祭祖；敬奉祖先)",
    "level": "CET4"
  },
  {
    "id": 3776,
    "word": "adjust",
    "phonetic": "/əˈdʒʌst/",
    "meaning": "vi 适应；vt 调整，调节；校正",
    "example": "adjust and control (调控)",
    "level": "CET4"
  },
  {
    "id": 3790,
    "word": "avoid",
    "phonetic": "/əˈvɔɪd/",
    "meaning": "vt 避免， 躲开； 撤销",
    "example": "avoid doing (避免做某事；逃避…)",
    "level": "CET4"
  },
  {
    "id": 3792,
    "word": "assign",
    "phonetic": "/əˈsaɪn/",
    "meaning": "vt 指派， 分配； 布置； 指定",
    "example": "assign work (派活；指派工作)",
    "level": "CET4"
  },
  {
    "id": 3808,
    "word": "amplify",
    "phonetic": "/ˈæmp.lɪ.faɪ/",
    "meaning": "vt 放大， 增强； 扩大； 详述， 进一步阐述",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3862,
    "word": "alcohol",
    "phonetic": "/ˈæl.kə.hɒl/",
    "meaning": "n 酒精， 乙醇",
    "example": "polyvinyl alcohol (聚乙烯醇)",
    "level": "CET4"
  },
  {
    "id": 3873,
    "word": "advisable",
    "phonetic": "/ədˈvaɪ.zə.bəl/",
    "meaning": "adj 可取的； 适当的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3899,
    "word": "authoritative",
    "phonetic": "/ɔːˈθɒɹɪtətɪv/",
    "meaning": "adj 有权威性的， 可信的； 专断的， 命令式的",
    "example": "authoritative information (官方消息)",
    "level": "CET4"
  },
  {
    "id": 3900,
    "word": "athlete",
    "phonetic": "/ˈæθ.lit/",
    "meaning": "n 运动员， 体育家",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 3918,
    "word": "argue",
    "phonetic": "/ˈɑː.ɡjuː/",
    "meaning": "vi 争论，争辩，辩论；vt 主张； 说服",
    "example": "argue with (争论；和…争吵)",
    "level": "CET4"
  },
  {
    "id": 3954,
    "word": "assess",
    "phonetic": "/əˈsɛs/",
    "meaning": "vt 对估价； 评价， 评论",
    "example": "risk assessment (风险估计，危险率估计)",
    "level": "CET4",
    "exampleRoot": "assessment"
  },
  {
    "id": 3957,
    "word": "asset",
    "phonetic": "/ˈæsɪt/",
    "meaning": "n 资产， 财产； 有价值的特性或技能， 优点",
    "example": "asset management (资产管理)",
    "level": "CET4"
  },
  {
    "id": 3959,
    "word": "apology",
    "phonetic": "/əˈpɒl.ə.dʒi/",
    "meaning": "n 道歉， 认错， 谢罪",
    "example": "an apology for something (不像样的代替品，勉强充作某物的东西，滥竽充数的样品[用于贬义])",
    "level": "CET4"
  },
  {
    "id": 3960,
    "word": "adequate",
    "phonetic": "/ˈæd.ɪ.kwət/",
    "meaning": "adj 足够的； 可以胜任的",
    "example": "adequate for (胜任……的；对……是足够的；适合……的)",
    "level": "CET4"
  },
  {
    "id": 3980,
    "word": "aware",
    "phonetic": "/əˈweːɹ/",
    "meaning": "adj 知道的， 意识到的",
    "example": "aware of (意识到，知道)",
    "level": "CET4"
  },
  {
    "id": 3983,
    "word": "award",
    "phonetic": "/əˈwɔːd/",
    "meaning": "n 奖，奖品；判定；vt 授予， 给予； 判给， 裁定",
    "example": "academy award (奥斯卡金像奖；学院奖（美国电影艺术科学院颁发的年度奖项）)",
    "level": "CET4"
  },
  {
    "id": 3984,
    "word": "alarm",
    "phonetic": "/əˈlɑːm/",
    "meaning": "n 惊恐，忧虑，警报；vt 使惊恐， 使担心",
    "example": "alarm system (报警系统)",
    "level": "CET4"
  },
  {
    "id": 3988,
    "word": "arbitrary",
    "phonetic": "/ˈɑɹ.bɪ.tɹɛ(ə).ɹi/",
    "meaning": "adj 随心所欲的； 专断的",
    "example": "arbitrary function (随意函数；任意函数)",
    "level": "CET4"
  },
  {
    "id": 3992,
    "word": "abruptly",
    "phonetic": "/ə.ˈbɹʌpt.li/",
    "meaning": "adv 突然地",
    "example": "abrupt change (突变；陡变)",
    "level": "CET4",
    "exampleRoot": "abrupt"
  },
  {
    "id": 3993,
    "word": "accessible",
    "phonetic": "/əkˈsɛs.ə.bəl/",
    "meaning": "adj 易接近的",
    "example": "readily accessible (易接近的；易达到的；可存取的)",
    "level": "CET4"
  },
  {
    "id": 3994,
    "word": "addiction",
    "phonetic": "/əˈdɪkʃən/",
    "meaning": "n 上瘾",
    "example": "drug addiction (药物成瘾)",
    "level": "CET4"
  },
  {
    "id": 3995,
    "word": "administrative",
    "phonetic": "/ədˈmɪ.nɪs.tɹəˌtɪv/",
    "meaning": "adj 管理的",
    "example": "administrative region (行政区域；行政分区)",
    "level": "CET4"
  },
  {
    "id": 3996,
    "word": "admire",
    "phonetic": "/ədˈmaɪə/",
    "meaning": "v 钦佩，称赞",
    "example": "admire for (vt. 赞赏)",
    "level": "CET4"
  },
  {
    "id": 3997,
    "word": "admission",
    "phonetic": "/ædˈmɪʃ.ən/",
    "meaning": "n 准许进(加)入；入场费；承认",
    "example": "admission of sth (承认)",
    "level": "CET4"
  },
  {
    "id": 3998,
    "word": "advance",
    "phonetic": "/ədˈvaːns/",
    "meaning": "v & n 前进，提前",
    "example": "in advance (adv. 预先，提前)",
    "level": "CET4"
  },
  {
    "id": 3999,
    "word": "advanced",
    "phonetic": "/ədˈvɑːnst/",
    "meaning": "adj 高级的",
    "example": "advanced technology (先进技术)",
    "level": "CET4"
  },
  {
    "id": 4000,
    "word": "advancement",
    "phonetic": "/ædˈvæns.mɛnt/",
    "meaning": "n 进步，提升",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4001,
    "word": "advice",
    "phonetic": "/ədˈvaɪs/",
    "meaning": "n 建议",
    "example": "seek advice (征求意见；请教)",
    "level": "CET4"
  },
  {
    "id": 4002,
    "word": "advisory",
    "phonetic": "/ədˈvaɪzəɹi/",
    "meaning": "n 报告",
    "example": "advisory committee (咨询委员会)",
    "level": "CET4"
  },
  {
    "id": 4003,
    "word": "advocator",
    "phonetic": "/ˈæd.və.keɪ.tər/",
    "meaning": "n 主张者，倡导者",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4004,
    "word": "affectionate",
    "phonetic": "/əˈfɛkʃənət/",
    "meaning": "adj 深情的，柔情的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4005,
    "word": "affirmation",
    "phonetic": "/æfɝˈmeɪʃn/",
    "meaning": "n 断言，肯定",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4006,
    "word": "agency",
    "phonetic": "/ˈeɪ.dʒən.si/",
    "meaning": "n 机构",
    "example": "news agency (通讯社；新闻通讯社)",
    "level": "CET4"
  },
  {
    "id": 4007,
    "word": "altitude",
    "phonetic": "/ˈælt.ɪˌtjuːd/",
    "meaning": "n 海拔, 高度",
    "example": "high altitude (高海拔)",
    "level": "CET4"
  },
  {
    "id": 4008,
    "word": "analyze",
    "phonetic": "/ˈæn.ə.laɪz/",
    "meaning": "v 分析",
    "example": "analyze data (分析数据；分析资料)",
    "level": "CET4"
  },
  {
    "id": 4009,
    "word": "appetite",
    "phonetic": "/ˈæp.ə.taɪt/",
    "meaning": "n 欲望, 胃口",
    "example": "appetite for (对…的欲望)",
    "level": "CET4"
  },
  {
    "id": 4010,
    "word": "appointment",
    "phonetic": "/əˈpɔɪnt.mɛnt/",
    "meaning": "n 约会",
    "example": "make an appointment (约会，预约)",
    "level": "CET4"
  },
  {
    "id": 4011,
    "word": "appreciate",
    "phonetic": "/əˈpɹiː.si.eɪt/",
    "meaning": "v 感激，欣赏",
    "example": "aesthetic appreciation (审美)",
    "level": "CET4",
    "exampleRoot": "appreciation"
  },
  {
    "id": 4012,
    "word": "archive",
    "phonetic": "/ˈɑɹkaɪv/",
    "meaning": "n 档案文件",
    "example": "archive file (n. [计]档案文件)",
    "level": "CET4"
  },
  {
    "id": 4013,
    "word": "ashamed",
    "phonetic": "/əˈʃeɪmd/",
    "meaning": "adj 害羞的",
    "example": "ashamed of (难为情，害臊；对…感到羞耻；对…感到惭愧)",
    "level": "CET4"
  },
  {
    "id": 4014,
    "word": "assembly",
    "phonetic": "/əˈsɛmb.lɪ/",
    "meaning": "n 装配",
    "example": "assembly line (装配线；流水作业线)",
    "level": "CET4"
  },
  {
    "id": 4015,
    "word": "astonish",
    "phonetic": "/əˈstɒnɪʃ/",
    "meaning": "v 使惊讶，使大为吃惊",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4016,
    "word": "average",
    "phonetic": "/ˈævəɹɪd͡ʒ/",
    "meaning": "adj 平常的",
    "example": "an average of (平均是…)",
    "level": "CET4"
  },
  {
    "id": 4017,
    "word": "aviate",
    "phonetic": "/ˈeɪvieɪt/",
    "meaning": "v 驾驶飞机",
    "example": "civil aviation (民用航空)",
    "level": "CET4",
    "exampleRoot": "aviation"
  },
  {
    "id": 4281,
    "word": "appealing",
    "phonetic": "/əˈpiː.lɪŋ/",
    "meaning": "adj 吸引人的",
    "example": "appealing design (造型美丽；造型优美)",
    "level": "CET4"
  },
  {
    "id": 4321,
    "word": "amusing",
    "phonetic": "/əˈmjuːzɪŋ/",
    "meaning": "adj 有趣的，好玩儿的",
    "example": "amuse oneself (自娱自乐，消遣)",
    "level": "CET4"
  },
  {
    "id": 4353,
    "word": "amaze",
    "phonetic": "/əˈmeɪz/",
    "meaning": "v 使吃惊",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4388,
    "word": "a",
    "phonetic": "/æɪ/",
    "meaning": "art 一(个)；每一(个)",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4389,
    "word": "ability",
    "phonetic": "/əˈ.bɪl.ɪ.ti/",
    "meaning": "n 能力；能耐，本领",
    "example": "innovation ability (创新能力)",
    "level": "CET4"
  },
  {
    "id": 4390,
    "word": "able",
    "phonetic": "/ˈeɪ.bl̩/",
    "meaning": "adj 有能力的；出色的",
    "example": "will be able to (将能够)",
    "level": "CET4"
  },
  {
    "id": 4391,
    "word": "aboard",
    "phonetic": "/əˈbɔːd/",
    "meaning": "adv 在船(车)上；上船",
    "example": "go aboard (上船；上飞机)",
    "level": "CET4"
  },
  {
    "id": 4392,
    "word": "about",
    "phonetic": "/əˈbɛʊt/",
    "meaning": "prep 关于；在…周围",
    "example": "how about (你认为…怎样)",
    "level": "CET4"
  },
  {
    "id": 4393,
    "word": "above",
    "phonetic": "/əˈbʌv/",
    "meaning": "prep 在…上面；高于",
    "example": "above oneself (自高自大；趾高气扬；兴高采烈)",
    "level": "CET4"
  },
  {
    "id": 4394,
    "word": "abroad",
    "phonetic": "/əˈbɹɔːd/",
    "meaning": "adv (在)国外；到处",
    "example": "home and abroad (国内外，海内外)",
    "level": "CET4"
  },
  {
    "id": 4395,
    "word": "absolute",
    "phonetic": "/ˈæb.səˌljuːt/",
    "meaning": "adj 绝对的；纯粹的",
    "example": "absolute value (绝对值)",
    "level": "CET4"
  },
  {
    "id": 4396,
    "word": "academy",
    "phonetic": "/əˈkæd.ə.mi/",
    "meaning": "n 私立中学；专科院校",
    "example": "academy of sciences (科学院)",
    "level": "CET4"
  },
  {
    "id": 4397,
    "word": "acceleration",
    "phonetic": "/æk.ˌsɛl.ə.ˈɹeɪ.ʃən/",
    "meaning": "n 加速；加速度",
    "example": "angular acceleration (角加速度)",
    "level": "CET4"
  },
  {
    "id": 4398,
    "word": "accent",
    "phonetic": "/ˈak.sənt/",
    "meaning": "n 口音，腔调；重音",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4399,
    "word": "accept",
    "phonetic": "/ækˈsɛpt/",
    "meaning": "v 接受；同意",
    "example": "accept of (v. 承兑)",
    "level": "CET4"
  },
  {
    "id": 4400,
    "word": "acceptable",
    "phonetic": "/æk.ˈsɛp.tə.bəl/",
    "meaning": "adj 可接受的，合意的",
    "example": "acceptable level (可接受的程度)",
    "level": "CET4"
  },
  {
    "id": 4401,
    "word": "accessary",
    "phonetic": "/ækˈsɛs(ə)ɹi/",
    "meaning": "n 同谋，从犯",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4402,
    "word": "accidental",
    "phonetic": "/ˌæk.sɪ.ˈdɛn.tl̩/",
    "meaning": "adj 偶然的；非本质的",
    "example": "accidental death (意外死亡；非正常死亡)",
    "level": "CET4"
  },
  {
    "id": 4403,
    "word": "accordingly",
    "phonetic": "/əˈkɔː(ɹ).dɪŋ.li/",
    "meaning": "adv 因此，所以；照着",
    "example": "act accordingly (核办)",
    "level": "CET4"
  },
  {
    "id": 4404,
    "word": "accuracy",
    "phonetic": "/[ˈækjʊrəsɪ]/",
    "meaning": "n 准确(性)；准确度",
    "example": "high accuracy (高准确度)",
    "level": "CET4"
  },
  {
    "id": 4405,
    "word": "ache",
    "phonetic": "/eɪk/",
    "meaning": "v 痛；想念；n 疼痛",
    "example": "aches and pains (痛苦；不适；各种各样的病痛)",
    "level": "CET4"
  },
  {
    "id": 4406,
    "word": "acre",
    "phonetic": "/ˈeɪ.kə/",
    "meaning": "n 英亩(=607亩)",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4407,
    "word": "across",
    "phonetic": "/əˈkɹɑs/",
    "meaning": "prep 横过；在…对面",
    "example": "across the board (全面地；包括一切地；以三等分的钱数赌同一匹马赢得前三名)",
    "level": "CET4"
  },
  {
    "id": 4408,
    "word": "act",
    "phonetic": "/æk/",
    "meaning": "v 行动；见效；n 行为",
    "example": "act as (担当)",
    "level": "CET4"
  },
  {
    "id": 4409,
    "word": "active",
    "phonetic": "/ˈæk.tɪv/",
    "meaning": "adj 活跃的；积极的",
    "example": "active in (积极于)",
    "level": "CET4"
  },
  {
    "id": 4410,
    "word": "activity",
    "phonetic": "/ækˈtɪ.və.ti/",
    "meaning": "n 活动；活力；行动",
    "example": "economic activity (经济活动)",
    "level": "CET4"
  },
  {
    "id": 4411,
    "word": "actor",
    "phonetic": "/ˈæk.tə/",
    "meaning": "n 男演员；演剧的人",
    "example": "best actor (最佳男主角；最佳男演员)",
    "level": "CET4"
  },
  {
    "id": 4412,
    "word": "actress",
    "phonetic": "/ˈak.tɹəs/",
    "meaning": "n 女演员",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4413,
    "word": "actual",
    "phonetic": "/ˈak(t)ʃj(ʊ)əl/",
    "meaning": "adj 实际的；现行的",
    "example": "actual situation (实际情况)",
    "level": "CET4"
  },
  {
    "id": 4414,
    "word": "actually",
    "phonetic": "/-ɪ/",
    "meaning": "adv 实际上；竟然",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4415,
    "word": "ad",
    "phonetic": "/æd/",
    "meaning": "n 广告",
    "example": "ad hoc (adj. 特别的；临时；专设)",
    "level": "CET4"
  },
  {
    "id": 4416,
    "word": "add",
    "phonetic": "/æd/",
    "meaning": "v 添加，附加，掺加",
    "example": "add up (v. 合计)",
    "level": "CET4"
  },
  {
    "id": 4417,
    "word": "adjective",
    "phonetic": "/ˈæ.d͡ʒə(k).tɪv/",
    "meaning": "n 形容词；adj 形容词的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4418,
    "word": "adult",
    "phonetic": "/əˈdʌlt/",
    "meaning": "n 成年人；adj 成年的",
    "example": "adult education (成人教育)",
    "level": "CET4"
  },
  {
    "id": 4419,
    "word": "adverb",
    "phonetic": "/ˈæd.vɜːb/",
    "meaning": "n 副词",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4420,
    "word": "advertisement",
    "phonetic": "/ədˈvɜːtɪsmənt/",
    "meaning": "n 广告；公告；登广告",
    "example": "advertisement company (广告公司)",
    "level": "CET4"
  },
  {
    "id": 4421,
    "word": "advise",
    "phonetic": "/ədˈvaɪz/",
    "meaning": "v 劝告；建议；通知",
    "example": "please advise (请指导；请指示)",
    "level": "CET4"
  },
  {
    "id": 4422,
    "word": "aeroplane",
    "phonetic": "/ˈeə.ɹə.pleɪn/",
    "meaning": "n 飞机",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4423,
    "word": "affair",
    "phonetic": "/əˈfɛə/",
    "meaning": "n 事情，事件；事务",
    "example": "state of affairs (事态；情势)",
    "level": "CET4"
  },
  {
    "id": 4424,
    "word": "affect",
    "phonetic": "/əˈfɛkt/",
    "meaning": "v 影响；感动",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4425,
    "word": "afraid",
    "phonetic": "/əˈfɹeɪd/",
    "meaning": "adj 害怕的；担心的",
    "example": "afraid of (害怕)",
    "level": "CET4"
  },
  {
    "id": 4426,
    "word": "Africa",
    "phonetic": "/ˈæf.rɪ.kə/",
    "meaning": "n 非洲",
    "example": "south africa (南非)",
    "level": "CET4"
  },
  {
    "id": 4427,
    "word": "African",
    "phonetic": "/ˈæf.rɪ.kən/",
    "meaning": "adj 非洲的；n 非洲人",
    "example": "south african (南非；南非的；南非人；南非人的)",
    "level": "CET4"
  },
  {
    "id": 4428,
    "word": "after",
    "phonetic": "/ˈæf.tə(ɹ)/",
    "meaning": "prep 在…以后；次于",
    "example": "after all (毕竟；终究)",
    "level": "CET4"
  },
  {
    "id": 4429,
    "word": "afternoon",
    "phonetic": "/af.təɾˈnʉːn/",
    "meaning": "n 下午，午后",
    "example": "in the afternoon (adv. 在下午)",
    "level": "CET4"
  },
  {
    "id": 4430,
    "word": "afterward",
    "phonetic": "/ˈɑːftə.wəd/",
    "meaning": "adv 后来，以后",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4431,
    "word": "again",
    "phonetic": "/əˈɡeɪn/",
    "meaning": "adv 又一次；而且",
    "example": "again and again (adv. 再三地，反复地)",
    "level": "CET4"
  },
  {
    "id": 4432,
    "word": "against",
    "phonetic": "/əˈɡeɪnst/",
    "meaning": "prep 倚在；逆，对着",
    "example": "up against (面临)",
    "level": "CET4"
  },
  {
    "id": 4433,
    "word": "age",
    "phonetic": "/eɪd͡ʒ/",
    "meaning": "n 年龄；时代；v 变老",
    "example": "at the age of (在…岁)",
    "level": "CET4"
  },
  {
    "id": 4434,
    "word": "ago",
    "phonetic": "/əˈɡəʊ/",
    "meaning": "adv 以前",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4435,
    "word": "agree",
    "phonetic": "/əˈɡɹi/",
    "meaning": "v 同意；持相同意见",
    "example": "agree with (同意，和…意见一致)",
    "level": "CET4"
  },
  {
    "id": 4436,
    "word": "agreement",
    "phonetic": "/əˈɡɹiːmənt/",
    "meaning": "n 协定，协议；同意",
    "example": "agreement with (同…达成协议)",
    "level": "CET4"
  },
  {
    "id": 4437,
    "word": "agriculture",
    "phonetic": "/ˈæɡɹɪˌkʌltʃə/",
    "meaning": "n 农业，农艺；农学",
    "example": "ministry of agriculture (农业部)",
    "level": "CET4"
  },
  {
    "id": 4438,
    "word": "ahead",
    "phonetic": "/əˈhɛd/",
    "meaning": "adv 在前；向前；提前",
    "example": "ahead of (在…之前)",
    "level": "CET4"
  },
  {
    "id": 4439,
    "word": "aim",
    "phonetic": "/eɪm/",
    "meaning": "v 瞄准，针对；致力",
    "example": "aim of (旨在；瞄准；致力于…)",
    "level": "CET4"
  },
  {
    "id": 4440,
    "word": "air",
    "phonetic": "/ˈɛə/",
    "meaning": "n 空气；空中；外观",
    "example": "in the air (在空中；悬而未决；在流传中；不设防)",
    "level": "CET4"
  },
  {
    "id": 4441,
    "word": "aircraft",
    "phonetic": "/ɛə.kɹɑːft/",
    "meaning": "n 飞机，飞行器",
    "example": "aircraft carrier (n. 航空母舰；全能篮球中锋)",
    "level": "CET4"
  },
  {
    "id": 4442,
    "word": "airline",
    "phonetic": "/ˈeər.laɪn/",
    "meaning": "n 航空公司；航线",
    "example": "airline ticket (飞机票)",
    "level": "CET4"
  },
  {
    "id": 4443,
    "word": "airplane",
    "phonetic": "/ˈɛəpleɪn/",
    "meaning": "n 飞机",
    "example": "by airplane (搭飞机)",
    "level": "CET4"
  },
  {
    "id": 4444,
    "word": "airport",
    "phonetic": "/ˈɛə.pɔːt/",
    "meaning": "n 机场，航空站",
    "example": "international airport (国际机场)",
    "level": "CET4"
  },
  {
    "id": 4445,
    "word": "alike",
    "phonetic": "/əˈlaɪk/",
    "meaning": "adj 同样的，相同的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4446,
    "word": "alive",
    "phonetic": "/əˈlaɪv/",
    "meaning": "adj 活着的；活跃的",
    "example": "alive with (充满着；洋溢着)",
    "level": "CET4"
  },
  {
    "id": 4447,
    "word": "all",
    "phonetic": "/ɔːl/",
    "meaning": "adj 全部的；prep 全部",
    "example": "all the (◎惟一的，仅有的)",
    "level": "CET4"
  },
  {
    "id": 4448,
    "word": "allow",
    "phonetic": "/əˈlaʊ/",
    "meaning": "v 允许，准许；任",
    "example": "allow for (考虑到，虑及)",
    "level": "CET4"
  },
  {
    "id": 4449,
    "word": "almost",
    "phonetic": "/ɔːl.ˈməʊst/",
    "meaning": "adv 几乎，差不多",
    "example": "almost all (几乎处处)",
    "level": "CET4"
  },
  {
    "id": 4450,
    "word": "alone",
    "phonetic": "/əˈləʊn/",
    "meaning": "adj 单独的；adv 单独地",
    "example": "let alone (更不必说；听任；不打扰)",
    "level": "CET4"
  },
  {
    "id": 4451,
    "word": "along",
    "phonetic": "/əˈlɑŋ/",
    "meaning": "prep 沿着；adv 向前",
    "example": "along with (沿（顺）着；连同…一起；与…一道；随同…一起)",
    "level": "CET4"
  },
  {
    "id": 4452,
    "word": "aloud",
    "phonetic": "/əˈlaʊd/",
    "meaning": "adv 出声地，大声地",
    "example": "read aloud (大声朗读)",
    "level": "CET4"
  },
  {
    "id": 4453,
    "word": "alphabet",
    "phonetic": "/ˈæl.fə.bɛt/",
    "meaning": "n 字母表，字母系统",
    "example": "phonetic alphabet (n. [语]音标字母)",
    "level": "CET4"
  },
  {
    "id": 4454,
    "word": "already",
    "phonetic": "/ɑlˈɹɛdi/",
    "meaning": "adv 早已，已经",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4455,
    "word": "also",
    "phonetic": "/ˈɔːl.səʊ/",
    "meaning": "adv 亦，也；而且，还",
    "example": "but also (不仅……而且…… 并且；表强调)",
    "level": "CET4"
  },
  {
    "id": 4456,
    "word": "although",
    "phonetic": "/ɔːlˈðəʊ/",
    "meaning": "conj 尽管，虽然",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4457,
    "word": "altogether",
    "phonetic": "/ɔː.tuːˈɡɛð.ə(ɹ)/",
    "meaning": "adv 完全；总而言之",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4458,
    "word": "aluminium",
    "phonetic": "/əˈluːmɪnəm/",
    "meaning": "n 铝",
    "example": "aluminium alloy (铝合金)",
    "level": "CET4"
  },
  {
    "id": 4459,
    "word": "always",
    "phonetic": "/ˈɔː(l).weɪz/",
    "meaning": "adv 总是，一直；永远",
    "example": "as always (◎同平时一样)",
    "level": "CET4"
  },
  {
    "id": 4460,
    "word": "ambulance",
    "phonetic": "/ˈæm.bjə.ləns/",
    "meaning": "n 救护车；野战医院",
    "example": "ambulance officer (救护主任)",
    "level": "CET4"
  },
  {
    "id": 4461,
    "word": "America",
    "phonetic": "/əˈmer.ɪ.kə/",
    "meaning": "n 美洲；美国",
    "example": "north america (北美洲)",
    "level": "CET4"
  },
  {
    "id": 4462,
    "word": "American",
    "phonetic": "/əˈmer.ɪ.kən/",
    "meaning": "adj 美洲的；n 美国人",
    "example": "south american (南美洲的；南美洲人的)",
    "level": "CET4"
  },
  {
    "id": 4463,
    "word": "among",
    "phonetic": "/əˈmɒŋ/",
    "meaning": "prep 在…之中",
    "example": "from among (从…中间；从…当中)",
    "level": "CET4"
  },
  {
    "id": 4464,
    "word": "amongst",
    "phonetic": "/əˈmʌŋst/",
    "meaning": "prep 在…之中(=among)",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4465,
    "word": "amount",
    "phonetic": "/əˈmaʊnt/",
    "meaning": "n 总数；数量；和",
    "example": "large amount (大量；巨额；大批)",
    "level": "CET4"
  },
  {
    "id": 4466,
    "word": "ampere",
    "phonetic": "/ˈæmˌpɛər/",
    "meaning": "n 安培",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4467,
    "word": "amuse",
    "phonetic": "/əˈmjuːz/",
    "meaning": "v 逗…乐；给…娱乐",
    "example": "amuse oneself (自娱自乐，消遣)",
    "level": "CET4"
  },
  {
    "id": 4468,
    "word": "anchor",
    "phonetic": "/ˈæŋ.kə/",
    "meaning": "n 锚；v 抛锚，停泊",
    "example": "at anchor (停泊着；抛了锚)",
    "level": "CET4"
  },
  {
    "id": 4469,
    "word": "and",
    "phonetic": "/ænd/",
    "meaning": "conj 和，又，并，则",
    "example": "and so (因此；所以)",
    "level": "CET4"
  },
  {
    "id": 4470,
    "word": "angel",
    "phonetic": "/ˈeɪn.dʒəl/",
    "meaning": "n 天使，神差，安琪儿",
    "example": "guardian angel (守护天使；保护神)",
    "level": "CET4"
  },
  {
    "id": 4471,
    "word": "anger",
    "phonetic": "/ˈæŋɡə(ɹ)/",
    "meaning": "n 怒，愤怒；v 使发怒",
    "example": "in anger (生气地，愤怒地)",
    "level": "CET4"
  },
  {
    "id": 4472,
    "word": "angle",
    "phonetic": "/ˈæŋ.ɡəl/",
    "meaning": "n 角，角度",
    "example": "angle of view (视角)",
    "level": "CET4"
  },
  {
    "id": 4473,
    "word": "angry",
    "phonetic": "/ˈæŋ.ɡɹi/",
    "meaning": "adj 愤怒的，生气的",
    "example": "angry with (生某人的气)",
    "level": "CET4"
  },
  {
    "id": 4474,
    "word": "animal",
    "phonetic": "/ˈænɪməl/",
    "meaning": "n 动物，兽；adj 动物的",
    "example": "animal husbandry (畜牧业；畜牧学)",
    "level": "CET4"
  },
  {
    "id": 4475,
    "word": "announcer",
    "phonetic": "/əˈnaʊnsə/",
    "meaning": "n 宣告者；播音员",
    "example": "radio announcer (电台播音员)",
    "level": "CET4"
  },
  {
    "id": 4476,
    "word": "another",
    "phonetic": "/æˈnʌð.ə(ɹ)/",
    "meaning": "adj 再一个的；别的",
    "example": "one another (彼此，互相)",
    "level": "CET4"
  },
  {
    "id": 4477,
    "word": "ant",
    "phonetic": "/ɛnt/",
    "meaning": "n 蚂蚁",
    "example": "fire ant (火蚁)",
    "level": "CET4"
  },
  {
    "id": 4478,
    "word": "anxious",
    "phonetic": "/ˈaŋ(k)ʃəs/",
    "meaning": "adj 忧虑的；渴望的",
    "example": "anxious about (为……担心；对……着急)",
    "level": "CET4"
  },
  {
    "id": 4479,
    "word": "any",
    "phonetic": "/ˈæni/",
    "meaning": "adj 什么，一些；任何的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4480,
    "word": "anyhow",
    "phonetic": "/ˈæn.i.haʊ/",
    "meaning": "adv 无论如何",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4481,
    "word": "anyone",
    "phonetic": "/ˈæniˌwʌn/",
    "meaning": "pron 任何人",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4482,
    "word": "anything",
    "phonetic": "/ˈɛ.nə.θɪŋ/",
    "meaning": "pron 任何事物；一切",
    "example": "anything but (根本不，决不)",
    "level": "CET4"
  },
  {
    "id": 4483,
    "word": "anyway",
    "phonetic": "/ˈɛniweɪ/",
    "meaning": "adv 无论如何",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4484,
    "word": "anywhere",
    "phonetic": "/ˈɛn.iː.(h)wɛə(ɹ)/",
    "meaning": "adv 在什么地方",
    "example": "or anywhere (或是什么别的地方，或其他某地)",
    "level": "CET4"
  },
  {
    "id": 4485,
    "word": "apart",
    "phonetic": "/əˈpɑː(ɹ)t/",
    "meaning": "adv 相隔；分开；除去",
    "example": "apart from (远离，除…之外；且不说；缺少)",
    "level": "CET4"
  },
  {
    "id": 4486,
    "word": "appear",
    "phonetic": "/əˈpiːɹ/",
    "meaning": "v 出现；来到；似乎",
    "example": "appear in (出现在…)",
    "level": "CET4"
  },
  {
    "id": 4487,
    "word": "apple",
    "phonetic": "/ˈæp.əl/",
    "meaning": "n 苹果，苹果树",
    "example": "an apple (一个苹果)",
    "level": "CET4"
  },
  {
    "id": 4488,
    "word": "approximate",
    "phonetic": "/əˈprɒk.sɪ.mət/",
    "meaning": "adj 近似的；v 近似",
    "example": "approximate solution ([计]近似解)",
    "level": "CET4"
  },
  {
    "id": 4489,
    "word": "April",
    "phonetic": "/ˈeɪ.prəl/",
    "meaning": "n 四月",
    "example": "april fool's day (愚人节（4月1日）)",
    "level": "CET4"
  },
  {
    "id": 4490,
    "word": "Arabian",
    "phonetic": "/əˈreɪ.bi.ən/",
    "meaning": "adj 阿拉伯的",
    "example": "arabian nights (一千零一夜（书名，又名天方夜谭）；不真实的故事)",
    "level": "CET4"
  },
  {
    "id": 4491,
    "word": "architecture",
    "phonetic": "/ˈɑː.kɪ.ˌtɛk.tʃə/",
    "meaning": "n 建筑学；建筑式样",
    "example": "system architecture (系统架构)",
    "level": "CET4"
  },
  {
    "id": 4492,
    "word": "area",
    "phonetic": "/ˈɛə̯ɹɪə̯/",
    "meaning": "n 面积；地区；领域",
    "example": "in the area (在这个地区；在该领域)",
    "level": "CET4"
  },
  {
    "id": 4493,
    "word": "argument",
    "phonetic": "/ˈɑːɡjʊmənt/",
    "meaning": "n 争论，辩论；理由",
    "example": "argument list (变元表)",
    "level": "CET4"
  },
  {
    "id": 4494,
    "word": "arithmetic",
    "phonetic": "/əˈrɪθ.mə.tɪk/",
    "meaning": "n 算术，四则运算",
    "example": "arithmetic mean (算术均数；等差中项)",
    "level": "CET4"
  },
  {
    "id": 4495,
    "word": "army",
    "phonetic": "/ˈɑː.miː/",
    "meaning": "n 军队；陆军",
    "example": "red army (n. 红军)",
    "level": "CET4"
  },
  {
    "id": 4496,
    "word": "around",
    "phonetic": "/əˈɹaʊnd/",
    "meaning": "prep 在…周围",
    "example": "all around (周围；到处，四处)",
    "level": "CET4"
  },
  {
    "id": 4497,
    "word": "arrival",
    "phonetic": "/əˈɹaɪ.vəl/",
    "meaning": "n 到达；到来；到达者",
    "example": "on arrival (到达；抵达时)",
    "level": "CET4"
  },
  {
    "id": 4498,
    "word": "arrive",
    "phonetic": "/əˈɹaɪv/",
    "meaning": "v 到达；来临；达到",
    "example": "arrive at (达到，达成；到达某地)",
    "level": "CET4"
  },
  {
    "id": 4499,
    "word": "arrow",
    "phonetic": "/ˈæɹ.əʊ/",
    "meaning": "n 箭；箭状物",
    "example": "bow and arrow (弓和箭；弧矢)",
    "level": "CET4"
  },
  {
    "id": 4500,
    "word": "art",
    "phonetic": "/ɑːt/",
    "meaning": "n 艺术，美术；技术",
    "example": "contemporary art (当代艺术)",
    "level": "CET4"
  },
  {
    "id": 4501,
    "word": "article",
    "phonetic": "/ˈɑːtɪkəl/",
    "meaning": "n 文章；条款；物品",
    "example": "in articles (根据契约当学徒，依雇用契约工作着)",
    "level": "CET4"
  },
  {
    "id": 4502,
    "word": "artist",
    "phonetic": "/ˈɑːtɪst/",
    "meaning": "n 艺术家，美术家",
    "example": "graphic artist (艺术家)",
    "level": "CET4"
  },
  {
    "id": 4503,
    "word": "artistic",
    "phonetic": "/ɑːˈtɪstɪk/",
    "meaning": "adj 艺术的；艺术家的",
    "example": "artistic conception (意境)",
    "level": "CET4"
  },
  {
    "id": 4504,
    "word": "as",
    "phonetic": "/æz/",
    "meaning": "conj 当…的时候",
    "example": "as well (也；同样地；还不如)",
    "level": "CET4"
  },
  {
    "id": 4505,
    "word": "ash",
    "phonetic": "/æʃ/",
    "meaning": "n 灰，灰末；骨灰",
    "example": "fly ash (粉煤灰；飞灰)",
    "level": "CET4"
  },
  {
    "id": 4506,
    "word": "Asia",
    "phonetic": "/ˈeɪ.ʒə/",
    "meaning": "n 亚洲",
    "example": "southeast asia (东南亚)",
    "level": "CET4"
  },
  {
    "id": 4507,
    "word": "Asian",
    "phonetic": "/ˈeɪ.ʒən/",
    "meaning": "adj 亚洲的；n 亚洲人",
    "example": "the asian games (亚运会)",
    "level": "CET4"
  },
  {
    "id": 4508,
    "word": "aside",
    "phonetic": "/əˈsaɪd/",
    "meaning": "adv 在旁边，到旁边",
    "example": "set aside (留出；驳回，撤销；不顾)",
    "level": "CET4"
  },
  {
    "id": 4509,
    "word": "ask",
    "phonetic": "/ˈask/",
    "meaning": "v 问；要求；邀请",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4510,
    "word": "asleep",
    "phonetic": "/əˈsliːp/",
    "meaning": "adj 睡着的，睡熟的",
    "example": "fall asleep (v. 入睡；睡着)",
    "level": "CET4"
  },
  {
    "id": 4511,
    "word": "assist",
    "phonetic": "/əˈsɪst/",
    "meaning": "v 援助，帮助；搀扶",
    "example": "assist in (帮助)",
    "level": "CET4"
  },
  {
    "id": 4512,
    "word": "assistant",
    "phonetic": "/əˈsɪstənt/",
    "meaning": "n 助手，助理；助教",
    "example": "technical assistance (技术援助)",
    "level": "CET4",
    "exampleRoot": "assistance"
  },
  {
    "id": 4513,
    "word": "astronaut",
    "phonetic": "/ˈæstɹəˌnɒt/",
    "meaning": "n 宇宙航行员，宇航员",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4514,
    "word": "at",
    "phonetic": "/æt/",
    "meaning": "prep 在…里；在…时",
    "example": "at all (（否定句）根本；究竟)",
    "level": "CET4"
  },
  {
    "id": 4515,
    "word": "Atlantic",
    "phonetic": "/ətˈlæn.tɪk/",
    "meaning": "adj 大西洋的；n 大西洋",
    "example": "atlantic ocean (大西洋)",
    "level": "CET4"
  },
  {
    "id": 4516,
    "word": "atmospheric",
    "phonetic": "/ˌæt.məsˈfer.ɪk/",
    "meaning": "adj 大气的；大气层的",
    "example": "atmospheric pressure (大气压力，大气压强)",
    "level": "CET4"
  },
  {
    "id": 4517,
    "word": "atomic",
    "phonetic": "/əˈtɔm.ɪk/",
    "meaning": "adj 原子的；原子能的",
    "example": "atomic absorption (原子吸收；原子吸收作用)",
    "level": "CET4"
  },
  {
    "id": 4518,
    "word": "attend",
    "phonetic": "/əˈtɛnd/",
    "meaning": "v 出席；照顾，护理",
    "example": "attend a meeting (参加会议)",
    "level": "CET4"
  },
  {
    "id": 4519,
    "word": "attention",
    "phonetic": "/əˈtɛn.ʃən/",
    "meaning": "n 注意，留心；注意力",
    "example": "pay attention (专心；集中注意力)",
    "level": "CET4"
  },
  {
    "id": 4520,
    "word": "attentive",
    "phonetic": "/əˈtɛntɪv/",
    "meaning": "adj 注意的；有礼貌的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4521,
    "word": "attraction",
    "phonetic": "/əˈtɹækʃən/",
    "meaning": "n 吸引；吸引力；引力",
    "example": "tourist attraction (观光胜地)",
    "level": "CET4"
  },
  {
    "id": 4522,
    "word": "August",
    "phonetic": "/ɔːˈɡʌst/",
    "meaning": "n 八月",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4523,
    "word": "aunt",
    "phonetic": "/ɑ(ː)nt/",
    "meaning": "n 伯母，婶母，姑母",
    "example": "paternal aunt (姑母)",
    "level": "CET4"
  },
  {
    "id": 4524,
    "word": "aural",
    "phonetic": "/ˈɔːɹəl/",
    "meaning": "adj 耳的，听觉的",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4525,
    "word": "Australia",
    "phonetic": "/ɒˈstreɪ.li.ə/",
    "meaning": "n 澳大利亚",
    "example": "south australia (南澳大利亚)",
    "level": "CET4"
  },
  {
    "id": 4526,
    "word": "Australian",
    "phonetic": "/ɒˈstreɪ.li.ən/",
    "meaning": "adj 澳大利亚的",
    "example": "australian national university (澳大利亚国立大学)",
    "level": "CET4"
  },
  {
    "id": 4527,
    "word": "auto",
    "phonetic": "/ˈɑtoʊ/",
    "meaning": "n (口语)汽车",
    "example": "auto parts (汽车配件；汽车零件)",
    "level": "CET4"
  },
  {
    "id": 4528,
    "word": "automation",
    "phonetic": "/ˌɔː.təˈmeɪ.ʃən/",
    "meaning": "n 自动，自动化",
    "example": "industrial automation (工业自动化)",
    "level": "CET4"
  },
  {
    "id": 4529,
    "word": "automobile",
    "phonetic": "/ˈɔː.tə.məˌbiːl/",
    "meaning": "n 汽车，机动车",
    "example": "automobile industry (汽车产业，汽车业；汽车工业)",
    "level": "CET4"
  },
  {
    "id": 4530,
    "word": "autumn",
    "phonetic": "/ˈɔːtəm/",
    "meaning": "n 秋，秋季",
    "example": "in autumn (在秋天)",
    "level": "CET4"
  },
  {
    "id": 4531,
    "word": "avenue",
    "phonetic": "/ˈæv.əˌnjuː/",
    "meaning": "n 林荫道，道路；大街",
    "example": "fifth avenue (（美国纽约的）第五大道)",
    "level": "CET4"
  },
  {
    "id": 4532,
    "word": "await",
    "phonetic": "/əˈwɛɪt/",
    "meaning": "v 等候，期待",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4533,
    "word": "away",
    "phonetic": "/əˈweɪ/",
    "meaning": "adv 离开，远离；…去",
    "example": "away from (远离，离开；避开痛苦)",
    "level": "CET4"
  },
  {
    "id": 4534,
    "word": "awfully",
    "phonetic": "/ˈɔːfli/",
    "meaning": "adv 令人畏惧的；很",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 4535,
    "word": "ax",
    "phonetic": "/æks/",
    "meaning": "n 斧子",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 6540,
    "word": "acquisition",
    "phonetic": "/æ.kwɪ.ˈzɪ.ʃən/",
    "meaning": "n 取得， 获得， 习得； 获得物， 增添的人",
    "example": "data acquisition (数据采集)",
    "level": "CET4"
  },
  {
    "id": 6550,
    "word": "adoptive",
    "phonetic": "/əˈdɒp.tɪv/",
    "meaning": "adj 收养关系的； 采用的",
    "example": "adoptive father (养父；义父)",
    "level": "CET4"
  },
  {
    "id": 6567,
    "word": "according",
    "phonetic": "/əˈkɔːdɪŋ/",
    "meaning": "adj 相等的， 一致的， 依…而定的",
    "example": "according as (根据；取决于)",
    "level": "CET4"
  },
  {
    "id": 6595,
    "word": "accusation",
    "phonetic": "/ˌæk.jə.ˈzeɪ.ʃən/",
    "meaning": "n 谴责； 【律】 指控",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 6631,
    "word": "astrophysics",
    "phonetic": "/ˌæs.trəʊˈfɪz.ɪks/",
    "meaning": "n 天体物理学",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 6642,
    "word": "audio",
    "phonetic": "/ˈɔː.di.əʊ/",
    "meaning": "adj 听觉的， 声音的",
    "example": "digital audio (数字音频)",
    "level": "CET4"
  },
  {
    "id": 6644,
    "word": "amid",
    "phonetic": "/əˈmɪd/",
    "meaning": "prep 在…中间， 在…之中， 被…围绕",
    "example": "",
    "level": "CET4"
  },
  {
    "id": 6647,
    "word": "accountancy",
    "phonetic": "/ə.ˈkaʊnt.ən.si/",
    "meaning": "n 会计工作； 会计学",
    "example": "accountancy profession (会计专业；会计员)",
    "level": "CET4"
  }
];

module.exports = { WORDS_A };
