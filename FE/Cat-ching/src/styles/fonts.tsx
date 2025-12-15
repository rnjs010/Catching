import { createGlobalStyle } from "styled-components";
import PretendardThin from "@/fonts/Pretendard-Thin.woff";
import PretendardExtraLight from "@/fonts/Pretendard-ExtraLight.woff";
import PretendardLight from "@/fonts/Pretendard-Light.woff";
import PretendardRegular from "@/fonts/Pretendard-Regular.woff";
import PretendardMedium from "@/fonts/Pretendard-Medium.woff";
import PretendardSemiBold from "@/fonts/Pretendard-SemiBold.woff";
import PretendardBold from "@/fonts/Pretendard-Bold.woff";
import PretendardExtraBold from "@/fonts/Pretendard-ExtraBold.woff";
import PretendardBlack from "@/fonts/Pretendard-Black.woff";

export const GlobalFonts = createGlobalStyle`
  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 100;
    font-display: swap;
    src: url(${PretendardThin}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 200;
    font-display: swap;
    src: url(${PretendardExtraLight}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 300;
    font-display: swap;
    src: url(${PretendardLight}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${PretendardRegular}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url(${PretendardMedium}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url(${PretendardSemiBold}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(${PretendardBold}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 800;
    font-display: swap;
    src: url(${PretendardExtraBold}) format("woff");
  }

  @font-face {
    font-family: "Pretendard";
    font-style: normal;
    font-weight: 900;
    font-display: swap;
    src: url(${PretendardBlack}) format("woff");
  }

  html, body {
    font-family: "Pretendard";
  }
`;
