import { AnalysisSectionKey } from "@/stores/analysisStore";
import { ReactNode } from "react";

// 섹션 별 제목 패턴 정의
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

// 결과 페이지 섹션 설정
export type ResultSectionConfig = {
  key: AnalysisSectionKey;
  title: string;
  icon: ReactNode;
};

export const RESULT_SECTIONS: ResultSectionConfig[] = [
  {
    key: "companySummary",
    title: "기본 정보",
    icon: "🏢",
  },
  {
    key: "companyIssue",
    title: "최신 주요 이슈",
    icon: "📌",
  },
  {
    key: "positionMainBusiness",
    title: "핵심 사업",
    icon: "🔧",
  },
  {
    key: "positionIssue",
    title: "직무 이슈",
    icon: "🎯",
  },
];
