import { useEffect, useState } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { useNotionStore } from "@/stores/notionStore";
import { notionService } from "@/services/notionService";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import {
  FiLink,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
} from "react-icons/fi";
import PillButton from "@/components/PillButton";
import AlertPopup from "@/components/AlertPopup";

const NotionCard = styled.div`
  ${tw`p-5 rounded-xl border border-gray-100 flex flex-col gap-4`}
  background-color: ${colors.gray10};
`;

const StatusWrapper = styled.div`
  ${tw`flex items-center gap-2`}
`;

const InfoRow = styled.div`
  ${tw`flex flex-col gap-1`}
`;

const SelectWrapper = styled.div`
  ${tw`relative mt-2`}
`;

const Select = styled.select`
  ${tw`w-full p-3 rounded-lg border appearance-none text-sm cursor-pointer`}
  border-color: ${colors.gray20};
  background-color: white;
  &:focus {
    outline: none;
    border-color: ${colors.blue80};
  }
`;

const ChevronIcon = styled.div`
  ${tw`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none`}
`;

export default function NotionSettings() {
  const {
    isConnected,
    isConnecting,
    hasDefaultPage,
    defaultPageId,
    defaultPageTitle,
    workspaceName,
    availablePages,
    setNotionInfo,
    setConnecting,
    setAvailablePages,
    clearNotionInfo,
  } = useNotionStore();

  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: "",
  });

  // 상태 초기화 및 주기적 업데이트 대용 (탭 닫힘 감지 등)
  const refreshStatus = async () => {
    try {
      const status = await notionService.getNotionStatus();
      setNotionInfo({
        isConnected: status.connected,
        hasDefaultPage: status.hasDefaultPage,
        defaultPageId: status.defaultPageId,
        defaultPageTitle: status.defaultPageTitle,
        workspaceName: status.workspaceName,
      });
      if (status.connected) {
        loadPages();
      }
    } catch (error) {
      console.error("Notion 상태 조회 실패:", error);
    }
  };

  const loadPages = async () => {
    setIsLoadingPages(true);
    try {
      const pages = await notionService.getNotionPages();
      setAvailablePages(pages);
    } catch (error) {
      console.error("Notion 페이지 목록 조회 실패:", error);
    } finally {
      setIsLoadingPages(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await notionService.getNotionOAuthUrl();
      const tab = await browser.tabs.create({ url });
      const tabId = tab.id!;

      let timeoutId: any;

      // callback URL 감지 및 meta 태그 확인을 위한 리스너
      const handleTabUpdated = async (
        updatedTabId: number,
        changeInfo: any
      ) => {
        if (
          updatedTabId !== tabId ||
          !changeInfo.url?.includes("/notion/callback?code=")
        )
          return;

        // 페이지 로드 대기를 위해 약간의 지연 후 meta 태그 확인
        setTimeout(async () => {
          try {
            const results = await browser.scripting.executeScript({
              target: { tabId },
              func: () => {
                const meta = document.querySelector(
                  'meta[name="oauth-result"]'
                );
                return meta?.getAttribute("content");
              },
            });

            const oauthResult = results[0]?.result;

            if (oauthResult === "success") {
              // 연결 성공: 3초 후 탭 자동 닫기
              setTimeout(async () => {
                try {
                  await browser.tabs.remove(tabId);
                } catch (e) {
                  // 이미 닫힌 경우 무시
                }
              }, 3000);
            }
          } catch (e) {
            console.error("Notion 결과 감지 실패:", e);
          }
        }, 800);
      };

      // 탭 닫힘 감지 (최종 상태 동기화)
      const handleTabRemoved = async (removedTabId: number) => {
        if (removedTabId !== tabId) return;

        if (timeoutId) clearTimeout(timeoutId);
        browser.tabs.onRemoved.removeListener(handleTabRemoved);
        browser.tabs.onUpdated.removeListener(handleTabUpdated);

        setConnecting(false);
        refreshStatus();
      };

      browser.tabs.onUpdated.addListener(handleTabUpdated);
      browser.tabs.onRemoved.addListener(handleTabRemoved);

      // 타임아웃 - 3분동안 연결 못하면 실패처리(리스너 정리)
      timeoutId = setTimeout(() => {
        browser.tabs.onRemoved.removeListener(handleTabRemoved);
        browser.tabs.onUpdated.removeListener(handleTabUpdated);
        setConnecting(false);
        setPopupConfig({
          isOpen: true,
          message: "Notion 연결 실패",
          showCancel: false,
        });
      }, 180000);
    } catch (error) {
      console.error("Notion 연결 시작 실패:", error);
      setConnecting(false);
    }
  };

  const handlePageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPageId = e.target.value;
    const selectedPage = availablePages.find((p) => p.id === selectedPageId);
    if (selectedPage) {
      try {
        await notionService.updateDefaultPage(
          selectedPage.id,
          selectedPage.title
        );
        setNotionInfo({
          isConnected,
          hasDefaultPage: true,
          defaultPageId: selectedPage.id,
          defaultPageTitle: selectedPage.title,
          workspaceName,
        });
      } catch (error) {
        console.error("대표 페이지 변경 실패:", error);
      }
    }
  };

  const handleDisconnect = () => {
    setPopupConfig({
      isOpen: true,
      message: "Notion 연동을 해제하시겠습니까?",
      showCancel: true,
      onConfirm: async () => {
        try {
          await notionService.disconnectNotion();
          clearNotionInfo();
        } catch (error) {
          console.error("Notion 연동 해제 실패:", error);
        }
      },
    });
  };

  return (
    <NotionCard>
      <div className="flex justify-between items-center">
        <StatusWrapper>
          <FiLink
            size={18}
            color={isConnected ? colors.blue80 : colors.gray40}
          />
          <Text variant="lg" weight="bold">
            Notion 연동
          </Text>
        </StatusWrapper>
        {isConnected ? (
          <div className="flex items-center gap-1 text-blue-600">
            <FiCheckCircle size={16} />
            <Text variant="base" color="blue80">
              연결됨
            </Text>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-400">
            <FiXCircle size={16} />
            <Text variant="base">미연결</Text>
          </div>
        )}
      </div>

      {isConnected ? (
        <>
          <InfoRow>
            <Text variant="xs" color="gray50">
              워크스페이스
            </Text>
            <Text variant="sm" weight="medium">
              {workspaceName || "-"}
            </Text>
          </InfoRow>

          <InfoRow>
            <Text variant="xs" color="gray50">
              현재 대표 페이지
            </Text>
            <SelectWrapper>
              <Select
                value={defaultPageId || ""}
                onChange={handlePageChange}
                disabled={isLoadingPages}
              >
                {!hasDefaultPage && (
                  <option value="" disabled>
                    페이지를 선택해주세요
                  </option>
                )}
                {availablePages.length > 0 ? (
                  availablePages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.icon ? `${page.icon} ` : ""}
                      {page.title}
                    </option>
                  ))
                ) : (
                  <option value="">
                    {defaultPageTitle ||
                      (isLoadingPages
                        ? "페이지 로딩 중..."
                        : "사용 가능한 페이지가 없습니다")}
                  </option>
                )}
              </Select>
              <ChevronIcon>
                <FiChevronDown size={16} color={colors.gray40} />
              </ChevronIcon>
            </SelectWrapper>
          </InfoRow>

          <PillButton
            borderColor={colors.gray30}
            onClick={handleDisconnect}
            className="mt-2 w-full justify-center"
          >
            연동 해제하기
          </PillButton>
        </>
      ) : (
        <div className="flex flex-col gap-3 py-2">
          <Text variant="sm" color="gray60">
            검색한 기업 분석 결과를 Notion 페이지로 내보낼 수 있습니다.
          </Text>
          <PillButton
            borderColor={colors.blue80}
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full justify-center"
          >
            {isConnecting ? "연결 중..." : "Notion 연결하기"}
          </PillButton>
        </div>
      )}

      <AlertPopup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        showCancel={popupConfig.showCancel}
        onConfirm={popupConfig.onConfirm}
        onClose={() => setPopupConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </NotionCard>
  );
}
