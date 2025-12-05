import "./App.css";
import styled from "styled-components";
import tw from "twin.macro";
import { GlobalFonts } from "@/styles/fonts";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

const Container = styled.div`
  ${tw`w-full px-2 py-1 min-h-screen flex flex-col justify-between items-center`}
`;

const ContentWrapper = styled.div`
  ${tw`w-full max-w-xl flex flex-col flex-1`}
`;

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  // 앱 로드 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Container>
      <GlobalFonts />

      <ContentWrapper>
        <Header />
        {/* 인증 상태에 따라 Home 또는 Search 페이지 표시 */}
        {isAuthenticated ? <Search /> : <Home />}
        <Footer />
      </ContentWrapper>
    </Container>
  );
}

export default App;
