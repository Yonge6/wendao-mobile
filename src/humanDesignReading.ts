import { humanDesignGuidance } from "./humanDesignGuidance";

export type ReadingLanguage = "zh" | "en";

type Activation = {
  gate: number;
  line: number;
  color: number;
  tone: number;
};

export type HumanDesignReadingChart = {
  core: {
    type: string;
    strategy: string;
    authority: string;
    profile: string;
    definition: string;
    incarnationCross: string;
  };
  activations?: {
    personality?: Record<string, Activation>;
    design?: Record<string, Activation>;
  };
};

export type ReadingSection = {
  title: string;
  body: string;
};

const labels: Record<string, { zh: string; en: string }> = {
  Generator: { zh: "生产者", en: "Generator" },
  "Manifesting Generator": { zh: "显示生产者", en: "Manifesting Generator" },
  Manifestor: { zh: "显示者", en: "Manifestor" },
  Projector: { zh: "投射者", en: "Projector" },
  Reflector: { zh: "反映者", en: "Reflector" },
  "To Respond": { zh: "等待回应", en: "wait to respond" },
  "Wait for the Invitation": { zh: "等待邀请", en: "wait for the invitation" },
  "To Inform": { zh: "行动前告知", en: "inform before acting" },
  "Wait a Lunar Cycle": { zh: "等待一个月亮周期", en: "wait a lunar cycle" },
  "Emotional - Solar Plexus": { zh: "情绪权威", en: "Emotional authority" },
  Sacral: { zh: "荐骨权威", en: "Sacral authority" },
  Splenic: { zh: "脾脏权威", en: "Splenic authority" },
  "Ego Manifested": { zh: "意志力权威", en: "Ego authority" },
  "Ego Projected": { zh: "意志力权威", en: "Ego authority" },
  "Ego - Manifested": { zh: "意志力权威", en: "Ego authority" },
  "Ego - Projected": { zh: "意志力权威", en: "Ego authority" },
  "Self-Projected": { zh: "自我投射权威", en: "Self-projected authority" },
  "Mental - Environment": { zh: "环境权威", en: "Environmental authority" },
  Lunar: { zh: "月亮权威", en: "Lunar authority" },
  "No Definition": { zh: "无定义", en: "No definition" },
  "Single Definition": { zh: "一分人", en: "Single definition" },
  "Split Definition": { zh: "二分人", en: "Split definition" },
  "Triple Split Definition": { zh: "三分人", en: "Triple-split definition" },
  "Quadruple Split Definition": { zh: "四分人", en: "Quadruple-split definition" },
};

const typeStrengths: Record<string, { zh: string; en: string }> = {
  Generator: {
    zh: "你有稳定而可持续的生命力，能在身体真正有回应的事情上持续练习，并形成很深的专业能力",
    en: "You have sustainable life-force energy and can build mastery through consistent engagement with work your body genuinely responds to",
  },
  "Manifesting Generator": {
    zh: "你擅长多线整合、快速试验与边做边优化，常能找到从想法到结果的更短路径",
    en: "You integrate multiple tracks, test quickly, and improve as you move, often finding a shorter path from idea to result",
  },
  Manifestor: {
    zh: "你擅长发起、开路和创造行动势能，能让原本停滞的事情开始运转",
    en: "You initiate movement, open paths, and give stalled situations momentum",
  },
  Projector: {
    zh: "你擅长看见人、资源与系统如何更有效地运作，并用精准观察帮助别人少走弯路",
    en: "You see how people, resources, and systems can work more effectively and guide attention toward high-leverage adjustments",
  },
  Reflector: {
    zh: "你能敏锐读取群体与环境的真实状态，发现别人已经习惯而忽略的变化",
    en: "You sensitively read the true condition of groups and environments and notice changes others may have normalized",
  },
};

