import type { ReadingLanguage } from "./humanDesignReading";

type Guidance = { zh: string; en: string };

function select(map: Record<string, Guidance>, key: string, language: ReadingLanguage, fallback: Guidance) {
  return (map[key] ?? fallback)[language];
}

const strategyGuidance: Record<string, Guidance> = {
  Generator: {
    zh: "让外界先给出一个具体的人、任务或选项，再听身体有没有持续靠近的回应；不是所有能做的事都值得把生命力交出去",
    en: "Let life present a specific person, task, or option, then notice whether your body has sustained energy for it; being capable of something does not mean it deserves your life force",
  },
  "Manifesting Generator": {
    zh: "先回应眼前真实出现的事，再允许自己试做、绕路和修正；速度是优势，但跳过身体确认会让返工变成消耗",
    en: "Respond to what is actually present, then allow yourself to test, reroute, and revise; speed is a gift, but skipping bodily confirmation turns iteration into depletion",
  },
  Manifestor: {
    zh: "当方向已经在心里形成，行动前把意图与可能影响告知相关的人；告知不是请示，而是减少阻力、保护自主空间",
    en: "Once direction has formed within you, inform the people who will be affected before acting; informing is not asking permission, but reducing resistance and protecting autonomy",
  },
  Projector: {
    zh: "把洞察留给真正看见你、也愿意接收的人和场合；等待认可不是被动，而是不把珍贵判断消耗在证明自己上",
    en: "Offer insight where you are genuinely recognized and invited to contribute; waiting for recognition is not passivity, but refusing to spend valuable perception on proving yourself",
  },
  Reflector: {
    zh: "重要方向不要在一个场景、一次情绪或一个人的期待里定案；让时间和不同环境照出什么始终成立",
    en: "Do not settle an important direction inside one setting, one mood, or one person's expectation; let time and changing environments reveal what remains true",
  },
};

const typeResetGuidance: Record<string, Guidance> = {
  Generator: {
    zh: "挫败反复出现时，先检查自己是否只因责任、习惯或不想让人失望而继续。暂停新增承诺，把力气收回到仍有回应的一件事上",
    en: "When frustration repeats, check whether duty, habit, or fear of disappointing others is keeping you engaged. Pause new commitments and return energy to one thing that still receives a bodily response",
  },
  "Manifesting Generator": {
    zh: "挫败常提示步骤跳得过快，或旧承诺已失去回应。允许自己回头补问、改变顺序或结束不再有能量的支线",
    en: "Frustration often signals a skipped step or a commitment that no longer has energy. Recheck the response, change the sequence, or close a branch that has gone flat",
  },
  Manifestor: {
    zh: "愤怒持续时，分辨阻力来自方向本身，还是别人被突然影响却没有收到信息。补做一次清楚告知，再决定推进、协商或退出",
    en: "When anger persists, distinguish a wrong direction from resistance created because others were affected without warning. Inform clearly, then choose whether to proceed, negotiate, or leave",
  },
  Projector: {
    zh: "苦涩常在洞察未被看见、付出超出邀请时累积。停止继续证明价值，退出无效指导，把休息留给下一次真正的认可",
    en: "Bitterness often accumulates when insight is unseen or effort exceeds the invitation. Stop proving your worth, withdraw from ineffective guidance, and rest for the next genuine recognition",
  },
  Reflector: {
    zh: "失望加重时，不急着给自己下结论，先观察所在环境是否长期失真。换一个场所、群体或时间点，再比较身体和心情的变化",
    en: "When disappointment deepens, do not turn it into a verdict about yourself. Change the setting, group, or timing and compare what shifts in your body and mood",
  },
};

