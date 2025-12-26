import { useRef, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import styled from "styled-components";
import tw from "twin.macro";
import { IoClose } from "react-icons/io5";
import { FiUser, FiLogOut } from "react-icons/fi";
import { Text } from "@/styles/typography";
import PillButton from "./PillButton";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";

interface HistoryItem {
  id: string;
  company: string;
  position: string;
  date: string;
  time: string;
}

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
  color: #0065FF;
`;

const DateTime = styled.div`
  ${tw`text-xs`}
  color: #666;
`;

// 임시 히스토리 데이터
const mockHistoryData: HistoryItem[] = [
  {
    id: "1",
    company: "현대오토에버",
    position: "MES 시스템 개발",
    date: "2025-11-17",
    time: "4:41 PM",
  },
  {
    id: "2",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-17",
    time: "4:41 PM",
  },
  {
    id: "3",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-10",
    time: "1:01 PM",
  },
  {
    id: "4",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-09",
    time: "1:00 PM",
  },
  {
    id: "5",
    company: "현대오토에버",
    position: "MES 시스템 개발",
    date: "2025-11-17",
    time: "4:41 PM",
  },
  {
    id: "6",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-17",
    time: "4:41 PM",
  },
  {
    id: "7",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-10",
    time: "1:01 PM",
  },
  {
    id: "8",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-09",
    time: "1:00 PM",
  },
  {
    id: "9",
    company: "현대오토에버",
    position: "MES 시스템 개발",
    date: "2025-11-17",
    time: "4:41 PM",
  },
  {
    id: "10",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-17",
    time: "4:41 PM",
  },
  {
    id: "11",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-10",
    time: "1:01 PM",
  },
  {
    id: "12",
    company: "현대오토에버",
    position: "Backend Developer",
    date: "2025-11-09",
    time: "1:00 PM",
  },
];

export default function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const [historyItems] = useState<HistoryItem[]>(mockHistoryData);
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

  useLayoutEffect(() => {
    if (isOpen && itemsRef.current.length > 0) {
      gsap.fromTo(
        itemsRef.current,
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <DrawerContainer
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
              {historyItems.map((item: HistoryItem, index: number) => (
                <HistoryItemCard
                  key={item.id}
                  ref={setItemRef(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CompanyName>{item.company}</CompanyName>
                  <Position>{item.position}</Position>
                  <DateTime>
                    {item.date} {item.time}
                  </DateTime>
                </HistoryItemCard>
              ))}
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
        </>
      )}
      <AlertPopup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        showCancel={popupConfig.showCancel}
        onConfirm={popupConfig.onConfirm}
        onClose={() => setPopupConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </AnimatePresence>
  );
}