const authorityStrengths: Record<string, { zh: string; en: string }> = {
  "Emotional - Solar Plexus": {
    zh: "你能从不同情绪位置看见事情的完整度，等波浪平稳后，决定通常更经得起时间",
    en: "You can see a decision from several emotional positions; once the wave settles, your choice can carry more depth and durability",
  },
  Sacral: {
    zh: "身体会对眼前选项给出直接反馈，帮助你识别什么值得持续投入",
    en: "Your body gives direct feedback to what is in front of you, helping you recognize where sustained energy is available",
  },
  Splenic: {
    zh: "你对风险、时机和当下状态有快速而细腻的直觉辨识",
    en: "You have fast, subtle recognition of timing, risk, and what is healthy in the present moment",
  },
  "Ego Manifested": {
    zh: "你能感受自己真正想争取什么，并把真心的意愿转化成行动",
    en: "You can recognize what you truly want and convert authentic will into action",
  },
  "Ego Projected": {
    zh: "你能辨认什么承诺真正值得投入意志力，并在正确关系中发挥影响",
    en: "You can recognize which commitments deserve your willpower and where your influence is genuinely invited",
  },
  "Self-Projected": {
    zh: "你会在说出想法的过程中听见真实方向，让声音帮助身份与选择对齐",
    en: "You hear direction through your own voice and use expression to align identity and choice",
  },
  Lunar: {
    zh: "你有多角度观察力，让时间与不同环境帮助自己形成完整判断",
    en: "You have multi-angle awareness and let time and changing environments reveal a more complete decision",
  },
  "Mental - Environment": {
    zh: "你会借由合适环境与高质量对话整理思路，从交流中听见自己的清晰",
    en: "You clarify thought through the right environment and high-quality dialogue",
  },
};

const definitionStrengths: Record<string, { zh: string; en: string }> = {
  "No Definition": {
    zh: "你有很强的环境感受力与适应性，也更需要给重大决定充分时间",
    en: "You are highly receptive to people and environments and benefit from giving important decisions more time",
  },
  "Single Definition": {
    zh: "你的内在连接较连贯，往往能够独立整合信息并形成行动",
    en: "Your internal processing is relatively connected, helping you integrate information independently",
  },
  "Split Definition": {
    zh: "你的不同部分常在交流和连接中被串起来，合适的互动会带来启发",
    en: "Different parts of your processing often connect through dialogue and the right relationships",
  },
  "Triple Split Definition": {
    zh: "你需要在不同关系与场景之间流动，思路才更容易逐渐整合",
    en: "Movement across people and environments helps your clarity assemble over time",
  },
  "Quadruple Split Definition": {
    zh: "你有多个相对独立的处理区块，给自己充足时间会更从容",
    en: "Several distinct processing areas need generous time to reach a settled whole",
  },
};

