import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import SplitText from "@/components/SplitText";
import GradientText from "@/components/GradientText";
import { EditButton } from "./EditButton";

const EditInput = styled.input`
  ${tw`text-3xl font-semibold text-blue-600 text-center bg-transparent focus:outline-none`}
  outline: none !important;
  box-shadow: none !important;
  max-width: 100%;

  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }
`;

const EditTextarea = styled.textarea`
  ${tw`text-3xl font-semibold text-blue-600 text-center bg-transparent focus:outline-none resize-none`}
  outline: none !important;
  box-shadow: none !important;
  max-width: 100%;

  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }
`;

const TextDisplay = styled.span`
  ${tw`text-3xl font-semibold text-blue-600`}
`;

interface EditableTextProps {
  text: string | null;
  isLoaded: boolean;
  isEditable: boolean;
  hasAnimated: boolean;
  onEdit: () => void;
  onSave: (newText: string) => void;
  onCancel: () => void;
  skipAnimation?: boolean;
  placeholder?: string;
  delayCalculator?: (text: string) => number;
  onAnimationComplete?: () => void;
}

export const EditableText = ({
  text,
  isLoaded,
  isEditable,
  hasAnimated,
  onEdit,
  onSave,
  onCancel,
  skipAnimation = false,
  placeholder = "",
  delayCalculator,
  onAnimationComplete,
}: EditableTextProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [editRows, setEditRows] = useState<number>(1);
  const [backup, setBackup] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState<string>(text || "");

  const handleEditClick = () => {
    setBackup(text);
    // span 크기 측정
    if (spanRef.current) {
      const height = spanRef.current.offsetHeight;
      setEditRows(Math.round(height / 36));
    }
    onEdit();
  };

  const handleSave = () => {
    onSave(currentText);
    onCancel(); // 편집 모드 종료
  };

  const handleCancel = () => {
    if (backup !== null) {
      setCurrentText(backup);
      onSave(backup);
    }
    onCancel();
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCurrentText(e.target.value);
  };

  useEffect(() => {
    if (!isEditable) {
      setCurrentText(text || "");
    }
  }, [text, isEditable]);

  return (
    <div className="flex items-center justify-center gap-2 break-all">
      {isEditable ? (
        editRows === 1 ? (
          <EditInput
            value={currentText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
          />
        ) : (
          <EditTextarea
            value={currentText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            rows={editRows}
          />
        )
      ) : (
        <>
          {text ? (
            hasAnimated || skipAnimation ? (
              <TextDisplay ref={spanRef}>{text}</TextDisplay>
            ) : (
              <SplitText
                text={text}
                delay={delayCalculator ? delayCalculator(text) : 180}
                onLetterAnimationComplete={onAnimationComplete}
              />
            )
          ) : (
            <GradientText>{placeholder}</GradientText>
          )}
        </>
      )}
      {isLoaded && !isEditable && <EditButton onClick={handleEditClick} />}
    </div>
  );
};
