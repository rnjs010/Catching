interface ParsedSections {
  companySummary: string;
  companyIssue: string;
  positionMainBusiness: string;
  positionIssue: string;
}

/**
 * redis / database에서 내려오는
 * "하나의 마크다운"을 4개 섹션으로 분리
 */
export const parseMarkdownToSections = (markdown: string): ParsedSections => {
  const result: ParsedSections = {
    companySummary: "",
    companyIssue: "",
    positionMainBusiness: "",
    positionIssue: "",
  };

  const sections = markdown.split(/^## /gm);

  sections.forEach((section) => {
    if (section.startsWith("회사 기본정보")) {
      result.companySummary = section.replace("회사 기본정보", "").trim();
    }
    if (section.startsWith("회사 이슈")) {
      result.companyIssue = section.replace("회사 이슈", "").trim();
    }
    if (section.startsWith("직무의 메인 사업")) {
      result.positionMainBusiness = section
        .replace("직무의 메인 사업", "")
        .trim();
    }
    if (section.startsWith("직무 이슈")) {
      result.positionIssue = section.replace("직무 이슈", "").trim();
    }
  });

  return result;
};
