import { AnalysisSections } from "@/stores/analysisStore";

type SectionKey = keyof AnalysisSections;

const SECTION_KEYWORDS: {
  key: SectionKey;
  match: RegExp;
}[] = [
  { key: "companySummary", match: /기본\s*정보/ },
  { key: "companyIssue", match: /최근\s*이슈/ },
  { key: "positionMainBusiness", match: /조사\s*내용/ },
  { key: "positionIssue", match: /직무\s*관련\s*이슈/ },
];

export const parseMarkdownToSections = (markdown: string): AnalysisSections => {
  const result: AnalysisSections = {
    companySummary: "",
    companyIssue: "",
    positionMainBusiness: "",
    positionIssue: "",
  };

  const lines = markdown.split("\n");
  let currentSection: SectionKey | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // 제목 후보 (#, ##, ### ...)
    if (/^#+\s+/.test(trimmed)) {
      const title = trimmed.replace(/^#+\s*/, "");

      const matched = SECTION_KEYWORDS.find(({ match }) => match.test(title));

      if (matched) {
        currentSection = matched.key;
        continue; // 제목 줄 자체는 내용에 넣지 않음
      }
    }

    // 현재 섹션이 정해져 있으면 내용 추가
    if (currentSection) {
      result[currentSection] += line + "\n";
    }
  }

  // 후처리 (양쪽 공백 제거)
  (Object.keys(result) as SectionKey[]).forEach((key) => {
    result[key] = result[key].trim();
  });

  return result;
};
