import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import catLogo from "@/assets/cat_glass.png";
import { useResultLifecycle } from "@/features/result/hooks/useResultLifecycle";
import ResultCardOnly from "@/features/result/components/resultCard";

const PageLayout = styled.div`
  ${tw`relative flex flex-col flex-1 w-full items-center`}
`;

const QueryText = styled.div`
  ${tw`px-2 py-1 mb-2 rounded-lg self-end`}
  background-color: ${colors.blue70};
`;

export default function Result() {
  const result = useResultLifecycle();

  return (
    <PageLayout>
      <img src={catLogo} alt="Cat Logo" className="w-10" />

      <QueryText>
        <Text variant="xs" color="gray10">
          {result.company}의 {result.position} 직무에 대해 검색해줘.
        </Text>
      </QueryText>

      <ResultCardOnly
        company={result.company}
        position={result.position}
        sections={result.sections}
        loadingStates={result.loadingStates}
        typingStates={result.typingStates}
        open={result.open}
        toggleSection={result.toggleSection}
        handleExportNotion={result.handleExportNotion}
        handleExportPdf={result.handleExportPdf}
        isNotionLoading={result.isNotionLoading}
        isPdfLoading={result.isPdfLoading}
        popupConfig={result.popupConfig}
        closePopup={result.closePopup}
      />
    </PageLayout>
  );
}
