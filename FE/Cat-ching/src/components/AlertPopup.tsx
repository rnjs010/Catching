import { motion, AnimatePresence } from "motion/react";
import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";

interface AlertPopupProps {
  isOpen: boolean;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  ${tw`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center`}
`;

const PopupContainer = styled(motion.div)`
  ${tw`bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl`}
`;

const MessageContainer = styled.div`
  ${tw`mb-6 text-center`}
`;

const Button = styled.button`
  ${tw`w-full py-2 rounded-lg font-medium text-lg transition-colors`}
  background-color: #0065FF;
  color: white;

  &:hover {
    background-color: #0052cc;
  }

  &:active {
    background-color: #003d99;
  }
`;

export default function AlertPopup({
  isOpen,
  message,
  buttonText = "확인",
  onClose,
}: AlertPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <PopupContainer
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageContainer>
              <Text variant="lg" weight="normal">
                {message}
              </Text>
            </MessageContainer>

            <Button onClick={onClose}>{buttonText}</Button>
          </PopupContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
