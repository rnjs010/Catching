import styled from "styled-components";
import tw from "twin.macro";
import { Search as SearchIcon } from "lucide-react";

const Button = styled.button<{ $isActive: boolean }>`
  ${tw`w-full mt-6 py-3 rounded-xl text-2xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2`}
  background-color: ${(props) => (props.$isActive ? "#3B82F6" : "#D1D5DB")};
  cursor: ${(props) => (props.$isActive ? "pointer" : "not-allowed")};
`;

interface SearchButtonProps {
  isActive: boolean;
  onClick?: () => void;
}

export const SearchButton = ({ isActive, onClick }: SearchButtonProps) => {
  return (
    <Button $isActive={isActive} onClick={onClick} disabled={!isActive}>
      <SearchIcon size={26} />
      탐색하기
    </Button>
  );
};
