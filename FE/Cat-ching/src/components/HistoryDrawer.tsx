import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import styled from "styled-components";
import tw from "twin.macro";
import { IoClose } from "react-icons/io5";
import { FiUser, FiLogOut, FiPlus } from "react-icons/fi";
import { Text } from "@/styles/typography";
import PillButton from "./PillButton";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { historyService } from "@/services/historyService";
import { HistoryItemResponse } from "@/types/history";
import AlertPopup from "./AlertPopup";
import { colors } from "@/styles/colors";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  ${tw`fixed inset-0 bg-black bg-opacity-50 z-40`}
`;

const DrawerContainer = styled(motion.div)`
  ${tw`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 flex flex-col rounded-r-2xl`}
  min-width: 85%;
`;

const Header = styled.div`
  ${tw`flex items-center justify-between p-4 border-b`}
`;

const CloseButton = styled.button`
  ${tw`p-1 rounded-full bg-transparent`}
  outline: none !important;
`;

const Content = styled.div`
  ${tw`flex-1 overflow-y-auto p-4`}
`;

const Footer = styled.div`
  ${tw`py-2 pr-4 border-t flex flex-row gap-2 justify-end`}
`;

const HistoryItemCard = styled(motion.div)`
  ${tw`p-4 mb-3 rounded-lg border border-gray-200 cursor-pointer transition-colors`}
`;

const CompanyName = styled.div`
  ${tw`font-semibold text-base mb-1`}
  color: #1a1a1a;
`;

const Position = styled.div`
  ${tw`text-sm mb-2`}
  color: #0065ff;
`;

const DateTime = styled.div`
  ${tw`text-xs`}
  color: #666;
`;

const LoadMoreButton = styled.button`
  ${tw`w-full py-3 mt-2 mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-all`}
  border-color: ${colors.gray30};
  color: ${colors.gray50};
  &:hover {
    background-color: ${colors.gray10};
    border-color: ${colors.blue80};
    color: ${colors.blue80};
  }
`;

export default function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const [allHistory, setAllHistory] = useState<HistoryItemResponse[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const logout = useAuthStore((state) => state.logout);
  const { navigate } = useAppStore();

  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: "",
  });

  const fetchHistory = async () => {
    try {
      const data = await historyService.getHistoryList();
      if (Array.isArray(data)) {
        setAllHistory(data);
      }
    } catch (error) {
      console.error("History fetch failed:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setVisibleCount(10); // 열 때마다 초기화
    }
  }, [isOpen]);

  const prevCountRef = useRef(0);

  useLayoutEffect(() => {
    if (isOpen && itemsRef.current.length > 0) {
      const newItems = itemsRef.current.slice(
        prevCountRef.current,
        visibleCount
      );

      if (newItems.length > 0) {
        gsap.fromTo(
          newItems,
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out",
            overwrite: true,
          }
        );
      }
      prevCountRef.current = visibleCount;
    }

    if (!isOpen) {
      prevCountRef.current = 0;
    }
  }, [isOpen, visibleCount, allHistory]);

  const setItemRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) itemsRef.current[index] = el;
  };

  const handleLogout = async () => {
    setPopupConfig({
      isOpen: true,
      message: "로그아웃 하시겠습니까?",
      showCancel: true,
      onConfirm: async () => {
        await logout();
        onClose();
      },
    });
  };

  const handleSettingsClick = () => {
    navigate("settings");
    onClose();
  };

  const formatDateTime = (isoString: string) => {
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const time = dateObj.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  const visibleItems = allHistory.slice(0, visibleCount);
  const hasMore = allHistory.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleItemClick = async (companyPositionId: number) => {
    try {
      const analysisData = await historyService.getHistoryAnalysis(
        companyPositionId
      );
      console.log("Analysis Result:", analysisData);
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Overlay
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
        {isOpen && (
          <DrawerContainer
            key="drawer-container"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <Header>
              <Text variant="lg" weight="bold">
                History
              </Text>
              <CloseButton onClick={onClose} aria-label="Close history">
                <IoClose size={24} />
              </CloseButton>
            </Header>

            <Content>
              {visibleItems.length > 0 ? (
                visibleItems.map((item, index) => {
                  const { date, time } = formatDateTime(item.createdAt);
                  return (
                    <HistoryItemCard
                      key={item.historyId}
                      ref={setItemRef(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleItemClick(item.companyPositionId)}
                    >
                      <CompanyName>{item.company}</CompanyName>
                      <Position>{item.position}</Position>
                      <DateTime>
                        {date} {time}
                      </DateTime>
                    </HistoryItemCard>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <Text variant="sm">기록이 없습니다.</Text>
                </div>
              )}

              {hasMore && (
                <LoadMoreButton onClick={handleLoadMore}>
                  <FiPlus /> 더보기
                </LoadMoreButton>
              )}
            </Content>

            <Footer>
              <PillButton
                icon={<FiUser />}
                borderColor="#6DACFF"
                onClick={handleSettingsClick}
              >
                사용자 설정
              </PillButton>

              <PillButton
                icon={<FiLogOut />}
                borderColor="#E0EEFF"
                onClick={handleLogout}
              >
                로그아웃
              </PillButton>
            </Footer>
          </DrawerContainer>
        )}
      </AnimatePresence>
      <AlertPopup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        showCancel={popupConfig.showCancel}
        onConfirm={popupConfig.onConfirm}
        onClose={() => setPopupConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
