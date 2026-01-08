import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "@/styles/typography";
import catLogo from "@/assets/cat_glass.png";
import { ChevronDown, ChevronRight, Pin } from "lucide-react";
import { SiNotion } from "react-icons/si";
import { GrDocumentPdf } from "react-icons/gr";
import { useState } from "react";

const PageLayout = styled.div`
  ${tw`relative flex flex-col flex-1 w-full items-center`}
`;

const QueryText = styled.div`
  ${tw`bg-[#0065FF] px-2 py-1 mb-2 rounded-lg self-end`}
`;

const ResultCard = styled.div`
  ${tw`w-full h-[480px] flex flex-col rounded-lg border border-[#ECE9E9] shadow-md`}
`;

const JobTitle = styled.div`
  ${tw`p-2 rounded-t-lg bg-[#E0EEFF]`}
`;

const ScrollArea = styled.div`
  ${tw`flex-1 overflow-y-auto space-y-3 p-2 rounded-b-lg bg-[#FBFAFA]`}

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SectionWrapper = styled.div`
  ${tw`space-y-2`}
`;

const SectionHeader = styled.button`
  ${tw`w-full flex items-center justify-between p-1 rounded-lg bg-[#B3D4FF]`}
`;

const SectionContent = styled.div`
  ${tw`px-1.5`}
`;

const ItemTitle = styled.p`
  ${tw`font-semibold text-gray-900`}
`;

const ItemDesc = styled.p`
  ${tw`text-xs text-gray-500 leading-relaxed whitespace-pre-line`}
`;

export default function Result() {
  const [open, setOpen] = useState({
    basic: false,
    business: true,
    issue: false,
  });

  return (
    <PageLayout>
      <img src={catLogo} alt="Cat Logo" className="w-10" />

      <QueryText>
        <Text variant="xs" color="gray10">
          현대오토에버의 MES 시스템 개발 직무에 대해 검색해줘.
        </Text>
      </QueryText>

      <ResultCard>
        <JobTitle>
          <Text variant="sm" color="gray80">
            🔎 현대오토에버 MES 시스템 개발 직무
          </Text>
        </JobTitle>

        {/* 스크롤 영역 */}
        <ScrollArea>
          {/* 기본 정보 */}
          <SectionWrapper>
            <SectionHeader
              onClick={() => setOpen((p) => ({ ...p, basic: !p.basic }))}
            >
              <Text variant="base" color="gray95">
                🏢 기본 정보
              </Text>
              {open.basic ? <ChevronDown /> : <ChevronRight />}
            </SectionHeader>

            {open.basic && (
              <SectionContent>
                <p>회사명: 현대오토에버</p>
                <p>산업: IT 서비스 / 모빌리티</p>
                <p>주요 고객: 현대자동차그룹</p>
              </SectionContent>
            )}
          </SectionWrapper>

          {/* 핵심 사업 */}
          <SectionWrapper>
            <SectionHeader
              onClick={() => setOpen((p) => ({ ...p, business: !p.business }))}
            >
              <Text variant="base" color="gray95">
                🔧 핵심 사업
              </Text>
              {open.business ? <ChevronDown /> : <ChevronRight />}
            </SectionHeader>

            {open.business && (
              <SectionContent>
                <div>
                  <ItemTitle>
                    1. 커넥티드카 플랫폼{" "}
                    <Pin size={14} className="inline ml-1" />
                  </ItemTitle>
                  <ItemDesc>
                    차량 원격 제어, 실시간 차량 상태 정보, 차량 데이터 수집/가공
                    차량 내 인포테인먼트(IVI), 디지털 키, 내비게이션 서비스 OTA
                    업데이트 시스템 구축 및 운영 백엔드 기술: API Gateway,
                    실시간 스트리밍, 차량 통신 프로토콜
                  </ItemDesc>
                </div>

                <div>
                  <ItemTitle>
                    2. 모빌리티 서비스 플랫폼{" "}
                    <Pin size={14} className="inline ml-1" />
                  </ItemTitle>
                  <ItemDesc>
                    차량 호출/예약, 카셰어링, 차량 배차 시스템 위치 기반
                    서비스(LBS), 실시간 교통 데이터 처리 대규모 트래픽을
                    처리하는 클라우드 기반 백엔드 인프라 MSA 구조 적용
                  </ItemDesc>
                </div>

                <div>
                  <ItemTitle>
                    3. 자율주행·지도·검증 시스템{" "}
                    <Pin size={14} className="inline ml-1" />
                  </ItemTitle>
                  <ItemDesc>
                    고정밀지도(HD Map) 구축 및 업데이트 자율주행 SW 검증
                    시뮬레이션(HIL/SIL) 주행 데이터 관리 및 AI 판단 모델 학습
                    분산 데이터 처리, 대용량 로그 수집
                  </ItemDesc>
                </div>
              </SectionContent>
            )}
          </SectionWrapper>

          {/* 최신 주요 이슈 */}
          <SectionWrapper>
            <SectionHeader
              onClick={() => setOpen((p) => ({ ...p, issue: !p.issue }))}
            >
              <Text variant="base" color="gray95">
                📌 최신 주요 이슈
              </Text>
              {open.issue ? <ChevronDown /> : <ChevronRight />}
            </SectionHeader>

            {open.issue && (
              <SectionContent>
                <p>• 매출 성장 지속</p>
                <p>• 차량 SW·모빌리티 플랫폼 투자 확대</p>
                <p>• 글로벌 SaaS·보안 기업과 협력 강화</p>
              </SectionContent>
            )}
          </SectionWrapper>
        </ScrollArea>
      </ResultCard>
    </PageLayout>
  );
}
