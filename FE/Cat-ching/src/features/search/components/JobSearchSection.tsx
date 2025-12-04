import styled from "styled-components";
import tw from "twin.macro";
import { ReactNode } from "react";

const SectionContainer = styled.div<{ $isVisible: boolean }>`
  ${tw`w-full transition-all duration-[2s] ease-in-out overflow-hidden`}
  max-height: ${(props) => (props.$isVisible ? "500px" : "0")};
  opacity: ${(props) => (props.$isVisible ? "1" : "0")};
  transform: ${(props) =>
    props.$isVisible ? "translateY(0)" : "translateY(20px)"};
`;

interface JobSearchSectionProps {
  isVisible: boolean;
  children: ReactNode;
}

export const JobSearchSection = ({
  isVisible,
  children,
}: JobSearchSectionProps) => {
  return <SectionContainer $isVisible={isVisible}>{children}</SectionContainer>;
};
