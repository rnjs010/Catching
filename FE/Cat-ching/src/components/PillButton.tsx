import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { ColorName, colors } from "@/styles/colors";
import { ReactNode } from "react";

interface PillButtonProps {
  text?: string;
  icon?: ReactNode;
  onClick?: () => void;
  borderColor?: ColorName;
  className?: string;
  disabled?: boolean;
}

const StyledButton = styled.button<{
  $borderColor: ColorName;
  $disabled: boolean;
}>`
  ${tw`flex items-center gap-1 px-2 py-1 rounded-full 
  bg-white border-2 shadow-sm transition-all duration-200`}

  border-color: ${({ $borderColor }) => colors[$borderColor]};

  ${({ $disabled }) =>
    $disabled
      ? tw`pointer-events-none opacity-50 bg-gray-200`
      : tw`cursor-pointer`}

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(1px);
    background: #f0f0f0;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
`;

export default function PillButton({
  text,
  icon,
  onClick,
  borderColor = "blue60",
  className = "",
  disabled = false,
}: PillButtonProps) {
  return (
    <StyledButton
      $borderColor={borderColor}
      disabled={disabled}
      $disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {text && <Text variant="xs">{text}</Text>}
    </StyledButton>
  );
}
