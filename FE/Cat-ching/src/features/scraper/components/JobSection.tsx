import { Text } from "@/styles/typography";
import { LuMousePointerClick } from "react-icons/lu";
import { TbCapture } from "react-icons/tb";
import styled from "styled-components";
import tw from "twin.macro";
import { EditableText } from "./EditableText";
import { useJobDrag } from "../hooks/useJobDrag";
import { useJobDragStore } from "@/stores/jobStore";
import { useState } from "react";

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

const GrayButton = styled.button`
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
  const { phase, draftText, job, isAutoDetected, setJobManual, reset } =
    useJobDragStore();
  const { startJobDrag, cancelJobDrag } = useJobDrag();
  const [isJobEditing, setIsJobEditing] = useState(false);

  const isDragging = phase === "dragging";
  const isDone = phase === "done";

  return (
    <Container visible={visible}>
      <Text variant="xl" className="mb-2">
        어떤 직무에 지원할 예정인가요?
      </Text>

      {/* 버튼 */}
      {!isDragging && !isDone && (
        <>
          {/* <Text variant="sm" weight="light" color="blue80">
            {mode === "capture"
              ? "(직무를 캡쳐하세요)"
              : "(직무를 드래그하세요)"}
          </Text> */}

          <CaptureButton
            onClick={() => {
              if (mode === "drag") startJobDrag();
              else onCaptureClick();
            }}
          >
            {mode === "capture" ? (
              <TbCapture size={28} />
            ) : (
              <LuMousePointerClick size={28} />
            )}
          </CaptureButton>

          <GrayButton onClick={onModeToggle}>
            <Text variant="xs" color="gray80">
              {mode === "capture" ? "직무 드래그로 변경" : "직무 캡쳐로 변경"}
            </Text>
          </GrayButton>
        </>
      )}

      {/* DRAG 안내 */}
      {isDragging && !draftText && (
        <>
          <GradientText className="text-2xl font-semibold">
            직무를 드래그해주세요
          </GradientText>

          <GrayButton onClick={cancelJobDrag}>취소</GrayButton>
        </>
      )}

      {/* 실시간 텍스트 */}
      {isDragging && draftText && (
        <Text variant="2xl" weight="semibold" color="blue80">
          {draftText}
        </Text>
      )}

      {/* 결과 */}
      {isDone && (
        <EditableText
          text={job}
          placeholder="직무 이름"
          isEditable={isJobEditing}
          skipAnimation={!isAutoDetected}
          onEdit={() => setIsJobEditing(true)}
          onClose={() => setIsJobEditing(false)}
          onSave={(value) => {
            const trimmed = value.trim();
            if (!trimmed) {
              reset();
              return;
            }

            setJobManual(trimmed);
            setIsJobEditing(false);
          }}
        />
      )}
    </Container>
  );
}