const profileGuidance: Record<string, { zh: string; en: string }> = {
  "1/3": { zh: "你会先研究清楚，再用真实试验检验答案；优势是把理论变成经得起现实验证的方法", en: "You investigate deeply, then test ideas in real life, turning theory into methods that can survive reality" },
  "1/4": { zh: "你先建立扎实基础，再通过稳定关系分享价值；专业深度与信任影响力会彼此放大", en: "You build a solid foundation and share value through trusted relationships, combining depth with relational influence" },
  "2/4": { zh: "你拥有需要独处滋养的自然才能，也容易通过熟悉的人际网络被看见", en: "Your natural talents are restored in solitude and often recognized through familiar networks" },
  "2/5": { zh: "你既有自然天赋，也容易被期待提供解决方案；清楚边界能保护真正的影响力", en: "You combine natural talent with the expectation of being a practical problem-solver; clear boundaries protect your influence" },
  "3/5": { zh: "你通过试验识别什么有效，再把经验提炼成可复用的解决方案", en: "You learn through experimentation and translate lived experience into practical solutions" },
  "3/6": { zh: "你从亲身经验中积累智慧，并逐渐形成更长远、更成熟的观察", en: "You accumulate wisdom through direct experience and gradually develop a longer view" },
  "4/6": { zh: "你的影响力来自关系信任与长期示范，稳定行动会让别人看见可能性", en: "Your influence grows through trusted relationships and long-term example" },
  "4/1": { zh: "你拥有较稳定的内在基础，并通过熟悉网络发挥长期影响", en: "You bring a stable inner foundation and influence through familiar networks" },
  "5/1": { zh: "你倾向深入调查后给出可行方案；别人容易期待你解决问题，因此承诺与边界很重要", en: "You investigate deeply before offering practical solutions; expectations make clear promises and boundaries essential" },
  "5/2": { zh: "你结合自然才能与解决复杂问题的影响力，被正确看见时尤其有力量", en: "You combine natural talent with practical problem-solving influence that is strongest when correctly recognized" },
  "6/2": { zh: "你在独处中沉淀自然才能，并随经验逐渐形成榜样式影响力", en: "You refine natural talent in solitude and gradually develop role-model influence" },
  "6/3": { zh: "你通过真实经历理解世界，再把经验沉淀成可长久使用的智慧", en: "You understand life through direct experience and distill it into durable wisdom" },
};

const typeWork: Record<string, { zh: string; en: string }> = {
  Generator: { zh: "在有真实回应的领域长期打磨，会让重复变成手感、兴趣变成专业", en: "Long-term engagement in work you genuinely respond to can turn repetition into mastery" },
  "Manifesting Generator": { zh: "整合、多线程推进与快速迭代能释放你的创造力；行动后愿意校准，比单纯求快更重要", en: "Integration, parallel progress, and fast iteration suit you; recalibration matters more than speed alone" },
  Manifestor: { zh: "发起项目、定义新方向和推动从零到一，更能发挥你的自主创造力", en: "Initiating projects, defining direction, and moving from zero to one can support your autonomous creativity" },
  Projector: { zh: "诊断、顾问、策略、设计与管理等需要看见系统规律的工作，能发挥你的洞察", en: "Advisory, strategic, design, and systems work can make strong use of your insight" },
  Reflector: { zh: "观察群体、文化、趋势与环境质量，能让敏感度成为集体的镜子", en: "Observing groups, culture, trends, and environmental quality can turn sensitivity into collective insight" },
};

const typeSignals: Record<string, { zhSign: string; enSign: string; zhNotSelf: string; enNotSelf: string }> = {
  Generator: { zhSign: "满足感", enSign: "satisfaction", zhNotSelf: "挫败", enNotSelf: "frustration" },
  "Manifesting Generator": { zhSign: "满足感", enSign: "satisfaction", zhNotSelf: "挫败", enNotSelf: "frustration" },
  Manifestor: { zhSign: "平和", enSign: "peace", zhNotSelf: "愤怒", enNotSelf: "anger" },
  Projector: { zhSign: "成功感", enSign: "success", zhNotSelf: "苦涩", enNotSelf: "bitterness" },
  Reflector: { zhSign: "惊喜", enSign: "surprise", zhNotSelf: "失望", enNotSelf: "disappointment" },
};

