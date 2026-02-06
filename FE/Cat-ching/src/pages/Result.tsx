import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import catLogo from "@/assets/cat_glass.png";
import { SiNotion } from "react-icons/si";
import { GrDocumentPdf } from "react-icons/gr";
import { FiCopy } from "react-icons/fi";
import PillButton from "@/components/PillButton";
import AlertPopup from "@/components/AlertPopup";
import { RESULT_SECTIONS } from "@/features/result/utils/sectionConfig";
import { ResultSection } from "@/features/result/components/resultSection";
import { useResultLifecycle } from "@/features/result/hooks/useResultLifecycle";

const PageLayout = styled.div`
  ${tw`relative flex flex-col flex-1 w-full items-center`}
`;

const QueryText = styled.div`
  ${tw`px-2 py-1 mb-2 rounded-lg self-end`}
  background-color: ${colors.blue70};
`;

const ResultCard = styled.div`
  ${tw`w-full flex flex-col rounded-lg border border-[#ECE9E9] shadow-md`}
  height: calc(100dvh - 170px);
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

const ButtonWrapper = styled.div`
  ${tw`flex justify-between pt-1.5 border-t`}
  border-color: ${colors.gray40};
`;

const LeftButtons = styled.div`
  ${tw`flex gap-2`}
`;

export default function Result() {
  const {
    company,
    position,
    sections,
    loadingStates,
    typingStates,
    open,
    toggleSection,
    handleExportNotion,
    handleExportPdf,
    popupConfig,
    closePopup,
    isNotionLoading,
    isPdfLoading,
  } = useResultLifecycle();

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
          {RESULT_SECTIONS.map((section) => (
            <ResultSection
              key={section.key}
              title={section.title}
              icon={section.icon as string}
              open={open[section.key]}
              onToggle={() => toggleSection(section.key)}
              content={sections[section.key]}
              isLoading={loadingStates[section.key]}
              isTyping={typingStates[section.key]}
            />
          ))}

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
        onClose={closePopup}
      />
    </PageLayout>
  );
}
