import { SiteType, DetectResult } from "@/types/feature";

function getSiteFromUrl(url: string): SiteType {
  if (url.includes("jobkorea.co.kr")) return "jobkorea";
  if (url.includes("saramin.co.kr")) return "saramin";
  if (url.includes("wanted.co.kr")) return "wanted";
  if (url.includes("jobplanet.co.kr")) return "jobplanet";
  if (url.includes("jasoseol.com")) return "jasoseol";
  if (url.includes("linkareer.com")) return "linkareer";
  if (url.includes("incruit.com")) return "incruit";
  if (url.includes("catch.co.kr")) return "catch";
  if (url.includes("jobda.im")) return "jobda";
  if (url.includes("rallit.com")) return "rallit";
  return "other";
}

export function extractCompany(site: string, url: string): string | null {
  const querySelect = <T extends Element>(selector: string): string | null => {
    const el = document.querySelector<T>(selector);
    return el?.textContent?.trim() || null;
  };

  if (site === "jobkorea") {
    const urlObj = new URL(url);
    if (url.includes("/Recruit/GI_Read")) {
      return querySelect("h2.Typography_variant_size20__344nw24");
    } else if (
      url.includes("/Recruit/Co_Read") ||
      url.includes("/Recruit/Salary") ||
      url.includes("/Company") ||
      url.includes("/company")
    ) {
      return querySelect("div.company-header-branding-body div.name");
    } else if (url.includes("/Review/ServiceView")) {
      return querySelect("span.co-name");
    } else if (url.includes("/starter/companyreport?")) {
      return urlObj.searchParams.get("schTxt");
    }
  }

  if (site === "saramin") {
    if (url.includes("/zf_user/company-review")) {
      return querySelect("h1.title a");
    } else if (url.includes("/zf_user/company-info")) {
      const el = document.querySelector<HTMLHeadingElement>("h1.tit_company");
      return el?.getAttribute("title")?.trim() || null;
    } else if (url.includes("/jobs/relay")) {
      const match = document.title.match(/^\[([^\]]+)\]/);
      return match ? match[1] : null;
    }
  }

  if (site === "wanted") {
    const match = document.title.match(/^\[([^\]]+)\]/);
    return match ? match[1] : null;
  }

  if (site === "jobplanet") {
    if (url.includes("/job/search")) {
      return querySelect(".company_name a");
    } else if (url.includes("/companies/")) {
      if (url.includes("/interviews/") || url.includes("/benefits/")) {
        return querySelect("h1.companies-company__name");
      }
      return querySelect("h1.text-h5");
    }
  }

  if (site === "jasoseol") {
    // /recruit/숫자 페이지
    if (/\/recruit\/\d+/.test(url)) {
      const isModal =
        document.querySelector(".recruit-slide-backdrop") !== null;

      if (isModal) {
        return querySelect(".ec-name-value");
      } else {
        return querySelect("h2.ml-3");
      }
    }
    const urlObj = new URL(url);

    // 메인 페이지 모달, /intern/숫자 페이지, /training 페이지
    if (
      (urlObj.hostname === "jasoseol.com" &&
        (urlObj.pathname === "/" || urlObj.pathname === "")) ||
      /\/intern\/\d+/.test(url) ||
      urlObj.pathname === "/training"
    ) {
      const isModal = document.body.classList.contains("no-scroll");

      if (isModal) {
        const modals = document.querySelectorAll<HTMLElement>(
          '.transition-left[class*="recruit-slide"]',
        );

        for (const modal of modals) {
          const leftValue = modal.style.left;
          if (leftValue && leftValue.includes("45px")) {
            const el = modal.querySelector<HTMLElement>("h2.ml-3");
            return el?.textContent?.trim() || null;
          }
        }
      }
    }

    // /companies 페이지
    if (url.includes("/companies")) {
      return querySelect("h1.text-gray-900");
    }

    return null;
  }

  if (site === "linkareer") {
    if (url.includes("/company-info")) {
      return querySelect("div.company-details h1");
    } else if (url.includes("/activity")) {
      return querySelect("h2.organization-name");
    }
  }

  if (site === "incruit") {
    if (url.includes("/jobdb_info") || url.includes("/entry/")) {
      return querySelect("div.top-cnt em a");
    } else if (url.includes("/company")) {
      return querySelect("div.name");
    }
  }

  if (site === "catch") {
    if (url.includes("/NCS/RecruitInfoDetails")) {
      const match = document.title.match(/^\[([^\]]+)\]/);
      return match ? match[1] : null;
    } else if (url.includes("/Comp/CompSummary")) {
      return querySelect("div.name h1");
    }
  }

  if (site === "jobda") {
    if (url.includes("/company")) {
      return querySelect("span.companyBannerArea_companyName__oyXyJ");
    } else if (url.includes("/position")) {
      return querySelect("a.title_companyName__dzX3V");
    } else {
      return querySelect("a.jobPostModal_jobPostInfoText__zA5OZ");
    }
  }

  if (site === "rallit") {
    if (url.includes("/companies/")) {
      return querySelect("h1.css-55ww01");
    } else if (url.includes("/positions/")) {
      return querySelect("h2.css-1iscm3n");
    }
  }

  if (site === "other") {
    const bodyText = document.body.innerText || "";
    if (
      url.includes("blog") ||
      url.includes("cafe") ||
      url.includes("tistory") ||
      url.includes("search")
    ) {
      return null;
    } else if (url.includes("news") && !bodyText.includes("채용")) {
      return null;
    } else if (url.includes("recruit") || url.includes("careers")) {
      return (
        document.title
          ?.replace("채용", "")
          .replace("정보", "")
          .replace("careers", "")
          .replace("Careers", "")
          .replace("홈페이지", "")
          .replace("|", "")
          .trim() || null
      );
    } else if (
      bodyText.includes("채용") ||
      bodyText.includes("careers") ||
      bodyText.includes("Careers")
    ) {
      return (
        document.title
          ?.replace("채용", "")
          .replace("정보", "")
          .replace("careers", "")
          .replace("Careers", "")
          .replace("홈페이지", "")
          .replace("|", "")
          .trim() || null
      );
    }
  }

  return null;
}