const gateThemesZh: Record<number, string> = {
  1: "原创表达", 2: "感知方向", 3: "在混乱中开创新秩序", 4: "把疑问形成答案", 5: "建立稳定节奏", 6: "辨认关系边界", 7: "引导共同方向", 8: "以个人风格作出贡献",
  9: "聚焦细节", 10: "忠于真实自我", 11: "产生丰富构想", 12: "选择正确时机表达", 13: "倾听并保存经验", 14: "驾驭资源与能力", 15: "包容差异与极端", 16: "把热情练成技能",
  17: "形成有结构的观点", 18: "发现问题并推动改善", 19: "敏锐感知需要", 20: "在当下清楚行动", 21: "管理资源与边界", 22: "以情绪风度影响氛围", 23: "把复杂洞见说简单", 24: "反复思考后提炼理解",
  25: "以开放之心接纳", 26: "影响、说服与整合经验", 27: "照料与滋养", 28: "为真正有意义的事坚持", 29: "对正确体验全心投入", 30: "辨认欲望并经历情感", 31: "在被认可时发挥领导力", 32: "判断什么值得延续",
  33: "退后复盘并保存故事", 34: "运用纯粹生命力", 35: "通过经历推动变化", 36: "在未知与危机中成长", 37: "建立互惠的社群关系", 38: "为价值与目标而战", 39: "激发被压住的生命精神", 40: "独立承担并懂得休息",
  41: "启动新的想象周期", 42: "把成长周期完成", 43: "产生突破性洞见", 44: "识别过去留下的模式", 45: "汇聚并分配资源", 46: "在身体经验中发现幸运", 47: "从困惑中提炼意义", 48: "用深度解决问题",
  49: "依据原则推动改变", 50: "守护共同价值", 51: "以勇气唤醒自己和他人", 52: "在静止中保持专注", 53: "发起新的成长周期", 54: "把野心转化成进步动力", 55: "寻找内在精神丰盛", 56: "用故事带来启发",
  57: "捕捉当下直觉", 58: "以喜悦推动改善", 59: "打破隔阂并建立亲密", 60: "接纳限制并等待突变", 61: "探索内在真理", 62: "精确命名与表达细节", 63: "用怀疑检验可靠性", 64: "从混乱图像中整合意义",
};

const gateThemesEn: Record<number, string> = {
  1: "original expression", 2: "sensing direction", 3: "creating order from chaos", 4: "forming workable answers", 5: "steady natural rhythms", 6: "relationship boundaries", 7: "guiding shared direction", 8: "contribution through personal style",
  9: "focused attention", 10: "authentic self-conduct", 11: "generating ideas", 12: "well-timed expression", 13: "listening and preserving experience", 14: "using skills and resources", 15: "embracing human extremes", 16: "turning enthusiasm into skill",
  17: "structured opinions", 18: "correction and improvement", 19: "sensitivity to needs", 20: "clear action in the now", 21: "resource control and boundaries", 22: "emotional grace", 23: "making insight understandable", 24: "returning to an idea until it resolves",
  25: "open-hearted acceptance", 26: "influence and persuasion", 27: "care and nourishment", 28: "struggle for meaning", 29: "wholehearted commitment", 30: "desire and emotional experience", 31: "recognized leadership", 32: "instinct for continuity",
  33: "privacy and reflection", 34: "pure life-force power", 35: "growth through experience", 36: "learning through the unknown", 37: "reciprocal community", 38: "fighting for purpose", 39: "provoking spirit", 40: "independent work and rest",
  41: "initiating an imaginative cycle", 42: "completing cycles of growth", 43: "breakthrough insight", 44: "recognizing past patterns", 45: "gathering and distributing resources", 46: "wisdom through the body", 47: "finding meaning in confusion", 48: "depth and practical solutions",
  49: "principled change", 50: "protecting shared values", 51: "awakening courage", 52: "stillness and concentration", 53: "starting new cycles", 54: "transforming ambition", 55: "inner abundance and spirit", 56: "stimulation through stories",
  57: "present-moment intuition", 58: "joyful improvement", 59: "breaking barriers to intimacy", 60: "accepting limits until change arrives", 61: "inner truth and mystery", 62: "precise naming and detail", 63: "testing through doubt", 64: "integrating meaning from confusion",
};

const determination: Record<number, [string, string]> = {
  1: ["Consecutive Appetite", "Alternating Appetite"],
  2: ["Open Taste", "Closed Taste"],
  3: ["Hot Thirst", "Cold Thirst"],
  4: ["Calm Touch", "Nervous Touch"],
  5: ["High Sound", "Low Sound"],
  6: ["Direct Light", "Indirect Light"],
};

