import { Text } from "@/styles/typography";
import { LuMousePointerClick } from "react-icons/lu";
import { TbCapture } from "react-icons/tb";
import styled from "styled-components";
import tw from "twin.macro";

const Container = styled.div<{ visible: boolean }>`
  ${({ visible }) =>
    visible
      ? tw`mt-8 opacity-100 translate-y-0 max-h-[600px]`
      : tw`opacity-0 translate-y-16 max-h-0 overflow-hidden`}
  ${tw`transition-[max-height,opacity,transform] duration-[2s] ease-out flex flex-col items-center`}
`;

const CaptureButton = styled.button`
  ${tw`w-16 h-16 p-2 my-4 rounded-full shadow-custom flex items-center justify-center text-blue-500 bg-blue-50`}
`;

const ModeToggleButton = styled.button`
  ${tw`px-2 py-1.5 rounded-full bg-gray-100 underline`}
`;

export type JobInputMode = "capture" | "drag";

interface Props {
  visible: boolean;
  mode: JobInputMode;
  onModeToggle: () => void;
  onCaptureClick: () => void;
}

export default function JobSection({
  visible,
  mode,
  onModeToggle,
  onCaptureClick,
}: Props) {
  return (
    <Container visible={visible}>
      <Text variant="xl">어떤 직무에 지원할 예정인가요?</Text>
      <Text variant="sm" weight="light" color="blue80">
        {mode === "capture" ? "(직무를 캡쳐하세요)" : "(직무를 드래그하세요)"}
      </Text>

      <CaptureButton onClick={onCaptureClick}>
        {mode === "capture" ? (
          <TbCapture size={28} />
        ) : (
          <LuMousePointerClick size={28} />
        )}
      </CaptureButton>

      <ModeToggleButton onClick={onModeToggle}>
        <Text variant="xs" color="gray80">
          {mode === "capture" ? "드래그로 변경" : "캡쳐로 변경"}
        </Text>
      </ModeToggleButton>
    </Container>
  );
}
