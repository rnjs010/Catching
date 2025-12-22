import "./App.css";
import styled from "styled-components";
import tw from "twin.macro";
import { GlobalFonts } from "@/styles/fonts";
import Home from "@/pages/Home";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Search from "@/pages/Search";

const Container = styled.div`
  ${tw`w-full px-2 py-1 min-h-screen flex flex-col justify-between items-center`}
`;

const ContentWrapper = styled.div`
  ${tw`flex w-full max-w-xl flex-1 pb-16`}
`;

function App() {
  return (
    <Container>
      <GlobalFonts />

      <Header />

      <ContentWrapper>
        {/* <Home /> */}
        <Search />
      </ContentWrapper>

      <Footer />
    </Container>
  );
}

export default App;