const cognition: Record<number, string> = {
  1: "Smell", 2: "Taste", 3: "Outer Vision", 4: "Inner Vision", 5: "Feeling", 6: "Touch",
};

const environment: Record<number, string> = {
  1: "Caves", 2: "Markets", 3: "Kitchens", 4: "Mountains", 5: "Valleys", 6: "Shores",
};

const variableLabelsZh: Record<string, string> = {
  "Consecutive Appetite": "连续食欲", "Alternating Appetite": "交替食欲",
  "Open Taste": "开放味觉", "Closed Taste": "封闭味觉",
  "Hot Thirst": "热渴", "Cold Thirst": "冷渴",
  "Calm Touch": "平静触觉", "Nervous Touch": "紧张触觉",
  "High Sound": "高声音", "Low Sound": "低声音",
  "Direct Light": "直接光", "Indirect Light": "间接光",
  Smell: "嗅觉", Taste: "味觉", "Outer Vision": "外在视觉", "Inner Vision": "内在视觉", Feeling: "感觉", Touch: "触觉",
  Caves: "洞穴", Markets: "市场", Kitchens: "厨房", Mountains: "山脉", Valleys: "山谷", "Natural Shores": "自然海岸", "Artificial Shores": "人工海岸",
};

function translated(value: string, language: ReadingLanguage) {
  return labels[value]?.[language] ?? value;
}

function strength(map: Record<string, { zh: string; en: string }>, key: string, language: ReadingLanguage, fallback: string) {
  return map[key]?.[language] ?? fallback;
}

function gateTheme(gate: number | undefined, language: ReadingLanguage) {
  if (!gate) return language === "zh" ? "让自然能力成为真实贡献" : "turning natural ability into genuine contribution";
  return language === "zh" ? gateThemesZh[gate] : gateThemesEn[gate];
}

function gates(chart: HumanDesignReadingChart) {
  return {
    consciousSun: chart.activations?.personality?.sun?.gate,
    consciousEarth: chart.activations?.personality?.earth?.gate,
    designSun: chart.activations?.design?.sun?.gate,
    designEarth: chart.activations?.design?.earth?.gate,
  };
}

function variables(chart: HumanDesignReadingChart) {
  const designSun = chart.activations?.design?.sun;
  const designNode = chart.activations?.design?.northNode;
  if (!designSun || !designNode) return null;
  const digestion = determination[designSun.color]?.[designSun.tone <= 3 ? 0 : 1];
  const baseEnvironment = environment[designNode.color];
  const place = baseEnvironment === "Shores"
    ? (designNode.tone <= 3 ? "Natural Shores" : "Artificial Shores")
    : baseEnvironment;
  return { digestion, cognition: cognition[designSun.tone], environment: place };
}

function signal(chart: HumanDesignReadingChart, language: ReadingLanguage) {
  const item = typeSignals[chart.core.type];
  if (!item) return language === "zh"
    ? { sign: "更稳定、真实的感受", notSelf: "持续的内在阻力" }
    : { sign: "a steadier sense of alignment", notSelf: "persistent inner resistance" };
  return language === "zh"
    ? { sign: item.zhSign, notSelf: item.zhNotSelf }
    : { sign: item.enSign, notSelf: item.enNotSelf };
}

