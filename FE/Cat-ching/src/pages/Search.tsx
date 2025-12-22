import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import GradientText from "@/components/GradientText";
import catQLogo from "@/assets/cat_q.png";
import catFLogo from "@/assets/cat_f.png";
import { LuMousePointerClick } from "react-icons/lu";
import { TbCapture } from "react-icons/tb";
import { SearchIcon } from "lucide-react";
import { useCompanyDetector } from "@/features/scraper/hooks/useCompanyDetector";
import { useShowCompany } from "@/features/scraper/hooks/useShowCompany";
import { EditableText } from "@/features/scraper/components/EditableText";
import { useEffect, useState } from "react";

const PageLayout = styled.div`
  ${tw`relative flex flex-col flex-1 w-full items-center`}
`;

const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

// 회사 관련
const CompanySection = styled.div<{ lifted: boolean }>`
  ${tw`flex flex-col items-center justify-center text-center transition-transform duration-1000 ease-out`}
`;

const CatImage = styled.img<{ isFound: boolean }>`
  ${tw`h-16 w-16 transition-transform duration-500 ease-in-out mx-auto mt-0 mb-4`}
  transform: rotate(${({ isFound }) => (isFound ? 0 : 15)}deg);
`;

const Wrapper = styled.div`
  ${tw`flex flex-col items-center gap-2`}
`;

// 직무 관련
const JobSection = styled.div<{ visible: boolean }>`
  ${({ visible }) =>
    visible
      ? tw`mt-12 opacity-100 translate-y-0 max-h-[600px]`
      : tw`opacity-0 translate-y-16 max-h-0 overflow-hidden`}

  ${tw`transition-[max-height,opacity,transform] duration-[2s] ease-out
    flex flex-col items-center`}
`;

const CaptureButton = styled.button`
  ${tw`w-16 h-16 p-2 my-4 rounded-full shadow-custom flex items-center justify-center text-blue-500 bg-blue-50`}
`;

const ModeToggleButton = styled.button`
  ${tw`px-2 py-1.5 rounded-full bg-gray-100 underline`}
`;

// 하단 검색 버튼
const SearchButton = styled.button<{ isActive: boolean }>`
  ${tw`w-10/12 px-2 py-2 rounded-xl shadow-custom flex flex-row justify-center items-center gap-1
    sticky bottom-0 transition-colors duration-300`}

  ${({ isActive }) =>
    isActive
      ? tw`bg-[#0065FF] cursor-pointer`
      : tw`bg-[#C9C9C9] cursor-not-allowed`}
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

  // 직무 관련
  type JobInputMode = "capture" | "drag";
  const [jobMode, setJobMode] = useState<JobInputMode>("capture");

  return (
    <PageLayout>
      <ContentArea>
        <CompanySection lifted={!!companyValue}>
          <Text variant="2xl" weight="extrabold" color={ui.color}>
            {ui.text}
          </Text>
          <CatImage src={ui.image} alt="Cat Logo" isFound={ui.hasCompany} />
          <Wrapper>
            <Text variant="xl">어떤 회사를 탐색할까요?</Text>

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
        </CompanySection>

        <JobSection visible={!!companyValue}>
          <Text variant="xl">어떤 직무에 지원할 예정인가요?</Text>

          <Text variant="sm" weight="light" color="blue80">
            {jobMode === "capture"
              ? "(직무를 캡쳐하세요)"
              : "(직무를 드래그하세요)"}
          </Text>

          <CaptureButton onClick={() => {}}>
            {jobMode === "capture" ? (
              <TbCapture size={28} />
            ) : (
              <LuMousePointerClick size={28} />
            )}
          </CaptureButton>

          <ModeToggleButton
            onClick={() =>
              setJobMode((prev) => (prev === "capture" ? "drag" : "capture"))
            }
          >
            <Text variant="xs" color="gray80">
              {jobMode === "capture" ? "드래그로 변경" : "캡쳐로 변경"}
            </Text>
          </ModeToggleButton>
        </JobSection>
      </ContentArea>

      <SearchButton isActive={!!companyValue} disabled={!!companyValue}>
        <SearchIcon size={24} color="white" />
        <Text weight="semibold" color="gray10">
          탐색하기
        </Text>
      </SearchButton>
    </PageLayout>
  );
}
