import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import GradientText from "@/components/GradientText";
import SplitText from "@/components/SplitText";
import catQLogo from "@/assets/cat_q.png";
import catFLogo from "@/assets/cat_f.png";
import { useState, useEffect, useCallback } from "react";
import {
  detectCompany,
  onTabChange,
} from "@/features/scraper/hooks/companyDetect";

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
  const [company, setCompany] = useState<string | null>(null);
  const [currentSite, setCurrentSite] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const result = await detectCompany();
    setCurrentSite(result.site);
    setCompany(result.company);
  }, []);

  useEffect(() => {
    fetchData();
    const cleanup = onTabChange(() => {
      fetchData();
    });
    return cleanup;
  }, [fetchData]);

  const ui = {
    found: !!company,
    text: company ? "!" : "?",
    color: company ? "blue70" : "black",
    image: company ? catFLogo : catQLogo,
  } as const;

  return (
    <>
      <ContentArea>
        <Text variant="2xl" weight="extrabold" color={ui.color}>
          {ui.text}
        </Text>
        <CatImage src={ui.image} alt="Cat Logo" isFound={ui.found} />
        <Wrapper>
          {currentSite ? (
            <>
              <Text variant="xl">어떤 회사를 탐색할까요?</Text>
              {company ? (
                <SplitText
                  text={company}
                  delay={180}
                  className="text-2xl font-semibold text-[#0058CC] truncate block"
                />
              ) : (
                <GradientText
                  children="채용 공고 분석 중..."
                  className="text-2xl font-semibold "
                />
              )}
            </>
          ) : (
            <AlertMessage>지원하는 구직사이트에서 사용해주세요</AlertMessage>
          )}
        </Wrapper>
      </ContentArea>
    </>
  );
}
