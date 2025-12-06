import { extractCompany } from "@/features/scraper/services/companyService";

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  main() {
    console.log("extension loaded");

    // 자소설닷컴 감지
    if (window.location.href.includes("jasoseol.com")) {
      let lastModalState = false;
      let lastCompanyName: string | null = null;
      const isMainPage =
        window.location.pathname === "/" || window.location.pathname === "";

      if (!isMainPage) return;

      const sendUpdate = (delay = 200) => {
        setTimeout(() => {
          browser.runtime.sendMessage({ action: "jasoseolChanged" });
        }, delay);
      };

      const getCompanyName = () => {
        return extractCompany("jasoseol", window.location.href);
      };

      const checkState = () => {
        const isModal = document.body.classList.contains("no-scroll");
        const companyName = getCompanyName();

        const modalChanged = isModal !== lastModalState;
        const companyChanged =
          companyName !== null && companyName !== lastCompanyName;

        if (modalChanged || companyChanged) {
          lastModalState = isModal;
          lastCompanyName = companyName;
          sendUpdate();
        }
      };

      const portalRoot = document.querySelector("#portal");
      if (portalRoot) {
        const observer = new MutationObserver(() => {
          checkState();
        });
        observer.observe(portalRoot, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    }

    // 잡플래닛 URL 파라미터 변경 감지
    if (window.location.href.includes("jobplanet.co.kr/job/search")) {
      let lastUrl = window.location.href;

      const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          console.log("잡플래닛 URL 변경 감지");
          setTimeout(() => {
            browser.runtime.sendMessage({ action: "jobplanetChanged" });
          }, 1500);
        }
      };

      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function (...args) {
        originalPushState.apply(this, args);
        checkUrlChange();
      };

      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        checkUrlChange();
      };

      window.addEventListener("popstate", checkUrlChange);
    }

    // 잡다 모달 감지
    if (window.location.href.includes("jobda.im")) {
      let lastCompanyName: string | null = null;
      let lastModalState = false;

      const sendUpdate = (delay = 300) => {
        setTimeout(() => {
          browser.runtime.sendMessage({ action: "jobdaChanged" });
        }, delay);
      };

      const getCompanyName = () =>
        extractCompany("jobda", window.location.href);

      const isModalOpen = () => {
        return document.querySelector("#modal ._modal_u2wjv_24") !== null;
      };

      const checkState = () => {
        const modal = isModalOpen();
        const companyName = getCompanyName();

        const modalChanged = modal !== lastModalState;
        const companyChanged =
          companyName !== lastCompanyName && companyName !== null;
        if (modalChanged || (modal && companyChanged)) {
          lastModalState = modal;
          lastCompanyName = companyName;
          sendUpdate(100);
        }
      };

      const modalRoot = document.querySelector("#modal");
      if (modalRoot) {
        const observer = new MutationObserver(() => {
          checkState();
        });

        observer.observe(modalRoot, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    }
  },
});
