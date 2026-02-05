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

  const titleIndex = lines.findIndex((line) => {
    const trimmed = line.trim();

    if (!/^#+\s+/.test(trimmed)) return false;

    const titleText = trimmed.replace(/^#+\s*/, "");
    return config.titlePatterns.some((re) => re.test(titleText));
  });

  if (titleIndex === -1) {
    return text.trim();
  }

  return lines
    .slice(titleIndex + 1)
    .join("\n")
    .trim();
}
