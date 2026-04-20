import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { FcGoogle } from "react-icons/fc";
import { useAuthStore } from "@/stores/authStore";
import WeeklyPopularChart from "@/features/chart/components/WeeklyPopularChart";

export const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full`}
`;

export const LoginButton = styled.button`
  ${tw`mb-4 mt-16 w-11/12 rounded-xl shadow-lg border flex items-center justify-center gap-2 transition-opacity`}
  background-color: ${colors.blue10};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default function Home() {
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    await login();
  };

  return (
    <>
      <ContentArea>
        {/* CHART */}
        <WeeklyPopularChart />

        {/* GOOGLE LOGIN */}
        <LoginButton onClick={handleLogin} disabled={isLoading}>
          <FcGoogle size={24} />
          <Text variant="xl" color="gray90">
            {isLoading ? "로그인 중..." : "Google로 시작하기"}
          </Text>
        </LoginButton>
      </ContentArea>
    </>
  );
}
