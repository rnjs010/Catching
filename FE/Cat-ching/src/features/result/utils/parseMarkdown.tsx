import { AnalysisSections } from "@/stores/analysisStore";
import { SECTION_CONFIGS } from "./sectionConfig";

export function parseMarkdownToSections(markdown: string): AnalysisSections {
  const result = SECTION_CONFIGS.reduce((acc, section) => {
    acc[section.key] = "";
    return acc;
  }, {} as AnalysisSections);

  const lines = markdown.split("\n");
  let currentSection: keyof AnalysisSections | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // 제목 확인
    if (/^#+\s+/.test(trimmed)) {
      const titleText = trimmed.replace(/^#+\s*/, "");

      const matchedSection = SECTION_CONFIGS.find((section) =>
        section.titlePatterns.some((re) => re.test(titleText))
      );

      if (matchedSection) {
        currentSection = matchedSection.key;
        continue; // 제목 제거
      }
    }

    if (currentSection) {
      result[currentSection] += line + "\n";
    }
  }

  // 후처리
  Object.keys(result).forEach((key) => {
    result[key as keyof AnalysisSections] =
      result[key as keyof AnalysisSections].trim();
  });

  return result;
}
