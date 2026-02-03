import { AnalysisSectionKey } from "@/stores/analysisStore";

export type SectionConfig = {
  key: AnalysisSectionKey;
  titlePatterns: RegExp[];
};

export const SECTION_CONFIGS: SectionConfig[] = [
  {
    key: "companySummary",
    titlePatterns: [/기본\s*정보/],
  },
  {
    key: "companyIssue",
    titlePatterns: [/최근\s*이슈/],
  },
  {
    key: "positionMainBusiness",
    titlePatterns: [/조사\s*내용/],
  },
  {
    key: "positionIssue",
    titlePatterns: [/직무\s*관련\s*이슈/],
  },
];
