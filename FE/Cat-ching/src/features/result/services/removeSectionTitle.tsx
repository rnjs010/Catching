import { AnalysisSections } from "@/stores/analysisStore";

export const SECTION_TITLE_MATCHERS: Record<keyof AnalysisSections, RegExp[]> =
  {
    companySummary: [/기본\s*정보/],
    companyIssue: [/최근\s*이슈/],
    positionMainBusiness: [/조사\s*내용/],
    positionIssue: [/직무\s*관련\s*이슈/],
  };

export function removeSectionTitle(text: string, keywords: RegExp[]): string {
  if (!text) return text;

  const lines = text.split("\n");

  // 첫 줄이 섹션 제목이면 제거
  const firstLine = lines[0].trim();

  if (
    /^#+\s+/.test(firstLine) &&
    keywords.some((re) => re.test(firstLine.replace(/^#+\s*/, "")))
  ) {
    return lines.slice(1).join("\n").trim();
  }

  return text.trim();
}
