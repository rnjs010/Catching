import "./App.css";
import styled from "styled-components";
import tw from "twin.macro";
import Search from "@/pages/Search";

const Container = styled.div`
  ${tw`w-full px-2 py-1 min-h-screen flex flex-col justify-between items-center`}
`;

const ContentWrapper = styled.div`
  ${tw`w-full max-w-xl flex flex-col flex-1`}
`;

function App() {
  return (
    <Container>
      <ContentWrapper>
        <Search />
      </ContentWrapper>
    </Container>
  );
}

export default App;