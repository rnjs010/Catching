import { AnalysisSectionKey } from "@/stores/analysisStore";
import { SECTION_CONFIGS } from "./sectionConfig";

export function removeSectionTitle(
  text: string,
  sectionKey: AnalysisSectionKey
): string {
  if (!text) return text;

  const config = SECTION_CONFIGS.find((section) => section.key === sectionKey);
  if (!config) return text.trim();

  const lines = text.split("\n");
  const firstLine = lines[0].trim();

  // 마크다운 제목인지 확인
  if (!/^#+\s+/.test(firstLine)) {
    return text.trim();
  }

  const titleText = firstLine.replace(/^#+\s*/, "");

  const isMatched = config.titlePatterns.some((re) => re.test(titleText));
  if (!isMatched) return text.trim();

  return lines.slice(1).join("\n").trim();
}