const authorityDecisionGuidance: Record<string, Guidance> = {
  "Emotional - Solar Plexus": {
    zh: "重大决定不要在兴奋高点、低落谷底或被催促时定案。至少经历一次情绪起伏，等不同状态下的答案开始接近，再承诺",
    en: "Do not finalize major choices at an emotional high, low, or under pressure. Let the wave move through at least once and commit when the answer begins to agree across different states",
  },
  Sacral: {
    zh: "把问题变成当下可回应的具体选项，留意身体自然靠近、发亮或退缩的反应。荐骨回应适合眼前真实之物，不替遥远假设作答",
    en: "Turn the issue into a concrete present-tense option and notice spontaneous expansion, energy, or withdrawal. Sacral response speaks to what is real now, not to distant hypotheticals",
  },
  Splenic: {
    zh: "第一瞬间安静、简短的安全感或不适感往往最有信息。它不会反复辩论；先记录当下信号，再用现实资料确认风险边界",
    en: "The first quiet flash of ease or unease often carries the signal. It does not argue repeatedly; record the immediate knowing, then use real information to verify the risk boundary",
  },
  "Ego Manifested": {
    zh: "问自己是否真的想要，并愿意承担承诺的价格。意志不是证明能力的工具；只把有限的心力用在能够坦然说出口的愿望上",
    en: "Ask whether you truly want this and are willing to pay the cost of the promise. Willpower is not a tool for proving capacity; reserve it for desires you can name honestly",
  },
  "Ego Projected": {
    zh: "在被认可的关系里听见自己真正愿意承诺什么。不要因别人期待你有力量就答应；确认这份交换是否也尊重你的价值与回报",
    en: "Hear what you genuinely want to commit to inside relationships that recognize you. Do not promise merely because others expect strength; check whether the exchange respects your value and return",
  },
  "Self-Projected": {
    zh: "把不同选项说给可信任的人听，不求对方给答案，只听自己的声音在哪个方向更自然、更像自己。清晰常藏在说话的质地里",
    en: "Speak the options aloud to a trusted listener without asking them to decide. Hear where your own voice becomes more natural and recognizably yours; direction often lives in the quality of expression",
  },
  "Mental - Environment": {
    zh: "先进入让头脑放松的环境，再与不替你做主的人对话。你需要听见思路在不同空间里如何变化，而不是用独处时的焦虑强行定案",
    en: "Enter an environment that lets your mind settle, then talk with people who will not decide for you. Hear how thought changes across settings instead of forcing certainty from isolated anxiety",
  },
  Lunar: {
    zh: "给重大决定完整的月亮周期，经过不同日子、关系和场所再观察。不是每天重新投票，而是记录哪些感受只是经过、哪些反复回来",
    en: "Give major decisions a full lunar cycle and observe them across different days, people, and places. Do not vote again each day; record what merely passes and what reliably returns",
  },
};

authorityDecisionGuidance["Ego - Manifested"] = authorityDecisionGuidance["Ego Manifested"];
authorityDecisionGuidance["Ego - Projected"] = authorityDecisionGuidance["Ego Projected"];

