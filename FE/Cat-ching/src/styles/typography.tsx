import tw from "twin.macro";
import styled from "styled-components";
import { colors, ColorName } from "./colors";

export const typography = {
  xs: {
    light: tw`font-light text-xs`,
    normal: tw`font-normal text-xs`,
    medium: tw`font-medium text-xs`,
    semibold: tw`font-semibold text-xs`,
    bold: tw`font-bold text-xs`,
    extrabold: tw`font-extrabold text-xs`,
  },
  sm: {
    light: tw`font-light text-sm`,
    normal: tw`font-normal text-sm`,
    medium: tw`font-medium text-sm`,
    semibold: tw`font-semibold text-sm`,
    bold: tw`font-bold text-sm`,
    extrabold: tw`font-extrabold text-sm`,
  },
  base: {
    light: tw`font-light text-base`,
    normal: tw`font-normal text-base`,
    medium: tw`font-medium text-base`,
    semibold: tw`font-semibold text-base`,
    bold: tw`font-bold text-base`,
    extrabold: tw`font-extrabold text-base`,
  },
  lg: {
    light: tw`font-light text-lg`,
    normal: tw`font-normal text-lg`,
    medium: tw`font-medium text-lg`,
    semibold: tw`font-semibold text-lg`,
    bold: tw`font-bold text-lg`,
    extrabold: tw`font-extrabold text-lg`,
  },
  xl: {
    light: tw`font-light text-xl`,
    normal: tw`font-normal text-xl`,
    medium: tw`font-medium text-xl`,
    semibold: tw`font-semibold text-xl`,
    bold: tw`font-bold text-xl`,
    extrabold: tw`font-extrabold text-xl`,
  },
  "2xl": {
    light: tw`font-light text-2xl`,
    normal: tw`font-normal text-2xl`,
    medium: tw`font-medium text-2xl`,
    semibold: tw`font-semibold text-2xl`,
    bold: tw`font-bold text-2xl`,
    extrabold: tw`font-extrabold text-2xl`,
  },
  "3xl": {
    light: tw`font-light text-3xl`,
    normal: tw`font-normal text-3xl`,
    medium: tw`font-medium text-3xl`,
    semibold: tw`font-semibold text-3xl`,
    bold: tw`font-bold text-3xl`,
    extrabold: tw`font-extrabold text-3xl`,
  },
  "4xl": {
    light: tw`font-light text-4xl`,
    normal: tw`font-normal text-4xl`,
    medium: tw`font-medium text-4xl`,
    semibold: tw`font-semibold text-4xl`,
    bold: tw`font-bold text-4xl`,
    extrabold: tw`font-extrabold text-4xl`,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
export type TypographyWeight = keyof (typeof typography)["xs"];

export const Text = styled.span<{
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: ColorName;
  tw?: string;
}>`
  ${({ variant = "lg", weight = "medium" }) => typography[variant][weight]}
  ${({ color }) => color && `color: ${colors[color]};`}
  font-family: 'Pretendard';
  ${({ tw }) => tw && tw}
`;
