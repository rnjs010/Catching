import "./App.css";
import styled from "styled-components";
import tw from "twin.macro";
import { GlobalFonts } from "@/styles/fonts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Result from "@/pages/Result";
import Register from "@/pages/Register";
import Settings from "@/pages/Settings";
import HistoryDrawer from "@/components/HistoryDrawer";
import Chart from "@/pages/Chart";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { useEffect, useState } from "react";

const Container = styled.div`
  ${tw`w-full px-2 min-h-screen flex flex-col justify-between items-center`}
`;

const ContentWrapper = styled.div`
  ${tw`flex w-full max-w-xl flex-1 pb-10`}
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

  useEffect(() => {
    const port = browser.runtime.connect({ name: "sidepanel" });

    return () => {
      console.log("sidepanel disconnected");
      port.disconnect();
    };
  }, []);

  return (
    <Container>
      <GlobalFonts />
      <Header onMenuClick={() => setHistoryOpen(true)} />
      <ContentWrapper>
        {/* 상태 기반 라우팅 */}
        {currentPage === "home" && <Home />}
        {currentPage === "register" && <Register />}
        {currentPage === "search" && <Search />}
        {currentPage === "settings" && <Settings />}
        {currentPage === "analysis" && <Result />}
        {currentPage === "chart" && <Chart />}
      </ContentWrapper>
      <Footer />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </Container>
  );
}

export default App;
