import "./App.css";
import styled from "styled-components";
import tw from "twin.macro";
import { GlobalFonts } from "@/styles/fonts";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Register from "@/pages/Register";
import Settings from "@/pages/Settings";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HistoryDrawer from "@/components/HistoryDrawer";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { useEffect, useState } from "react";

const Container = styled.div`
  ${tw`w-full px-2 py-1 min-h-screen flex flex-col justify-between items-center`}
`;

const ContentWrapper = styled.div`
  ${tw`w-full max-w-xl flex flex-col flex-1`}
`;

function App() {
  const { isAuthenticated, isNewUser, checkAuth } = useAuthStore();
  const { currentPage, navigate } = useAppStore();
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  // 앱 로드 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 인증 상태에 따른 초기 페이지 설정
  useEffect(() => {
    if (!isAuthenticated) {
      if (currentPage !== "home") {
        navigate("home");
      }
    } else if (isNewUser) {
      if (currentPage !== "register") {
        navigate("register");
      }
    } else {
      // 인증된 경우 home이나 register에 있으면 search로 이동
      if (currentPage === "home" || currentPage === "register") {
        navigate("search");
      }
    }
  }, [isAuthenticated, isNewUser, currentPage, navigate]);

  return (
    <Container>
      <GlobalFonts />

      <ContentWrapper>
        <Header onMenuClick={() => setHistoryOpen(true)} />

        {/* 상태 기반 라우팅 */}
        {currentPage === "home" && <Home />}
        {currentPage === "register" && <Register />}
        {currentPage === "search" && <Search />}
        {currentPage === "settings" && <Settings />}

        <Footer />
      </ContentWrapper>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </Container>
  );
}

export default App;
