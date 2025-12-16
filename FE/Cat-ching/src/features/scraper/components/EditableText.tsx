import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import SplitText from "@/components/SplitText";
import { Pencil } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";

const Textarea = styled.textarea`
  ${tw`w-full text-2xl font-semibold text-[#0058CC] text-center bg-transparent resize-none`}
  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

const EditIconButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      type="button"
      aria-label="편집"
      onClick={onClick}
      className="p-0 border-0 bg-transparent text-[#9A9A9A] cursor-pointer transition-colors duration-300 hover:text-[#0058CC] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <Pencil size={20} />
    </button>
  );
};

interface EditableTextProps {
  text: string | null;
  isEditable: boolean;
  onEdit: () => void;
  onSave: (newText: string) => void;
  onClose: () => void;
  skipAnimation?: boolean;
  placeholder?: string;
  delayCalculator?: (text: string) => number;
}

export const EditableText = ({
  text,
  isEditable,
  onEdit,
  onSave,
  onClose,
  skipAnimation = false,
  placeholder = "",
  delayCalculator,
}: EditableTextProps) => {
  const [currentText, setCurrentText] = useState(text ?? "");
  const [isAnimationDone, setIsAnimationDone] = useState(true);

  const backupRef = useRef<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCancelingRef = useRef(false);

  useEffect(() => {
    if (!isEditable) {
      setCurrentText(text ?? "");
    }
  }, [text, isEditable]);

  // textarea 자동 높이 조절
  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resize();
  }, [currentText]);

  // 커서 위치 제어
  useEffect(() => {
    if (!isEditable) return;

    const el = textareaRef.current;
    if (!el) return;

    el.focus();

    const len = el.value.length;
    el.setSelectionRange(len, len);
    resize();
  }, [isEditable]);

  // 애니메이션 여부 판단
  useEffect(() => {
    if (!text || skipAnimation) {
      setIsAnimationDone(true);
      return;
    }
    setIsAnimationDone(false);
  }, [text, skipAnimation]);

  const handleEditClick = () => {
    backupRef.current = text ?? "";
    onEdit();
  };

  const saveAndClose = () => {
    onSave(currentText);
    onClose();
  };

  const cancelEdit = () => {
    isCancelingRef.current = true;
    setCurrentText(backupRef.current);
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveAndClose();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleBlur = () => {
    if (isCancelingRef.current) {
      isCancelingRef.current = false;
      return;
    }
    saveAndClose();
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
  };

  const canEdit = Boolean(text) && isAnimationDone && !isEditable;
  const shouldShowStaticText = isAnimationDone || skipAnimation;

  return (
    <div className="flex items-center justify-center gap-2 break-all">
      {isEditable ? (
        <Textarea
          ref={textareaRef}
          rows={1}
          value={currentText}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <>
          {text &&
            (shouldShowStaticText ? (
              <Text variant="2xl" weight="semibold" color="blue80">
                {text}
              </Text>
            ) : (
              <SplitText
                text={text}
                delay={delayCalculator ? delayCalculator(text) : 180}
                onLetterAnimationComplete={() => setIsAnimationDone(true)}
                className="text-2xl font-semibold text-[#0058CC]"
              />
            ))}
        </>
      )}

      {canEdit && <EditIconButton onClick={handleEditClick} />}
    </div>
  );
};
