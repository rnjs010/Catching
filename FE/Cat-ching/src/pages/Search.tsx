import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import GradientText from "@/components/GradientText";
import catQLogo from "@/assets/cat_q.png";
import catFLogo from "@/assets/cat_f.png";
import { useCompanyDetector } from "@/features/scraper/hooks/useCompanyDetector";
import { useShowCompany } from "@/features/scraper/hooks/useShowCompany";
import { EditableText } from "@/features/scraper/components/EditableText";
import { useEffect, useState } from "react";

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

export default function Search() {
  const { company, isLoading } = useCompanyDetector();

  const showCompany = useShowCompany(isLoading, company);

  const [companyValue, setCompanyValue] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [companyState, setCompanyState] = useState<
    "loading" | "analyzing" | "empty" | "ready"
  >("loading");

  useEffect(() => {
    if (isLoading) {
      setCompanyState("loading");
      return;
    }

    if (!showCompany) {
      setCompanyState("analyzing");
      return;
    }

    if (!company) {
      setCompanyState("empty");
      setCompanyValue("직접 입력해주세요");
      return;
    }

    setCompanyState("ready");
    setCompanyValue(company);
  }, [isLoading, showCompany, company]);

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
          {companyState === "loading" && (
            <GradientText className="text-2xl font-semibold">
              페이지 로딩중...
            </GradientText>
          )}

          {companyState === "analyzing" && (
            <GradientText className="text-2xl font-semibold">
              채용 공고 분석 중...
            </GradientText>
          )}

          {(companyState === "empty" || companyState === "ready") && (
            <EditableText
              text={companyValue}
              placeholder="회사 이름"
              isEditable={isEditing}
              skipAnimation={companyState === "empty"}
              onEdit={() => setIsEditing(true)}
              onCancel={() => setIsEditing(false)}
              onSave={(value) => {
                setCompanyValue(value);
                setIsEditing(false);
              }}
            />
          )}
        </Wrapper>
      </ContentArea>
    </>
  );
}
