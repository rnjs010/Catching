import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { SearchIcon } from "lucide-react";
import { useCompanyDetector } from "@/features/scraper/hooks/useCompanyDetector";
import { useShowCompany } from "@/features/scraper/hooks/useShowCompany";
import CompanySection from "@/features/scraper/components/CompanySection";
import JobSection from "@/features/scraper/components/JobSection";
import { useEffect, useState } from "react";

const PageLayout = styled.div`
  ${tw`relative flex flex-col flex-1 w-full items-center`}
`;

const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

const SearchButton = styled.button<{ isActive: boolean }>`
  ${tw`w-11/12 px-2 py-2 rounded-xl shadow-custom flex flex-row justify-center items-center gap-1
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

  // 직무 관련
  type JobInputMode = "capture" | "drag";
  const [jobMode, setJobMode] = useState<JobInputMode>("capture");

  return (
    <PageLayout>
      <ContentArea>
        <CompanySection
          companyValue={companyValue}
          companyState={companyState}
          isEditing={isEditing}
          isAutoDetected={isAutoDetected}
          onEdit={startEdit}
          onClose={closeEdit}
          onSave={saveCompany}
        />

        <JobSection
          visible={!!companyValue}
          mode={jobMode}
          onModeToggle={() =>
            setJobMode((prev) => (prev === "capture" ? "drag" : "capture"))
          }
          onCaptureClick={() => {
            // 나중에 OCR / Drag 이벤트 연결
          }}
        />
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