const authorityPracticeGuidance: Record<string, Guidance> = {
  "Emotional - Solar Plexus": { zh: "把一个非紧急决定推迟到明天，分别记录此刻、睡醒后与下一次情绪变化后的答案", en: "Delay one non-urgent decision until tomorrow and record the answer now, after sleep, and after the next emotional shift" },
  Sacral: { zh: "请可信任的人把一个选择拆成三个是非问题，只记录身体最先出现的靠近、停顿或退缩", en: "Ask someone you trust to turn one choice into three yes-or-no questions and record the body's first expansion, pause, or withdrawal" },
  Splenic: { zh: "进入一个场所或对话时，先写下第一瞬间的安全、紧绷或时机感，十分钟后再与事实核对", en: "On entering one place or conversation, note the first flash of safety, tension, or timing, then compare it with the facts ten minutes later" },
  "Ego Manifested": { zh: "面对一个承诺，完成两句话：“我真正想要的是……”与“我愿意付出的代价是……”；任何一句说不清，就先不承诺", en: "Before one promise, complete: 'What I truly want is…' and 'The cost I am willing to pay is…'; if either stays unclear, do not commit yet" },
  "Ego Projected": { zh: "复查一个别人希望你承担的角色：写下你被认可的具体价值、交换条件和明确结束点", en: "Review one role others want you to carry: name the specific recognition, the fair exchange, and the clear ending point" },
  "Self-Projected": { zh: "把两个方向各说一分钟并录音，回听哪一段声音更舒展、用词更像自己，而不是比较哪段理由更漂亮", en: "Speak each of two directions for one minute and replay them, listening for the voice that is more open and truly yours rather than the argument that sounds smarter" },
  "Mental - Environment": { zh: "带着同一问题去两个不同环境散步或对话，只比较哪里让思路展开，不急着当天得出答案", en: "Carry the same question through two different environments or conversations and compare where thought opens, without forcing an answer that day" },
  Lunar: { zh: "为一个重要方向建立 28 天记录，只写当天环境、身体状态与答案倾向，周期结束后再看稳定模式", en: "Keep a 28-day log for one important direction, noting setting, bodily state, and leaning each day, then look for the stable pattern only at the end" },
};

authorityPracticeGuidance["Ego - Manifested"] = authorityPracticeGuidance["Ego Manifested"];
authorityPracticeGuidance["Ego - Projected"] = authorityPracticeGuidance["Ego Projected"];

const profileRelationshipGuidance: Record<string, Guidance> = {
  "1/3": { zh: "你需要允许关系经由提问、试错和修正变得可靠。能够一起面对“这次没用”的人，比只期待你永远正确的人更适合长期同行", en: "Relationships become trustworthy through questions, experiments, and repair. People who can face what did not work with you are better long-term companions than those who require permanent certainty" },
  "1/4": { zh: "信任通常从可靠知识和稳定往来中建立。不要为了扩大人脉越过自己的准备，也别把尚未验证的判断交给最在意你的人承担", en: "Trust grows through grounded knowledge and steady connection. Do not outrun your preparation to expand a network, or ask close relationships to carry claims you have not verified" },
  "2/4": { zh: "独处不是拒绝关系，而是才能恢复的必要空间。让熟悉的人知道你何时需要退回自己，也允许真正看见你的人发出邀请", en: "Solitude is not rejection but necessary restoration for natural talent. Let familiar people know when you need to withdraw, while staying available to invitations from those who truly see you" },
  "2/5": { zh: "别人容易把解决问题的期待投向你，而你也需要不被打扰的空间。接受请求前先确认问题、权限和结束点，避免天赋变成全天候义务", en: "Others may project solutions onto you while your talent needs privacy. Before accepting a request, define the problem, authority, and ending so natural ability does not become permanent availability" },
  "3/5": { zh: "真实经验让你具有解决问题的说服力，也容易让人只看见结果。说明方案的适用条件和失败记录，能减少“你应该救场”的投射", en: "Lived experience gives your solutions credibility, but others may see only the result. Name limits and failed attempts so practical influence does not become a projection that you must rescue every situation" },
  "3/6": { zh: "你会在经历中不断更新自己，关系也需要容纳版本变化。选择允许你承认误判、调整距离并从经验成长的人，而不是把旧故事永远固定在你身上", en: "You keep changing through experience, and relationships must allow new versions of you. Choose people who permit revision, distance, and growth rather than fastening an old story to your identity" },
  "4/6": { zh: "你的影响力来自长期信任与身体力行。维护少数真实关系比不断扩大曝光更重要；当价值观不再一致，也要诚实调整连接，而非维持表面榜样", en: "Your influence grows through durable trust and lived example. A few real relationships matter more than endless reach; when values diverge, adjust the bond honestly instead of preserving a public image" },
  "4/1": { zh: "你对核心方向较稳定，也通过熟悉网络产生影响。关系中可清楚说明哪些基础不会轻易改变，同时给别人选择靠近或离开的自由", en: "You bring a stable foundation and influence through familiar networks. State what is unlikely to change while giving others freedom to move closer or farther without coercion" },
  "5/1": { zh: "别人容易期待你拿出能落地的答案。先调查、再承诺，并把“我能解决什么、不能保证什么”说在开头，可信度会高于无边界的拯救", en: "Others may expect a practical answer from you. Investigate before promising and state what you can solve and cannot guarantee; bounded usefulness is more trustworthy than rescue without limits" },
  "5/2": { zh: "自然能力会吸引他人的投射，但正确时机不由期待强度决定。为自己保留退隐和准备时间，只回应真正理解问题、也看见你的邀请", en: "Natural ability attracts projection, but urgency from others does not determine correct timing. Preserve retreat and preparation, responding only to invitations that understand both the problem and you" },
  "6/2": { zh: "你需要独处沉淀，也会被他人当作参照。无需表演完美；坦白自己仍在学习，并选择真正召唤你天赋的关系，会让示范更可信", en: "You need solitude to integrate and may still become a reference for others. Do not perform perfection; admit what is still developing and answer relationships that genuinely call out your talent" },
  "6/3": { zh: "经历与修正会逐渐成为你的智慧。关系里不必隐藏走过的弯路，但要分辨谁愿意理解过程，谁只想借你的经验获得一个保证", en: "Experience and revision gradually become wisdom. You need not hide detours, but distinguish people willing to understand the process from those seeking a guarantee through your history" },
};

