import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { SiNotion } from "react-icons/si";
import { GrDocumentPdf } from "react-icons/gr";
import { FiCopy } from "react-icons/fi";
import PillButton from "@/components/PillButton";
import AlertPopup from "@/components/AlertPopup";
import { RESULT_SECTIONS } from "@/features/result/utils/sectionConfig";
import { ResultSection } from "@/features/result/components/resultSection";
import { AnalysisSectionKey } from "@/stores/analysisStore";

const CardWrapper = styled.div`
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
  ${tw`flex justify-between p-2 border-t bg-[#FBFAFA] shrink-0`}
  border-color: ${colors.gray40};
`;

const LeftButtons = styled.div`
  ${tw`flex gap-2`}
`;

type ResultCardOnlyProps = {
  company: string;
  position: string;
  sections: Record<AnalysisSectionKey, string>;
  loadingStates: Record<AnalysisSectionKey, boolean>;
  typingStates: Record<AnalysisSectionKey, boolean>;
  open: Record<AnalysisSectionKey, boolean>;
  toggleSection: (key: AnalysisSectionKey) => void;
  handleExportNotion: () => Promise<void>;
  handleExportPdf: () => Promise<void>;
  isNotionLoading: boolean;
  isPdfLoading: boolean;
  popupConfig: {
    isOpen: boolean;
    message: string;
    onConfirm?: () => void;
  };
  closePopup: () => void;
};

export default function ResultCardOnly({
  company,
  position,
  sections,
  loadingStates,
  typingStates,
  open,
  toggleSection,
  handleExportNotion,
  handleExportPdf,
  isNotionLoading,
  isPdfLoading,
  popupConfig,
  closePopup,
}: ResultCardOnlyProps) {
  return (
    <>
      <CardWrapper>
        <JobTitle>
          <Text variant="sm" color="gray80">
            🔎 {company} {position} 직무
          </Text>
        </JobTitle>

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
        </ScrollArea>

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
      </CardWrapper>

      <AlertPopup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        onConfirm={popupConfig.onConfirm}
        onClose={closePopup}
      />
    </>
  );
}
