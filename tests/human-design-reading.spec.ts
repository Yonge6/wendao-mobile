import { expect, test } from "@playwright/test";
import {
  detailedReading,
  foundationalReading,
  type HumanDesignReadingChart,
} from "../src/humanDesignReading";

const activation = (gate: number, color = 3, tone = 2) => ({ gate, line: 1, color, tone });

function chart(core: HumanDesignReadingChart["core"], gates = [14, 8, 29, 30]): HumanDesignReadingChart {
  return {
    core,
    activations: {
      personality: { sun: activation(gates[0]), earth: activation(gates[1]) },
      design: {
        sun: activation(gates[2], 4, 5),
        earth: activation(gates[3]),
        northNode: activation(33, 6, 2),
      },
    },
  };
}

const generator = chart({
  type: "Generator",
  strategy: "To Respond",
  authority: "Sacral",
  profile: "5/1",
  definition: "Single Definition",
  incarnationCross: "Right Angle Cross of Service",
});

const projector = chart({
  type: "Projector",
  strategy: "Wait for the Invitation",
  authority: "Emotional - Solar Plexus",
  profile: "2/4",
  definition: "Split Definition",
  incarnationCross: "Left Angle Cross of Alignment",
}, [18, 17, 52, 58]);

function storedSnapshot(current: HumanDesignReadingChart) {
  return {
    schemaVersion: "1.0",
    engineVersion: "1.0.0",
    verificationStatus: "engine_verified",
    chartHash: `sha256:${"b".repeat(64)}`,
    generatedAt: "2026-08-13T00:00:00.000Z",
    input: {
      birthDate: "1990-01-01",
      birthTime: "12:00",
      timezone: "Asia/Shanghai",
      locationLabel: "武汉市",
    },
    core: current.core,
    activations: current.activations,
    structure: { definedCenters: [], channels: [], variables: {} },
    meta: {},
  };
}

test("keeps the life manual deterministic and complete in both languages", () => {
  for (const language of ["zh", "en"] as const) {
    expect(foundationalReading(generator, language)).toHaveLength(4);
    expect(detailedReading(generator, language)).toHaveLength(14);
    expect(detailedReading(generator, language)).toEqual(detailedReading(generator, language));
    expect(new Set(detailedReading(generator, language).map((section) => section.title)).size).toBe(14);
  }
});

test("keeps the foundational and detailed readings strengths-first and practical", () => {
  const zhFoundation = foundationalReading(generator, "zh");
  const enFoundation = foundationalReading(generator, "en");
  expect(zhFoundation.map((section) => section.title)).toEqual([
    "你的三项核心优势",
    "工作场景",
    "生活场景",
    "做决定时可以这样试",
  ]);
  expect(enFoundation.map((section) => section.title)).toEqual([
    "Your three core strengths",
    "Work example",
    "Daily-life example",
    "Try this when deciding",
  ]);
  expect(zhFoundation[0].body).toContain("1. 核心能量优势");
  expect(zhFoundation[1].body).toContain("收到新任务时");
  expect(zhFoundation[2].body).toContain("安排运动、学习或周末活动");
  expect(zhFoundation[3].body).toContain("自我观察练习");

  const zhDetailed = detailedReading(generator, "zh");
  const enDetailed = detailedReading(generator, "en");
  expect(zhDetailed[0].title).toBe("先看重点：你的三项核心优势");
  expect(zhDetailed.at(-1)?.title).toBe("未来七天，只做一个小实验");
  expect(enDetailed[0].title).toBe("Your three core strengths");
  expect(enDetailed.at(-1)?.title).toBe("A small experiment for the next seven days");
});

test("changes latter-half guidance across type authority profile and definition", () => {
  for (const language of ["zh", "en"] as const) {
    const generatorTail = detailedReading(generator, language).slice(6).map((section) => section.body);
    const projectorTail = detailedReading(projector, language).slice(6).map((section) => section.body);
    expect(generatorTail).not.toEqual(projectorTail);
    expect(generatorTail.filter((body, index) => body !== projectorTail[index]).length).toBeGreaterThanOrEqual(6);
  }

  const generatorZh = detailedReading(generator, "zh");
  const projectorZh = detailedReading(projector, "zh");
  expect(generatorZh[6].body).toContain("具体选项");
  expect(generatorZh[7].body).toContain("深入调查");
  expect(generatorZh[8].body).toContain("能落地的答案");
  expect(generatorZh[10].body).toContain("完整独处时间");
  expect(generatorZh[12].body).toContain("挫败");
  expect(generatorZh[13].body).toContain("是非问题");
  expect(projectorZh[6].body).toContain("情绪起伏");
  expect(projectorZh[7].body).toContain("独处");
  expect(projectorZh[8].body).toContain("熟悉的人");
  expect(projectorZh[10].body).toContain("对话对象");
  expect(projectorZh[12].body).toContain("苦涩");
  expect(projectorZh[13].body).toContain("推迟到明天");
});

