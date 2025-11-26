import { SiteType, DetectResult } from '@/types/feature'

function getSiteFromUrl(url: string): SiteType {
  if (url.includes('jobkorea.co.kr')) return 'jobkorea'
  if (url.includes('saramin.co.kr')) return 'saramin'
  if (url.includes('wanted.co.kr')) return 'wanted'
  if (url.includes('jobplanet.co.kr')) return 'jobplanet'
  if (url.includes('jasoseol.com')) return 'jasoseol'
  if (url.includes('linkareer.com')) return 'linkareer'
  if (url.includes('incruit.com')) return 'incruit'
  if (url.includes('catch.co.kr')) return 'catch'
  if (url.includes('jobda.im')) return 'jobda'
  if (url.includes('rallit.com')) return 'rallit'
  return 'other'
}

function extractCompany(site: string, url: string): string | null {
  if (site === 'jobkorea') {
    if (url.includes('/Recruit/Co_Read') || url.includes('/Company') || url.includes('/company')) {
      const el = document.querySelector<HTMLElement>('div.company-header-branding-body div.name')
      return el?.textContent?.trim() || null
    } else {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="writer"]')
      return meta?.content || null
    }
  }
  
  if (site === 'saramin') {
    if (url.includes('/zf_user/company-review')) {
      const el = document.querySelector<HTMLElement>('h1.title a')
      return el?.textContent?.trim() || null
    } else if (url.includes('/zf_user/company-info')) {
      const el = document.querySelector<HTMLHeadingElement>('h1.tit_company')
      return el?.textContent?.trim() || null
    } else if (url.includes('/jobs/relay')) {
      const match = document.title.match(/^\[([^\]]+)\]/)
      return match ? match[1] : null
    }
  }

  if (site === 'wanted') {
    const match = document.title.match(/^\[([^\]]+)\]/)
    return match ? match[1] : null
  }
  
  if (site === 'jobplanet') {
    if (url.includes('/job/search')) {
      const el = document.querySelector<HTMLElement>('.company_name a')
      return el?.textContent?.trim() || null
    } else if (url.includes('/companies/')) {
      const el = document.querySelector<HTMLHeadingElement>('h1.text-h5')
      return el?.textContent?.trim() || null
    }
  }
  
  if (site === 'jasoseol') {
    // /recruit/숫자 페이지
    if (/\/recruit\/\d+/.test(url)) {
      const isModal = document.querySelector('.recruit-slide-backdrop') !== null
      
      if (isModal) {
        const el = document.querySelector<HTMLElement>('.ec-name-value')
        return el?.textContent?.trim() || null
      } else {
        const el = document.querySelector<HTMLElement>('span.ml-3')
        return el?.textContent?.trim() || null
      }
    }
    const urlObj = new URL(url)

    // 메인 페이지 모달
    if (urlObj.hostname === 'jasoseol.com' && (urlObj.pathname === '/' || urlObj.pathname === '')) {
      const isModal = document.body.classList.contains('no-scroll')
      
      if (isModal) {
        const el = document.querySelector<HTMLElement>('span.ml-3')
        return el?.textContent?.trim() || null
      }
    }
    
    // /companies 페이지
    if (url.includes('/companies')) {
      const el = document.querySelector<HTMLHeadingElement>('h1.text-gray-900')
      return el?.textContent?.trim() || null
    }
    
    return null
  }
  
  if (site === 'linkareer') {
    if (url.includes('/company-info')) {
      const el = document.querySelector<HTMLHeadingElement>('div.company-details h1')
      return el?.textContent?.trim() || null
    } else if (url.includes('/activity')) {
      const el = document.querySelector<HTMLHeadingElement>('h2.organization-name')
      return el?.textContent?.trim() || null
    }
  }

  if (site === 'incruit') {
    if (url.includes('/jobdb_info') || url.includes('/entry/')) {
      const el = document.querySelector<HTMLElement>('div.top-cnt em a')
      return el?.textContent?.trim() || null
    } else if (url.includes('/company')) {
      const el = document.querySelector<HTMLElement>('div.name')
      return el?.textContent?.trim() || null
    }
  }

  if (site === 'catch') {
    if (url.includes('/NCS/RecruitInfoDetails')) {
      const match = document.title.match(/^\[([^\]]+)\]/)
      return match ? match[1] : null
    } else if (url.includes('/Comp/CompSummary')) {
      const el = document.querySelector<HTMLHeadingElement>('div.name h2')
      return el?.textContent?.trim() || null
    }
  }

  if (site === 'jobda') {
    if (url.includes('/company')) {
      const el = document.querySelector<HTMLHeadingElement>('span.companyBannerArea_companyName__oyXyJ')
      return el?.textContent?.trim() || null
    } else if (url.includes('/position')) {
      const el = document.querySelector<HTMLHeadingElement>('a.title_companyName__dzX3V')
      return el?.textContent?.trim() || null
    } else if (url.includes('/jobs')) {
      const el = document.querySelector<HTMLHeadingElement>('a.jobPostModal_jobPostInfoText__zA5OZ')
      return el?.textContent?.trim() || null
    }
  }

  if (site === 'rallit') {
    if (url.includes('/companies/')) {
      const el = document.querySelector<HTMLHeadingElement>('h1.css-55ww01')
      return el?.textContent?.trim() || null
    } else if (url.includes('/positions/')) {
      const el = document.querySelector<HTMLHeadingElement>('h2.css-1iscm3n')
      return el?.textContent?.trim() || null
    }
  }

  if (site === 'other') {
    const bodyText = document.body.innerText || ''
    if (bodyText.includes('채용')) {
      return document.title?.trim() || null
    }
  }
  
  return null
}

export async function detectCompany(): Promise<DetectResult> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  
  if (!tab.id || !tab.url) {
    return { site: null, company: null }
  }

  const site = getSiteFromUrl(tab.url)
  
  if (!site) {
    return { site: null, company: null }
  }

  try {
    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractCompany,
      args: [site, tab.url]
    })
    const company = results[0]?.result || null
    
    // other 사이트에서 '채용' 단어 못 찾으면 null 반환
    if (site === 'other' && !company) {
      return { site: null, company: null }
    }
    
    return { site, company }
  } catch (e) {
    console.error('Script injection failed:', e)
    return { site, company: null }
  }
}

export function onTabChange(callback: () => void): () => void {
  const handleActivated = () => {
    setTimeout(callback, 100)
  }

  const handleUpdated = (
    tabId: number,
    changeInfo: { status?: string; url?: string }
  ) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
      browser.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
        if (activeTab?.id === tabId) {
          setTimeout(callback, 1000)
        }
      })
    }
  }

  const handleMessage = (message: { action: string }) => {
    if (message.action === 'jasoseolChanged' || message.action === 'jobplanetChanged' || message.action === 'jobdaChanged') {
      callback()
    }
  }

  browser.tabs.onActivated.addListener(handleActivated)
  browser.tabs.onUpdated.addListener(handleUpdated)
  browser.runtime.onMessage.addListener(handleMessage)

  return () => {
    browser.tabs.onActivated.removeListener(handleActivated)
    browser.tabs.onUpdated.removeListener(handleUpdated)
    browser.runtime.onMessage.removeListener(handleMessage)
  }
}