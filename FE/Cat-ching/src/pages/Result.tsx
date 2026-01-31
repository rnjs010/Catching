import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import catLogo from "@/assets/cat_glass.png";
import { ChevronDown, ChevronRight, Pin } from "lucide-react";
import { SiNotion } from "react-icons/si";
import { GrDocumentPdf } from "react-icons/gr";
import { FiCopy } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useAnalysisInputStore } from "@/stores/analysisInputStore";
import { useAnalysisSSE } from "@/features/result/hooks/useAnalysis";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useAuthStore } from "@/stores/authStore";
import { MarkdownRender } from "@/features/result/services/markdownRender";
import PillButton from "@/components/PillButton";
import AlertPopup from "@/components/AlertPopup";
import { notionService } from "@/services/notionService";
import { exportService } from "@/services/exportService";

const PageLayout = styled.div`
  ${tw`relative flex flex-col flex-1 w-full items-center`}
`;

const QueryText = styled.div`
  ${tw`px-2 py-1 mb-2 rounded-lg self-end`}
  background-color: ${colors.blue70};
`;

const ResultCard = styled.div`
  ${tw`w-full h-[480px] flex flex-col rounded-lg border border-[#ECE9E9] shadow-md`}
`;

const JobTitle = styled.div`
  ${tw`p-2 rounded-t-lg bg-[#E0EEFF]`}
`;

const ScrollArea = styled.div`
  ${tw`flex-1 overflow-y-auto space-y-3 p-2 rounded-b-lg bg-[#FBFAFA]`}

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SectionWrapper = styled.div`
  ${tw`space-y-2`}
`;

const SectionHeader = styled.button`
  ${tw`w-full flex items-center justify-between p-1 rounded-lg bg-[#B3D4FF]`}
  background-color: ${colors.blue40};
`;

const SectionContent = styled.div<{ $open: boolean }>`
  ${tw`px-1.5 overflow-hidden transition-all duration-300`};

  max-height: ${({ $open }) => ($open ? "2000px" : "0")};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
`;

const TypingIndicator = ({ text = "AI 분석 중..." }: { text?: string }) => (
  <div className="flex items-center gap-1 text-gray-400 mt-2">
    <span>{text}</span>
    <BlinkCursor />
  </div>
);

const BlinkCursor = styled.span`
  animation: blink 1s step-end infinite;
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
`;

const ButtonWrapper = styled.div`
  ${tw`flex justify-between pt-1.5 border-t`}
  border-color: ${colors.gray40};
`;

const LeftButtons = styled.div`
  ${tw`flex gap-2`}
`;

export default function Result() {
  const [token, setToken] = useState<string | null>(null);
  const { company, position } = useAnalysisInputStore();
  const { start, stop } = useAnalysisSSE();
  const { sections, loadingStates, typingStates, isComplete, analysisId } =
    useAnalysisStore();

  const [open, setOpen] = useState({
    basic: true,
    issue: true,
    business: true,
    positionIssue: true,
  });

  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: "",
  });

  const [isNotionLoading, setIsNotionLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleExportNotion = async () => {
    if (!analysisId || isNotionLoading) return;
    setIsNotionLoading(true);
    try {
      await notionService.exportToNotion(analysisId);
      setPopupConfig({
        isOpen: true,
        message: "Notion에 성공적으로 추가되었습니다.",
      });
    } catch (error) {
      console.error("Notion export failed:", error);
      setPopupConfig({
        isOpen: true,
        message: "Notion 추가에 실패했습니다. 연동 상태를 확인해주세요.",
      });
    } finally {
      setIsNotionLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!analysisId || isPdfLoading) return;
    setIsPdfLoading(true);
    try {
      await exportService.downloadAnalysisPdf(analysisId, company, position);
      setPopupConfig({
        isOpen: true,
        message: "PDF 파일이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      setPopupConfig({
        isOpen: true,
        message: "PDF 저장에 실패했습니다.",
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const t = await useAuthStore.getState().getToken();
      setToken(t);
    })();
  }, []);

  useEffect(() => {
    if (!company || !position || !token || isComplete) return;
    console.log("Starting analysis SSE...", { company, position, token });

    setOpen({
      basic: true,
      issue: true,
      business: true,
      positionIssue: true,
    });

    start({
      company,
      position,
      today: new Date().toISOString().slice(0, 10),
      analysisDepth: "NORMAL",
      token,
    });

    return () => stop();
  }, [company, position, token]);

  useEffect(() => {
    if (!isComplete) return;

    setOpen({
      basic: false,
      issue: true,
      business: false,
      positionIssue: false,
    });
  }, [isComplete]);

  return (
    <PageLayout>
      <img src={catLogo} alt="Cat Logo" className="w-10" />

      <QueryText>
        <Text variant="xs" color="gray10">
          {company}의 {position} 직무에 대해 검색해줘.
        </Text>
      </QueryText>

      <ResultCard>
        <JobTitle>
          <Text variant="sm" color="gray80">
            🔎 {company} {position} 직무
          </Text>
        </JobTitle>

        {/* 스크롤 영역 */}
        <ScrollArea>
          {/* 기본 정보 */}
          <SectionWrapper>
            <SectionHeader
              onClick={() => setOpen((p) => ({ ...p, basic: !p.basic }))}
            >
              <Text variant="base" color="gray95">
                🏢 기본 정보
              </Text>
              {open.basic ? <ChevronDown /> : <ChevronRight />}
            </SectionHeader>

            <SectionContent $open={open.basic}>
              {sections.companySummary && (
                // <Text variant="sm">{sections.companySummary}</Text>
                <MarkdownRender text={sections.companySummary} />
              )}

              {loadingStates.companySummary && <TypingIndicator />}
              {typingStates.companySummary && (
                <TypingIndicator text="입력 중..." />
              )}
            </SectionContent>
          </SectionWrapper>

          {/* 최신 주요 이슈 */}
          <SectionWrapper>
            <SectionHeader
              onClick={() => setOpen((p) => ({ ...p, issue: !p.issue }))}
            >
              <Text variant="base" color="gray95">
                📌 최신 주요 이슈
              </Text>
              {open.issue ? <ChevronDown /> : <ChevronRight />}
            </SectionHeader>

            <SectionContent $open={open.issue}>
              {sections.companyIssue && (
                // <Text variant="sm">{sections.companyIssue}</Text>
                <MarkdownRender text={sections.companyIssue} />
              )}

              {loadingStates.companyIssue && <TypingIndicator />}
              {typingStates.companyIssue && (
                <TypingIndicator text="입력 중..." />
              )}
            </SectionContent>
          </SectionWrapper>

          {/* 핵심 사업 */}
          <SectionWrapper>
            <SectionHeader
              onClick={() => setOpen((p) => ({ ...p, business: !p.business }))}
            >
              <Text variant="base" color="gray95">
                🔧 핵심 사업
              </Text>
              {open.business ? <ChevronDown /> : <ChevronRight />}
            </SectionHeader>

            <SectionContent $open={open.business}>
              {sections.positionMainBusiness && (
                // <Text variant="sm">{sections.positionMainBusiness}</Text>
                <MarkdownRender text={sections.positionMainBusiness} />
              )}

              {loadingStates.positionMainBusiness && <TypingIndicator />}
              {typingStates.positionMainBusiness && (
                <TypingIndicator text="입력 중..." />
              )}
            </SectionContent>
          </SectionWrapper>

          {/* 직무 이슈 */}
          <SectionWrapper>
            <SectionHeader
              onClick={() =>
                setOpen((p) => ({ ...p, positionIssue: !p.positionIssue }))
              }
            >
              <Text variant="base" color="gray95">
                🎯 직무 이슈
              </Text>
              {open.positionIssue ? <ChevronDown /> : <ChevronRight />}
            </SectionHeader>

            <SectionContent $open={open.positionIssue}>
              {sections.positionIssue && (
                // <Text variant="sm">{sections.positionIssue}</Text>
                <MarkdownRender text={sections.positionIssue} />
              )}

              {loadingStates.positionIssue && <TypingIndicator />}
              {typingStates.positionIssue && (
                <TypingIndicator text="입력 중..." />
              )}
            </SectionContent>
          </SectionWrapper>

          {/* 하단 버튼 */}
          <ButtonWrapper>
            <LeftButtons>
              <PillButton
                text="Notion에 추가"
                icon={<SiNotion size={12} />}
                borderColor="blue90"
                onClick={handleExportNotion}
                disabled={isNotionLoading}
              />
              <PillButton
                text="PDF로 저장"
                icon={<GrDocumentPdf size={12} />}
                borderColor="red"
                onClick={handleExportPdf}
                disabled={isPdfLoading}
              />
            </LeftButtons>
            <PillButton icon={<FiCopy size={16} />} borderColor="gray60" />
          </ButtonWrapper>
        </ScrollArea>
      </ResultCard>
      <AlertPopup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        onConfirm={popupConfig.onConfirm}
        onClose={() => setPopupConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </PageLayout>
  );
}
