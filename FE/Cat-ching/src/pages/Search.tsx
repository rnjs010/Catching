import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { SearchIcon } from "lucide-react";
import CompanySection from "@/features/search/components/CompanySection";
import JobSection from "@/features/search/components/JobSection";
import { useCompanyDetector } from "@/features/search/hooks/useCompanyDetector";
import { useShowCompany } from "@/features/search/hooks/useShowCompany";
import { useAppStore } from "@/stores/appStore";
import { useJobInputStore } from "@/stores/jobStore";
import { useAnalysisInputStore } from "@/stores/analysisInputStore";
import { useAnalysisStore } from "@/stores/analysisStore";
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
  const { job, reset } = useJobInputStore();
  useEffect(() => {
    reset();
    useAnalysisInputStore.getState().reset();
    useAnalysisStore.getState().reset();
  }, []);

  useEffect(() => {
    if (!isAutoDetected) return;
    reset();
  }, [isAutoDetected]);

  // 페이지 이동
  const { navigate } = useAppStore();
  const { setInput } = useAnalysisInputStore();

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

        <JobSection visible={!!companyValue} />
      </ContentArea>

      <SearchButton
        isActive={!!companyValue && !!job}
        disabled={!(!!companyValue && !!job)}
        onClick={() => {
          if (!companyValue || !job) return;
          setInput({ company: companyValue, position: job });
          navigate("analysis");
        }}
      >
        <SearchIcon size={24} color="white" />
        <Text weight="semibold" color="gray10">
          탐색하기
        </Text>
      </SearchButton>
    </PageLayout>
  );
}
