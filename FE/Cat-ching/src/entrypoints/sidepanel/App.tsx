import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { detectCompany, onTabChange } from '@/features/scraper/hooks/companyDetect'
import styled from 'styled-components';
import tw from 'twin.macro';
import catQLogo from '@/assets/cat_q.png';
import catFLogo from '@/assets/cat_f.png';

const queryClient = new QueryClient()

const CenteredWrapper = styled.div`
  ${tw`flex items-center justify-center min-h-screen p-4`}
`;

const PopupContainer = styled.div`
  ${tw`p-6 max-w-sm mx-auto bg-white shadow-xl rounded-xl`}
  width: 300px;
`;

const Header = styled.div`
  /* 가운데 정렬 */
  ${tw`flex flex-col items-center justify-center mb-4 pb-2`}
`;

const Title = styled.h1`
  ${tw`text-2xl font-extrabold text-gray-900 mt-2`}
`;

const CatImage = styled.img<{ isFound: boolean }>`
  ${tw`h-16 w-16 transition-transform duration-500 ease-in-out mx-auto mt-0`}
  transform: rotate(${props => props.isFound ? '0deg' : '15deg'});
`;

const ContentArea = styled.div`
  ${tw`mt-4 text-center`}
`;

const SiteInfo = styled.p`
  ${tw`mb-2 text-gray-700 block`}
`;

const CompanyName = styled.span`
  ${tw`font-mono text-lg font-extrabold text-blue-600 truncate block`}
`;

const AlertMessage = styled.p`
  ${tw`text-sm font-extrabold text-red-600 bg-red-100 p-3 rounded-lg border border-red-300`}
`;

const IsFound = styled.h3<{ isFound: boolean }>`
  ${tw`text-2xl font-extrabold mt-2 mb-0`}
  color: ${props => (props.isFound ? '#0065FF' : '#111827')};
`

function MainPopup() {
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
    <PopupContainer>
      <Header>
        <Title>Cat-ching</Title>
        <IsFound isFound={isCompanyFound}>{isCompanyFound ? '!' : '?'}</IsFound>
        <CatImage 
          src={isCompanyFound ? catFLogo : catQLogo} 
          alt="Cat Logo" 
          isFound={isCompanyFound} 
        />
      </Header>
      <ContentArea>
        {currentSite ? (
          <SiteInfo>
            회사명:
            <CompanyName>{company || '찾을 수 없음'}</CompanyName>
          </SiteInfo>
        ) : (
          <AlertMessage>지원하는 구직사이트에서 사용해주세요</AlertMessage>
        )}
      </ContentArea>
    </PopupContainer>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CenteredWrapper>
        <MainPopup />
      </CenteredWrapper>
    </QueryClientProvider>
  )
}

export default App;