const profileExpectationGuidance: Record<string, Guidance> = {
  "1/3": { zh: "准备充分会给你安全感，但真正可靠的理解仍要经过现实碰撞；无需因一次失误否定研究，也不要用更多研究逃避试验", en: "Preparation creates safety, but reliable understanding still needs contact with reality; one failed test does not invalidate your research, and more research should not become an escape from testing" },
  "1/4": { zh: "别人会同时依赖你的知识基础与关系可信度；先确认自己站稳，再通过真实连接传播，影响力不必靠陌生场合里的即时证明", en: "Others rely on both your grounded knowledge and relational trust; establish the foundation first, then let influence travel through real connection rather than instant proof among strangers" },
  "2/4": { zh: "才能常在你没有刻意经营时被熟人看见；既不要为了回应召唤耗尽独处，也不要因尚未完美准备而永远拒绝被邀请出来", en: "Talent is often recognized through familiar people without deliberate promotion; protect solitude without using incomplete preparation as a reason to refuse every genuine call outward" },
  "2/5": { zh: "自然能力容易被放大成“你什么都能解决”的想象；越早澄清真实专长与不可承担之处，越能让被看见成为支持而非压力", en: "Natural ability can be magnified into the fantasy that you can solve everything; early clarity about real expertise and limits turns recognition into support instead of pressure" },
  "3/5": { zh: "社会期待你把试错提炼成有效方案，却未必愿意看见过程；公开适用范围与失败条件，能保护经验的真实性和方案的可信度", en: "People may want the useful solution without seeing the experiments behind it; naming scope and failure conditions protects both the truth of your experience and the credibility of the result" },
  "3/6": { zh: "成长不是直线，早期经历与后来的观察会不断改写彼此；不必抢先扮演成熟榜样，让时间把亲历逐渐沉淀成可分享的视角", en: "Growth is not linear, and later perspective keeps rewriting earlier experience; do not rush to perform maturity, allowing time to turn lived events into a shareable view" },
  "4/6": { zh: "人们会通过长期关系观察你如何生活，而不只是听你说什么；影响力来自一致性，但一致不等于永不改变，诚实更新也属于示范", en: "People learn from how you live across long relationships, not only from what you say; influence grows through consistency, and honest evolution belongs inside that example" },
  "4/1": { zh: "稳定基础让你不易被外界轻易改写，也可能被误解为固执；清楚说明核心原则与可协商方法，能让长期影响少一些隐性拉扯", en: "A stable foundation resists external rewriting but can be mistaken for rigidity; distinguish core principles from negotiable methods so durable influence carries less hidden tension" },
  "5/1": { zh: "他人常把可行答案和救场能力投向你；深入调查是责任，明确承诺也是责任，不能解决的部分越早说清，越不容易在事后承受误解", en: "Others may project practical answers and rescue capacity onto you; investigation and bounded promises are both responsibilities, and early limits reduce later misunderstanding" },
  "5/2": { zh: "你可能在尚未准备时就被期待站出来，也可能只想退回自然状态；区分真正认可与单纯需求，决定哪一次召唤值得让天赋走到台前", en: "You may be called out before you feel ready while preferring a natural private state; distinguish genuine recognition from raw demand to know which call deserves your talent in public" },
  "6/2": { zh: "别人可能把榜样期待放在你身上，而你的能力仍需要独处自然成熟；无需证明无所不知，真实地活出已整合的部分就足够产生影响", en: "Others may project a role-model image while your ability still matures in solitude; you need not prove omniscience, because living what is genuinely integrated already carries influence" },
  "6/3": { zh: "你的可信度来自亲历、修正与逐渐形成的远见，而不是从未走错；保留对新经验的开放，能避免智慧变成要求别人复制你路径的结论", en: "Credibility grows from experience, revision, and emerging perspective rather than never being wrong; openness to new evidence keeps wisdom from becoming a demand that others copy your path" },
};