export function foundationalReading(chart: HumanDesignReadingChart, language: ReadingLanguage): ReadingSection[] {
  const type = translated(chart.core.type, language);
  const strategy = translated(chart.core.strategy, language);
  const authority = translated(chart.core.authority, language);
  const profile = chart.core.profile;
  const chartGates = gates(chart);
  const chartSignal = signal(chart, language);
  const typeStrength = strength(typeStrengths, chart.core.type, language, language === "zh" ? "你有一套值得被理解的自然运作方式" : "You have a natural way of operating that deserves to be understood");
  const authorityStrength = strength(authorityStrengths, chart.core.authority, language, language === "zh" ? "重要决定需要尊重自己的内在节奏" : "Important decisions benefit from respecting your inner timing");
  const profileText = strength(profileGuidance, profile, language, language === "zh" ? `${profile}人生角色结合了两种学习与贡献方式` : `Your ${profile} profile combines two ways of learning and contributing`);
  const definitionText = strength(definitionStrengths, chart.core.definition, language, language === "zh" ? "你有自己的信息整合方式" : "You have your own way of integrating information");
  const strategyText = humanDesignGuidance.strategy(chart.core.type, language);
  const resetText = humanDesignGuidance.reset(chart.core.type, language);
  const visibleSun = gateTheme(chartGates.consciousSun, language);
  const visibleEarth = gateTheme(chartGates.consciousEarth, language);
  const designSun = gateTheme(chartGates.designSun, language);
  const designEarth = gateTheme(chartGates.designEarth, language);

  if (language === "en") {
    return [
      { title: "Core advantage", body: `${typeStrength}. Your strategy is to ${strategy}: ${strategyText}.` },
      { title: "Talent combination", body: `${profileText}. A visible gift is ${visibleSun}, grounded through ${visibleEarth}. Together, these qualities can turn natural ability into value other people can recognize and use.` },
      { title: "Life theme", body: `${visibleSun}, ${visibleEarth}, ${designSun}, and ${designEarth} may repeatedly meet in your work, relationships, and creations. This is not a fixed career or destiny; it is a pattern of contribution that becomes clearer as you live more honestly.` },
      { title: "Best expression", body: `${definitionText}. ${authorityStrength}. ${chartSignal.sign} is a useful sign of alignment; when ${chartSignal.notSelf} persists, ${resetText}.` },
    ];
  }

  return [
    { title: "核心优势", body: `${typeStrength}。你的策略是“${strategy}”：${strategyText}。` },
    { title: "天赋组合", body: `${profileText}。你最容易被看见的天赋是${visibleSun}，并能通过${visibleEarth}把它落到现实。这组组合让你的优势更容易转化成别人能感受到的价值。` },
    { title: "生命主题", body: `${visibleSun}、${visibleEarth}、${designSun}与${designEarth}，可能反复出现在工作、关系和创作中。它不指定职业或命运，而是在提醒你：越信任自己的节奏，这些能力越容易形成独特贡献。` },
    { title: "最佳发挥方式", body: `${definitionText}。${authorityStrength}。${chartSignal.sign}可以作为对齐的参考；若${chartSignal.notSelf}持续出现，${resetText}。` },
  ];
}

