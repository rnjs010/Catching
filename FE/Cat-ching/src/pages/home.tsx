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

// export const Container = styled.div`
//   ${tw`w-full min-h-screen bg-white flex flex-col items-center justify-center font-sans`}
// `;

export const Container = styled.div`
  ${tw`w-full min-h-screen bg-white flex flex-col justify-between items-center`}
`;

export const Header = styled.div`
  ${tw`w-full max-w-md flex justify-between items-center px-4 py-3 sticky top-0 bg-white z-10`}
`;

export const Title = styled.h1`
  ${tw`text-lg font-bold`}
`;

export const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

export const SubText = styled.div`
  ${tw`text-center text-gray-500 text-sm mt-1`}
`;

export const MainTitle = styled.h2`
  ${tw`text-xl text-center mt-3 font-bold`}
`;

export const DateRange = styled.div`
  ${tw`text-center text-gray-400 text-xs mt-1`}
`;

export const LoginButton = styled.button`
  ${tw`mt-8 w-72 h-12 rounded-xl shadow-sm border flex items-center justify-center bg-white text-gray-700 font-medium gap-2`}
`;

export const Footer = styled.div`
  ${tw`w-full max-w-md flex justify-between text-gray-400 text-lg py-4 sticky bottom-0 bg-white z-10 border-t`}
`;

export const RowBox = styled.div`
  ${tw`flex justify-center text-gray-400`}
`;

// 차트 관련
export const ChartWrapper = styled.div`
  ${tw`relative w-60 h-60 mt-6`}
`;

export const InnerIcon = styled.div`
  ${tw`w-16 absolute top-1/2 left-1/2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2`}
`;

const MyPie = () => {
  const [hoverId, setHoverId] = useState(null);

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
  return (
    <Container>
      {/* HEADER */}
      <Header>
        <RxHamburgerMenu />
        <Title>Catching</Title>
        <IoBarChartOutline />
      </Header>

      <ContentArea>
        {/* TEXT */}
        <SubText>총 15,321명 조사</SubText>
        <MainTitle>가장 인기 있는 회사/직무</MainTitle>
        <DateRange>2025.09.08~2025.09.15</DateRange>

        {/* CHART */}
        <ChartWrapper>
          <MyPie />
          <InnerIcon>
            <img src={blueCat} alt="blue cat" />
          </InnerIcon>
        </ChartWrapper>

        {/* GOOGLE LOGIN */}
        <LoginButton>
          <FcGoogle />
          Google로 시작하기
        </LoginButton>
      </ContentArea>

      {/* FOOTER */}
      <Footer>
        <RowBox>
          <GoMail />
          <CiGlobe />
        </RowBox>
        <RowBox>
          <CiStar />
          <CiStar />
          <CiStar />
          <CiStar />
          <CiStar />
        </RowBox>
      </Footer>
    </Container>
  );
}
