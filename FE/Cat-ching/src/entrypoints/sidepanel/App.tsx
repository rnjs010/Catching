import "./App.css";
import styled from "styled-components";
import tw from "twin.macro";
import Home from "@/pages/home";
import { GlobalFonts } from "@/styles/fonts";

const Container = styled.div`
  ${tw``}
`;

function App() {
  return (
    <Container>
      <GlobalFonts />
      <Home />
    </Container>
  );
}

export default App;
