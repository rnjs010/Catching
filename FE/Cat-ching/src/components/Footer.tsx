import styled from "styled-components";
import tw from "twin.macro";
import { colors } from "@/styles/colors";
import { GoMail } from "react-icons/go";
import { CiGlobe, CiStar } from "react-icons/ci";

export const FooterWrapper = styled.div`
  ${tw`w-full flex justify-between px-2 py-4 sticky bottom-0 z-10 border-t`}
  background-color: ${colors.gray10};
`;

export const RowBox = styled.div<{ gap?: string }>`
  ${tw`flex justify-center`}
  color: ${colors.gray40};
  ${({ gap }) => gap && `gap: ${gap};`}
`;

export default function Footer() {
  return (
    <FooterWrapper>
      <RowBox gap="4px">
        <GoMail size={20} />
        <CiGlobe size={20} />
      </RowBox>

      <RowBox>
        <CiStar size={20} />
        <CiStar size={20} />
        <CiStar size={20} />
        <CiStar size={20} />
        <CiStar size={20} />
      </RowBox>
    </FooterWrapper>
  );
}
