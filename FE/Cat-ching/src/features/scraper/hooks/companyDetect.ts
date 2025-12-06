import { SiteType, DetectResult } from "@/types/feature";

export function getSiteFromUrl(url: string): SiteType {
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

function extractCompany(site: string, url: string): string | null {
  const querySelect = <T extends Element>(selector: string): string | null => {
    const el = document.querySelector<T>(selector);
    return el?.textContent?.trim() || null;
  };

  const removeString = (str: string) => {
    return str
      .replace("careers", "")
      .replace("Careers", "")
      .replace("홈페이지", "")
      .replace("기업정보", "")
      .replace("인재", "")
      .replace("채용", "")
      .replace("정보", "")
      .trim();
  };

  const matchTitle = (): string | null => {
    const match = document.title.match(/^\[([^\]]+)\]/);
    return match ? match[1] : null;
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
    } else if (urlObj.pathname !== "/") {
      const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="writer"]'
      );
      return meta?.content || null;
    }
  }

  if (site === "saramin") {
    if (url.includes("/zf_user/company-review")) {
      return querySelect("h1.title a");
    } else if (url.includes("/zf_user/company-info")) {
      return removeString(querySelect("h1.tit_company")!);
    } else if (url.includes("/jobs/relay")) {
      return matchTitle();
    } else if (url.includes("/write/")) {
      const el = document.querySelectorAll(
        "span.MetaInfo_meta-info__item-desc__Z7Z4v"
      );
      return el[1].textContent?.trim() || null;
    }
  }

  if (site === "wanted") {
    if (url.includes("/company/")) {
      return querySelect("h1.wds-1f8kxw2");
    } else {
      return matchTitle();
    }
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
    const urlObj = new URL(url);

    // 모달 페이지 회사명 찾기
    const getActiveModalCompanyName = () => {
      const modals = document.querySelectorAll<HTMLElement>(
        '.transition-left[class*="recruit-slide"]'
      );

      for (const modal of modals) {
        if (modal.style.left?.includes("45px")) {
          return (
            modal
              .querySelector<HTMLElement>("span.ml-3")
              ?.textContent?.trim() || null
          );
        }
      }
      return null;
    };

    // 모달 여부 확인
    const isModalOpen = () => document.body.classList.contains("no-scroll");

    // recruit 페이지
    if (/\/recruit\/\d+/.test(url)) {
      if (document.querySelector(".recruit-slide-backdrop")) {
        // recruit 상세 모달
        return querySelect(".ec-name-value");
      } else {
        // 일반 recruit 페이지
        return querySelect("span.ml-3");
      }
    }
    // intern 페이지
    else if (/\/intern\/\d+/.test(url)) {
      return isModalOpen()
        ? getActiveModalCompanyName()
        : querySelect("span.ml-3");
    }

    // 메인 페이지 + training 페이지
    const isMainOrTraining =
      urlObj.hostname === "jasoseol.com" &&
      (urlObj.pathname === "/" ||
        urlObj.pathname === "" ||
        urlObj.pathname === "/training");

    if (isMainOrTraining && isModalOpen()) {
      return getActiveModalCompanyName();
    }

    // company 페이지
    if (url.includes("/companies")) {
      return querySelect("h1.text-gray-900");
    }

    if (url.includes("/resume/")) {
      return querySelect("a.company-link");
    }

    return null;
  }

  if (site === "linkareer") {
    if (url.includes("/company-info")) {
      return querySelect("div.company-details h1");
    } else if (url.includes("/activity")) {
      return querySelect("h2.organization-name");
    } else if (url.includes("/channel/")) {
      const title = querySelect("h1.company-title");
      if (!title) {
        return querySelect("div.news-title");
      }
      return title;
    }
  }

  if (site === "incruit") {
    if (url.includes("/jobdb_info") || url.includes("/entry/")) {
      return querySelect("div.top-cnt em a");
    } else if (url.includes("/company")) {
      return querySelect("div.name");
    } else if (url.includes("/datacenter/data")) {
      return querySelect("p.cmp-info-header__name a");
    } else if (url.includes("/coverletter/")) {
      const full = querySelect("h2.subject-text");
      if (full) {
        const title = full.split("20")[0].trim();
        return title;
      }
    }
  }

  if (site === "catch") {
    if (url.includes("/NCS/RecruitInfoDetails")) {
      return matchTitle();
    } else if (url.includes("/Comp/")) {
      return querySelect("div.name h1");
    } else if (url.includes("/JobN/CoverLetter")) {
      return querySelect("dt.tag-space a.name");
    } else if (url.includes("/JobN/Pass/")) {
      return querySelect("div.view p.q");
    }
  }

  if (site === "jobda") {
    if (url.includes("/company")) {
      return querySelect("span.companyBannerArea_companyName__oyXyJ");
    } else if (url.includes("/position")) {
      return querySelect("a.title_companyName__dzX3V");
    } else if (url.includes("/jobs")) {
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
      url.includes("search") ||
      url.includes("/arti/")
    ) {
      return null;
    } else if (url.includes("news") && !bodyText.includes("채용")) {
      return null;
    } else if (url.includes("recruit") || url.includes("careers")) {
      return removeString(document.title);
    } else if (
      bodyText.includes("채용") ||
      bodyText.includes("careers") ||
      bodyText.includes("Careers")
    ) {
      return removeString(document.title);
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
    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractCompany,
      args: [site, tab.url],
    });
    const company = results[0]?.result || null;

    // other 사이트에서 '채용' 단어 못 찾으면 null 반환
    if (site === "other" && !company) {
      return { site: null, company: null };
    }

    return { site, company };
  } catch (e) {
    console.error("Script injection failed:", e);
    return { site, company: null };
  }
}

export function onTabChange(callback: () => void): () => void {
  const handleActivated = () => {
    setTimeout(callback, 100);
  };

  const handleUpdated = (
    tabId: number,
    changeInfo: { status?: string; url?: string }
  ) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
      browser.tabs.query(
        { active: true, currentWindow: true },
        ([activeTab]) => {
          if (activeTab?.id === tabId) {
            setTimeout(callback, 1000);
          }
        }
      );
    }
  };

  const handleMessage = (message: { action: string }) => {
    if (
      message.action === "jasoseolChanged" ||
      message.action === "jobplanetChanged" ||
      message.action === "jobdaChanged"
    ) {
      callback();
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
