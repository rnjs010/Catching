import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoBarChartOutline, IoArrowBack } from "react-icons/io5";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";
import AlertPopup from "./AlertPopup";
import { useAppStore } from "@/stores/appStore";

export const HeaderWrapper = styled.div`
  ${tw`w-full flex justify-between items-center px-1 py-3 sticky top-0 z-10`}
  background-color: ${colors.gray10};
`;

const IconButton = styled.button`
  ${tw`p-2 rounded-lg cursor-pointer`}
  background: none;
  border: none;
`;

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showAlert, setShowAlert] = useState(false);

  const { currentPage, navigate, goBack } = useAppStore();

  const handleMenuClick = () => {
    if (currentPage === "settings") {
      goBack();
      return;
    }

    if (!isAuthenticated) {
      setShowAlert(true);
    } else {
      onMenuClick?.();
    }
  };

  const handleChartClick = () => {
    if (!isAuthenticated) {
      setShowAlert(true);
    }
  };

  const handleHomeClick = () => {
    if (!isAuthenticated) {
      navigate("home");
    } else {
      navigate("search");
    }
  };

  return (
    <>
      <HeaderWrapper>
        <IconButton onClick={handleMenuClick} aria-label={currentPage === 'settings' ? 'Back' : 'Open Side Menu'}>
          {currentPage === "settings" ? (
            <IoArrowBack size={24} />
          ) : (
            <RxHamburgerMenu size={24} />
          )}
        </IconButton>
        <IconButton onClick={handleHomeClick} aria-label="Go to Home">
          <Text variant="xl" weight="normal">
            <Text color="blue80">C</Text>at-ching
          </Text>
        </IconButton>
        <IconButton
          onClick={handleChartClick}
          aria-label="Open Statistical Chart"
        >
          <IoBarChartOutline size={24} />
        </IconButton>
      </HeaderWrapper>

      <AlertPopup
        isOpen={showAlert}
        message="로그인 후 이용하실 수 있습니다."
        onClose={() => setShowAlert(false)}
      />
    </>
  );
}
