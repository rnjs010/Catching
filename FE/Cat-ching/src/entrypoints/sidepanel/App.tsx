import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';
import styled from 'styled-components';
import tw from 'twin.macro';

const Container = styled.div`
  ${tw`text-center p-4`}
`;

const Header = styled.h1`
  ${tw`text-3xl font-bold mb-4`}
`;

const Card = styled.div`
  ${tw`p-6 border border-gray-200 rounded-lg shadow-md max-w-sm mx-auto`}
`;

const Button = styled.button`
  ${tw`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200`}
`;

const Description = styled.p`
  ${tw`mt-4 text-sm text-gray-600`}
`;

const LogoContainer = styled.div`
  ${tw`flex justify-center space-x-8`}
`;

const Logo = styled.img`
  ${tw`h-24 w-24 inline-block`}
  &.react {
    ${tw`animate-spin`}
  }
`;


function App() {
  const [count, setCount] = useState(0);

  return (
    <Container>
      <LogoContainer>
        <a href="https://wxt.dev" target="_blank" rel="noopener noreferrer">
          <Logo src={wxtLogo} alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <Logo src={reactLogo} className="react" alt="React logo" />
        </a>
      </LogoContainer>
      
      <Header>WXT + React + twin.macro</Header>
      
      <Card>
        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
        <Description>
          Edit <code>src/App.tsx</code> and save to test HMR
        </Description>
      </Card>
      
      <Description className="read-the-docs">
        Click on the WXT and React logos to learn more
      </Description>
    </Container>
  );
}

export default App;
