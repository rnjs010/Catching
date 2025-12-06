import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import GradientText from "@/components/GradientText";
import SplitText from "@/components/SplitText";
import catQLogo from "@/assets/cat_q.png";
import catFLogo from "@/assets/cat_f.png";
import { useCompanyDetector } from "@/features/scraper/hooks/useCompanyDetector";
import { useShowCompany } from "@/features/scraper/hooks/useShowCompany";

const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

const CatImage = styled.img<{ isFound: boolean }>`
  ${tw`h-16 w-16 transition-transform duration-500 ease-in-out mx-auto mt-0 mb-4`}
  transform: rotate(${({ isFound }) => (isFound ? 0 : 15)}deg);
`;

const Wrapper = styled.div`
  ${tw`h-32 flex flex-col items-center gap-2`}
`;

const AlertMessage = styled.p`
  ${tw`text-sm font-extrabold text-red-600 bg-red-100 p-3 rounded-lg border border-red-300`}
`;

export default function Search() {
  const { company, currentSite, isLoading } = useCompanyDetector();

  const showCompany = useShowCompany(isLoading, company);
  const shouldShowAlert = !isLoading && !currentSite;

  const ui = {
    found: !!showCompany,
    text: showCompany ? "!" : "?",
    color: showCompany ? "blue70" : "black",
    image: showCompany ? catFLogo : catQLogo,
  } as const;

  return (
    <>
      <ContentArea>
        <Text variant="2xl" weight="extrabold" color={ui.color}>
          {ui.text}
        </Text>
        <CatImage src={ui.image} alt="Cat Logo" isFound={ui.found} />
        <Wrapper>
          {/* 1. 사이트 없음 */}
          {shouldShowAlert ? (
            <AlertMessage>지원하는 구직사이트에서 사용해주세요</AlertMessage>
          ) : /* 2. 로딩 중 */
          isLoading ? (
            <GradientText className="text-2xl font-semibold">
              페이지 로딩중...
            </GradientText>
          ) : /* 3. 사이트 있음 + 로딩 끝 */
          !showCompany ? (
            <GradientText className="text-2xl font-semibold">
              채용 공고 분석 중...
            </GradientText>
          ) : (
            <SplitText
              text={company!}
              delay={180}
              className="text-2xl font-semibold text-[#0058CC] truncate block"
            />
          )}
        </Wrapper>
      </ContentArea>
    </>
  );
}
