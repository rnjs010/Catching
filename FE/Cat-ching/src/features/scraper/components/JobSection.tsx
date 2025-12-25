import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { LuMousePointerClick } from "react-icons/lu";
import { TbCapture } from "react-icons/tb";
import { EditableText } from "./EditableText";
import GradientText from "@/components/GradientText";
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
  ${tw`w-16 h-16 p-2 mt-1 rounded-full shadow-custom flex items-center justify-center text-blue-500 bg-blue-50`}
`;

const GrayButton = styled.button`
  ${tw`px-3 py-1.5 mt-4 rounded-full bg-gray-100 underline`}
`;

type JobInputMode = "capture" | "drag";
type ViewState = "idle" | "dragGuide" | "dragPreview" | "result";

const TEXT = {
  dragGuide: "직무를 드래그해주세요",
  toDrag: "직무 드래그로 변경",
  toCapture: "직무 캡쳐로 변경",
} as const;

export default function JobSection({ visible }: { visible: boolean }) {
  const [mode, setMode] = useState<JobInputMode>("capture");
  const toggleInputMode = () => {
    setMode((prev) => (prev === "capture" ? "drag" : "capture"));
  };

  const { phase, draftText, job, isAutoDetected, setJobManual, reset } =
    useJobDragStore();
  const { startJobDrag, cancelJobDrag } = useJobDrag();
  const [isJobEditing, setIsJobEditing] = useState(false);

  const getViewState = (): ViewState => {
    if (phase === "done") return "result";
    if (phase === "dragging" && draftText) return "dragPreview";
    if (phase === "dragging") return "dragGuide";
    return "idle";
  };

  const viewState = getViewState();

  const handleMainAction = () => {
    if (mode === "drag") {
      startJobDrag();
    } else {
      // OCR 직무 캡쳐 로직 추가 예정
    }
  };

  const handleJobSave = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      reset();
      return;
    }

    setJobManual(trimmed);
    setIsJobEditing(false);
  };

  return (
    <Container visible={visible}>
      <Text variant="xl" className="mb-2">
        어떤 직무에 지원할 예정인가요?
      </Text>

      {viewState === "idle" && (
        <>
          <CaptureButton onClick={handleMainAction}>
            {mode === "capture" ? (
              <TbCapture size={28} />
            ) : (
              <LuMousePointerClick size={28} />
            )}
          </CaptureButton>

          <GrayButton onClick={toggleInputMode}>
            <Text variant="xs" color="gray80">
              {mode === "capture" ? TEXT.toDrag : TEXT.toCapture}
            </Text>
          </GrayButton>
        </>
      )}

      {viewState === "dragGuide" && (
        <>
          <GradientText className="text-2xl font-semibold">
            {TEXT.dragGuide}
          </GradientText>

          <GrayButton onClick={cancelJobDrag}>취소</GrayButton>
        </>
      )}

      {viewState === "dragPreview" && (
        <Text variant="2xl" weight="semibold" color="blue80">
          {draftText}
        </Text>
      )}

      {viewState === "result" && (
        <EditableText
          text={job}
          placeholder="직무 이름"
          isEditable={isJobEditing}
          skipAnimation={!isAutoDetected}
          onEdit={() => setIsJobEditing(true)}
          onClose={() => setIsJobEditing(false)}
          onSave={handleJobSave}
        />
      )}
    </Container>
  );
}