const profilePracticeGuidance: Record<string, Guidance> = {
  "1/3": { zh: "把它当成一次可逆试验，并提前写下怎样算有效、何时需要修正", en: "Make it a reversible experiment and define in advance what counts as useful and when to revise" },
  "1/4": { zh: "先补足一个关键事实，再与一位长期信任的人交流，而不是急着公开结论", en: "Ground one missing fact, then discuss it with one trusted long-term connection before making a public conclusion" },
  "2/4": { zh: "在独处恢复后，把一个自然擅长的部分交给熟悉且真正看见你的人检验", en: "After restorative solitude, let one familiar person who truly sees you respond to a natural talent" },
  "2/5": { zh: "先写清请求范围、可提供的帮助和退出条件，再决定是否成为那个解决者", en: "Define the request, the help you can offer, and the exit condition before becoming the problem-solver" },
  "3/5": { zh: "记录一次失败带来的可复用发现，同时标明这条方案不适用于什么情境", en: "Record one reusable lesson from a failure and name the situations where that solution should not be applied" },
  "3/6": { zh: "回看一段经历，只提炼现在已经改变的一项判断，不要求过去立刻变成完整答案", en: "Review one experience and extract a single judgment that has changed, without forcing the past into a complete answer" },
  "4/6": { zh: "用一次稳定行动照顾重要关系，让价值通过长期一致而不是劝说被看见", en: "Care for one important relationship through consistent action, letting values be seen through continuity rather than persuasion" },
  "4/1": { zh: "说出一个不会轻易改变的核心原则，也说明在方法上仍可协商的空间", en: "State one foundational principle that will not shift easily and the room that remains negotiable in method" },
  "5/1": { zh: "接手问题前先问三个事实问题，并公开你的方案边界和需要对方承担的部分", en: "Ask three factual questions before taking on a problem, then state the solution's limits and what the other person must carry" },
  "5/2": { zh: "为一个外界期待留出独处时间，等自然能力准备好后再回应，而不是被紧迫感定义", en: "Give one external expectation private time, responding when natural ability is ready rather than when urgency demands" },
  "6/2": { zh: "选择一个无需证明的场合，自然地分享已成熟的能力，也坦白仍在学习之处", en: "Choose one setting where no proof is required, share a mature ability naturally, and name what is still developing" },
  "6/3": { zh: "把一个亲历教训写成“当时—修正—现在”的三步记录，保留过程而非只展示答案", en: "Write one lived lesson as 'then—revision—now,' preserving the process instead of displaying only the answer" },
};

