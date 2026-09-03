export type ExtractedSection = {
  content: string;
  heading: string | null;
  level: number;
  locator: Record<string, number | string>;
  ordinal: number;
};

export function normalizeExtractedText(value: string) {
  return value
    .normalize("NFC")
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/[ \u00a0]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function looksLikeHeading(line: string) {
  const trimmed = line.trim();

  if (trimmed.length < 3 || trimmed.length > 120) return false;
  if (
    /^(cap[ií]tulo|parte|se[cç][aã]o|pref[aá]cio|introdu[cç][aã]o|conclus[aã]o)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  const letters = trimmed.replace(/[^\p{L}]/gu, "");
  return letters.length >= 3 && letters === letters.toLocaleUpperCase("pt-BR");
}

export function structureText(
  rawText: string,
  format: "docx" | "markdown" | "text",
): ExtractedSection[] {
  const text = normalizeExtractedText(rawText);
  if (!text) return [];

  const lines = text.split("\n");
  const sections: ExtractedSection[] = [];
  let heading: string | null = null;
  let level = 0;
  let content: string[] = [];
  let sectionStartLine = 1;

  function flush() {
    const sectionContent = normalizeExtractedText(content.join("\n"));
    if (!sectionContent && !heading) return;

    sections.push({
      content: sectionContent,
      heading,
      level,
      locator: { line_start: sectionStartLine },
      ordinal: sections.length,
    });
    content = [];
  }

  for (const [lineIndex, line] of lines.entries()) {
    const markdownHeading =
      format === "markdown" ? /^(#{1,6})\s+(.+)$/.exec(line.trim()) : null;
    const heuristicHeading = format !== "markdown" && looksLikeHeading(line);

    if (markdownHeading || heuristicHeading) {
      flush();
      heading = markdownHeading?.[2]?.trim() ?? line.trim();
      level = markdownHeading?.[1]?.length ?? 1;
      sectionStartLine = lineIndex + 1;
    } else {
      content.push(line);
    }
  }

  flush();

  if (sections.length === 0) {
    return [
      {
        content: text,
        heading: "Conteúdo completo",
        level: 0,
        locator: { line_start: 1 },
        ordinal: 0,
      },
    ];
  }

  return sections.slice(0, 1_000).map((section, ordinal) => ({
    ...section,
    locator: { ...section.locator, section: ordinal + 1 },
    ordinal,
  }));
}