export async function detectCompany(): Promise<DetectResult> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab.id || !tab.url) {
    return { site: null, company: null };
  }

  const site = getSiteFromUrl(tab.url);

  if (!site) {
    return { site: null, company: null };
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractCompany,
      args: [site, tab.url],
    });
    const company = results[0]?.result || null;

    if (site === "other" && !company) {
      return { site: null, company: null };
    }

    return { site, company };
  } catch (e) {
    console.error("[detectCompany] Script injection failed:", e);
    return { site, company: null };
  }
}

export function onTabChange(callback: () => void): () => void {
  let currentTabId: number | null = null;
  let currentUrl: string | null = null;

  const handleActivated = async (activeInfo: { tabId: number }) => {
    currentTabId = activeInfo.tabId;
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentUrl = tab.url || null;
    setTimeout(callback, 300);
  };

  let pendingUrlChanged = false;
  const handleUpdated = async (
    tabId: number,
    changeInfo: { status?: string; url?: string },
  ) => {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTab?.id !== tabId) return;

    const urlChanged = changeInfo.url && changeInfo.url !== currentUrl;
    const loadingComplete = changeInfo.status === "complete";

    if (urlChanged) {
      currentUrl = changeInfo.url || null;
      pendingUrlChanged = true;
    }

    if (pendingUrlChanged && loadingComplete) {
      pendingUrlChanged = false;

      const site = currentUrl ? getSiteFromUrl(currentUrl) : null;
      const delay = ["jobplanet", "jasoseol"].includes(site ?? "") ? 1000 : 200;
      setTimeout(callback, delay);
    }
  };

  // 페이지 내부 변화 감지
  const handleMessage = (message: { action: string }) => {
    if (
      message.action === "jasoseolChanged" ||
      message.action === "jobplanetChanged" ||
      message.action === "jobdaChanged"
    ) {
      setTimeout(() => {
        callback();
      }, 300);
    }
  };

  browser.tabs.onActivated.addListener(handleActivated);
  browser.tabs.onUpdated.addListener(handleUpdated);
  browser.runtime.onMessage.addListener(handleMessage);

  return () => {
    browser.tabs.onActivated.removeListener(handleActivated);
    browser.tabs.onUpdated.removeListener(handleUpdated);
    browser.runtime.onMessage.removeListener(handleMessage);
  };
}
