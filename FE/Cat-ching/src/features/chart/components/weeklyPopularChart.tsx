import { useState } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { ResponsivePie } from "@nivo/pie";

import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import blueCat from "@/assets/blueCat.png";
import BlurText from "@/components/BlurText";
import { PieItem } from "@/types/chart";
import { useWeeklyPopularChart } from "@/features/chart/hooks/useWeeklyPopularChart";

const ChartSection = styled.div`
  ${tw`flex flex-col items-center justify-center w-full`}
`;

const ChartText = styled.div`
  ${tw`h-24 flex flex-col items-center justify-center`}
`;

const ChartWrapper = styled.div`
  ${tw`relative w-60 h-60 mt-6`}
`;

const InnerIcon = styled.div`
  ${tw`w-16 absolute top-1/2 left-1/2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2`}
`;

const ErrorText = styled.div`
  ${tw`mt-4 text-center`}
`;

const EmptyChartBox = styled.div`
  ${tw`w-60 h-60 mt-6 rounded-full flex items-center justify-center border`}
  border-color: ${colors.gray30};
  background-color: ${colors.gray20};
`;

// 기본 텍스트 (호버 안 됐을 때)
const DefaultChartText = ({
  totalCount,
  dateRangeText,
}: {
  totalCount: number;
  dateRangeText: string;
}) => (
  <>
    <Text color="gray60">총 {totalCount.toLocaleString()}명 조사</Text>
    <Text variant="2xl" weight="semibold">
      가장 인기 있는 회사/직무
    </Text>
    <Text variant="sm" weight="normal" color="gray60">
      {dateRangeText}
    </Text>
  </>
);

// 호버 텍스트
const HoverChartText = ({
  item,
  dateRangeText,
}: {
  item: PieItem;
  dateRangeText: string;
}) => (
  <>
    <Text variant="sm" color="gray60" tw="animate-fade-in-slow">
      {item.value.toLocaleString()}명 조사
    </Text>
    <Text variant="xl" tw="animate-fade-in-slow">
      {item.label}
    </Text>
    <BlurText
      text={item.job}
      delay={80}
      animateBy="letters"
      direction="top"
      className="text-2xl font-semibold text-[#0058CC]"
    />
    <Text variant="sm" weight="normal" color="gray60">
      {dateRangeText}
    </Text>
  </>
);

type PieChartProps = {
  pieData: PieItem[];
  hoverId: number | null;
  setHoverId: (value: number | null) => void;
};

const PieChart = ({ pieData, hoverId, setHoverId }: PieChartProps) => {
  return (
    <ResponsivePie
      data={pieData}
      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      innerRadius={0.55}
      padAngle={0.6}
      cornerRadius={3}
      activeOuterRadiusOffset={10}
      colors={({ data }) => data.color}
      enableArcLinkLabels={false}
      arcLabelsSkipAngle={0}
      arcLabel={(d) => `${d.value}명`}
      arcLabelsTextColor={(d) => (d.id === hoverId ? "#ffffff" : "transparent")}
      arcLabelsRadiusOffset={0.5}
      theme={{
        labels: {
          text: {
            fontSize: 18,
            fontWeight: 700,
          },
        },
      }}
      onMouseEnter={(d: any) => setHoverId(Number(d.id))}
      onMouseLeave={() => setHoverId(null)}
      tooltip={() => null}
    />
  );
};

export default function WeeklyPopularChart() {
  const {
    pieData,
    totalCount,
    dateRangeText,
    isLoading,
    isError,
    // refetch, // 나중에 필요하면 적용 (다시 불러오기)
  } = useWeeklyPopularChart();

  const [hoverId, setHoverId] = useState<number | null>(null);
  const hoveredItem = pieData.find((item) => item.id === hoverId);

  const isEmpty = !isLoading && !isError && pieData.length === 0;

  return (
    <ChartSection>
      <ChartText>
        {hoveredItem ? (
          <HoverChartText item={hoveredItem} dateRangeText={dateRangeText} />
        ) : (
          <DefaultChartText
            totalCount={totalCount}
            dateRangeText={dateRangeText}
          />
        )}
      </ChartText>

      <ChartWrapper>
        {isLoading ? (
          <EmptyChartBox>
            <Text color="gray60">불러오는 중...</Text>
          </EmptyChartBox>
        ) : isError ? (
          <EmptyChartBox>
            <ErrorText>
              <Text color="gray60">차트 데이터를 불러오지 못했어요.</Text>
            </ErrorText>
          </EmptyChartBox>
        ) : isEmpty ? (
          <EmptyChartBox>
            <Text color="gray60">표시할 데이터가 없어요.</Text>
          </EmptyChartBox>
        ) : (
          <>
            <PieChart
              pieData={pieData}
              hoverId={hoverId}
              setHoverId={setHoverId}
            />
            <InnerIcon>
              <img src={blueCat} alt="blue cat" />
            </InnerIcon>
          </>
        )}
      </ChartWrapper>
    </ChartSection>
  );
}
