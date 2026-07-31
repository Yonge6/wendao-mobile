const HANZI = /\p{Script=Han}/u;
const LACUNA = /[□○]/u;

export const HIGH_RISK_RECEIVED_PHRASES = new Map([
  ["非常道", "属于王弼通行本措辞，不属于帛书乙本主文"],
  ["非常名", "属于王弼通行本措辞，不属于帛书乙本主文"],
  ["守静笃", "属于王弼通行本措辞，不属于帛书乙本主文"],
  ["万物并作", "属于王弼通行本措辞，不属于帛书乙本主文"],
  ["吾以观复", "属于王弼通行本措辞，不属于帛书乙本主文"],
  ["大器晚成", "属于王弼通行本措辞，不属于帛书乙本主文"],
  ["大方无隅", "属于王弼通行本措辞，不属于帛书乙本主文"],
]);

export function sourceTokens(value) {
  return Array.from(value).filter((character) => HANZI.test(character) || LACUNA.test(character));
}

export function reconstructedTokens(lines) {
  const tokens = [];
  let bracketDepth = 0;
  for (const [lineIndex, line] of lines.entries()) {
    for (const [characterIndex, character] of Array.from(line).entries()) {
      if (character === "〔") {
        bracketDepth += 1;
        continue;
      }
      if (character === "〕") {
        bracketDepth = Math.max(0, bracketDepth - 1);
        continue;
      }
      if (HANZI.test(character)) {
        tokens.push({ character, lineIndex, characterIndex, marked: bracketDepth > 0 });
      }
    }
  }
  return tokens;
}

/**
 * Align a diplomatic transcription with a readable reconstruction.
 * Exact graphs are preferred, □/○ consume one restored graph, and other
 * one-for-one graph changes are treated as readings rather than supplies.
 */
export function requiredSupplyIndexes(transcription, reconstructedVerse) {
  const source = sourceTokens(transcription);
  const target = reconstructedTokens(reconstructedVerse);
  const rows = source.length + 1;
  const columns = target.length + 1;
  const costs = Array.from({ length: rows }, () => new Float64Array(columns));
  const moves = Array.from({ length: rows }, () => new Uint8Array(columns));

  for (let row = 1; row < rows; row += 1) {
    costs[row][0] = row;
    moves[row][0] = 2;
  }
  for (let column = 1; column < columns; column += 1) {
    costs[0][column] = column;
    moves[0][column] = 3;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const sourceCharacter = source[row - 1];
      const targetCharacter = target[column - 1].character;
      const diagonalPenalty = sourceCharacter === targetCharacter
        ? 0
        : LACUNA.test(sourceCharacter)
          ? 0.05
          : 0.8;
      const diagonal = costs[row - 1][column - 1] + diagonalPenalty;
      const deletion = costs[row - 1][column] + 1;
      const insertion = costs[row][column - 1] + 1;
      const best = Math.min(diagonal, deletion, insertion);
      costs[row][column] = best;
      // Prefer contextual one-for-one alignment when costs tie.
      moves[row][column] = diagonal <= best + Number.EPSILON ? 1 : deletion <= insertion ? 2 : 3;
    }
  }

  const required = new Set();
  let row = source.length;
  let column = target.length;
  while (row > 0 || column > 0) {
    const move = moves[row][column];
    if (move === 1) {
      if (LACUNA.test(source[row - 1])) required.add(column - 1);
      row -= 1;
      column -= 1;
    } else if (move === 2) {
      row -= 1;
    } else {
      required.add(column - 1);
      column -= 1;
    }
  }
  return [...required].sort((a, b) => a - b);
}

export function markReconstructionSupplies(transcription, lines) {
  const plainLines = lines.map((line) => line.replace(/[〔〕]/g, ""));
  const target = reconstructedTokens(plainLines);
  const required = new Set(requiredSupplyIndexes(transcription, plainLines));
  const byLine = new Map();
  for (const index of required) {
    const token = target[index];
    if (!token) continue;
    if (!byLine.has(token.lineIndex)) byLine.set(token.lineIndex, new Set());
    byLine.get(token.lineIndex).add(token.characterIndex);
  }

  return plainLines.map((line, lineIndex) => {
    const markedPositions = byLine.get(lineIndex) ?? new Set();
    let result = "";
    let open = false;
    for (const [characterIndex, character] of Array.from(line).entries()) {
      const shouldMark = HANZI.test(character) && markedPositions.has(characterIndex);
      if (shouldMark && !open) {
        result += "〔";
        open = true;
      } else if (!shouldMark && open) {
        result += "〕";
        open = false;
      }
      result += character;
    }
    if (open) result += "〕";
    return result;
  });
}

export function inspectChapterIntegrity(chapter) {
  const issues = [];
  const prefix = `Chapter ${chapter?.id ?? "?"}`;
  const transcription = chapter?.sources?.silkBTranscription;
  const receivedReference = chapter?.sources?.receivedReference;
  const reconstructionNotes = chapter?.sources?.reconstructionNotes;
  const reconstructedVerse = chapter?.zh?.reconstructedVerse;

  if (!transcription) issues.push({ severity: "P0", message: `${prefix}: missing sources.silkBTranscription` });
  if (!receivedReference) issues.push({ severity: "P0", message: `${prefix}: missing sources.receivedReference` });
  if (!reconstructionNotes) issues.push({ severity: "P0", message: `${prefix}: missing sources.reconstructionNotes` });
  if (!Array.isArray(reconstructedVerse) || reconstructedVerse.length === 0) {
    issues.push({ severity: "P0", message: `${prefix}: missing zh.reconstructedVerse` });
    return issues;
  }

  const plainReading = reconstructedVerse.join("").replace(/[〔〕]/g, "");
  for (const [phrase, reason] of HIGH_RISK_RECEIVED_PHRASES) {
    if (plainReading.includes(phrase)) {
      issues.push({ severity: "P0", message: `${prefix}: 发现“${phrase}” — ${reason}` });
    }
  }

  const openBrackets = (reconstructedVerse.join("").match(/〔/g) ?? []).length;
  const closeBrackets = (reconstructedVerse.join("").match(/〕/g) ?? []).length;
  if (openBrackets !== closeBrackets) {
    issues.push({ severity: "P0", message: `${prefix}: 校补标记〔〕不成对` });
  }

  if (transcription) {
    const target = reconstructedTokens(reconstructedVerse);
    const required = requiredSupplyIndexes(transcription, reconstructedVerse);
    const additionCharacters = new Set(
      (chapter?.zh?.additions ?? []).flatMap((addition) => Array.from(addition?.text ?? "").filter((character) => HANZI.test(character))),
    );
    const unmarked = required.filter((index) => {
      const token = target[index];
      return token && !token.marked && !additionCharacters.has(token.character);
    });
    if (unmarked.length) {
      const preview = unmarked.slice(0, 12).map((index) => target[index]?.character).filter(Boolean).join("");
      issues.push({
        severity: "P0",
        message: `${prefix}: 新增文字未标注来源${preview ? `（${preview}${unmarked.length > 12 ? "…" : ""}）` : ""}`,
      });
    }
  }

  return issues;
}
