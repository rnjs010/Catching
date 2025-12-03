import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import {
  detectCompany,
  onTabChange,
} from "@/features/scraper/hooks/companyDetect";
import styled from "styled-components";
import tw from "twin.macro";
import catQLogo from "@/assets/cat_q.png";
import catFLogo from "@/assets/cat_f.png";
import GradientText from "@/components/GradientText";
import SplitText from "@/components/SplitText";
import { useOCR } from "@/features/OCR/hooks/useOCR";
import { Scan, MousePointerClick } from "lucide-react";
import { JobSearchSection } from "@/features/search/components/JobSearchSection";
import { SearchButton } from "@/features/search/components/SearchButton";
import { EditButton } from "@/features/search/components/EditButton";
import { Text } from "@/styles/typography";

const queryClient = new QueryClient();

const CatImage = styled.img<{ $isFound: boolean }>`
  ${tw`h-16 w-16 transition-transform duration-500 ease-in-out mx-auto mt-0 mb-4`}
  transform: rotate(${({ $isFound }) => ($isFound ? 0 : 15)}deg);
`;

export const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center text-center flex-1 w-full transition-all duration-500`}
`;

const Name = styled.div`
  ${tw`text-3xl font-semibold text-blue-600 flex items-center justify-center gap-2 mb-2`}
`;

const AlertMessage = styled.p`
  ${tw`text-sm font-extrabold text-red-600 bg-red-100 p-3 m-4 rounded-lg border border-red-300`}
`;

const ActionButton = styled.button`
  ${tw`p-4 rounded-full bg-blue-50 text-blue-600 shadow-sm`}
`;

const EditInput = styled.input`
  ${tw`text-3xl font-semibold text-blue-600 text-center bg-transparent focus:outline-none`}
  outline: none !important;
  box-shadow: none !important;
  width: auto;
  min-width: 100px;

  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }
`;

function SearchContent() {
  const [company, setCompany] = useState<string | null>(null);
  const [currentSite, setCurrentSite] = useState<string | null>(null);

  const [isCompanyLoaded, setIsCompanyLoaded] = useState(false);
  const [isJobLoaded, setIsJobLoaded] = useState(false);
  const [isDetectionActive, setIsDetectionActive] = useState(true);

  const [jobTitle, setJobTitle] = useState<string>("");

  const [isCompanyEditable, setIsCompanyEditable] = useState(false);
  const [isJobEditable, setIsJobEditable] = useState(false);

  const [searchMode, setSearchMode] = useState<"capture" | "scraper">(() => {
    return (
      (localStorage.getItem("searchMode") as "capture" | "scraper") || "capture"
    );
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { captureAndOCR, getSelectionText } = useOCR();

  const ui = {
    found: !!company,
    text: company ? "!" : "?",
    color: company ? ("blue70" as const) : ("black" as const),
    image: company ? catFLogo : catQLogo,
    isComplete: !!company && !!jobTitle,
  } as const;

  const fetchData = useCallback(async () => {
    if (!isDetectionActive) return;

    const result = await detectCompany();
    if (result.company && result.company !== company) {
      setCurrentSite(result.site);
      setCompany(result.company);
      setIsCompanyLoaded(false);
    } else if (!result.company && !company) {
      setCurrentSite(result.site);
      if (!result.site) {
        setIsCompanyEditable(true);
      }
    }
  }, [isDetectionActive, company]);

  useEffect(() => {
    fetchData();
    const cleanup = onTabChange(() => {
      fetchData();
    });
    return cleanup;
  }, [fetchData]);

  const handleCompanyAnimationComplete = () => {
    setTimeout(() => {
      setIsCompanyLoaded(true);
    }, 800);
  };

  const handleJobAnimationComplete = () => {
    setIsJobLoaded(true);
  };

  const handleAction = async () => {
    setIsDetectionActive(false);
    setIsAnalyzing(true);

    try {
      let result = "";
      if (searchMode === "capture") {
        result = await captureAndOCR();
      } else {
        result = await getSelectionText();
      }

      if (result) {
        setJobTitle(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSearchMode = () => {
    const newMode = searchMode === "capture" ? "scraper" : "capture";
    setSearchMode(newMode);
    localStorage.setItem("searchMode", newMode);
  };

  return (
    <ContentArea>
      <Text variant="2xl" weight="extrabold" color={ui.color} className="-mb-2">
        {ui.text}
      </Text>
      <CatImage src={ui.image} alt="Cat Logo" $isFound={ui.found} />
      <div className="w-full px-4">
        <div className="mb-2">
          <Text
            variant="xl"
            weight="semibold"
            color={ui.isComplete ? "gray30" : "black"}
            tw="mb-2 block"
          >
            어떤 회사를 탐색할까요?
          </Text>
          <Name>
            {isCompanyEditable ? (
              <EditInput
                value={company || ""}
                onChange={(e) => setCompany(e.target.value)}
                onBlur={() => setIsCompanyEditable(false)}
                size={company?.length || 10}
                autoFocus
              />
            ) : (
              <>
                {company ? (
                  <SplitText
                    text={company}
                    delay={180}
                    onLetterAnimationComplete={handleCompanyAnimationComplete}
                  />
                ) : (
                  <GradientText children="채용 공고 분석 중..." />
                )}
              </>
            )}
            {isCompanyLoaded && (
              <EditButton
                onClick={() => setIsCompanyEditable(true)}
                className={isCompanyEditable ? "invisible" : ""}
              />
            )}
          </Name>
        </div>

        <JobSearchSection isVisible={isCompanyLoaded}>
          <div className="mt-12 mb-4">
            <Text
              variant="xl"
              weight="semibold"
              color={ui.isComplete ? "gray30" : "black"}
              tw="mb-2 block"
            >
              어떤 직무에 지원할 예정인가요?
            </Text>

            {!jobTitle && !isAnalyzing && (
              <>
                {searchMode === "capture" && (
                  <Text variant="xs" color="blue60" tw="mb-4 block">
                    (직무를 캡쳐하세요)
                  </Text>
                )}
                <div className="flex flex-col items-center gap-2">
                  <ActionButton onClick={handleAction}>
                    {searchMode === "capture" ? (
                      <Scan size={32} />
                    ) : (
                      <MousePointerClick size={32} />
                    )}
                  </ActionButton>
                  <button
                    onClick={toggleSearchMode}
                    className="text-xs text-gray-400 underline mt-2"
                  >
                    {searchMode === "capture"
                      ? "스크래퍼로 변경"
                      : "캡쳐로 변경"}
                  </button>
                </div>
              </>
            )}
            <Name>
              {isAnalyzing && (
                <div className="py-4">
                  <GradientText children="직무 분석 중..." />
                </div>
              )}

              {jobTitle && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  {isJobEditable ? (
                    <EditInput
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      onBlur={() => setIsJobEditable(false)}
                      size={jobTitle.length || 10}
                      autoFocus
                    />
                  ) : (
                    <>
                      <SplitText
                        text={jobTitle}
                        delay={180}
                        onLetterAnimationComplete={handleJobAnimationComplete}
                      />
                    </>
                  )}
                  {isJobLoaded && (
                    <EditButton
                      onClick={() => setIsJobEditable(true)}
                      className={isJobEditable ? "invisible" : ""}
                    />
                  )}
                </div>
              )}
            </Name>
          </div>
        </JobSearchSection>

        <SearchButton isActive={ui.isComplete} />
      </div>
    </ContentArea>
  );
}

function Search() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchContent />
    </QueryClientProvider>
  );
}

export default Search;
