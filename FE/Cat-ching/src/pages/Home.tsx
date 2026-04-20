import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { FcGoogle } from "react-icons/fc";
import { ResponsivePie } from "@nivo/pie";
import blueCat from "@/assets/blueCat.png";
import { useState } from "react";
import { PieItem } from "@/types/chart";
import BlurText from "@/components/BlurText";
import { useAuthStore } from "@/stores/authStore";
import { useWeeklyPopularChart } from "@/features/chart/hooks/useWeeklyPopularChart";

export const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

export const ChartText = styled.div`
  ${tw`h-24 flex flex-col items-center justify-center`}
`;

export const ChartWrapper = styled.div`
  ${tw`relative w-60 h-60 mt-6`}
`;

export const InnerIcon = styled.div`
  ${tw`w-16 absolute top-1/2 left-1/2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2`}
`;

export const LoginButton = styled.button`
  ${tw`mb-4 mt-16 w-11/12 rounded-xl shadow-lg border flex items-center justify-center gap-2 transition-opacity`}
  background-color: ${colors.blue10};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 차트 관련
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

type MyPieProps = {
  pieData: PieItem[];
  setHoverId: (value: number | null) => void;
  hoverId: number | null;
};

const MyPie = ({ pieData, setHoverId, hoverId }: MyPieProps) => {
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
      onMouseEnter={(d: any) => setHoverId(d.id)}
      onMouseLeave={() => setHoverId(null)}
      tooltip={() => null}
    />
  );
};

export default function Home() {
  const { login, isLoading } = useAuthStore();

  const {
    pieData,
    totalCount,
    dateRangeText,
    isLoading: isChartLoading,
    isError,
  } = useWeeklyPopularChart();

  const [hoverId, setHoverId] = useState<number | null>(null);
  const hoveredItem = pieData.find((item) => item.id === hoverId);

  const handleLogin = async () => {
    await login();
  };

  return (
    <>
      <ContentArea>
        {/* TEXT */}
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

        {/* CHART */}
        <ChartWrapper>
          <MyPie pieData={pieData} setHoverId={setHoverId} hoverId={hoverId} />
          <InnerIcon>
            <img src={blueCat} alt="blue cat" />
          </InnerIcon>
        </ChartWrapper>

        {/* GOOGLE LOGIN */}
        <LoginButton onClick={handleLogin} disabled={isLoading}>
          <FcGoogle size={24} />
          <Text variant="xl" color="gray90">
            {isLoading ? "로그인 중..." : "Google로 시작하기"}
          </Text>
        </LoginButton>
      </ContentArea>
    </>
  );
}
