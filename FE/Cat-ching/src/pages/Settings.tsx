import { useState, useEffect } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { useUserStore } from "@/stores/userStore";
import { updateUserInfo, withdrawAccount } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { Text } from "@/styles/typography";
import { colors } from "@/styles/colors";
import { FiEdit2, FiCheck, FiChevronRight } from "react-icons/fi";
import NotionSettings from "@/features/notion/NotionSettings";
import AlertPopup from "@/components/AlertPopup";

const PageContainer = styled.div`
  ${tw`flex flex-col gap-8 w-full flex-1 animate-fade-in-slow`}
`;

const Section = styled.section`
  ${tw`flex flex-col gap-4`}
`;

const ProfileCard = styled.div`
  ${tw`p-5 rounded-xl border border-gray-100 flex flex-col gap-6`}
  background-color: ${colors.gray10};
`;

const FieldRow = styled.div`
  ${tw`flex justify-between items-center`}
`;

const EditInput = styled.input`
  ${tw`p-2 border rounded-md text-sm outline-none transition-all w-2/3`}
  &:focus {
    border-color: ${colors.blue80};
    box-shadow: 0 0 0 2px ${colors.blue80}10;
  }
`;

const EditButton = styled.button`
  ${tw`flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500`}
  font-size: 0.8rem;
`;

const SaveButton = styled.button`
  ${tw`flex items-center gap-1 p-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm`}
  font-size: 0.8rem;
`;

const LinkSection = styled.div`
  ${tw`flex flex-col border-t border-gray-50 mt-3`}
`;

const LinkItem = styled.div`
  ${tw`flex justify-between items-center px-2 py-2 cursor-pointer hover:opacity-70 transition-opacity`}
  border-bottom: 1px solid ${colors.gray10};
  &:last-child {
    border-bottom: none;
  }
`;

export default function Settings() {
  const { user, setUser } = useUserStore();
  const { logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");

  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    if (user) {
      setNewName(user.userName);
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user?.userName) {
      setIsEditing(false);
      return;
    }

    try {
      const updatedUser = await updateUserInfo(newName);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      setPopupConfig({
        isOpen: true,
        message: "닉네임 변경에 실패했습니다.",
        showCancel: false,
      });
    }
  };

  const handleLogout = () => {
    setPopupConfig({
      isOpen: true,
      message: "로그아웃 하시겠습니까?",
      showCancel: true,
      onConfirm: async () => {
        await logout();
      },
    });
  };

  const handleWithdrawal = () => {
    setPopupConfig({
      isOpen: true,
      message:
        "정말로 회원을 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.",
      showCancel: true,
      onConfirm: async () => {
        try {
          await withdrawAccount();
          await logout(true);
        } catch (error) {
          setPopupConfig({
            isOpen: true,
            message: "회원탈퇴에 실패했습니다.",
            showCancel: false,
          });
        }
      },
    });
  };

  return (
    <PageContainer>
      <Section>
        <Text variant="lg" weight="bold">
          사용자 프로필
        </Text>
        <ProfileCard>
          <FieldRow>
            <div className="flex flex-col gap-1 w-full">
              <Text variant="xs" color="gray50">
                이메일
              </Text>
              <Text variant="sm" weight="medium">
                {user?.email || "-"}
              </Text>
            </div>
          </FieldRow>

          <FieldRow>
            <div className="flex flex-col gap-1 w-full">
              <Text variant="xs" color="gray50">
                닉네임
              </Text>
              <div className="flex items-center justify-between gap-2 mt-1">
                {isEditing ? (
                  <>
                    <EditInput
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                    <SaveButton onClick={handleUpdateName}>
                      <FiCheck /> 완료
                    </SaveButton>
                  </>
                ) : (
                  <>
                    <Text variant="sm" weight="medium">
                      {user?.userName || "-"}
                    </Text>
                    <EditButton onClick={() => setIsEditing(true)}>
                      <FiEdit2 size={14} /> 수정
                    </EditButton>
                  </>
                )}
              </div>
            </div>
          </FieldRow>
        </ProfileCard>
      </Section>

      <Section>
        <Text variant="lg" weight="bold">
          연동 서비스
        </Text>
        <NotionSettings />
      </Section>

      <Section>
        <div className="flex flex-col gap-8">
          <div>
            <Text variant="lg" weight="bold">
              서비스 정보
            </Text>
            <LinkSection>
              <LinkItem
                onClick={() =>
                  window.open("https://cat-ching.netlify.app/privacy", "_blank")
                }
              >
                <Text variant="sm" color="gray70">
                  개인정보 처리방침
                </Text>
                <FiChevronRight color={colors.gray40} />
              </LinkItem>
              <LinkItem
                onClick={() =>
                  window.open("https://cat-ching.netlify.app/terms", "_blank")
                }
              >
                <Text variant="sm" color="gray70">
                  서비스 이용약관
                </Text>
                <FiChevronRight color={colors.gray40} />
              </LinkItem>
            </LinkSection>
          </div>

          <div>
            <Text variant="lg" weight="bold">
              계정 관리
            </Text>
            <LinkSection>
              <LinkItem onClick={handleLogout}>
                <Text variant="sm" color="gray70">
                  로그아웃
                </Text>
                <FiChevronRight color={colors.gray40} />
              </LinkItem>
              <LinkItem onClick={handleWithdrawal}>
                <Text variant="sm" tw="text-red-500">
                  회원탈퇴
                </Text>
                <FiChevronRight color={colors.gray40} />
              </LinkItem>
            </LinkSection>
          </div>
        </div>
      </Section>

      <div className="mt-auto pt-2 pb-6 text-center opacity-30 pointer-events-none">
        <Text variant="xs">
          Cat-ching v{browser.runtime.getManifest().version}
        </Text>
      </div>

      <AlertPopup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        showCancel={popupConfig.showCancel}
        onConfirm={popupConfig.onConfirm}
        onClose={() => setPopupConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </PageContainer>
  );
}
