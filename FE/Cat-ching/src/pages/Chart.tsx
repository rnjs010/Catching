import styled, { keyframes } from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import WeeklyPopularChart from "@/features/chart/components/WeeklyPopularChart";
import { useDetailResult } from "@/features/chart/hooks/useDetailResult";
import ResultCardOnly from "@/features/result/components/resultCard";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { colors } from "@/styles/colors";
import { useEffect, useRef, useState } from "react";
import { PieItem } from "@/types/chart";

const PAGE_MIN_HEIGHT = "calc(100dvh - 85px)";

const ContentArea = styled.div`
  ${tw`w-full`}
`;

const ChartViewport = styled.section`
  ${tw`w-full flex flex-col items-center justify-center`}
  min-height: ${PAGE_MIN_HEIGHT};
`;

const GuideWrapper = styled.button`
  ${tw`mt-6 flex flex-col items-center justify-center bg-transparent border-none cursor-pointer`}
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
    opacity: 0.9;
  }
  50% {
    transform: translateY(6px);
    opacity: 0.5;
  }
`;

const ArrowWrapper = styled.div`
  ${tw`mt-1 flex items-center justify-center`}
  color: ${colors.blue80};
  animation: ${bounce} 1.4s infinite ease-in-out;
`;

const DetailSection = styled.section`
  ${tw`w-full flex flex-col`}
  min-height: ${PAGE_MIN_HEIGHT};
`;

const DetailHeader = styled.div`
  ${tw`w-full flex items-center justify-between sticky top-0 z-10 py-2 my-2`}
  background-color: ${colors.gray10};
`;

const ActionButton = styled.button`
  ${tw`px-3 py-1 rounded-lg border text-sm cursor-pointer flex items-center gap-1`}
  border-color: ${colors.gray40};
  background-color: ${colors.gray10};
`;

export default function Chart() {
  const [detailTarget, setDetailTarget] = useState<PieItem | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);

  const handleSliceClick = (item: PieItem) => {
    setDetailTarget(item);
  };

  // 상세 api 호출
  const result = useDetailResult(detailTarget?.id ?? null);

  useEffect(() => {
    if (!detailTarget) return;

    const timeout = window.setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [detailTarget]);

  const handleScrollToDetail = () => {
    if (!detailTarget) return;

    detailRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <ContentArea>
      <ChartViewport>
        <WeeklyPopularChart onSliceClick={handleSliceClick} />

        <GuideWrapper
          type="button"
          onClick={handleScrollToDetail}
          disabled={!detailTarget}
        >
          <Text variant="sm" color="gray60">
            {detailTarget
              ? `${detailTarget.label} - ${detailTarget.job} 직무의 상세 결과가 아래에 있어요`
              : "조각을 클릭하면 아래에서 상세 결과를 확인할 수 있어요"}
          </Text>
          <ArrowWrapper>
            <MdKeyboardArrowDown size={26} />
          </ArrowWrapper>
        </GuideWrapper>
      </ChartViewport>

      {detailTarget && (
        <DetailSection ref={detailRef}>
          <DetailHeader>
            <ActionButton type="button" onClick={handleScrollToTop}>
              <MdKeyboardArrowUp size={18} />
              위로 돌아가기
            </ActionButton>
          </DetailHeader>

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
        </DetailSection>
      )}
    </ContentArea>
  );
}
