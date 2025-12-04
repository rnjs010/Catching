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
import { usePositionScraper } from "@/features/scraper/hooks/positionScraper";
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
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);

  // 스플릿텍스트 애니메이션이 한 번 실행되었는지 추적
  const [hasCompanyAnimated, setHasCompanyAnimated] = useState(false);
  const [hasJobAnimated, setHasJobAnimated] = useState(false);
  const [isJobSectionEverOpened, setIsJobSectionEverOpened] = useState(false);

  // 편집 취소를 위한 백업 값
  const [companyBackup, setCompanyBackup] = useState<string | null>(null);
  const [jobTitleBackup, setJobTitleBackup] = useState<string>("");

  const { captureAndOCR, getSelectionText } = useOCR();
  const { startSelectionMonitor } = usePositionScraper();

  const ui = {
    found: !!company,
    text: company ? "!" : "?",
    color: company ? ("blue70" as const) : ("black" as const),
    image: company ? catFLogo : catQLogo,
    isComplete: !!company && !!jobTitle,
  } as const;

  const fetchData = useCallback(async () => {
    if (!isDetectionActive) return;
    if (isCompanyEditable || isJobEditable) return; // 편집 중에는 감지 중단

    const result = await detectCompany();
    if (result.company && result.company !== company) {
      setCurrentSite(result.site);
      setCompany(result.company);
      setIsCompanyLoaded(false);
      setHasCompanyAnimated(false); // 새 회사 감지 시 애니메이션 리셋
    } else if (!result.company && !company) {
      setCurrentSite(result.site);
      if (!result.company) {
        setCompany("직접 입력해주세요");
      }
    }
  }, [isDetectionActive, company, isCompanyEditable, isJobEditable]);

  useEffect(() => {
    fetchData();
    const cleanup = onTabChange(() => {
      fetchData();
    });
    return cleanup;
  }, [fetchData]);

  const handleCompanyAnimationComplete = () => {
    setIsCompanyLoaded(true);
    setHasCompanyAnimated(true); // 애니메이션 한번하면 일반텍스트
    setIsJobSectionEverOpened(true); // 직무 열린거 유지
  };

  const handleJobAnimationComplete = () => {
    setIsJobLoaded(true);
    setHasJobAnimated(true);
  };

  const handleAction = async () => {
    setIsDetectionActive(false);
    setIsAnalyzing(true);
    setIsOCRProcessing(false);

    try {
      if (searchMode === "capture") {
        const result = await captureAndOCR(() => {
          // 크롭 완료, OCR 처리 시작
          setIsOCRProcessing(true);
        });
        if (result) {
          setJobTitle(result);
          setHasJobAnimated(false); // 새 직무 설정 시 애니메이션 리셋
        }
        setIsAnalyzing(false);
        setIsOCRProcessing(false);
      } else {
        // 스크래퍼 모드: 버튼 클릭 후 실시간으로 선택 감지
        setHasJobAnimated(true); // 스크래퍼는 애니메이션 없이 바로 표시
        await startSelectionMonitor((text: string) => {
          // 첫 선택 시 분석 중 메시지 숨김
          setIsAnalyzing(false);
          // 실시간으로 선택된 텍스트 업데이트
          setJobTitle(text);
        });
        // 스크래퍼 모드에서는 선택 완료 시 바로 로드 완료 처리
        setIsJobLoaded(true);
      }
    } catch (e) {
      console.error(e);
      setIsAnalyzing(false);
      setIsOCRProcessing(false);
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsCompanyEditable(false);
                  } else if (e.key === "Escape") {
                    setCompany(companyBackup); // 취소하면 원래 값으로 복원
                    setIsCompanyEditable(false);
                  }
                }}
                onBlur={() => setIsCompanyEditable(false)}
                size={company?.length || 10}
                autoFocus
              />
            ) : (
              <>
                {company ? (
                  hasCompanyAnimated || company == "직접 입력해주세요" ? (
                    <span className="text-3xl font-semibold text-blue-600">
                      {company}
                    </span>
                  ) : (
                    <SplitText
                      text={company}
                      delay={180}
                      onLetterAnimationComplete={handleCompanyAnimationComplete}
                    />
                  )
                ) : (
                  <GradientText children="채용 공고 분석 중..." />
                )}
              </>
            )}
            {isCompanyLoaded ||
              (company == "직접 입력해주세요" && (
                <EditButton
                  onClick={() => {
                    setCompanyBackup(company);
                    setIsCompanyEditable(true);
                  }}
                  className={isCompanyEditable ? "invisible" : ""}
                />
              ))}
          </Name>
        </div>

        <JobSearchSection
          isVisible={
            (isJobSectionEverOpened || isCompanyLoaded) &&
            company !== "직접 입력해주세요"
          }
        >
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
                {searchMode === "capture" ? (
                  <Text variant="xs" color="blue60" tw="mb-4 block">
                    (원하는 직무를 캡쳐하세요)
                  </Text>
                ) : (
                  <Text variant="xs" color="blue60" tw="mb-4 block">
                    (원하는 직무를 드래그해주세요)
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
                  <GradientText>
                    {searchMode === "capture"
                      ? isOCRProcessing
                        ? "직무 분석 중..."
                        : "OCR할 영역을 선택하세요"
                      : "직무를 드래그해주세요"}
                  </GradientText>
                </div>
              )}

              {jobTitle && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  {isJobEditable ? (
                    <EditInput
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setIsJobEditable(false);
                        } else if (e.key === "Escape") {
                          setJobTitle(jobTitleBackup);
                          setIsJobEditable(false);
                        }
                      }}
                      onBlur={() => setIsJobEditable(false)}
                      size={jobTitle.length || 10}
                      autoFocus
                    />
                  ) : (
                    <>
                      {searchMode === "capture" ? (
                        hasJobAnimated ? (
                          <span className="text-3xl font-semibold text-blue-600">
                            {jobTitle}
                          </span>
                        ) : (
                          <SplitText
                            text={jobTitle}
                            delay={180}
                            onLetterAnimationComplete={
                              handleJobAnimationComplete
                            }
                          />
                        )
                      ) : (
                        <span className="text-3xl font-semibold text-blue-600">
                          {jobTitle}
                        </span>
                      )}
                    </>
                  )}
                  {isJobLoaded && (
                    <EditButton
                      onClick={() => {
                        setJobTitleBackup(jobTitle);
                        setIsJobEditable(true);
                      }}
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
