import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { detectCompany, onTabChange } from '@/features/scraper/hooks/companyDetect'
import styled from 'styled-components';
import tw from 'twin.macro';
import catQLogo from '@/assets/cat_q.png';
import catFLogo from '@/assets/cat_f.png';
import GradientText from '@/components/GradientText';
import SplitText from '@/components/SplitText';

const queryClient = new QueryClient()

const Header = styled.h1`
  ${tw`flex flex-col items-center justify-center mt-4 pb-1`}
`;

const CatImage = styled.img<{ isFound: boolean }>`
  ${tw`h-16 w-16 transition-transform duration-500 ease-in-out mx-auto mt-0`}
  transform: rotate(${props => props.isFound ? '0deg' : '15deg'});
`;

export const ContentArea = styled.div`
  ${tw`flex flex-col items-center justify-center text-center flex-1 w-full`}
`;

const SiteInfo = styled.p`
  ${tw`mb-2 text-gray-700 block`}
`;

const CompanyName = styled.div`
  ${tw`text-3xl font-semibold text-blue-600 truncate block mb-2`}
`;

const AlertMessage = styled.p`
  ${tw`text-sm font-extrabold text-red-600 bg-red-100 p-3 m-4 rounded-lg border border-red-300`}
`;

const IsFound = styled.h3<{ isFound: boolean }>`
  ${tw`text-2xl font-extrabold`}
  color: ${props => (props.isFound ? '#0065FF' : '#111827')};
  margin: -0.5rem;
`

function Search() {
  const [company, setCompany] = useState<string | null>(null)
  const [currentSite, setCurrentSite] = useState<string | null>(null)
  
  // 회사를 찾았는지 여부를 판단하는 상태
  const isCompanyFound = !!company; 

  const fetchData = useCallback(async () => {
    const result = await detectCompany()
    setCurrentSite(result.site)
    setCompany(result.company)
  }, [])

  useEffect(() => {
    fetchData()
    const cleanup = onTabChange(() => {
      fetchData()
    })
    return cleanup
  }, [fetchData])

  return (
    <QueryClientProvider client={queryClient}>
      <ContentArea>
        <IsFound isFound={isCompanyFound}>{isCompanyFound ? '!' : '?'}</IsFound>
        <CatImage 
          src={isCompanyFound ? catFLogo : catQLogo} 
          alt="Cat Logo" 
          isFound={isCompanyFound} 
        />
        {currentSite ? (
          <SiteInfo>
            <Header className='text-2xl font-semibold'>어떤 회사를 탐색할까요?</Header>
            <CompanyName>{company ? <SplitText text={company} delay={180} /> : <GradientText children="채용 공고 분석 중..." />}</CompanyName>
          </SiteInfo>
        ) : (
          <AlertMessage>지원하는 구직사이트에서 사용해주세요</AlertMessage>
        )}
      </ContentArea>
    </QueryClientProvider>
  )
}

export default Search;
