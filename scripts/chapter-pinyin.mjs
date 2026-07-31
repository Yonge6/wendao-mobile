import { pinyin } from "pinyin-pro";

const HANZI = /\p{Script=Han}/u;

export function pinyinLinesForChapter(chapterId, lines) {
  const explicitClassicalTones = { bu: "bù", fu: "fú", gong: "gōng" };
  return lines.map((line) => {
    const characters = Array.from(line).filter((character) => HANZI.test(character));
    return pinyin(characters.join(""), { toneType: "symbol", type: "array" }).map((syllable, index) => {
      const character = characters[index];
      const previous = characters[index - 1];
      const next = characters[index + 1];
      if (character === "为") {
        const purposeConstruction = (chapterId === 12 && (next === "腹" || next === "目"))
          || (chapterId === 13 && (next === "身" || next === "天"))
          || (chapterId === 81 && previous === "以" && next === "人");
        return purposeConstruction ? "wèi" : "wéi";
      }
      if (character === "夫" && previous !== "丈") return "fú";
      if (character === "恶" && (previous === "所" || next === "之")) return "wù";
      if (character === "几" && (next === "于" || next === "成")) return "jī";
      if (character === "揣" && next === "而") return "zhuī";
      if (character === "载" && chapterId === 10) return "zài";
      if (character === "朝" && chapterId === 23) return "zhāo";
      if (character === "处") return "chǔ";
      if (character === "数" && chapterId === 27) return "shǔ";
      if (character === "见" && previous === "自") return "xiàn";
      if (character === "好" && (chapterId === 53 || chapterId === 57)) return "hào";
      return explicitClassicalTones[syllable] ?? syllable;
    });
  });
}
