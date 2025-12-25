import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import catQLogo from "@/assets/cat_q.png";
import catFLogo from "@/assets/cat_f.png";
import { EditableText } from "./EditableText";
import GradientText from "@/components/GradientText";

const Container = styled.div<{ lifted: boolean }>`
  ${tw`flex flex-col items-center justify-center text-center transition-transform duration-1000 ease-out`}

  ${({ lifted }) => (lifted ? tw`-translate-y-4` : tw`translate-y-0`)}
`;

const CatImage = styled.img<{ isFound: boolean }>`
  ${tw`h-16 w-16 transition-transform duration-500 ease-in-out mx-auto mt-0 mb-4`}
  transform: rotate(${({ isFound }) => (isFound ? 0 : 15)}deg);
`;

interface Props {
  companyValue: string | null;
  companyState: "loading" | "analyzing" | "empty" | "ready";
  isEditing: boolean;
  isAutoDetected: boolean;
  onEdit: () => void;
  onClose: () => void;
  onSave: (value: string) => void;
}

export default function CompanySection({
  companyValue,
  companyState,
  isEditing,
  isAutoDetected,
  onEdit,
  onClose,
  onSave,
}: Props) {
  const ui = {
    hasCompany: Boolean(companyValue),
    text: companyValue ? "!" : "?",
    color: companyValue ? "blue70" : "black",
    image: companyValue ? catFLogo : catQLogo,
  } as const;

  const isEditableVisible =
    companyState === "empty" || companyState === "ready";
  const displayText = companyValue ?? "직접 입력해주세요";

  return (
    <Container lifted={!!companyValue}>
      <Text variant="2xl" weight="extrabold" color={ui.color}>
        {ui.text}
      </Text>
      <CatImage src={ui.image} alt="Cat Logo" isFound={ui.hasCompany} />
      <Text variant="xl" className="mb-2">
        어떤 회사를 탐색할까요?
      </Text>

      {companyState === "loading" && (
        <GradientText className="text-2xl font-semibold">
          페이지 로딩중...
        </GradientText>
      )}

      {companyState === "analyzing" && (
        <GradientText className="text-2xl font-semibold">
          채용 공고 분석 중...
        </GradientText>
      )}

      {isEditableVisible && (
        <EditableText
          text={displayText}
          placeholder="회사 이름"
          isEditable={isEditing}
          skipAnimation={!isAutoDetected}
          onEdit={onEdit}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Container>
  );
}
