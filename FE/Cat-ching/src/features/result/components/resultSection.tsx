import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MarkdownRender } from "./markdownRender";
import { useEffect, useRef, useState } from "react";

const SectionWrapper = styled.div`
  ${tw`space-y-2`}
`;

const SectionHeader = styled.button`
  ${tw`w-full flex items-center justify-between p-1 rounded-lg bg-[#B3D4FF]`}
  background-color: ${colors.blue40};
`;

const SectionContentOuter = styled.div<{ $open: boolean; $height: number }>`
  ${tw`overflow-hidden transition-all duration-300 ease-in-out`}
  max-height: ${({ $open, $height }) => ($open ? `${$height}px` : "0px")};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
`;

const SectionContentInner = styled.div`
  ${tw`px-1.5`}
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
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (!innerRef.current) return;

    // 실제 콘텐츠 높이 측정
    setContentHeight(innerRef.current.scrollHeight);
  }, [content, isLoading, isTyping, open]);

  return (
    <SectionWrapper>
      <SectionHeader onClick={onToggle}>
        <Text variant="base" color="gray95">
          {icon} {title}
        </Text>
        {open ? <ChevronDown /> : <ChevronRight />}
      </SectionHeader>

      <SectionContentOuter $open={open} $height={contentHeight}>
        <SectionContentInner ref={innerRef}>
          {content && <MarkdownRender text={content} />}
          {isLoading && <TypingIndicator />}
          {isTyping && <TypingIndicator text="입력 중..." />}
        </SectionContentInner>
      </SectionContentOuter>
    </SectionWrapper>
  );
}
