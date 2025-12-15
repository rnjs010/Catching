import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoBarChartOutline } from "react-icons/io5";

export const HeaderWrapper = styled.div`
  ${tw`w-full flex justify-between items-center px-1 py-3 sticky top-0 z-10`}
  background-color: ${colors.gray10};
`;

export default function Header() {
  return (
    <HeaderWrapper>
      <RxHamburgerMenu size={24} />
      <Text variant="xl" weight="normal">
        <Text color="blue80">C</Text>at-ching
      </Text>
      <IoBarChartOutline size={24} />
    </HeaderWrapper>
  );
}