export function detailedReading(chart: HumanDesignReadingChart, language: ReadingLanguage): ReadingSection[] {
  const type = translated(chart.core.type, language);
  const strategy = translated(chart.core.strategy, language);
  const authority = translated(chart.core.authority, language);
  const definition = translated(chart.core.definition, language);
  const profile = chart.core.profile;
  const chartGates = gates(chart);
  const chartVariables = variables(chart);
  const chartSignal = signal(chart, language);
  const typeStrength = strength(typeStrengths, chart.core.type, language, language === "zh" ? "你有独特的能量节奏" : "You have a distinct energy rhythm");
  const authorityStrength = strength(authorityStrengths, chart.core.authority, language, language === "zh" ? "尊重自己的内在节奏会带来更清楚的决定" : "Respecting your inner timing supports clearer decisions");
  const profileText = strength(profileGuidance, profile, language, language === "zh" ? `${profile}结合了两种成长方式` : `${profile} combines two ways of growing`);
  const definitionText = strength(definitionStrengths, chart.core.definition, language, language === "zh" ? `${definition}描述了你的整合方式` : `${definition} describes how your clarity integrates`);
  const workText = strength(typeWork, chart.core.type, language, language === "zh" ? "适合你的工作会尊重真实节奏，也让能力得到持续使用" : "The right work respects your real rhythm and gives your ability somewhere meaningful to go");
  const consciousSun = gateTheme(chartGates.consciousSun, language);
  const consciousEarth = gateTheme(chartGates.consciousEarth, language);
  const designSun = gateTheme(chartGates.designSun, language);
  const designEarth = gateTheme(chartGates.designEarth, language);
  const strategyText = humanDesignGuidance.strategy(chart.core.type, language);
  const resetText = humanDesignGuidance.reset(chart.core.type, language);
  const decisionText = humanDesignGuidance.authorityDecision(chart.core.authority, language);
  const authorityPractice = humanDesignGuidance.authorityPractice(chart.core.authority, language);
  const relationshipText = humanDesignGuidance.profileRelationship(profile, language);
  const expectationText = humanDesignGuidance.profileExpectation(profile, language);
  const profilePractice = humanDesignGuidance.profilePractice(profile, language);
  const integrationPractice = humanDesignGuidance.definitionPractice(chart.core.definition, language);

  if (language === "en") {
    const bodyContext = chartVariables
      ? `Your digestion pattern is ${chartVariables.digestion}, cognition is ${chartVariables.cognition}, and supportive environment is ${chartVariables.environment}.`
      : "Your body and environment are part of how clarity arrives; notice the conditions that help your nervous system settle.";
    return [
      { title: "You do not need to become someone else", body: `${typeStrength}. A different rhythm is not a defect. This reading is an invitation to notice where life feels more honest, sustainable, and alive—not a standard you must perform perfectly.` },
      { title: "Your core energy and strategy", body: `You are a ${type}, and your strategy is to ${strategy}. ${strategyText}. Strategy is not a standard to perform; it is a practical filter for where your energy can remain honest and sustainable.` },
      { title: "The gifts people can see", body: `Your conscious Sun highlights ${consciousSun}; your conscious Earth grounds it through ${consciousEarth}. Your value lies not only in having a gift, but in translating it into something another person can genuinely receive.` },
      { title: "The strengths working underneath", body: `Your design Sun and Earth bring ${designSun} and ${designEarth} into the background of your life. Other people may notice these qualities before you name them. They become more trustworthy when you leave room for the body to respond.` },
      { title: "Your life theme and contribution", body: `Your incarnation cross is ${chart.core.incarnationCross}. It does not prescribe an occupation or destiny. It describes a recurring pattern that becomes clearer as your visible and underlying gifts meet in work, relationships, and creation.` },
      { title: "How your best decisions feel", body: `Your authority is ${authority}. ${authorityStrength}. ${decisionText}. The goal is not perfect certainty, but a choice reached through the process your system can actually trust.` },
      { title: "Profile, expectations, and being understood", body: `${profileText}. ${expectationText}. This is where a profile becomes practical: it shows which expectations support contribution and which quietly turn a gift into a role you never agreed to carry.` },
      { title: "Relationships that fit your way of growing", body: `${relationshipText}. Let closeness include the right to learn, withdraw, revise, or define an ending; connection becomes more durable when it does not require you to betray your natural process.` },
      { title: "Work, creativity, and sustainable impact", body: `${workText}. Use ${consciousSun} as the visible contribution and ${consciousEarth} as its grounding question. Work that fits should make ${chartSignal.sign} more available over time, so accomplishment becomes evidence of fit rather than prolonged self-override.` },
      { title: "Rhythm, body, and environment", body: `${definitionText}. ${bodyContext} ${integrationPractice}. Treat the result as an observation to compare across real situations, not a lifestyle rule you must obey perfectly.` },
      { title: "Your personal route back from pressure", body: `${chartSignal.notSelf} is an early signal, not a flaw. ${resetText}. Before recommitting, give ${authority} enough room to become available again. A useful reset changes the conditions of the decision instead of demanding more discipline inside the same pressure.` },
      { title: "A practice built from your own design", body: `${authorityPractice}. Then ${profilePractice}. During the same experiment, ${integrationPractice}. Review what changed in energy, clarity, and ${chartSignal.sign}; keep only what your lived experience confirms.` },
    ];
  }

  const bodyContext = chartVariables
    ? `你的消化倾向是${variableLabelsZh[chartVariables.digestion] ?? chartVariables.digestion}，认知感官是${variableLabelsZh[chartVariables.cognition] ?? chartVariables.cognition}，适合尝试的环境是${variableLabelsZh[chartVariables.environment] ?? chartVariables.environment}。`
    : "身体与环境也参与清晰的形成，可以观察什么条件会让呼吸更深、注意力更稳、内心不再那么急。";
  return [
    { title: "先说最重要的：你不需要变成别人", body: `${typeStrength}。与周围人不同的节奏并不是缺点。这份解读不是要你把自己修理成更标准的人，而是帮助你辨认：哪些选择让自己更真实、稳定、有生命力。` },
    { title: "你的核心能量与策略", body: `你是${type}，策略是“${strategy}”。${strategyText}。策略不是需要表演正确的规定，而是筛选承诺的现实工具，让能量更可能流向真实且可持续的方向。` },
    { title: "别人最容易看见的天赋", body: `你的人格太阳提示${consciousSun}，人格地球则通过${consciousEarth}帮助这份天赋在现实中站稳。你的价值不只在于“拥有一种天赋”，还在于把看到的、理解的和坚持的东西，变成别人真正感受得到的帮助。` },
    { title: "你未必意识到的潜在力量", body: `设计太阳与地球带来${designSun}和${designEarth}。这部分更像身体自带的推动力，常在临场选择、压力反应和他人对你的评价里出现。越少急着管理别人怎么看，它们越容易稳定出现。` },
    { title: "你的生命主题与独特贡献", body: `你的轮回交叉是${chart.core.incarnationCross}。它不指定职业，也不是一项必须完成的命运任务；它更像一个逐渐浮现的主题：当人格与设计的四项能力在工作、关系和创作中相遇，你独特的贡献方式会越来越清楚。` },
    { title: "做决定时，怎样才算对自己诚实", body: `你的内在权威是${authority}。${authorityStrength}。${decisionText}。重点不是追求头脑里百分之百确定，而是让决定经过一条你真正能够信任的过程。` },
    { title: "人生角色：你如何成长，也如何被看见", body: `你的人生角色是${profile}。${profileText}。${expectationText}。人生角色在这里不是身份标签，而是帮助你分辨：哪些期待支持贡献，哪些期待正在把天赋变成未曾同意的义务。` },
    { title: "适合你的关系，不会抹掉成长方式", body: `${relationshipText}。让亲近包含学习、退回自己、修正和说明结束点的权利；不必用固定角色换取归属，关系反而更可能长久。` },
    { title: "工作、创造力与可持续的影响", body: `${workText}。可以把${consciousSun}视为外界容易看见的贡献，把${consciousEarth}当作让它站稳的现实问题。适合的工作会让${chartSignal.sign}逐渐增多，使成果成为适配的证据，而不是长期违背自己。` },
    { title: "你的整合节奏、身体与环境", body: `${definitionText}。${bodyContext}${integrationPractice}。把这些当作可比较的生活观察，不是必须完美执行的规定，只保留真实经验反复证实的部分。` },
    { title: "压力来临时，你自己的回程路线", body: `${chartSignal.notSelf}是一项早期提醒，不是缺点。${resetText}。重新承诺以前，给${authority}足够空间重新出现。有效复位会改变决定所处的条件，而不是逼自己在同一份压力里更努力。` },
    { title: "一项真正从你的结构出发的练习", body: `${authorityPractice}。接着，${profilePractice}。同一次观察中，${integrationPractice}。最后比较能量、清晰度与${chartSignal.sign}是否变化，只留下亲身经验能够证实的方法。` },
  ];
}
