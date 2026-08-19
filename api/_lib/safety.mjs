import { HttpError } from "./http.mjs";

const IMMEDIATE_RISK = [
  /(?:想|要|准备|计划|打算|现在).{0,12}(?:自杀|结束生命|伤害自己)/i,
  /(?:自杀|结束生命|伤害自己).{0,12}(?:准备|计划|方法|现在)/i,
  /(?:kill myself|end my life|suicide plan|hurt myself)/i,
];

const HIGH_STAKES = [
  /(?:药|用药|剂量|诊断|医生|手术|怀孕|medical|medicine|doctor|diagnos|dose|surgery)/i,
  /(?:法律|律师|起诉|合同效力|legal advice|lawyer|lawsuit)/i,
  /(?:投资|股票|基金|加密货币|保证收益|invest|stock|crypto|guaranteed return)/i,
];

export function classifySafetyRisk(question) {
  if (IMMEDIATE_RISK.some((pattern) => pattern.test(question))) return "immediate";
  if (HIGH_STAKES.some((pattern) => pattern.test(question))) return "high_stakes";
  return "standard";
}

export function validateCompanionQuestion(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_question", "Question must be text");
  }
  const question = value.trim().replace(/\s+/g, " ");
  if (!question) throw new HttpError(400, "invalid_question", "Question is required");
  if (question.length > 2000) {
    throw new HttpError(400, "question_too_long", "Question is too long");
  }
  return question;
}

export function immediateSafetyResponse(locale) {
  if (locale === "zh") {
    return "听起来你现在可能正处在危险里。请先不要独自承受：立刻联系当地紧急服务，或请一位可信任的人来到你身边，并远离可能伤害自己的物品。如果可以，直接告诉对方：‘我现在不安全，需要你陪着我并帮我求助。’问道同行不能处理紧急危机，但你值得得到及时、真实的人类帮助。";
  }
  return "It sounds as though you may be in immediate danger. Please do not stay alone with this: contact local emergency services now, ask a trusted person to come and remain with you, and move away from anything you could use to hurt yourself. You can say directly, ‘I am not safe right now. Please stay with me and help me get urgent support.’ Wendao Companion cannot manage an emergency, but you deserve immediate human help.";
}
