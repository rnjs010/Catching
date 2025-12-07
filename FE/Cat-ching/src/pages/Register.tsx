import { useState } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import Stepper, { Step } from "@/components/Stepper";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "@/stores/authStore";
import { updateUserInfo } from "@/services/authService";
import { motion } from "motion/react";

const Container = styled.div`
  ${tw`flex flex-col items-center justify-center flex-1 w-full p-4`}
`;

const InputField = styled.input`
  ${tw`w-full px-4 py-2 text-sm border rounded-lg`}
  border-color: #e5e7eb;

  &:focus {
    outline: none;
    border-color: #0065ff;
  }
`;

export default function Register() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [name, setName] = useState(user?.name || "");
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      // 이름이 변경되었으면 업데이트
      if (name !== user?.name) {
        const updatedUser = await updateUserInfo(name);
        setUser(updatedUser);
      }

      // 1초 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // isNewUser를 false로 변경하여 Search 페이지로 이동
      useAuthStore.setState({ isNewUser: false });
    } catch (error) {
      console.error("사용자 정보 업데이트 실패:", error);
      setIsCompleting(false);
    }
  };

  if (isCompleting) {
    return (
      <Container>
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <Text variant="xl" weight="bold">
            회원가입 완료!
          </Text>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container>
      <Stepper
        initialStep={1}
        backButtonText="Previous"
        nextButtonText="Next"
        onFinalStepCompleted={handleComplete}
        stepCircleContainerClassName="w-full max-w-md"
      >
        <Step>
          <div className="py-8 text-center">
            <Text variant="lg" weight="bold">
              Cat-ching에 오신 것을
              <br />
              환영합니다!
            </Text>
          </div>
        </Step>

        <Step>
          <div className="py-8 text-center">
            <Text variant="lg" weight="bold">
              해당 이메일로 가입하신 것이 맞나요?
            </Text>
            <br />
            <Text variant="sm" weight="normal" color="gray60">
              {user?.email}
            </Text>
          </div>
        </Step>

        <Step>
          <div className="py-8">
            <Text variant="lg" weight="bold">
              사용하실 닉네임을
              <br />
              입력해주세요!
            </Text>
            <br />
            <Text variant="xs" weight="normal" color="gray60">
              변경 없이 계속하실 수 있습니다.
            </Text>
            <br />
            <br />
            <InputField
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="닉네임"
              autoFocus
            />
          </div>
        </Step>

        <Step>
          <div className="py-8 text-center">
            <Text variant="xl" weight="bold">
              회원가입 완료!
            </Text>
          </div>
        </Step>
      </Stepper>
    </Container>
  );
}
