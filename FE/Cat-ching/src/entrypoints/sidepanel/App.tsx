import "./App.css";
import styled from "styled-components";
import tw from "twin.macro";
import Home from "@/pages/home";

const Container = styled.div`
  ${tw``}
`;

function App() {
  return (
    <Container>
      <Home />
    </Container>
  );
}

export default App;
