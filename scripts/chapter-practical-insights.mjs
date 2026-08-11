import { chapterPracticalInsightDetails } from "./chapter-practical-insight-details.mjs";

const baseChapterPracticalInsights = [
  null,
  {
    zh: [
      "不要急着用一个名字概括一个人。职位、性格、一次失误都只是局部；在家庭和工作中，多看对方此刻真实的行为，关系才不会被旧标签提前判死。",
      "说“我已经懂了”之前，再给事实一点出现的时间。很多误会不是信息不足，而是我们太快把猜测当成结论；保留观察，能少做许多徒劳的解释和防御。",
      "也不要把自己困在别人给的定义里。你可以承认过去的选择，同时允许今天作出不同回应；名字方便沟通，却不该成为停止生长的边界。",
    ],
    en: [
      "Do not reduce a person to one name. A job title, personality label, or single mistake is only partial; in family and work, attend to present behavior so an old label does not sentence the relationship in advance.",
      "Before saying “I already understand,” give the facts more time to appear. Many misunderstandings come not from missing information but from treating a guess as a conclusion; continued observation prevents needless defense and explanation.",
      "Do not let other people's definitions become your enclosure either. You can acknowledge past choices and still respond differently today; names help communication, but they should never become the boundary of growth.",
    ],
  },
  {
    zh: [
      "遇到好坏、输赢、对错的争论时，先看看双方是不是在互相定义。一个方案显得快，往往因为另一个方案承担了稳定；看见代价，判断才不会只剩站队。",
      "关系里的冲突常不是谁彻底错误，而是两种需要挤在同一个时刻。把立场背后的害怕、期待和边界说清楚，比急着压倒对方更可能找到完整答案。",
      "当你只看见事情的一面，主动换到相反的位置再看一次。这样做不是取消原则，而是检查自己的结论能否容纳现实的复杂，避免用局部正确制造整体伤害。",
    ],
    en: [
      "When people argue over good and bad, winning and losing, or right and wrong, notice how each side defines the other. A fast option may look fast because another option carries stability; seeing the hidden cost makes judgment more complete than taking sides.",
      "Conflict in a relationship is rarely proof that one person is entirely wrong. Two needs may simply be competing in the same moment; naming the fear, expectation, and boundary beneath each position creates more room than defeating the other person.",
      "When only one side of a situation is visible, deliberately examine it from the opposite position. This does not abandon principle; it tests whether your conclusion can hold reality's complexity without using partial truth to create wider harm.",
    ],
  },
  {
    zh: [
      "先分清“我需要”还是“我不想输给别人”。消费、升职和社交里的许多焦虑来自比较；把注意力拉回身体、时间和真实用途，欲望才不会替你做决定。",
      "为金钱、成绩和曝光设一条“够用线”。没有边界的追求会不断抬高门槛，让已经拥有的东西失去感受；知道何时足够，才能把精力留给真正重要的人生。",
      "少展示一点，并不等于放弃进取。让作品、服务和长期信用自己说话，可以减少为了维持形象而产生的浪费，也让合作回到能力和价值本身。",
    ],
    en: [
      "First ask whether this is a genuine need or a fear of falling behind. Much anxiety around purchases, promotion, and social visibility is comparison in disguise; return attention to the body, available time, and actual use before desire makes the decision for you.",
      "Set an enough-line for money, achievement, and exposure. Pursuit without a boundary keeps raising the threshold until what you already have becomes invisible; knowing what is sufficient preserves energy for the parts of life that truly matter.",
      "Showing less does not mean abandoning ambition. Let work, service, and long-term trust speak for themselves; this reduces the waste of maintaining an image and brings collaboration back to real capacity and value.",
    ],
  },
  {
    zh: [
      "不要把日程排满到没有呼吸。工作之间留出转换、关系里留出沉默、决定前留出一晚，空白会让疲惫被看见，也让更好的回应有机会出现。",
      "解决问题时，除了问“还要增加什么”，也问“哪一层可以拿掉”。少一个审批、少一句辩解、少一项无效功能，往往比继续堆资源更接近真正需要。",
      "为变化预留余地，是一种成熟的设计。计划、预算和承诺都不要只适用于最顺利的情况；有缓冲的系统，遇到意外时才不会把压力全部转嫁给人。",
    ],
    en: [
      "Do not schedule life until it has no room to breathe. Leave transition between tasks, silence inside relationships, and a night before major decisions; open space reveals fatigue and allows a wiser response to arrive.",
      "When solving a problem, ask not only what must be added but what layer can be removed. One less approval, defensive explanation, or unused feature may serve the real need better than another pile of resources.",
      "Leaving room for change is mature design. Plans, budgets, and commitments should not work only under ideal conditions; a system with margin can absorb surprise instead of transferring every shock to the people inside it.",
    ],
  },
  {
    zh: [
      "关心一个人，不等于替他取消事实和后果。家庭、团队和公共事务中，把同情与判断分开，才能既看见处境，也不让偏爱伤害其他人。",
      "当事情没有按照个人愿望发展，先别把它解释成命运针对自己。世界有自己的条件和节奏；接受这一点，能把抱怨省下来的力量用于真正可改变的部分。",
      "公平并不是冷漠，而是让规则经得起角色交换。制定边界或分配资源前，问问如果位置互换是否仍然认可，这能减少善意之名下的双重标准。",
    ],
    en: [
      "Caring for someone does not mean cancelling facts or consequences on their behalf. In family, teams, and public decisions, separating compassion from judgment lets us understand circumstances without allowing favoritism to harm others.",
      "When events do not follow personal wishes, resist reading them as the world targeting you. Reality has conditions and timing of its own; accepting that returns the energy of complaint to what can actually be changed.",
      "Fairness is not indifference; it asks whether a rule survives an exchange of roles. Before setting a boundary or distributing resources, ask whether you would still accept the arrangement from the other position.",
    ],
  },
  {
    zh: [
      "保护那个能让你长期创造的源头。睡眠、独处、身体节奏和不被打扰的时间，看起来没有产出，却决定你能否持续给予，而不是靠透支证明价值。",
      "真正稳定的力量通常声音不大。与其追求一阵高涨，不如建立可以每天重复的小习惯；连续的微小供给，往往比偶尔的猛烈投入更能改变生活。",
      "在关系里也要让爱有源头。不要只在被需要时才确认自己重要；能独自恢复、也能向外连接的人，给予不会变成控制，离开也不会变成惩罚。",
    ],
    en: [
      "Protect the source that allows you to create for a long time. Sleep, solitude, bodily rhythm, and uninterrupted time may look unproductive, yet they determine whether giving remains sustainable instead of becoming proof through exhaustion.",
      "Stable strength is rarely loud. Rather than waiting for a burst of motivation, build a small practice that can be repeated daily; continuous modest nourishment changes life more reliably than occasional intensity.",
      "Love also needs a source within relationship. Do not confirm your worth only by being needed; a person who can restore alone and connect outward can give without controlling and leave without punishing.",
    ],
  },
  {
    zh: [
      "做成一件事后，把功劳分给真实参与的人。承认别人的贡献不会削弱你，反而能让团队愿意继续承担，让成果不必靠一个人的形象维持。",
      "把方法、权限和关键信息交出去。若任何决定都必须等你，所谓负责已经变成依赖；真正长久的工作，是你暂时不在时仍能清楚运转。",
      "不以自己为中心，也不等于把自己耗尽。长期服务需要边界和恢复；只有不靠牺牲换认同，帮助才不会在日后变成怨气或隐形控制。",
    ],
    en: [
      "After accomplishing something, share credit with the people who truly carried it. Naming other contributions does not diminish you; it strengthens continued ownership and keeps the result from depending on one person's image.",
      "Transfer methods, authority, and essential information. If every decision must wait for you, responsibility has become dependence; durable work can still operate clearly during your absence.",
      "Not centering yourself does not require exhausting yourself. Long service needs boundaries and restoration; help that is not traded for approval is less likely to harden into resentment or hidden control.",
    ],
  },
  {
    zh: [
      "学会在必要时站到低处。先听、先让事实汇集、先理解别人的困难，不会降低尊严；像水流向低处，能够承接的人反而更容易看见全局。",
      "遇到阻力，不要立刻用更大的力气撞回去。改变表达、绕开僵局、等待对方能接住的时机，是柔软的智慧；路径可以调整，真正的方向不必放弃。",
      "帮助别人而不计算回报，做事而不争抢中心，同时留意行动的时机。利他、适应、不争并非软弱，它们让关系少受损耗，也让力量能够使用得更久。",
    ],
    en: [
      "Learn to take the lower place when it is useful. Listening first, gathering facts, and understanding another person's difficulty do not reduce dignity; like water moving low, the one who can receive often sees the whole more clearly.",
      "When resistance appears, do not answer immediately with greater force. Change the wording, move around a deadlock, or wait until the other side can receive the message; the path may change without abandoning the direction.",
      "Help without keeping score, work without fighting for the center, and pay attention to timing. Service, adaptability, and non-contention are not weakness; they reduce damage in relationships and let strength remain usable longer.",
    ],
  },
  {
    zh: [
      "事情已经达到目的时，先停一下再决定是否继续增加。更多功能、更多承诺、更多修饰都可能把成果变成负担；知道何时够了，是保护价值的一部分。",
      "完成之后要主动让出位置。把舞台、决定权和成长机会交给后来的人，既能检验成果是否独立，也能避免自己被过去的成功困住。",
      "离开前把收尾做完整：说明现状、留下方法、交代风险，但不要让所有人永远依赖你。好的退出不是消失，而是让事情能够在没有你的情况下继续。",
    ],
    en: [
      "When a result already serves its purpose, pause before adding more. Extra features, promises, or polish can turn an achievement into burden; knowing when it is enough is part of protecting its value.",
      "After completion, deliberately make room for others. Transfer visibility, decision-making, and opportunities to grow; this tests whether the result can stand alone and prevents past success from becoming your enclosure.",
      "Complete the ending before leaving: explain the current state, preserve the method, and disclose the risks without making everyone permanently dependent on you. A good exit enables continuation rather than simply disappearing.",
    ],
  },
  {
    zh: [
      "重要决定前，先检查身体、情绪和头脑是否在同一个方向。嘴上答应、身体抗拒、心里委屈的承诺很难长久；内外一致，才是真正可以承担的开始。",
      "保持柔软不是没有主见，而是能根据事实修正姿势。关系和工作中，若新信息已经出现，就不必为了维护旧形象继续僵持；能调整的人更接近完整。",
      "创造之后不要急着占有。教会别人、允许作品被使用、让成果继续变化，会使能力真正服务生命，而不是让生命被成绩和所有权反过来支配。",
    ],
    en: [
      "Before an important commitment, notice whether body, emotion, and thought are moving in the same direction. A verbal yes joined to bodily resistance and private resentment rarely lasts; inner alignment is the beginning of what can truly be carried.",
      "Remaining supple does not mean having no position. It means correcting your posture when facts change; in work and relationships, new information matters more than defending an outdated image.",
      "After creating, do not rush to possess. Teach others, allow the work to be used, and let the result continue changing; ability then serves life instead of making life serve achievement and ownership.",
    ],
  },
  {
    zh: [
      "看一个工具是否好用，不只看它装了多少东西，也看它是否留下可使用的空间。会议、房间和产品都一样；删去拥挤，人的注意力和行动才进得来。",
      "关系中也需要“无”的作用。不要把每次沉默都当成冷淡，也不要替对方说完所有话；留一点没有被解释的空间，真实感受才可能自己浮现。",
      "遇到复杂问题，先找阻塞而不是继续加码。一个多余流程、一个含糊责任或一个无法拒绝的要求，可能正是系统失灵的原因；移除它，比增加资源有效。",
    ],
    en: [
      "Judge a tool not only by what it contains but by the usable space it leaves. Meetings, rooms, and products work the same way; reducing crowding lets human attention and action enter.",
      "Relationships also depend on absence. Do not treat every silence as rejection or finish every sentence for the other person; unfilled space allows a genuine feeling to surface in its own time.",
      "With a complex problem, look for obstruction before adding more. One redundant process, vague responsibility, or demand that cannot be refused may be the true cause of failure; removal can help more than additional resources.",
    ],
  },
  {
    zh: [
      "被刺激吸引，不等于真正得到滋养。刷完信息、买完东西、参加完热闹之后，留意自己是更稳定还是更空虚；身体的后续感受，比当下兴奋更可靠。",
      "选择食物、内容和关系时，少问“它够不够好看”，多问“它是否支持我的生活”。能让你睡得好、想得清、保持尊严的东西，才值得长期进入日常。",
      "为感官设置边界，不是拒绝快乐，而是恢复品味。减少无休止的推送、比较和消费后，简单的一餐、一次谈话和一段专注才重新变得有分量。",
    ],
    en: [
      "Being stimulated is not the same as being nourished. After scrolling, purchasing, or joining excitement, notice whether you feel steadier or emptier; the body's after-effect is more reliable than the immediate rush.",
      "When choosing food, media, and relationships, ask less whether they look impressive and more whether they support your life. What helps you sleep, think clearly, and keep dignity deserves a lasting place in the day.",
      "Setting limits around the senses does not reject pleasure; it restores discernment. With less endless notification, comparison, and consumption, a simple meal, conversation, or period of attention can regain weight.",
    ],
  },
  {
    zh: [
      "不要把一次得失扩大成“我这个人值不值得”。职位、关系和身体状态都会变化；把自我价值绑在它们上面，任何波动都会变成对身份的威胁。",
      "焦虑出现时，先辨认你真正要保护的是什么。很多控制并不是为了安全，而是害怕失去形象和确定感；说清核心需要，行动才不会被恐惧放大。",
      "珍惜自己，也要把自己放回关系之中。照顾身体、承认限度，同时不让个人安危成为所有决定的中心，才能既保护自己又承担对他人的责任。",
    ],
    en: [
      "Do not enlarge one gain or loss into a verdict on your worth. Roles, relationships, and bodily conditions all change; tying identity to them turns every fluctuation into a threat to the self.",
      "When anxiety rises, identify what you are actually trying to protect. Much control serves not safety but fear of losing image or certainty; naming the core need keeps action from being magnified by fear.",
      "Care for yourself while placing the self back inside relationship. Protect the body and acknowledge limits without making personal security the center of every decision; this supports both self-respect and responsibility to others.",
    ],
  },
  {
    zh: [
      "面对复杂的人，不要因为一个解释顺口就以为已经看懂。经历、身体、环境和未说出口的部分共同构成整体；承认看不全，反而能减少武断的伤害。",
      "团队处理问题时，数据拆分有用，但别忘了零件之间的关系。只优化单个指标，可能把压力转移到别处；每次改善都要回头检查整体是否真的更好。",
      "允许重要的事暂时没有名字和结论。不是所有感受都需要立即归类；耐心陪伴一个尚未成形的问题，常能等到比快速定义更准确的方向。",
    ],
    en: [
      "With a complex person, do not mistake a convenient explanation for understanding. History, body, environment, and what remains unsaid form a whole; admitting that you cannot see everything reduces the harm of certainty.",
      "In team problem-solving, decomposition is useful but relationships between parts still matter. Optimizing one metric can transfer pressure elsewhere; every improvement should be checked against the health of the whole.",
      "Allow an important matter to remain temporarily unnamed and unresolved. Not every feeling needs immediate classification; staying with an emerging question often reveals a direction more accurate than a fast definition.",
    ],
  },
  {
    zh: [
      "重要决定前先减少输入。暂停争论、消息和新的建议，让已经掌握的事实沉淀一晚；很多答案不是想得不够，而是内在一直被新的声音搅动。",
      "情绪混浊时，不急着发长消息或作永久承诺。先让身体慢下来，等激烈感受有了边界，再表达真正需要，通常能少说伤人的话、少做反复的决定。",
      "静下来不是永远不行动。清楚之后要做一件必要的事，并继续观察结果；安静若只用来逃避，也会变成另一种拖延，关键是让行动来自澄明。",
    ],
    en: [
      "Reduce input before an important decision. Pause argument, messages, and new advice so the facts already present can settle overnight; many answers are hidden not by insufficient thought but by constant disturbance.",
      "When emotion is muddy, avoid sending the long message or making a permanent promise. Slow the body, let intensity find a boundary, and then name the real need; this prevents hurtful speech and repeated reversals.",
      "Stillness is not permanent inaction. Once clarity returns, take one necessary step and keep observing the result; silence used only for avoidance becomes another delay, while clear action completes the practice.",
    ],
  },
  {
    zh: [
      "不要把眼前的高峰当成永久身份，也不要把低谷当成最终判决。工作、关系和情绪都有周期；知道变化会返回，能让人少一点自满，也少一点绝望。",
      "反复出现的问题，往往在提醒我们回到根部。与其每次处理表面症状，不如检查睡眠、边界、沟通和基本制度，找到那个不断制造同一结果的源头。",
      "定期回顾自己从哪里出发。一个季度、一段关系或一次项目结束后，重新确认重要原则；在变化中保留可返回的根，方向就不必随每次风向摇摆。",
    ],
    en: [
      "Do not make a present peak into a permanent identity or a low point into a final verdict. Work, relationships, and emotion move in cycles; knowing they return reduces both arrogance and despair.",
      "A recurring problem often asks us to return to its root. Instead of treating the surface each time, examine sleep, boundaries, communication, and basic systems to find what keeps producing the same result.",
      "Review where you began at regular intervals. At the end of a quarter, relationship phase, or project, renew contact with the essential principle; a root you can return to keeps direction from moving with every wind.",
    ],
  },
  {
    zh: [
      "好的带领先把目的和边界说清楚，而不是把每一步都替别人决定。团队知道为什么做、哪些不能碰，才有空间使用自己的判断，不必等指令才能行动。",
      "少说一点，把承诺留给实际支持。领导者反复强调权威，常说明系统缺少信任；稳定资源、及时承担责任，比持续展示存在感更能让人安心。",
      "事情完成后，让参与者说“这是我们做成的”。分享决定权和功劳，不只是一种谦逊，也能培养下一位承担者，让成果不因领导者离开而消失。",
    ],
    en: [
      "Good leadership clarifies purpose and boundaries instead of deciding every step for others. When a team knows why the work matters and what must not be crossed, people can use judgment rather than waiting for instruction.",
      "Speak less and let practical support carry the promise. Repeated displays of authority often reveal missing trust; stable resources and timely responsibility create more safety than constant visibility.",
      "After completion, let participants say, “We made this.” Shared decisions and credit are more than humility; they develop the next person who can carry the work when the current leader leaves.",
    ],
  },
  {
    zh: [
      "当一个组织不断增加口号和规章，先检查是不是信任已经受损。只要求人表现正确，可能把问题藏得更深；修复承诺、责任和公平，规则才不必无限加码。",
      "不要用“我这样做是为你好”代替真正的关系。善意需要接受对方的反馈，也要允许拒绝；不能被检验的好心，很容易变成控制或道德压力。",
      "价值要在无人观看的日常里成立。与其强调自己多正直、多关怀，不如看付款是否守时、错误是否承担、弱者是否被尊重；行为比称号更接近德。",
    ],
    en: [
      "When an organization keeps adding slogans and rules, first ask whether trust has been damaged. Demanding correct appearances can drive the problem deeper; repairing promises, responsibility, and fairness reduces the need for endless regulation.",
      "Do not replace relationship with “I am doing this for your own good.” Care must receive feedback and allow refusal; goodwill that cannot be questioned easily becomes control or moral pressure.",
      "Values must hold in ordinary moments when no one is watching. Rather than declaring integrity or compassion, examine whether payments are timely, mistakes are owned, and vulnerable people are respected; conduct is closer to virtue than titles.",
    ],
  },
  {
    zh: [
      "把复杂问题重新说成一句普通人听得懂的话。如果团队必须靠术语维持专业感，可能已经离开最初需要；清楚不是降低标准，而是让人真正能够参与。",
      "每增加一个流程、功能或承诺，都问它解决什么具体问题。没有明确用途的复杂度会持续消耗注意力；删去表演性的部分，系统才重新轻盈可用。",
      "生活中也要练习回到朴素。少买一件、少安排一次、少证明一句，把时间还给吃饭、睡眠、照顾和专注；简单不是贫乏，而是让重要之物重新可感。",
    ],
    en: [
      "Restate a complex problem in language an ordinary person can understand. If a team needs jargon to preserve a sense of expertise, it may have left the original need; clarity does not lower standards, it makes participation possible.",
      "Whenever adding a process, feature, or promise, name the concrete problem it solves. Complexity without a clear use continuously consumes attention; removing performative layers makes a system lighter and usable again.",
      "Practice returning to simplicity in daily life as well. Buy one thing less, schedule one thing less, and prove one thing less; return time to food, sleep, care, and attention. Simplicity is not poverty but renewed contact with what matters.",
    ],
  },
  {
    zh: [
      "与多数人不同，不必立刻证明自己更正确。先确认你的选择是否真的让生命更稳定、更诚实；差异若只靠反对别人维持，仍然被别人决定。",
      "孤独出现时，回到真正滋养你的来源。可信的朋友、长期阅读、身体劳动和安静实践，比追逐认同更能支持一条少有人走的路。",
      "保留与群体连接的能力。坚持独立判断，同时愿意听见不同经验，不把“我不一样”变成优越感；有根的人可以不同，而不必把所有人变成敌人。",
    ],
    en: [
      "Being different from the majority does not require proving that you are more correct. First ask whether the choice makes life steadier and more honest; a difference sustained only by opposition is still being determined by others.",
      "When loneliness appears, return to what genuinely nourishes you. Trusted friends, long reading, physical work, and quiet practice support an uncommon path more reliably than chasing recognition.",
      "Preserve the ability to remain connected with the group. Hold independent judgment while listening to other experience, and do not turn difference into superiority; a rooted person can be distinct without making everyone else an enemy.",
    ],
  },
  {
    zh: [
      "先确定方向，再挑选方法。工具、课程和技巧不断更新，如果不知道自己要保护什么，它们只会制造新的忙碌；方向清楚，简单的方法也能持续积累。",
      "面对诱惑时，问它会把你带向哪里，而不只问现在是否舒服。一次决定看起来很小，但重复的消费、表达和承诺会共同塑造道路。",
      "道路不必一开始就完全看清。让每一步与真实、少强迫、可持续对齐，再根据反馈调整；方向可以坚定，路线仍然保持开放。",
    ],
    en: [
      "Choose direction before choosing technique. Tools, courses, and methods keep changing; without knowing what must be protected, they create new busyness. A clear direction lets even simple practices accumulate.",
      "When temptation appears, ask where it will take you rather than only whether it feels good now. A single choice looks small, but repeated purchases, words, and commitments gradually form a road.",
      "The whole path does not need to be visible at the beginning. Align each step with truth, less coercion, and sustainability, then adjust from feedback; direction can remain firm while the route stays open.",
    ],
  },
  {
    zh: [
      "遇到阻力时，调整姿势不等于认输。换时间、换表达、先退一步，都可能保存真正要守护的东西；僵硬坚持一种形式，反而容易把核心一起折断。",
      "关系里允许自己先放下防御。听完对方、承认一部分事实、修正一句话，并不会让你失去立场；能弯曲的人更有机会把关系带回可对话的位置。",
      "计划被现实改变时，先辨认哪些原则不能丢，哪些方式可以重做。把核心与形式分开，才能既不轻易放弃，也不为了面子把错误继续到底。",
    ],
    en: [
      "Adjusting your posture under resistance is not surrender. Changing timing, wording, or taking one step back may preserve what truly matters; rigid loyalty to one form can break the core along with it.",
      "In relationship, allow yourself to lower defense first. Hearing the other person, acknowledging part of the truth, or correcting one sentence does not erase your position; flexibility can return the relationship to conversation.",
      "When reality changes a plan, separate principles that must remain from methods that can be remade. Distinguishing core from form prevents both easy abandonment and the prideful continuation of a mistake.",
    ],
  },
  {
    zh: [
      "不是每个空白都需要立刻说话填满。会议、争执和陪伴中，停几秒再回应，能让真正的问题出现，也能避免用惯性语言掩盖没有想清楚的部分。",
      "少承诺一点，把说过的话做完。频繁表态会稀释语言的重量；让行动、时间和结果替你作证，别人才能从稳定经验中建立信任。",
      "表达重要信息时，去掉夸张和多余辩解。把事实、需要与下一步说清楚即可；语言越接近真实，越不需要靠声量和重复维持。",
    ],
    en: [
      "Not every pause needs immediate speech. In meetings, conflict, and companionship, waiting a few seconds lets the real question appear and prevents habitual language from covering what is not yet understood.",
      "Promise less and complete what you say. Constant declarations dilute the weight of language; when action, time, and results testify for you, trust can grow from stable experience.",
      "When communicating something important, remove exaggeration and unnecessary defense. State the fact, the need, and the next step; words close to reality need less volume and repetition to hold.",
    ],
  },
  {
    zh: [
      "把注意力从“别人怎么看我”移回事情本身。展示成绩、争抢功劳会让人持续维护形象；专注解决真实问题，能力才能变成结果而不是表演。",
      "做得好时，不必贬低别人来证明自己。说明贡献也承认条件和协作，能让成功更可信，并减少团队因比较产生的防御和内耗。",
      "发现自己急着解释、炫耀或证明时，先停下来问：我害怕别人误会什么？照顾那份不安，比继续放大声音更能恢复内在稳定。",
    ],
    en: [
      "Move attention from how others see you back to the work itself. Display and competition for credit require continuous image maintenance; solving the real problem turns ability into a result rather than a performance.",
      "When you do well, there is no need to diminish another person. Name your contribution while acknowledging conditions and collaboration; this makes success more credible and reduces defensive comparison inside a team.",
      "When you feel compelled to explain, display, or prove, pause and ask what misunderstanding you fear. Caring for that insecurity restores inner stability more effectively than increasing the volume.",
    ],
  },
  {
    zh: [
      "行动前先了解事物自身的条件。植物、团队、关系和身体都有节奏；不能因为目标合理，就假设任何时间、任何方式都能得到同样结果。",
      "遇到进展缓慢，不要立刻把它视为意志不足。也许资源、信任或能力尚未成熟；补足条件，比不断催促更可能让变化真正发生。",
      "尊重自然不是放任。该浇水就浇水，该设边界就设边界，然后停止不必要的操弄；照看生长所需，而不是替生命规定每一个姿势。",
    ],
    en: [
      "Understand a thing's own conditions before acting. Plants, teams, relationships, and bodies all have timing; a reasonable goal does not mean every moment and method can produce the same result.",
      "When progress is slow, do not assume that willpower is missing. Resources, trust, or capacity may not yet be mature; supplying conditions works more deeply than continued pressure.",
      "Respect for what is natural is not neglect. Water what needs water, set the necessary boundary, and then stop unnecessary manipulation; tend the requirements of growth without prescribing every posture of life.",
    ],
  },
  {
    zh: [
      "重要时刻先稳住身体再作决定。放慢呼吸、坐稳、确认基本事实，能把人从躁动里带回重心；没有根的速度，往往只是更快地走向错误。",
      "不要让每个新消息都改变优先级。团队和生活都需要少数稳定原则；外部再热闹，也先完成真正重要的事，判断才不会被刺激牵走。",
      "承担重量，也要避免沉重僵化。稳定不是拒绝变化，而是在变化里保有可返回的节奏、边界和价值，这样移动才有方向，也不会被每次风向带走。",
    ],
    en: [
      "Steady the body before making an important decision. Slow the breath, sit firmly, and confirm basic facts; this returns you from agitation to a center. Speed without a root often reaches the wrong place sooner.",
      "Do not allow every new message to reorder priorities. Teams and lives need a few stable principles; finish what truly matters before following the surrounding excitement.",
      "Carry weight without becoming heavy and rigid. Stability does not reject change; it preserves a rhythm, boundary, and value to return to, so movement still has direction.",
    ],
  },
  {
    zh: [
      "不要太快把人分成“有用”和“没用”。一个人在当前岗位表现不好，可能是位置、支持或方法不合；先寻找未被使用的能力，再决定是否放弃。",
      "处理错误时，目标不是证明谁最差，而是让系统重新工作。保护受影响的人，也给犯错者清楚的责任和改正路径，团队才不会靠羞辱维持秩序。",
      "资源有限时，也别只照顾最耀眼的部分。被忽略的成员、材料和细节常藏着未来的可能；善于保存与再用，能减少淘汰带来的长期浪费。",
    ],
    en: [
      "Do not divide people too quickly into useful and useless. Poor performance in one role may reveal a mismatch of position, support, or method; look for unused capacity before deciding to discard someone.",
      "When addressing an error, the goal is not to prove who is worst but to restore a working system. Protect those affected while giving the person responsible a clear duty and path to repair.",
      "When resources are limited, do not care only for the most visible part. Neglected people, materials, and details may hold future possibility; preservation and reuse reduce the long cost of exclusion.",
    ],
  },
  {
    zh: [
      "知道自己有力量，也要保留接纳和倾听。能力若只能通过控制表现，就会把周围的人变得被动；能承接反馈，力量才不必靠压住别人来成立。",
      "不要只发展被赞美的一面。果断的人也需要柔软，善良的人也需要边界；允许两端共同存在，性格才不会因为长期压抑而突然反弹。",
      "在竞争环境里，守住不争先的空间。先观察、先让别人表达、先看整体需要，并不减少影响力；真正成熟的领导常从容纳开始。",
    ],
    en: [
      "Know your strength while preserving receptivity and listening. Ability expressed only through control makes others passive; receiving feedback lets power exist without pressing everyone else down.",
      "Do not develop only the side that receives praise. Decisive people need softness and kind people need boundaries; allowing both poles prevents a suppressed quality from returning in destructive form.",
      "In a competitive setting, protect some space from the need to be first. Observe, let others speak, and notice the whole need; mature influence often begins with the capacity to contain.",
    ],
  },
  {
    zh: [
      "不要把一个复杂系统当成可以任意摆弄的物件。家庭、组织和环境都有自发秩序；大规模改变前，先了解连锁影响，避免解决一处却破坏更多地方。",
      "能干预，不等于都该干预。看到别人作出与你不同的选择时，分清这是伤害、共同责任，还是只让你不舒服；不属于你的部分要学会停手。",
      "管理的重点是照看条件和底线，而不是控制每个动作。规则清楚、信息透明、反馈可达，人往往比被频繁纠正时更能形成稳定秩序。",
    ],
    en: [
      "Do not treat a complex system as an object that can be manipulated at will. Families, organizations, and environments have spontaneous order; before a large intervention, examine the chain of effects.",
      "The ability to intervene does not mean every intervention is yours. When someone chooses differently, distinguish harm and shared responsibility from mere discomfort; learn to stop where the work is not yours.",
      "Management should tend conditions and essential boundaries rather than control every motion. Clear rules, transparent information, and reachable feedback create steadier order than constant correction.",
    ],
  },
  {
    zh: [
      "达到目标后，不要把成功变成压服别人的资格。一次有效的方法未必适合所有人；保留谦逊，能防止成果继续制造新的反抗和冲突。",
      "推动事情时，给对方理解、回应和选择的空间。只靠压力得到的配合，在压力消失后也容易消失；共同认可的方向才更可能持续。",
      "复盘时除了问“做成没有”，也问用了什么代价。若结果建立在恐惧、羞辱或长期透支上，就需要重新设计方法，而不是只庆祝数字。",
    ],
    en: [
      "After reaching a goal, do not turn success into a license to overpower others. One effective method may not fit everyone; humility prevents an achievement from creating the next resistance and conflict.",
      "When moving work forward, leave room for understanding, response, and choice. Cooperation produced only by pressure often disappears when pressure does; a direction people can recognize together lasts longer.",
      "In review, ask not only whether the result was achieved but what it cost. If success depends on fear, humiliation, or chronic exhaustion, redesign the method instead of celebrating the number alone.",
    ],
  },
  {
    zh: [
      "把强制手段留到最后，而不是因为它见效快就优先使用。权力、处罚和威胁会留下长期记忆；能通过说明、协商和修复解决的事，不必先制造伤害。",
      "面对冲突，即使必须制止，也不要享受胜利感。承认双方损失、照顾无辜影响、为关系留下回来的路，才能防止正义变成麻木。",
      "团队经历激烈事件后，要安排恢复而不只赶快翻篇。复盘事实、承认恐惧、修补安全感，是避免伤害在沉默中继续传递的必要工作。",
    ],
    en: [
      "Keep coercion as a last resort rather than choosing it first because it acts quickly. Power, punishment, and threat leave a long memory; matters that can be resolved through explanation, negotiation, and repair need not begin with harm.",
      "Even when conflict must be stopped, do not take pleasure in victory. Acknowledge losses, care for innocent impact, and leave a path back to relationship so justice does not become numbness.",
      "After an intense event, give a team time for recovery instead of forcing an immediate return to normal. Reviewing facts, naming fear, and rebuilding safety prevents unspoken harm from continuing through the system.",
    ],
  },
  {
    zh: [
      "制度和工具要服务目的，而不是让目的迁就制度。流程开始变多时，定期问它是否仍解决真实问题；没有用途的规则应被简化或停止。",
      "知道何时足够，能保护权力边界。职责完成后不继续扩张权限，资源够用后不再囤积，才能防止“为了做好”变成永无止境的控制。",
      "复杂局面里先回到朴素原则：谁受影响、事实是什么、底线在哪里、下一步由谁负责。简单的问题框架，常比漂亮概念更能让事情向前。",
    ],
    en: [
      "Institutions and tools must serve the purpose rather than forcing the purpose to serve them. As process grows, regularly ask whether it still solves a real problem; rules without a use should be simplified or stopped.",
      "Knowing what is enough protects the boundary of power. Do not expand authority after the duty is complete or hoard resources after needs are met; otherwise the wish to do well becomes endless control.",
      "In complexity, return to plain questions: who is affected, what are the facts, where is the boundary, and who owns the next step? A simple frame often moves work farther than an impressive concept.",
    ],
  },
  {
    zh: [
      "认识别人只能提供信息，认识自己才决定如何回应。被批评、被诱惑或被催促时，先辨认自己的害怕和需要，别让外部声音直接接管行动。",
      "胜过自己不是压住感受，而是不让冲动掌舵。愤怒可以提供边界信息，欲望可以显示渴望；听见它们，再由更长远的价值决定下一步。",
      "建立一份诚实的自我记录。定期写下什么让你有生命力、什么反复消耗、哪些承诺并非真心愿意；自知来自长期观察，不来自一句性格标签。",
    ],
    en: [
      "Knowing other people provides information; knowing yourself determines the response. When criticized, tempted, or hurried, identify your own fear and need before outside voices take direct control of action.",
      "Mastering yourself does not mean suppressing feeling. Anger can reveal a boundary and desire can reveal a longing; hear the information, then let a longer value choose the next step.",
      "Keep an honest record of the self. Regularly note what gives you life, what repeatedly drains you, and which promises were never a genuine yes; self-knowledge grows through observation, not one personality label.",
    ],
  },
  {
    zh: [
      "真正重要的工作，不必一直把自己放在中心。把注意力投向问题、使用者和共同目标，个人声量变小，成果的实际影响反而可能更大。",
      "拥有位置时，主动让别人被看见。邀请不同意见、分享资源、把机会给尚未有舞台的人，能让影响力从个人扩大为共同能力。",
      "不要用“我不重要”假装谦逊。清楚承担自己的责任，也不夸大独特性；既不自轻也不自大，才能稳定服务比自己更大的事情。",
    ],
    en: [
      "Work that truly matters does not require keeping the self at the center. Direct attention to the problem, the people served, and the shared aim; a quieter personal image can produce greater practical impact.",
      "When you hold a position, deliberately make others visible. Invite dissent, share resources, and give opportunity to people without a stage; influence then grows from one person into common capacity.",
      "Do not disguise self-erasure as humility. Carry your responsibility clearly without exaggerating uniqueness; neither diminishing nor enlarging yourself allows stable service to something larger.",
    ],
  },
  {
    zh: [
      "共同愿景不能只是一句好听口号。把它翻译成安全、尊严、时间和资源上的具体安排，人们才知道这个方向如何改善真实生活。",
      "邀请别人靠近，而不是用宏大目标逼人服从。说明为什么重要，也允许提问和不同速度；自愿参与形成的共同体，比被动一致更有力量。",
      "愿景要接受日常检验。每隔一段时间检查政策、产品和合作是否仍服务最初承诺；如果实际效果相反，就应调整做法而不是维护口号。",
    ],
    en: [
      "A shared vision cannot remain a pleasing slogan. Translate it into concrete arrangements for safety, dignity, time, and resources so people can see how the direction improves real life.",
      "Invite people toward a purpose rather than using greatness to force obedience. Explain why it matters while allowing questions and different speeds; voluntary participation is stronger than passive uniformity.",
      "A vision must survive ordinary testing. Regularly examine whether policies, products, and collaboration still serve the original promise; if effects contradict it, change the practice rather than defending the slogan.",
    ],
  },
  {
    zh: [
      "遇到坚硬的人或制度，先找可以进入的缝隙。一次准确的问题、一个可接受的小改变，常比正面证明谁更强更能推动长期变化。",
      "柔软不等于没有边界。语气可以温和，原则仍可清楚；把对抗降下来，让对方有机会听见内容，比同时提高声量更有作用，也更容易留下合作空间。",
      "把改变做成持续作用，而不是一次爆发。稳定反馈、反复示范和小步修正看起来慢，却能穿过防御，使新习惯真正留在系统里。",
    ],
    en: [
      "With a rigid person or institution, look first for an opening. One precise question or acceptable small change often moves long-term reality farther than a frontal contest over who is stronger.",
      "Softness does not erase boundaries. The tone can be gentle while the principle remains clear; lowering confrontation gives the other person a chance to hear the content.",
      "Make change a continuous influence rather than one explosion. Stable feedback, repeated example, and small correction may look slow, yet they pass through defense and allow a new habit to remain in the system.",
    ],
  },
  {
    zh: [
      "并非所有改善都需要更多管理。底线、目标和责任清楚后，减少频繁干预，让人根据反馈自我调整，往往比每一步都纠正更能形成能力。",
      "管理者要能忍受过程不完全按照自己的样子展开。只要风险可控、结果符合目的，就允许不同方法存在；多样性是系统适应变化的储备。",
      "当秩序反复依赖提醒和监督，检查是不是设计有问题。让信息更清楚、反馈更及时、责任更贴近现场，胜过不断增加一个负责催促的人。",
    ],
    en: [
      "Not every improvement requires more management. Once purpose, boundaries, and responsibility are clear, less intervention allows people to adjust through feedback and build capacity.",
      "A manager must tolerate a process that does not reproduce their exact style. When risk is controlled and the purpose is served, allow different methods; diversity is a reserve for adaptation.",
      "When order repeatedly depends on reminders and supervision, inspect the design. Clearer information, faster feedback, and responsibility closer to the work help more than adding another person whose job is to chase everyone.",
    ],
  },
  {
    zh: [
      "少追求好看的姿态，多做经得起日常检验的选择。真正的关怀会花时间，真正的诚信会承担损失；价值若只在方便时出现，就还没有扎根。",
      "判断一个人或组织，不只听它如何介绍自己。看它如何对待错误、弱者、付款和无人关注的细节，厚实常藏在不适合宣传的地方。",
      "自己做决定时，也要从表面效果回到实际后果。一个选择也许不够体面，却更诚实、更可持续；居实，意味着愿意让真实重于形象。",
    ],
    en: [
      "Seek less impressive posture and choose what survives ordinary testing. Real care spends time and real integrity accepts cost; a value that appears only when convenient has not taken root.",
      "Do not judge a person or organization only by its introduction. Watch how it treats mistakes, vulnerable people, payment, and unnoticed details; substance often lives where publicity has little interest.",
      "In your own decisions, move from surface effect to practical consequence. A choice may look less polished yet remain more honest and sustainable; abiding in substance means letting reality outweigh image.",
    ],
  },
  {
    zh: [
      "共同一致不等于所有人变得一样。先找到不能失去的共同原则，再允许背景、方法和表达不同；能容纳差异的统一，才不会变成新的压迫。",
      "拥有资源和位置的一方，要更愿意向下听。权力越大，越需要主动了解边缘处的经验，否则所谓整体很可能只是中心位置的视角。",
      "合作出现分裂时，回到共同需要而不是继续争身份。问大家真正想保护什么、哪些底线可以共享，常能重新找到连接，而不是逼出表面一致。",
    ],
    en: [
      "Unity does not require everyone to become the same. Find the shared principle that must not be lost, then allow differences in background, method, and expression; unity that can hold difference avoids becoming another oppression.",
      "The side with greater position and resources must listen downward more deliberately. The more power one holds, the more important experience at the margin becomes; otherwise the whole is only the center's view.",
      "When collaboration divides, return to shared need instead of competing identities. Ask what everyone is trying to protect and which boundaries can be held together; connection is stronger than forced appearance of agreement.",
    ],
  },
  {
    zh: [
      "发现方向错误时，返回不是失败。越早承认、越早重看条件，越能减少沉没成本；真正危险的是为了证明坚持而继续把更多资源投入错误路线。",
      "承认弱处，会让合作更真实。说“这里我不知道”“这部分需要帮助”，不是降低能力，而是让正确的人和信息有机会进入。",
      "生活失去平衡时，回到最基本的睡眠、饮食、关系和责任。恢复不是靠一次壮举，而是先把被忽略的根重新照顾起来，让日常重新能够承载你。",
    ],
    en: [
      "Returning is not failure when the direction is wrong. The earlier you admit it and review conditions, the less sunk cost grows; the danger is investing more only to prove consistency.",
      "Admitting weakness makes collaboration more real. Saying “I do not know here” or “I need help with this part” does not reduce ability; it allows the right person and information to enter.",
      "When life loses balance, return to basic sleep, food, relationship, and responsibility. Recovery rarely begins with a heroic act; it begins by caring again for the neglected root.",
    ],
  },
  {
    zh: [
      "不要只用“听起来像成功”判断一个道理。真正重要的提醒有时笨拙、逆耳，甚至要求我们放弃熟悉优势；先看长期作用，而不是即时掌声。",
      "听到与常识相反的意见时，先找它试图纠正什么偏差。反常不自动等于正确，但它可能揭露被多数习惯遮住的代价和盲点，值得在拒绝前认真检查。",
      "选择一条小范围实践来检验，而不是立刻相信或嘲笑。把悖论放进真实生活，观察它是否让人更清醒、更少伤害，经验会替语言给出答案。",
    ],
    en: [
      "Do not judge an idea only by whether it sounds like success. Important guidance may feel awkward, unwelcome, or ask us to release a familiar advantage; examine its long effect rather than immediate applause.",
      "When an opinion contradicts common sense, ask what imbalance it is trying to correct. The unusual is not automatically true, but it may expose a cost or blind spot hidden by majority habit.",
      "Test the paradox through a small practice instead of instantly believing or mocking it. Place it in real life and observe whether it brings clarity and less harm; experience can answer what language cannot.",
    ],
  },
  {
    zh: [
      "减少不一定是损失，增加也不一定是进步。砍掉无效会议、补足休息和资源，判断标准应是是否恢复平衡，而不是数字单纯变大或变小。",
      "分配任务和财富时，先看哪里过量、哪里缺口最深。持续奖励已经占优的一方，会让系统越来越脆弱；补足不足，是在保护共同体。",
      "个人生活也需要动态调节。工作太满就减少承诺，关系太疏就增加陪伴；和谐不是平均，而是根据真实需要不断校准，让各部分重新能够呼吸。",
    ],
    en: [
      "Reduction is not always loss, and increase is not always progress. Remove an empty meeting or add needed rest and resources; the measure is restored balance rather than numbers moving in one preferred direction.",
      "When distributing work and wealth, notice where excess sits and where the deepest lack remains. Continually rewarding the already advantaged makes a system fragile; repairing insufficiency protects the whole.",
      "Personal life also needs dynamic adjustment. Reduce commitments when work is full and add presence when relationship grows thin; harmony is not sameness but continuing calibration to real need.",
    ],
  },
  {
    zh: [
      "影响别人时，先降低压迫感。一个准确的问题、持续的示范和可接受的邀请，常比命令更容易进入坚硬防御，让改变从内部发生。",
      "不要因为声音小就低估作用。日复一日的守信、礼貌和清楚边界，会慢慢改变一段关系或团队文化；真正深的力量未必有戏剧性。",
      "遇到强大阻力时，寻找缝隙和路径，而不是复制对方的强硬。你可以坚持目的，同时改变速度、媒介和顺序，让力量用在能产生作用的位置。",
    ],
    en: [
      "Lower the sense of pressure when influencing another person. A precise question, consistent example, and receivable invitation often enter hard defenses more effectively than command.",
      "Do not underestimate an influence because it is quiet. Daily reliability, courtesy, and clear boundaries gradually reshape a relationship or team culture; deep strength does not require drama.",
      "When resistance is powerful, look for openings and alternate paths instead of copying its hardness. Keep the purpose while changing speed, medium, and sequence so effort reaches a place where it can work.",
    ],
  },
  {
    zh: [
      "为重要追求设定停止条件。多少钱、多少客户、做到什么程度算够，如果从不回答，成长就会不断吞掉休息、关系和健康，最后反而失去最初目的。",
      "感到羞耻或不安时，别立刻用更多成就来补。先辨认你是在解决实际问题，还是想证明自己有价值；后一种追赶通常没有终点。",
      "知止不是放弃，而是把力量留给下一件真正需要的事。完成、退出、拒绝不再合适的机会，都是成熟选择，不必等到彻底耗尽才停。",
    ],
    en: [
      "Set stopping conditions for important pursuits. How much money, how many clients, or what level of completion is enough? Without an answer, growth consumes rest, relationship, and health.",
      "When shame or insecurity appears, do not immediately cover it with more achievement. Ask whether you are solving a real problem or proving that you have worth; the second pursuit rarely has an end.",
      "Stopping is not giving up; it preserves strength for what genuinely needs it next. Completion, exit, and refusal of an unsuitable opportunity are mature choices that need not wait for total exhaustion.",
    ],
  },
  {
    zh: [
      "允许成果保留一点不完美。只要核心用途可靠，就可以先交付、使用和学习；为了维护“完美形象”无限延迟，反而让价值无法进入现实。",
      "关系也不需要变成没有缺口的成品。承认彼此有限、保留各自空间，比要求对方满足全部需要更能让亲密持续，也让双方保有真实的自己。",
      "完成后留下可修正的入口。记录已知问题、接受反馈、说明下一版条件；成熟的完成不是封死变化，而是让未来能够安全接续。",
    ],
    en: [
      "Allow a result to retain some imperfection. When the essential use is reliable, release it for use and learning; endless delay to protect a perfect image prevents value from entering reality.",
      "A relationship need not become a finished object without gaps. Acknowledging limits and preserving individual space sustains intimacy better than requiring one person to meet every need.",
      "Leave an entrance for correction after completion. Record known issues, receive feedback, and state the conditions for a next version; mature completion keeps future continuation safe rather than sealing change out.",
    ],
  },
  {
    zh: [
      "每天先看见已经拥有的东西。身体还能做什么、谁在支持你、哪些基本需要已被满足；这不是自我安慰，而是防止比较抹掉现实中的价值。",
      "满足不等于停止成长。可以继续追求，同时不把当下生活当成等待成功前的废片；愿意享受普通日常，成长才不会建立在持续匮乏上。",
      "消费或承诺前，问它是在增加生活，还是只缓解一时空虚。若快乐必须不断靠新的刺激续费，就需要回头照顾更深的孤独和疲惫。",
    ],
    en: [
      "Begin each day by noticing what is already present: what the body can still do, who supports you, and which basic needs are met. This is not denial; it prevents comparison from erasing real value.",
      "Contentment does not end growth. Continue pursuing while refusing to treat present life as discarded footage before success; enjoying ordinary days keeps development from being built on permanent lack.",
      "Before a purchase or commitment, ask whether it adds to life or merely relieves a moment of emptiness. Pleasure that requires continuous new stimulation may be asking for care at a deeper layer of loneliness or fatigue.",
    ],
  },
  {
    zh: [
      "信息很多时，先停止无目的搜索。把手头资料读深、去现场观察、询问真正相关的人，专注往往比继续收集更多链接更接近真相。",
      "理解别人不只靠远处的知识。留意同住的人怎样沉默、同事怎样卡住、身体怎样反应，眼前细节能提供任何报告都没有的线索。",
      "不出户并非封闭世界，而是避免用奔走代替思考。先形成问题、整理证据，再决定需要去哪里；有方向的外出才真正扩大认识。",
    ],
    en: [
      "When information is abundant, stop aimless searching. Read what you already have deeply, observe the actual place, and ask the people truly involved; attention often reaches truth faster than another list of links.",
      "Understanding others does not come only from distant knowledge. Notice how a family member grows quiet, where a colleague gets stuck, and how the body responds; nearby detail offers evidence no report contains.",
      "Knowing without restless travel is not closing the world out. Form the question and organize evidence before deciding where to go; outward movement with direction genuinely expands understanding.",
    ],
  },
  {
    zh: [
      "每周问一次：什么可以不做。删掉没有价值的会议、过度解释和重复决定，能让有限注意力回到真正重要的工作，也让生活少一点无谓消耗。",
      "放下一层控制，观察系统是否反而更好。允许别人用自己的方法完成、允许关系有沉默、允许计划留白，常能释放被管理压住的能力。",
      "减少自我辩护，会让人更接近事实。犯错时先承认影响和责任，再说明背景；少一点维护形象，修复反而更快开始，信任也更有机会回来。",
    ],
    en: [
      "Ask once a week what can remain undone. Removing an empty meeting, excessive explanation, or repeated decision returns limited attention to work that truly matters.",
      "Release one layer of control and observe whether the system improves. Let another person use their own method, let a relationship contain silence, and let a plan retain space; capacity often appears when management loosens.",
      "Reducing self-defense brings us closer to fact. After a mistake, first acknowledge impact and responsibility before explaining context; less image protection allows repair to begin sooner.",
    ],
  },
  {
    zh: [
      "作公共决定前，先听处境最不同的人。自己的便利不能自动代表所有人的需要；把边缘经验带进判断，才能发现平均数据遮住的问题。",
      "服务别人时，别急着给出你最喜欢的答案。先问对方真正需要什么、愿意承担什么，再共同决定；善意若不听反馈，很容易只服务施予者的满足。",
      "面对群体差异，保持原则也保持可调整性。共同底线可以清楚，具体做法要允许因人因地变化，这样公平才不是强迫所有人使用同一尺寸。",
    ],
    en: [
      "Before a public decision, listen to people whose circumstances differ most from your own. Personal convenience does not represent universal need; experience at the margin reveals problems hidden by averages.",
      "When serving another person, do not rush to offer your favorite answer. Ask what they need and are willing to carry, then decide together; care without feedback often serves the giver's satisfaction.",
      "With group difference, keep principles clear while allowing practice to adjust. Shared boundaries can remain firm, but methods may vary by person and place; fairness is not forcing one size on everyone.",
    ],
  },
  {
    zh: [
      "照顾生命，不要把安全变成全面控制。健康检查、风险准备和清楚边界很重要，但若为了避免所有意外取消运动、关系和探索，也会先耗损活力。",
      "分辨谨慎与恐惧。谨慎会收集事实、准备退路，然后继续生活；恐惧则不断推迟、重复确认，仍无法安心。看见差别，才能在保护中保留行动。",
      "把注意力从“绝不出错”转向“出错后如何恢复”。建立支持、储备和求助路径，比幻想完全无风险更能让个人和团队走得长久。",
    ],
    en: [
      "Care for life without turning safety into total control. Health checks, preparation, and clear boundaries matter, but cancelling movement, relationship, and exploration to avoid every surprise also consumes vitality.",
      "Distinguish prudence from fear. Prudence gathers facts, prepares an exit, and continues living; fear postpones and checks repeatedly without finding safety. Seeing the difference keeps action inside protection.",
      "Move attention from never making a mistake to knowing how recovery will work. Support, reserves, and a clear path to ask for help sustain people and teams better than the fantasy of zero risk.",
    ],
  },
  {
    zh: [
      "创造一件东西后，让它真正进入别人生活。作品、方法和知识若只能由你解释和控制，就还没有独立；开放使用和反馈，成果才开始生长。",
      "帮助别人时，目标是增加对方能力，而不是延长依赖。说明方法、交还决定权、允许对方做得不同，才不会把关怀变成占有。",
      "面对孩子、团队或项目，区分照看与操纵。提供资源、边界和必要保护，然后给成长留空间；不能按你的样子发展，也可能发展得很好。",
    ],
    en: [
      "After creating something, let it enter other people's lives. A work, method, or body of knowledge that only you can explain and control is not yet independent; use and feedback begin its growth.",
      "When helping, increase the other person's capacity rather than extending dependence. Explain the method, return decision-making, and allow a different result so care does not become possession.",
      "With children, teams, or projects, distinguish tending from manipulation. Provide resources, boundaries, and necessary protection, then leave room for growth; development unlike your image may still be healthy.",
    ],
  },
  {
    zh: [
      "事情变得混乱时，先回到源头。重新确认最初目的、基本事实和共同需要，常能发现后来增加的争执只是离根太远，并非真的无解。",
      "理解结果，也要追溯产生它的条件。孩子的行为、团队的绩效、身体的症状，都不能只在表面纠正；找到长期供给它的环境，改变才会稳定。",
      "保护自己的根本来源。睡眠、可信关系、核心价值和基本能力，是外部变化时可返回的“母”；根稳，才有余力理解不断变化的“子”。",
    ],
    en: [
      "When a situation becomes confused, return to its source. Renew the original purpose, basic facts, and shared need; many later arguments appear because the work has moved too far from its root.",
      "To understand a result, trace the conditions that produced it. A child's behavior, team performance, or bodily symptom cannot be corrected only at the surface; stable change alters the environment that keeps feeding it.",
      "Protect your own root source. Sleep, trusted relationship, core values, and basic capacity are the mother to return to when conditions change; a steady root gives room to understand the changing children.",
    ],
  },
  {
    zh: [
      "真正可走的路通常没有那么复杂。若一个方案需要持续欺骗、表演或勉强自己才能维持，它即使光鲜，也可能已经偏离平坦的大道。",
      "警惕看起来更快的捷径。省略沟通、跳过基础、把成本推给别人，短期会显得高效，长期却要用更多力气修补，还会透支原本的信任。",
      "每天选择一件简单而正直的事：按时完成、说清边界、照顾身体、偿还承诺。大道不是远处理念，而是反复走在可持续的平路上。",
    ],
    en: [
      "A path that can truly be walked is usually not so complicated. If a choice requires continuous deception, performance, or self-betrayal, its glamour may already hide a departure from the level Way.",
      "Be cautious of shortcuts that only look faster. Skipping communication and foundations or transferring cost to others appears efficient briefly but demands greater repair later.",
      "Choose one simple and upright act each day: finish on time, state a boundary, care for the body, or honor a promise. The great Way is not distant theory but repeated movement on sustainable ground.",
    ],
  },
  {
    zh: [
      "想改善世界，先从自己能负责的范围开始。说话是否诚实、承诺是否完成、家中是否尊重人，这些小处会进入更大的团队和制度。",
      "不要用宏大理想逃避身边责任。关心公共议题，也要处理自己的偏见、消费和权力使用；由身至天下，意味着尺度扩大时原则仍然一致。",
      "个人修养也不能停在自我感觉良好。把获得的清明用于改善关系、工作和公共空间；内在成长若不减少现实伤害，就还需要继续检验。",
    ],
    en: [
      "Begin improving the world within the range you can actually carry. Honest speech, completed promises, and respect inside the home travel outward into larger teams and institutions.",
      "Do not use a grand ideal to avoid nearby responsibility. Care about public issues while examining your own prejudice, consumption, and use of power; principles should remain consistent as scale expands.",
      "Personal cultivation cannot end in feeling good about yourself. Apply clarity to relationship, work, and public space; inner growth that does not reduce real harm still needs testing.",
    ],
  },
  {
    zh: [
      "保留初生般的感受力。累、怕、喜欢或不舒服时，先承认身体的直接信号，不必立刻用“应该”把它压下；真实感受是调整生活的重要资料。",
      "柔软的人更容易学习。承认不知道、愿意重新尝试、允许别人教你，不会降低成熟；失去好奇，经验就容易变成僵硬的优越感。",
      "和谐不是从不冲突，而是冲突后能恢复连接。表达受伤、听见影响、重新找节奏，像呼吸一样回到关系，比保持完美形象更有生命力。",
    ],
    en: [
      "Preserve the sensitivity of new life. When tired, afraid, drawn, or uncomfortable, acknowledge the body's direct signal before covering it with what you should feel; sensation is useful information for adjustment.",
      "A supple person can keep learning. Admitting uncertainty, trying again, and allowing another person to teach you do not reduce maturity; curiosity prevents experience from hardening into superiority.",
      "Harmony does not mean never having conflict. The ability to name hurt, hear impact, and return to a shared rhythm after rupture is more alive than preserving a perfect appearance.",
    ],
  },
  {
    zh: [
      "不要把人的身份差异当成全部。职位、阵营和标签之下，都有害怕、需要尊严、渴望被理解的部分；看见共同处，才能降低不必要的敌意。",
      "共同并不取消边界和责任。理解一个人的处境，不等于同意他的行为；可以保持人性上的尊重，同时清楚制止伤害，让同理心不变成纵容。",
      "遇到你很难认同的人，先寻找一个真实相同点：都要安全、都怕失去、都希望有选择。这个入口不会解决全部问题，却能让对话不从仇恨开始。",
    ],
    en: [
      "Do not treat differences of identity as the whole person. Beneath role, faction, and label are fear, need for dignity, and the wish to be understood; shared humanity reduces unnecessary hostility.",
      "Common ground does not cancel boundaries or responsibility. Understanding circumstances is not agreement with behavior; human respect can remain while harm is clearly stopped.",
      "With someone difficult to understand, find one true point of sameness: both need safety, fear loss, or want some choice. It will not solve everything, but it keeps dialogue from beginning in hatred.",
    ],
  },
  {
    zh: [
      "问题没有造成伤害时，不必因为不符合你的习惯就立刻纠正。给家人、同事和孩子一定自我调整空间，能培养判断，而不是只培养服从。",
      "设好少数必要边界，然后减少反复提醒。规则太多会把注意力用在躲避管理；清楚底线加上真实后果，往往更容易形成稳定秩序。",
      "发现自己频繁插手时，问问是在解决问题，还是缓解自己的不安。管理者能承受短暂不确定，系统才有机会长出不依赖监督的能力。",
    ],
    en: [
      "When no harm is occurring, do not correct something merely because it differs from your habit. Giving family, colleagues, and children room to self-adjust develops judgment rather than only obedience.",
      "Set a few necessary boundaries and reduce repeated reminders. Too many rules direct attention toward avoiding management; clear limits joined to real consequences create steadier order.",
      "When you keep intervening, ask whether you are solving a problem or relieving your own anxiety. A leader who can tolerate temporary uncertainty allows a system to develop capacity beyond supervision.",
    ],
  },
  {
    zh: [
      "顺境里保留警觉，逆境里保留希望。好事可能带来松懈和过度扩张，坏事也可能迫使人修正方向；不要让眼前标签替你判断全部后果。",
      "事情变化时，给结论一点时间。失去一个机会未必是最终损失，得到一个位置也未必只有好处；先观察连锁影响，再决定如何回应。",
      "关系冲突中，不把对方永久定义为祸，也不把短暂和好当成福。看具体行为是否改变、边界是否可守，长期事实比一时情绪更可靠。",
    ],
    en: [
      "Keep alertness in good fortune and hope in difficulty. Success can bring carelessness and overexpansion, while trouble may force a needed correction; the present label does not reveal every consequence.",
      "Give conclusions time when circumstances change. Losing an opportunity may not be final loss, and gaining a position may carry hidden cost; observe the chain of effects before choosing a response.",
      "In relationship conflict, do not define the other person permanently as disaster or treat a brief reunion as blessing. Watch whether behavior changes and boundaries hold; long evidence is more reliable than one emotion.",
    ],
  },
  {
    zh: [
      "节制不是把自己逼得越少越好，而是把资源用在能长久的地方。保留体力、金钱和注意力的余量，遇到变化时才有能力照顾真正重要的事。",
      "建立深根要靠重复的小事。规律睡眠、兑现承诺、持续学习、维护可信关系，看起来普通，却比一次猛烈投入更能支撑长期成长。",
      "不要等危机出现才开始储备。团队提前培养替代能力，家庭保留应急资金，个人维护身体和朋友；有根基，面对风浪时就少靠恐慌决定。",
    ],
    en: [
      "Moderation is not forcing life to become as small as possible. It places resources where they can last; reserve energy, money, and attention so change does not remove the ability to care for what matters.",
      "Deep roots grow through repeated ordinary acts. Regular sleep, honored promises, continued learning, and trusted relationship support long development more reliably than one burst of intensity.",
      "Do not wait for crisis before building reserves. Teams develop backup capacity, families keep emergency funds, and people maintain body and friendship; roots reduce panic as a decision-maker.",
    ],
  },
  {
    zh: [
      "处理复杂事务时，动作越多不一定越好。像翻动小鱼会把它弄碎，频繁改方向、换规则、催进度，也会破坏正在形成的秩序。",
      "确定必要条件后，给过程一段稳定时间。今天一种要求、明天另一套指标，会让人只学会猜管理者；持续标准才能让真实反馈出现。",
      "干预前先问这次动作解决什么具体风险。若只是因为看不见进展而焦虑，可以先观察；温和治理不是放任，而是只在必要处准确用力。",
    ],
    en: [
      "More movement does not automatically improve a complex matter. As repeatedly turning a small fish breaks it apart, constant changes of direction, rules, and deadlines damage order that is still forming.",
      "After setting necessary conditions, give the process a stable period. A new demand today and a different metric tomorrow teach people only to guess the manager; consistent standards allow real feedback to appear.",
      "Before intervening, name the concrete risk the action will solve. If anxiety comes only from not seeing progress, continue observing; gentle governance is precise effort at necessary points, not neglect.",
    ],
  },
  {
    zh: [
      "位置越高，越要主动降低信息门槛。让一线的人能直接反馈，让资源真正到达承担工作的人；居下不是姿态，而是防止权力远离现实。",
      "关系中更强的一方先放下赢的需要。掌握更多资源、经验或话语权的人愿意倾听和让步，才可能建立合作，而不是要求弱者不断适应。",
      "做大之后仍保留服务意识。组织、品牌或个人影响力增加时，问自己在承接什么公共需要；只享受中心位置，规模很快会变成负担。",
    ],
    en: [
      "The higher the position, the more deliberately information barriers should be lowered. Let frontline people report directly and let resources reach those carrying the work; taking the lower place keeps power close to reality.",
      "In relationship, the stronger side can release the need to win first. A person with more resources, experience, or voice creates cooperation by listening and yielding rather than requiring the weaker side to keep adapting.",
      "Retain a service orientation as scale grows. When an organization, brand, or individual gains influence, ask what common need it is receiving; enjoying the center without service turns size into burden.",
    ],
  },
  {
    zh: [
      "不要只把原则留给表现好的人。一个人犯错、失败或处在低谷时，仍然需要基本尊严和回来的路径；庇护不是免除责任，而是不让人被一次经历永远放逐。",
      "成为别人可求助的地方，也要说明你能提供什么、不能提供什么。清楚边界能让帮助稳定持续，避免承诺过多后突然消失，反而造成第二次失望。",
      "自己陷入困难时，不必等到完全崩溃才求助。向可信的人说明事实、需要和已经尝试的方法；愿意进入支持，本身就是恢复能力的一部分。",
    ],
    en: [
      "Do not reserve principle only for people who perform well. Someone who fails or falls into difficulty still needs basic dignity and a path back; refuge does not erase responsibility, it prevents one event from becoming permanent exile.",
      "When becoming a place of help, state clearly what you can and cannot provide. Boundaries make support stable and prevent the sudden disappearance that follows an impossible promise.",
      "When you are in difficulty, do not wait for total collapse before asking for help. Tell a trusted person the facts, the need, and what you have tried; entering support is part of the capacity to recover.",
    ],
  },
  {
    zh: [
      "问题刚露出征兆时就处理。一个反复迟到、一次数据异常、一句没有说开的不满，成本都远小于它们变成危机之后的补救，也更容易保住关系。",
      "大任务先拆成今天能完成的一步。明确负责人、时间和可观察结果，能够减少头脑里的巨大压力，也让真实进展替代空泛焦虑。",
      "困难处于容易阶段时，别因为“不严重”而忽略。日常维护、边界提醒和早期沟通看起来琐碎，却是避免未来付出巨大代价的地方。",
    ],
    en: [
      "Act when a problem first shows a sign. Repeated lateness, one data anomaly, or an unspoken resentment costs far less to address before it becomes a crisis.",
      "Break a large task into one step that can be completed today. A clear owner, time, and observable result reduce the mind's enormous pressure and replace vague anxiety with real movement.",
      "Do not ignore a difficulty because it is still easy. Routine maintenance, an early boundary reminder, and a timely conversation look small precisely because they prevent a much larger future cost.",
    ],
  },
  {
    zh: [
      "学会在问题还小的时候处理。生活和工作里，不要等混乱完全出现才行动；一个被忽略的小征兆，往往比最后的大规模补救更值得认真对待。",
      "越接近完成，越要稳住自己。熟悉感最容易让人松懈、求快或过早庆祝；把复核、交接和收尾做完整，成果才真正离开风险区。",
      "不要把最后用力误当成负责。真正持久的结果来自全过程尊重条件、节奏和边界；从开始到结束都保持清醒，才是“慎终如始”。",
    ],
    en: [
      "Learn to act while a problem is still small. In work and life, do not wait until disorder fully appears; a neglected early sign often deserves more attention than a large rescue at the end.",
      "Become steadier as completion approaches. Familiarity invites rushing, relaxed attention, and celebration too early; review, handoff, and careful closure move a result beyond the final zone of risk.",
      "Do not mistake a final burst of force for responsibility. Durable results come from respecting conditions, timing, and limits through the whole process; clarity from beginning to end is what caring for the end as the beginning means.",
    ],
  },
  {
    zh: [
      "不要把聪明变成让别人猜不透的权力。规则、价格、职责和评价越清楚，人越能诚实参与；靠信息差维持优势，会让所有人学会互相防备。",
      "管理中少一点技巧操弄，多一点稳定制度。用临时暗示、关系亲疏和反复试探控制人，短期看似灵活，长期会破坏信任和责任感。",
      "自己作决定时，也别只追求最会算计的方案。一个选择若必须长期伪装、钻空子或利用别人才能成立，它的收益很可能正在损害更大的生活秩序。",
    ],
    en: [
      "Do not turn cleverness into power that others cannot understand. Clear rules, prices, responsibilities, and evaluation support honest participation; advantage based on information gaps teaches everyone to defend against everyone else.",
      "Use less manipulation and more stable structure in management. Hints, favoritism, and repeated tests may look flexible in the short term, but they steadily destroy trust and responsibility.",
      "In personal decisions, do not pursue only the most calculating option. A choice that requires long disguise, loopholes, or exploitation may be gaining at the cost of a larger order in life.",
    ],
  },
  {
    zh: [
      "想获得真实信息，先让自己成为别人敢说话的低处。领导者若只欢迎好消息，问题就会在沉默里变大；能承接坏消息，才有机会及早处理。",
      "关系里不要总抢着定义局面。先听完、先问需要、先容纳一时混乱，像江海接纳百川；能接住差异的人，更容易形成长期连接。",
      "影响力越大，越要避免高高在上。主动靠近现场、使用普通语言、让功劳流向参与者，才能让人愿意汇聚，而不是被权力推着靠近。",
    ],
    en: [
      "To receive truthful information, become a lower place where people dare to speak. A leader who welcomes only good news lets problems grow in silence; receiving bad news makes early action possible.",
      "In relationship, do not rush to define the whole situation. Listen fully, ask what is needed, and hold temporary disorder as rivers and seas receive streams; the capacity to receive difference supports lasting connection.",
      "The more influence you hold, the more important it is to avoid standing above everyone. Stay close to the work, use ordinary language, and let credit flow to participants so people gather willingly.",
    ],
  },
  {
    zh: [
      "作决定前，先问能否减少伤害、减少浪费、减少抢先。慈悲让你看见影响，节俭让资源可持续，不争第一让别人也有生长空间。",
      "节俭不是一味压缩生活，而是不把有限资源耗在虚荣和重复上。把钱、时间和注意力留给长期价值，个人与组织都会更有韧性。",
      "不敢为天下先，不等于永远退缩。必要时仍要承担，只是不把领先当作身份；先看共同需要，再决定自己站在哪个位置，以及何时应该让出位置。",
    ],
    en: [
      "Before deciding, ask whether harm, waste, and the need to be first can be reduced. Compassion sees impact, frugality preserves resources, and not rushing ahead leaves room for others to grow.",
      "Frugality does not mean making life uniformly smaller. It refuses to spend limited resources on vanity and repetition; preserving money, time, and attention for lasting value builds resilience.",
      "Not daring to be first does not mean permanent retreat. Carry responsibility when necessary without making leadership an identity; begin with the common need, then choose the position you should occupy.",
    ],
  },
  {
    zh: [
      "冲突中先把目标从“赢过对方”改为“解决问题”。一旦只想获胜，事实就会被挑选、关系会被牺牲；共同面对问题，才可能保留合作。",
      "不争不是不表达。把事实、需要和边界说清楚，但不羞辱、不抢最后一句、不强迫立即同意，能让坚定与尊重同时存在，也让对话仍有下一步。",
      "看到别人表现更好时，把嫉妒转成信息。问自己真正向往什么、可以学习什么，而不是贬低对方；竞争可以成为成长线索，不必变成敌意。",
    ],
    en: [
      "In conflict, change the goal from defeating the other person to solving the problem. Once victory becomes primary, facts are selected and relationship is sacrificed; facing the problem together preserves cooperation.",
      "Non-contention does not mean silence. State facts, needs, and boundaries without humiliation, demanding the last word, or forcing immediate agreement; firmness and respect can remain together.",
      "When someone performs better, use envy as information. Ask what you genuinely long for and can learn instead of diminishing them; comparison can become a clue for growth rather than hostility.",
    ],
  },
  {
    zh: [
      "进入冲突前，先记得受伤不是抽象代价。每个决定都会落在具体身体、家庭和未来关系上；保留悲悯，能防止立场让人对伤害麻木。",
      "真正强大的人敢于承认悲伤和损失。团队或家庭经历事件后，不急着要求振作；允许哀悼，才有机会诚实整理发生了什么，并真正开始恢复。",
      "当双方都想赢时，更能看见代价的一方往往更接近成熟。愿意停止升级、保护无辜、留下和解路径，不是软弱，而是拒绝让冲突继续吞噬。",
    ],
    en: [
      "Before entering conflict, remember that harm is not an abstract cost. Every decision lands on specific bodies, families, and future relationships; compassion prevents a position from making us numb.",
      "Real strength can acknowledge grief and loss. After an event affects a team or family, do not demand an immediate recovery; space for mourning allows an honest account of what occurred.",
      "When both sides want victory, the side that can still see the cost may be closer to maturity. Stopping escalation, protecting the uninvolved, and leaving a path to reconciliation are forms of strength.",
    ],
  },
  {
    zh: [
      "不要因为外表普通就低估价值。一个安静的人、一项基础工作、一种不善宣传的能力，可能正是团队长期可靠的核心；判断要看作用，不只看包装。",
      "自己有能力时，也不必急着展示全部。先让事实和作品成熟，再选择合适时机表达；内在有分量的人，不需要每次都靠外界确认。",
      "保持朴素，同时不要把才能藏成自我否定。怀玉不是拒绝贡献，而是不让贡献被虚荣支配；该承担时清楚站出来，完成后仍能回到平常。",
    ],
    en: [
      "Do not underestimate value because its appearance is ordinary. A quiet person, foundational task, or poorly advertised skill may be the core of long reliability; judge by function rather than packaging.",
      "When you have ability, there is no need to display all of it immediately. Let facts and work mature, then speak at the useful time; inner substance does not require constant external confirmation.",
      "Remain plain without hiding talent as self-denial. Holding jade within does not refuse contribution; it keeps contribution from being ruled by vanity. Step forward when needed and return to ordinary life afterward.",
    ],
  },
  {
    zh: [
      "不确定时，直接说“我还不知道”。假装确定会让错误决定更难修正；承认知识边界，反而能邀请证据、专家和不同经验进入。",
      "知道得越多，越要看见未知仍有多大。专业判断中保留假设、条件和置信度，可以防止一句结论被误用成不容讨论的真理，也保护后来修正。",
      "面对别人的问题，不必立刻给答案来证明有用。先澄清问题、说明自己知道与不知道的部分，再共同寻找；诚实的未知比漂亮的误导更可靠。",
    ],
    en: [
      "When uncertain, say directly, “I do not know yet.” Pretended certainty makes a wrong decision harder to repair; acknowledging the boundary of knowledge invites evidence, expertise, and other experience.",
      "The more you know, the more visible the remaining unknown should become. Stating assumptions, conditions, and confidence keeps professional judgment from being misused as unquestionable truth.",
      "You do not need an instant answer to prove usefulness. Clarify the question, state what you know and do not know, and search together; honest uncertainty is more reliable than an impressive misdirection.",
    ],
  },
  {
    zh: [
      "了解自己，也要善待自己。看见局限后，不用羞辱和比较逼迫改变；尊重身体节奏、给错误修复空间，成长才不会建立在自我厌恶上。",
      "自爱需要边界。拒绝长期消耗、离开反复伤害、为休息保留时间，不是自私，而是承认生命值得被保护，也值得在清醒中继续成长。",
      "不要把“做自己”理解成拒绝反馈。真正的自知能听见行为对别人的影响，再选择是否调整；爱自己，也包括不让自己停在无意识的伤害里。",
    ],
    en: [
      "Know yourself and treat yourself with care. After seeing a limitation, do not use shame and comparison to force change; respect bodily timing and leave room to repair mistakes so growth is not built on self-hatred.",
      "Self-care requires boundaries. Refusing chronic depletion, leaving repeated harm, and protecting time for rest are not selfish; they recognize that life deserves protection.",
      "Do not interpret being yourself as refusing feedback. Real self-knowledge hears the impact of behavior and then chooses whether to adjust; loving yourself includes not remaining inside unconscious harm.",
    ],
  },
  {
    zh: [
      "勇敢不只表现为敢做，也表现为敢停。信息不足、代价不明或会伤害无辜时，拒绝冲动行动，需要比逞强更大的内在稳定，也更能承担后果。",
      "面对群体压力，保留一句“我需要再想想”。不立即表态、不跟随起哄，可以保护判断，也给其他犹豫的人留下不被裹挟的空间。",
      "谨慎之后仍要承担必要行动。不敢不是逃避一切风险，而是先辨认什么不该做，再把力量用在真正负责的选择上，不被犹豫长期困住。",
    ],
    en: [
      "Courage appears not only in daring but in stopping. When information is insufficient, cost is unclear, or innocent people may be harmed, refusing impulsive action requires more stability than bravado.",
      "Under group pressure, preserve the sentence, “I need more time to think.” Not declaring immediately or joining excitement protects judgment and gives other uncertain people room from coercion.",
      "After caution, still carry necessary action. Not daring is not avoidance of every risk; it first identifies what should not be done, then directs strength toward the responsible choice.",
    ],
  },
  {
    zh: [
      "不要替别人执行本应由他承担的后果。过度代办、替人解释、替人道歉，看似帮助，长期却会夺走对方学习责任的机会，也让关系越来越失衡。",
      "拥有权力时，更要守住职责边界。不是所有错误都需要最重处罚，也不是所有问题都由你裁决；程序和角色分工能防止个人情绪变成伤害。",
      "看到不公可以介入，但先确认授权、证据和影响。越过边界去“替天行道”，容易复制自己反对的暴力；正当目的也需要正当方法。",
    ],
    en: [
      "Do not carry consequences that another person must learn to carry. Repeatedly doing, explaining, or apologizing on their behalf looks helpful but removes the opportunity to develop responsibility.",
      "The more power you hold, the more carefully role boundaries must be kept. Not every error requires the strongest punishment and not every problem is yours to judge; process prevents personal emotion from becoming harm.",
      "Intervene in injustice only after checking authority, evidence, and impact. Acting as a private executioner can reproduce the violence you oppose; a just purpose still requires a just method.",
    ],
  },
  {
    zh: [
      "越害怕失去，越容易用控制耗损正在拥有的生命。为了健康、安全或关系不断检查和限制，可能让日常只剩防备；保护需要边界，也需要呼吸。",
      "不要把活得久、拥有多、位置高当成唯一价值。生命的质量也在真实连接、自由选择和有意义的投入里；数量不能替代活着的感受。",
      "准备风险之后，允许自己继续生活。做必要保险、检查和计划，然后去运动、爱人、尝试；成熟不是消灭不确定，而是在不确定中保持生命力。",
    ],
    en: [
      "The more we fear loss, the more control can consume the life already present. Endless checking and restriction for health, safety, or relationship can turn daily existence into defense; protection needs boundaries and breath.",
      "Do not make longevity, possession, or status the only measures of life. Quality also lives in real connection, free choice, and meaningful effort; quantity cannot substitute for the experience of being alive.",
      "After preparing for risk, allow life to continue. Arrange necessary insurance, checks, and plans, then move, love, and try; maturity does not eliminate uncertainty but preserves vitality within it.",
    ],
  },
  {
    zh: [
      "活着的身体需要柔软和调整空间。疼痛、疲劳或情绪变化时，先听信号并改变节奏；硬撑并不总是坚强，可能是在失去恢复能力。",
      "观点也要能弯曲。新证据出现后愿意修正，不会损害可信度；真正危险的是为了维护一致形象，把错误立场变得越来越僵硬。",
      "组织若只允许一种方法和声音，也会逐渐失去生命力。保留试验、异议和学习的空间，系统才有能力面对尚未知道的变化，并在压力下继续生长。",
    ],
    en: [
      "A living body needs softness and room to adjust. When pain, fatigue, or emotion changes, hear the signal and alter the pace; enduring rigidly is not always strength and may reduce the ability to recover.",
      "Views also need the capacity to bend. Revising after new evidence does not damage credibility; defending an error to preserve a consistent image makes the position increasingly lifeless.",
      "An organization that permits only one method and voice also loses vitality. Space for experiment, dissent, and learning gives a system capacity for changes it cannot yet predict.",
    ],
  },
  {
    zh: [
      "看见哪里过多、哪里不足，再谈公平。资源若总流向已经拥有最多的人，整体会失去韧性；补足基本能力，是让所有人都能参与。",
      "团队分工不能只奖励最显眼的结果。维护、照顾、文档和支持虽然不耀眼，却承担系统缺口；让回报看见这些工作，合作才不会失衡。",
      "个人生活也要用有余补不足。精神充足时处理困难事项，收入宽裕时建立储备，关系稳定时主动关心别人；把余量流向真正缺口。",
    ],
    en: [
      "Notice where excess and insufficiency sit before speaking of fairness. When resources always flow toward those who already hold the most, the whole loses resilience; meeting basic capacity allows everyone to participate.",
      "Team reward cannot see only visible outcomes. Maintenance, care, documentation, and support carry the gaps of a system; recognizing this work keeps collaboration from becoming unbalanced.",
      "Use personal surplus to meet real lack. Handle difficult work when energy is available, build reserves when income is stronger, and reach toward others when relationship is stable; let margin flow toward the true gap.",
    ],
  },
  {
    zh: [
      "面对强硬局面，不必把自己变得更硬。降低对抗、改变路径、持续表达关键事实，像水寻找缝隙，能在不放弃原则的情况下保存力量。",
      "柔弱的作用需要时间。一次温和沟通可能看不见结果，但长期守信、稳定边界和不报复，会逐渐改变关系能够承受的范围，让防御慢慢松开。",
      "真正的胜利不是把对方击碎，而是让问题失去继续伤害的力量。保留转身、修复和重新合作的可能，比短暂压服更接近长久解决。",
    ],
    en: [
      "A hard situation does not require making yourself harder. Lower confrontation, change the path, and continue stating essential facts; like water finding an opening, principle can remain while strength is preserved.",
      "Soft influence needs time. One gentle conversation may show no immediate result, but long reliability, steady boundaries, and refusal to retaliate gradually change what a relationship can hold.",
      "Real victory does not break the other person; it removes the problem's ability to continue harming. Preserving possibilities for turning, repair, and future cooperation resolves more than temporary domination.",
    ],
  },
  {
    zh: [
      "有凭据、有道理，也不必把追责变成羞辱。说明事实、责任和期限，同时保留履行的路径，比反复逼迫更可能让旧账真正结束。",
      "关系里不要把每次让步都记成债。清楚重要边界，也允许善意自由发生；若所有付出都等待回报，亲近会逐渐变成结算，彼此也会失去轻松。",
      "掌握优势时，克制追加惩罚的冲动。目标应是恢复公平和防止再犯，而不是享受对方低头；止于必要，才能避免正当追责变成报复。",
    ],
    en: [
      "Having evidence and being right do not require turning accountability into humiliation. State the fact, responsibility, and deadline while preserving a path to fulfill them; this closes an obligation better than repeated pressure.",
      "In relationship, do not record every act of care as a debt. Keep important boundaries while allowing kindness to be freely given; when every contribution waits for repayment, closeness becomes an account.",
      "When holding advantage, restrain the urge to add punishment. The purpose is restored fairness and prevention, not the pleasure of submission; stopping at what is necessary keeps accountability from becoming revenge.",
    ],
  },
  {
    zh: [
      "规模更大不自动等于生活更好。购买、扩张或迁移前，问它是否增加真实自由，还是让你进入更长的依赖链和更高维护成本。",
      "保留基本生活能力和附近关系。会做简单食物、处理基础问题、认识邻里，在系统中断时会成为效率无法替代的韧性，也让日常更有踏实感。",
      "减少无意义的远方比较，重新感受眼前共同体。支持本地合作、维护长期朋友、珍惜熟悉环境，满足感常来自可触及的连接，而不是无限选择。",
    ],
    en: [
      "Larger scale does not automatically improve life. Before buying, expanding, or moving, ask whether it creates real freedom or adds a longer chain of dependence and greater maintenance cost.",
      "Retain basic life skills and nearby relationships. Preparing simple food, handling basic problems, and knowing neighbors become resilience when systems fail in ways efficiency cannot replace.",
      "Reduce meaningless comparison with distant lives and recover contact with the community at hand. Local cooperation, long friendship, and familiar places often provide satisfaction that infinite choice cannot.",
    ],
  },
  {
    zh: [
      "真实的话不一定好听，但应该尽量清楚且少伤害。表达困难事实时，去掉夸张和羞辱，把证据、影响与需要说明白，诚实才不会成为攻击借口。",
      "帮助别人时，判断他是否因此更有能力。代替选择、制造依赖或让对方欠人情，都可能把善意变成控制；有益的帮助最终会归还自由。",
      "做决定前，用“是否有益、是否伤害”作为最后检查。收益不能只算自己得到什么，也要看代价落在谁身上；利而不害，是整部书留给行动的尺度。",
    ],
    en: [
      "Truth may not sound pleasant, but it should remain clear and cause as little harm as possible. When stating a difficult fact, remove exaggeration and humiliation; honesty should not become permission to attack.",
      "When helping, ask whether the other person gains capacity. Choosing for them, extending dependence, or creating a debt can turn kindness into control; beneficial help eventually returns freedom.",
      "Before acting, use benefit and harm as the final check. Gain cannot count only what you receive; it must include where the cost lands. Benefiting without harm is a practical measure for the entire book.",
    ],
  },
];

export const chapterPracticalInsights = baseChapterPracticalInsights.map((insights, chapterId) => {
  if (!insights) return null;
  const details = chapterPracticalInsightDetails[chapterId];
  return {
    zh: insights.zh.map((point, pointIndex) => `${point}${details.zh[pointIndex]}`),
    en: insights.en.map((point, pointIndex) => `${point} ${details.en[pointIndex]}`),
  };
});

export function practicalInsightsFor(chapterId) {
  const insights = chapterPracticalInsights[chapterId];
  if (!insights?.zh || !insights?.en) {
    throw new Error(`Missing practical insights for chapter ${chapterId}`);
  }
  return insights;
}
