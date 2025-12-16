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
  const showResult = useShowCompany(isLoading, company);

  const [companyValue, setCompanyValue] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  const companyState = (() => {
    if (isLoading) return "loading";
    if (!showResult) return "analyzing";
    if (!company) return "empty";
    return "ready";
  })();

  useEffect(() => {
    if (companyState !== "ready") {
      setCompanyValue(null);
      setIsAutoDetected(false);
      return;
    }

    setCompanyValue(company);
    setIsAutoDetected(true);
  }, [companyState, company]);

  const ui = {
    hasCompany: Boolean(companyValue),
    text: companyValue ? "!" : "?",
    color: companyValue ? "blue70" : "black",
    image: companyValue ? catFLogo : catQLogo,
  } as const;

  const startEdit = () => setIsEditing(true);
  const closeEdit = () => setIsEditing(false);

  const saveCompany = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      setCompanyValue(trimmed);
      setIsAutoDetected(false);
    }
    closeEdit();
  };

  const isEditableVisible =
    companyState === "empty" || companyState === "ready";

  const displayText = companyValue ?? "직접 입력해주세요";

  return (
    <>
      <ContentArea>
        <Text variant="2xl" weight="extrabold" color={ui.color}>
          {ui.text}
        </Text>
        <CatImage src={ui.image} alt="Cat Logo" isFound={ui.hasCompany} />
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

          {isEditableVisible && (
            <EditableText
              text={displayText}
              placeholder="회사 이름"
              isEditable={isEditing}
              skipAnimation={!isAutoDetected}
              onEdit={startEdit}
              onClose={closeEdit}
              onSave={saveCompany}
            />
          )}
        </Wrapper>
      </ContentArea>
    </>
  );
}