test("does not restore the former universal closing paragraphs", () => {
  for (const current of [generator, projector]) {
    for (const language of ["zh", "en"] as const) {
      const body = detailedReading(current, language).map((section) => section.body).join("\n");
      expect(body).not.toContain("一个真实回应和一个清楚边界，就足以开始");
      expect(body).not.toContain("One honest response and one clearer boundary are enough to begin");
      expect(body).not.toContain("观察哪些人让你的身体更放松、声音更自然、节奏被尊重");
      expect(body).not.toContain("The right people do not require you to erase your timing");
    }
  }
});

test("gives every supported type authority profile and definition its own guidance", () => {
  const typeCases = [
    ["Generator", "To Respond"],
    ["Manifesting Generator", "To Respond"],
    ["Manifestor", "To Inform"],
    ["Projector", "Wait for the Invitation"],
    ["Reflector", "Wait a Lunar Cycle"],
  ] as const;
  const authorities = [
    "Emotional - Solar Plexus",
    "Sacral",
    "Splenic",
    "Ego Manifested",
    "Ego Projected",
    "Self-Projected",
    "Mental - Environment",
    "Lunar",
  ];
  const profiles = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"];
  const definitions = ["No Definition", "Single Definition", "Split Definition", "Triple Split Definition", "Quadruple Split Definition"];

  for (const language of ["zh", "en"] as const) {
    const typeReadings = typeCases.map(([type, strategy]) => detailedReading(chart({
      ...generator.core,
      type,
      strategy,
    }), language));
    expect(new Set(typeReadings.map((reading) => reading[2].body)).size).toBe(typeCases.length);
    expect(new Set(typeReadings.map((reading) => reading[12].body)).size).toBe(typeCases.length);
    expect(new Set(typeCases.map(([type, strategy]) => foundationalReading(chart({
      ...generator.core,
      type,
      strategy,
    }), language)[3].body)).size).toBe(typeCases.length);

    const authorityReadings = authorities.map((authority) => detailedReading(chart({
      ...generator.core,
      authority,
    }), language));
    expect(new Set(authorityReadings.map((reading) => reading[6].body)).size).toBe(authorities.length);
    expect(new Set(authorityReadings.map((reading) => reading[13].body)).size).toBe(authorities.length);

    const profileReadings = profiles.map((profile) => detailedReading(chart({
      ...generator.core,
      profile,
    }), language));
    expect(new Set(profileReadings.map((reading) => reading[7].body)).size).toBe(profiles.length);
    expect(new Set(profileReadings.map((reading) => reading[8].body)).size).toBe(profiles.length);

    const definitionReadings = definitions.map((definition) => detailedReading(chart({
      ...generator.core,
      definition,
    }), language));
    expect(new Set(definitionReadings.map((reading) => reading[10].body)).size).toBe(definitions.length);
  }
});

test("renders distinct latter-half guidance in the real life-manual drawer", async ({ page }) => {
  async function openDetailedReading(targetPage: typeof page, snapshot: ReturnType<typeof storedSnapshot>) {
    await targetPage.addInitScript((storedChart) => {
      window.localStorage.setItem("wendao-chart-snapshot", JSON.stringify(storedChart));
      window.localStorage.setItem("wendao-free-chapters-v1", JSON.stringify([64]));
    }, snapshot);
    await targetPage.goto("/?chapter=64&lang=zh");
    await targetPage.getByRole("button", { name: "打开更多功能" }).click();
    await targetPage.getByRole("button", { name: "查看人生说明书" }).click();
    await targetPage.getByRole("button", { name: "查看详细解读" }).click();
    await expect(targetPage.getByRole("heading", { name: "先看重点：你的三项核心优势" })).toBeVisible();
    await expect(targetPage.getByRole("heading", { name: "遇到真实选择时，具体怎么做" })).toBeVisible();
    return targetPage.locator(".profile-detail-reading");
  }

  const generatorReading = await openDetailedReading(page, storedSnapshot(generator));
  await expect(generatorReading).toContainText("把问题变成当下可回应的具体选项");
  await expect(generatorReading).toContainText("别人容易期待你拿出能落地的答案");
  await expect(generatorReading).toContainText("挫败反复出现时");
  const generatorTail = await generatorReading.locator("article").evaluateAll((articles) => articles.slice(6).map((article) => article.textContent));

  const projectorPage = await page.context().newPage();
  const projectorReading = await openDetailedReading(projectorPage, storedSnapshot(projector));
  await expect(projectorReading).toContainText("至少经历一次情绪起伏");
  await expect(projectorReading).toContainText("独处不是拒绝关系");
  await expect(projectorReading).toContainText("苦涩常在洞察未被看见");
  const projectorTail = await projectorReading.locator("article").evaluateAll((articles) => articles.slice(6).map((article) => article.textContent));
  expect(projectorTail).not.toEqual(generatorTail);

  const overflow = await projectorPage.locator(".drawer-scroll").evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
