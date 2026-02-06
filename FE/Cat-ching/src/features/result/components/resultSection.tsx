import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MarkdownRender } from "./markdownRender";

const SectionWrapper = styled.div`
  ${tw`space-y-2`}
`;

const SectionHeader = styled.button`
  ${tw`w-full flex items-center justify-between p-1 rounded-lg bg-[#B3D4FF]`}
  background-color: ${colors.blue40};
`;

const SectionContent = styled.div<{ $open: boolean }>`
  ${tw`px-1.5 overflow-hidden transition-all duration-300`};

  max-height: ${({ $open }) => ($open ? "2000px" : "0")};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
`;

const TypingIndicator = ({ text = "AI 분석 중..." }: { text?: string }) => (
  <div className="flex items-center gap-1 text-gray-400 mt-2">
    <span>{text}</span>
    <BlinkCursor />
  </div>
);

const BlinkCursor = styled.span`
  animation: blink 1s step-end infinite;
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
`;

type Props = {
  title: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  content?: string;
  isLoading: boolean;
  isTyping: boolean;
};

export function ResultSection({
  title,
  icon,
  open,
  onToggle,
  content,
  isLoading,
  isTyping,
}: Props) {
  return (
    <SectionWrapper>
      <SectionHeader onClick={onToggle}>
        <Text variant="base" color="gray95">
          {icon} {title}
        </Text>
        {open ? <ChevronDown /> : <ChevronRight />}
      </SectionHeader>

      <SectionContent $open={open}>
        {content && <MarkdownRender text={content} />}
        {isLoading && <TypingIndicator />}
        {isTyping && <TypingIndicator text="입력 중..." />}
      </SectionContent>
    </SectionWrapper>
  );
}