const definitionPracticeGuidance: Record<string, Guidance> = {
  "No Definition": { zh: "先离开当前人群与环境再复查感受，避免把吸收来的压力误认成自己的决定", en: "Recheck the feeling away from the current group and setting so absorbed pressure is not mistaken for your own decision" },
  "Single Definition": { zh: "先给自己完整独处时间整合，再把已经成形的结论带入对话，而不是靠讨论启动每一步", en: "Give yourself uninterrupted time to integrate, then bring a formed view into dialogue instead of using discussion to start every step" },
  "Split Definition": { zh: "找能连接思路、但不替你完成答案的对话对象；留意交流后哪些原本分开的信息自然接上", en: "Choose dialogue that connects thought without completing the answer for you, noticing what previously separate information joins naturally" },
  "Triple Split Definition": { zh: "不要把清晰绑在一个人身上；经过几种关系与场景后再整理，流动本身就是整合的一部分", en: "Do not bind clarity to one person; move through several relationships and settings before integrating, because movement itself supports your process" },
  "Quadruple Split Definition": { zh: "给复杂问题更长、不被催促的成熟期，一次只处理一个区块，等待各部分最终形成稳定连接", en: "Give complex questions a longer unpressured maturation period, processing one area at a time until the parts form a stable connection" },
};

const generic = {
  strategy: { zh: "用自己的策略筛选承诺，把能量留给真正适合的方向", en: "Use your strategy to filter commitments and preserve energy for fitting directions" },
  reset: { zh: "持续阻力出现时，先减少外界压力，再回到自己的策略与内在权威复查", en: "When resistance persists, reduce external pressure and recheck the choice through your strategy and authority" },
  authorityDecision: { zh: "给重要决定足够时间与身体空间，不用紧迫感代替清晰", en: "Give important decisions enough time and bodily space instead of substituting urgency for clarity" },
  authorityPractice: { zh: "为一个重要选择暂停解释，先记录身体与内在节奏给出的真实信号", en: "Pause explanation around one important choice and record the honest signal from your body and inner timing" },
  profileRelationship: { zh: "让关系理解你的学习方式与边界，不用固定角色交换归属感", en: "Let relationships understand your way of learning and your boundaries instead of trading a fixed role for belonging" },
  profilePractice: { zh: "选择一个与你的成长方式相符的小实验，并保留调整边界", en: "Choose one small experiment that fits your way of growing and preserve room to revise" },
  definitionPractice: { zh: "尊重自己的信息整合速度，并观察什么条件让清晰更自然地出现", en: "Respect your pace of integration and observe the conditions in which clarity arrives more naturally" },
};

export const humanDesignGuidance = {
  strategy: (type: string, language: ReadingLanguage) => select(strategyGuidance, type, language, generic.strategy),
  reset: (type: string, language: ReadingLanguage) => select(typeResetGuidance, type, language, generic.reset),
  authorityDecision: (authority: string, language: ReadingLanguage) => select(authorityDecisionGuidance, authority, language, generic.authorityDecision),
  authorityPractice: (authority: string, language: ReadingLanguage) => select(authorityPracticeGuidance, authority, language, generic.authorityPractice),
  profileRelationship: (profile: string, language: ReadingLanguage) => select(profileRelationshipGuidance, profile, language, generic.profileRelationship),
  profileExpectation: (profile: string, language: ReadingLanguage) => select(profileExpectationGuidance, profile, language, generic.profileRelationship),
  profilePractice: (profile: string, language: ReadingLanguage) => select(profilePracticeGuidance, profile, language, generic.profilePractice),
  definitionPractice: (definition: string, language: ReadingLanguage) => select(definitionPracticeGuidance, definition, language, generic.definitionPractice),
};
