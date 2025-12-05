import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  detectCompany,
  onTabChange,
  getSiteFromUrl,
} from "@/features/scraper/hooks/companyDetect";
import styled from "styled-components";
import tw from "twin.macro";
import catQLogo from "@/assets/cat_q.png";
import catFLogo from "@/assets/cat_f.png";
import { useOCR } from "@/features/OCR/hooks/useOCR";
import { usePositionScraper } from "@/features/scraper/hooks/positionScraper";
import { Scan, MousePointerClick } from "lucide-react";
import { JobSearchSection } from "@/features/search/components/JobSearchSection";
import { SearchButton } from "@/features/search/components/SearchButton";
import { EditableText } from "@/features/search/components/EditableText";
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

  // 회사나 직무 편집 상태를 ref로 추적 (fetchData가 최신 값을 참조하도록)
  const isCompanyEditableRef = useRef(isCompanyEditable);
  const isJobEditableRef = useRef(isJobEditable);

  // "직접 입력해주세요" 타이머 추적
  const notSupportedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { captureAndOCR, getSelectionText } = useOCR();
  const { startSelectionMonitor } = usePositionScraper();

  const ui = {
    found: !!company,
    text: company ? "!" : "?",
    color: company ? ("blue70" as const) : ("black" as const),
    image: company ? catFLogo : catQLogo,
    isComplete: !!company && !!jobTitle,
  } as const;

  const UI_TEXT = {
    whatCompany: "어떤 회사를 탐색할까요?",
    whatJob: "어떤 직무에 지원할 예정인가요?",
    notSupported: "직접 입력해주세요",
    instruction: {
      capture: "(원하는 직무를 캡쳐하세요)",
      scraper: "(원하는 직무를 드래그해주세요)",
    },
    toggleButton: {
      capture: "스크래퍼로 변경",
      scraper: "캡쳐로 변경",
    },
    analyzingMessage: "채용 공고 분석 중...",
    getAnalyzingMessage: (
      mode: "capture" | "scraper",
      isProcessing: boolean
    ) => {
      if (mode === "scraper") return "직무를 드래그해주세요";
      return isProcessing ? "직무 분석 중..." : "OCR할 영역을 선택하세요";
    },
  } as const;

  const fetchData = useCallback(async () => {
    if (!isDetectionActive) return;
    if (isCompanyEditableRef.current || isJobEditableRef.current) return; // 편집 중에는 감지 중단

    const result = await detectCompany();

    // 회사 감지됨
    if (result.company && result.company !== company) {
      // 대기 중인 타이머 취소
      if (notSupportedTimerRef.current) {
        clearTimeout(notSupportedTimerRef.current);
        notSupportedTimerRef.current = null;
      }

      setCurrentSite(result.site);
      setCompany(result.company);
      setIsCompanyLoaded(false);
      setHasCompanyAnimated(false);
    }
    // 회사 감지 안 됨
    else if (!result.company) {
      setCurrentSite(result.site);

      // 이전에 회사가 있었다면 초기화 (모달 닫힘 등)
      if (company && company !== UI_TEXT.notSupported) {
        setCompany(null);
        setIsCompanyLoaded(false);
        setHasCompanyAnimated(false);
      }

      // 지원하지 않는 사이트면 3초 후 "직접 입력해주세요" 표시
      if (!company) {
        // 이전 타이머 있으면 취소
        if (notSupportedTimerRef.current) {
          clearTimeout(notSupportedTimerRef.current);
        }

        // 새 타이머 시작
        notSupportedTimerRef.current = setTimeout(async () => {
          // 3초 후 다시 URL 검증
          const [tab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });

          if (!tab.id || !tab.url) {
            setCompany(UI_TEXT.notSupported);
            return;
          }

          const site = getSiteFromUrl(tab.url);
          // 여전히 지원하지 않는 사이트면 메시지 표시
          if (site === "other") {
            setCompany(UI_TEXT.notSupported);
          }
          // 지원하는 사이트로 이동했으면 fetchData가 알아서 처리
        }, 3000);
      }
    }
  }, [isDetectionActive, company, currentSite]);

  useEffect(() => {
    fetchData();
    const cleanup = onTabChange(() => {
      // 대기 중인 타이머 있으면 취소
      if (notSupportedTimerRef.current) {
        clearTimeout(notSupportedTimerRef.current);
        notSupportedTimerRef.current = null;
      }

      // 만약 탭 이동 시에 company가 직접 입력해주세요로 되어 있다면 초기화
      if (company === UI_TEXT.notSupported) {
        setCompany(null);
        setIsCompanyLoaded(false);
        setHasCompanyAnimated(false);
      }

      fetchData();
    });
    return cleanup;
  }, [fetchData]);

  // ref 값을 최신 상태로 업데이트
  useEffect(() => {
    isCompanyEditableRef.current = isCompanyEditable;
    isJobEditableRef.current = isJobEditable;
  }, [isCompanyEditable, isJobEditable]);

  const handleCompanyAnimationComplete = () => {
    setIsCompanyLoaded(true);
    setHasCompanyAnimated(true); // 애니메이션 한번하면 일반텍스트
    setIsJobSectionEverOpened(true); // 직무 열린거 유지
  };

  const delayLength = (company: string) => {
    if (company.length <= 6) return 180;
    if (company.length <= 12) return 130;
    return 80;
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
      // 취소/에러 시 회사 감지 재개
      setIsDetectionActive(true);
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
            {UI_TEXT.whatCompany}
          </Text>
          <Name>
            <EditableText
              text={company}
              isLoaded={isCompanyLoaded || company === UI_TEXT.notSupported}
              isEditable={isCompanyEditable}
              hasAnimated={hasCompanyAnimated}
              onEdit={() => setIsCompanyEditable(true)}
              onSave={(newText) => setCompany(newText)}
              onCancel={() => setIsCompanyEditable(false)}
              skipAnimation={company === UI_TEXT.notSupported}
              placeholder={UI_TEXT.analyzingMessage}
              delayCalculator={delayLength}
              onAnimationComplete={handleCompanyAnimationComplete}
            />
          </Name>
        </div>

        <JobSearchSection
          isVisible={
            (isJobSectionEverOpened || isCompanyLoaded) &&
            company !== UI_TEXT.notSupported
          }
        >
          <div className="mt-12 mb-4">
            <Text
              variant="xl"
              weight="semibold"
              color={ui.isComplete ? "gray30" : "black"}
              tw="mb-2 block"
            >
              {UI_TEXT.whatJob}
            </Text>

            {!jobTitle && !isAnalyzing && (
              <>
                <Text variant="xs" color="blue60" tw="mb-4 block">
                  {UI_TEXT.instruction[searchMode]}
                </Text>
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
                    {UI_TEXT.toggleButton[searchMode]}
                  </button>
                </div>
              </>
            )}
            <Name>
              {isAnalyzing && (
                <div className="py-4">
                  <GradientText>
                    {UI_TEXT.getAnalyzingMessage(searchMode, isOCRProcessing)}
                  </GradientText>
                </div>
              )}

              {jobTitle && (
                <EditableText
                  text={jobTitle}
                  isLoaded={isJobLoaded}
                  isEditable={isJobEditable}
                  hasAnimated={hasJobAnimated}
                  onEdit={() => setIsJobEditable(true)}
                  onSave={(newText) => setJobTitle(newText)}
                  onCancel={() => setIsJobEditable(false)}
                  skipAnimation={searchMode === "scraper"}
                  delayCalculator={delayLength}
                  onAnimationComplete={handleJobAnimationComplete}
                />
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
