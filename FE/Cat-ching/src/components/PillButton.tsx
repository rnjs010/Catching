import { ReactNode } from "react";
import styled from "styled-components";

interface PillButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  borderColor?: string;
  pressed?: boolean;
  className?: string;
}

const StyledButton = styled.button<{ $borderColor: string; $pressed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 2px solid ${(props) => props.$borderColor};
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;

  /* 외부 그림자 (기본) */
  box-shadow: ${(props) =>
    props.$pressed
      ? "inset 0 2px 4px rgba(0, 0, 0, 0.1)"
      : "0 2px 8px rgba(0, 0, 0, 0.1)"};

  /* 눌렸을 때 약간 아래로 */
  transform: ${(props) =>
    props.$pressed ? "translateY(1px)" : "translateY(0)"};

  &:hover {
    box-shadow: ${(props) =>
      props.$pressed
        ? "inset 0 2px 4px rgba(0, 0, 0, 0.1)"
        : "0 4px 12px rgba(0, 0, 0, 0.15)"};
    border-color: ${(props) => props.$borderColor};
  }

  &:active {
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    background: gainsboro;
    transform: translateY(1px);
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  font-size: 1.25rem;
`;

export default function PillButton({
  children,
  icon,
  onClick,
  borderColor = "#0065FF",
  pressed = false,
  className = "",
}: PillButtonProps) {
  return (
    <StyledButton
      $borderColor={borderColor}
      $pressed={pressed}
      onClick={onClick}
      className={className}
    >
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {children}
    </StyledButton>
  );
}
