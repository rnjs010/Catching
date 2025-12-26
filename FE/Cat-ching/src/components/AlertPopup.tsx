import { motion, AnimatePresence } from "motion/react";
import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";

interface AlertPopupProps {
  isOpen: boolean;
  message: string;
  buttonText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

const Overlay = styled(motion.div)`
  ${tw`fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center`}
  backdrop-filter: blur(2px);
`;

const PopupContainer = styled(motion.div)`
  ${tw`bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100`}
`;

const MessageContainer = styled.div`
  ${tw`mb-8 text-center whitespace-pre-wrap`}
`;

const ButtonGroup = styled.div`
  ${tw`flex gap-3`}
`;

const BaseButton = styled.button`
  ${tw`flex-1 py-3 rounded-xl font-semibold text-base transition-all`}
`;

const ConfirmButton = styled(BaseButton)`
  background-color: #0065ff;
  color: white;

  &:hover {
    background-color: #0052cc;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CancelButton = styled(BaseButton)`
  background-color: #f3f4f6;
  color: #4b5563;

  &:hover {
    background-color: #e5e7eb;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default function AlertPopup({
  isOpen,
  message,
  buttonText = "확인",
  cancelText = "취소",
  showCancel = false,
  onClose,
  onConfirm,
}: AlertPopupProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <PopupContainer
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageContainer>
              <Text
                variant="base"
                weight="medium"
                color="gray90"
                tw="leading-relaxed"
              >
                {message}
              </Text>
            </MessageContainer>

            <ButtonGroup>
              {showCancel && (
                <CancelButton onClick={onClose}>{cancelText}</CancelButton>
              )}
              <ConfirmButton onClick={handleConfirm}>
                {buttonText}
              </ConfirmButton>
            </ButtonGroup>
          </PopupContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
