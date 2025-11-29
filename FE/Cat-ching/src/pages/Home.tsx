import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { FcGoogle } from "react-icons/fc";
import { ResponsivePie } from "@nivo/pie";
import blueCat from "@/assets/blueCat.png";
import { useState } from "react";
import { PieItem } from "@/types/chart.type";
import BlurText from "@/components/BlurText";

export const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

export const ChartText = styled.div`
  ${tw`h-24 flex flex-col items-center justify-center mt-6`}
`;

export const ChartWrapper = styled.div`
  ${tw`relative w-60 h-60 mt-6`}
`;

export const InnerIcon = styled.div`
  ${tw`w-16 absolute top-1/2 left-1/2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2`}
`;

export const LoginButton = styled.button`
  ${tw`my-8 w-11/12 rounded-xl shadow-lg border flex items-center justify-center gap-2`}
  background-color: ${colors.blue10};
`;

// Text Animation
const handleAnimationComplete = () => {
  console.log("Animation completed!");
};

// 차트 관련
const DefaultChartText = () => (
  <>
    <Text color="gray60">총 15,321명 조사</Text>
    <Text variant="2xl" weight="semibold">
      가장 인기 있는 회사/직무
    </Text>
    <Text variant="sm" weight="normal" color="gray60">
      2025.09.08~2025.09.15
    </Text>
  </>
);

const HoverChartText = ({ item }: { item: PieItem }) => (
  <>
    <Text variant="sm" color="gray60" tw="animate-fade-in-slow">
      {item.value}명 조사
    </Text>
    <Text variant="xl" tw="animate-fade-in-slow">
      {item.label}
    </Text>
    <BlurText
      text={item.job}
      delay={80}
      animateBy="letters"
      direction="top"
      onAnimationComplete={handleAnimationComplete}
      className="text-2xl font-semibold text-[#0058CC]"
    />
    <Text variant="sm" weight="normal" color="gray60">
      2025.09.08~2025.09.15
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
  // 임시 데이터
  const pieData = [
    {
      id: 1,
      label: "삼성 SDS",
      job: "SW 개발/설계",
      value: 40,
      color: "#003f98",
    },
    {
      id: 2,
      label: "현대오토에버",
      job: "백엔드 개발자",
      value: 25,
      color: "#0057ff",
    },
    {
      id: 3,
      label: "회사C",
      job: "데이터 분석가",
      value: 15,
      color: "#61a4ff",
    },
    { id: 4, label: "회사D", job: "마케팅", value: 12, color: "#cfe3ff" },
    { id: 5, label: "회사E", job: "인사/총무", value: 8, color: "#001c57" },
  ];

  const [hoverId, setHoverId] = useState<number | null>(null);
  const hoveredItem = pieData.find((item) => item.id === hoverId);

  return (
    <>
      <ContentArea>
        {/* TEXT */}
        <ChartText>
          {hoveredItem ? (
            <HoverChartText item={hoveredItem} />
          ) : (
            <DefaultChartText />
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
        <LoginButton>
          <FcGoogle size={24} />
          <Text variant="xl" color="gray90">
            Google로 시작하기
          </Text>
        </LoginButton>
      </ContentArea>
    </>
  );
}
