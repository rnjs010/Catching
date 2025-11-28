import tw from "twin.macro";
import styled from "styled-components";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoBarChartOutline } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { GoMail } from "react-icons/go";
import { CiGlobe } from "react-icons/ci";
import { CiStar } from "react-icons/ci";
import { ResponsivePie } from "@nivo/pie";
import { useState } from "react";
import blueCat from "@/assets/blueCat.png";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";

export const Container = styled.div`
  ${tw`w-full min-h-screen flex flex-col justify-between items-center`}
`;

export const Header = styled.div`
  ${tw`w-full max-w-xl flex justify-between items-center px-4 py-3 sticky top-0 z-10`}
  background-color: ${colors.gray10};
`;

export const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

export const ChartText = styled.div`
  ${tw`h-24 flex flex-col items-center justify-center mt-6`}
`;

export const LoginButton = styled.button`
  ${tw`my-8 w-11/12 max-w-xl rounded-xl shadow-lg border flex items-center justify-center gap-2`}
  background-color: ${colors.blue10};
`;

export const Footer = styled.div`
  ${tw`w-11/12 max-w-xl flex justify-between py-4 sticky bottom-0 z-10 border-t`}
  background-color: ${colors.gray10};
`;

export const RowBox = styled.div<{ gap?: string }>`
  ${tw`flex justify-center`}
  color: ${colors.gray40};
  ${({ gap }) => gap && `gap: ${gap};`}
`;

// 차트 관련
export const ChartWrapper = styled.div`
  ${tw`relative w-60 h-60 mt-6`}
`;

export const InnerIcon = styled.div`
  ${tw`w-16 absolute top-1/2 left-1/2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2`}
`;

type PieItem = {
  id: number;
  label: string;
  job: string;
  value: number;
  color: string;
};

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
    <Container>
      {/* HEADER */}
      <Header>
        <RxHamburgerMenu size={24} />
        <Text variant="xl" weight="normal">
          <Text color="blue80">C</Text>at-ching
        </Text>
        <IoBarChartOutline size={24} />
      </Header>

      <ContentArea>
        {/* TEXT */}
        <ChartText>
          {hoveredItem ? (
            <>
              <Text variant="sm" color="gray60">
                {hoveredItem.value}명 조사
              </Text>
              <Text variant="xl">{hoveredItem.label}</Text>
              <Text variant="2xl" weight="semibold" color="blue80">
                {hoveredItem.job}
              </Text>
              <Text variant="sm" weight="normal" color="gray60">
                2025.09.08~2025.09.15
              </Text>
            </>
          ) : (
            <>
              <Text color="gray60">총 15,321명 조사</Text>
              <Text variant="2xl" weight="semibold">
                가장 인기 있는 회사/직무
              </Text>
              <Text variant="sm" weight="normal" color="gray60">
                2025.09.08~2025.09.15
              </Text>
            </>
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

      {/* FOOTER */}
      <Footer>
        <RowBox gap="4px">
          <GoMail size={20} />
          <CiGlobe size={20} />
        </RowBox>
        <RowBox>
          <CiStar size={20} />
          <CiStar size={20} />
          <CiStar size={20} />
          <CiStar size={20} />
          <CiStar size={20} />
        </RowBox>
      </Footer>
    </Container>
  );
}
