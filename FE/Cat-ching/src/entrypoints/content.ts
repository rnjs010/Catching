import { extractCompany } from "@/features/search/services/companyService";
import { showCropOverlay } from "@/features/search/services/showCropOverlay";

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  main() {
    console.log("extension loaded");

    // 자소설닷컴 감지
    if (window.location.href.includes("jasoseol.com")) {
      let lastModalState = false;
      let lastUrl = window.location.href;
      let lastActiveModalIndex: number | null = null;

      const sendUpdate = (delay = 1000) => {
        setTimeout(() => {
          browser.runtime.sendMessage({ action: "jasoseolChanged" });
        }, delay);
      };

      const checkModalState = () => {
        const backdrop = document.querySelector(".recruit-slide-backdrop");
        const hasNoScroll = document.body.classList.contains("no-scroll");
        const isModal = backdrop !== null || hasNoScroll;

        let currentActiveModalIndex: number | null = null;
        // 메인, /training, /intern 페이지에서 45px 모달 스와이프 감지
        // /intern 페이지는 URL 변경 + 45px 모달 스와이프 둘 다 사용
        if (
          isModal &&
          (window.location.pathname === "/" ||
            window.location.pathname === "/training" ||
            window.location.pathname.startsWith("/intern/"))
        ) {
          // left: 45px 스타일을 가진 모달 찾기
          const modals = document.querySelectorAll<HTMLElement>(
            '.transition-left[class*="recruit-slide"]',
          );
          modals.forEach((modal, index) => {
            const leftValue = modal.style.left;
            // left: 45px 형태 체크
            if (leftValue && leftValue.includes("45px")) {
              currentActiveModalIndex = index;
            }
          });
        }

        // 모달 상태 변경 또는 활성 모달 변경 시 업데이트
        if (
          isModal !== lastModalState ||
          (isModal && currentActiveModalIndex !== lastActiveModalIndex)
        ) {
          lastModalState = isModal;
          lastActiveModalIndex = currentActiveModalIndex;
          sendUpdate();
        }
      };

      const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          sendUpdate();
        }
      };

      const observer = new MutationObserver(() => {
        checkModalState();
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
        subtree: true,
      });

      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function (...args: any[]) {
        originalPushState.apply(this, args as any);
        checkUrlChange();
      };

      history.replaceState = function (...args: any[]) {
        originalReplaceState.apply(this, args as any);
        checkUrlChange();
      };

      window.addEventListener("popstate", checkUrlChange);

      setInterval(() => {
        checkUrlChange();
        checkModalState();
      }, 1000);
    }

    // 잡플래닛 URL 파라미터 변경 감지 (없어도 작동하는 듯)
    if (window.location.href.includes("jobplanet.co.kr/job/search")) {
      // let lastUrl = window.location.href;
      // const checkUrlChange = () => {
      //   if (window.location.href !== lastUrl) {
      //     lastUrl = window.location.href;
      //     console.log("잡플래닛 URL 변경 감지");
      //     setTimeout(() => {
      //       browser.runtime.sendMessage({ action: "jobplanetChanged" });
      //     }, 1500);
      //   }
      // };
      // const originalPushState = history.pushState;
      // const originalReplaceState = history.replaceState;
      // history.pushState = function (...args) {
      //   originalPushState.apply(this, args);
      //   checkUrlChange();
      // };
      // history.replaceState = function (...args) {
      //   originalReplaceState.apply(this, args);
      //   checkUrlChange();
      // };
      // window.addEventListener("popstate", checkUrlChange);
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

    // OCR 크롭 UI 및 선택 모니터링 메시지 리스너
    let cancelCropOverlay: (() => void) | null = null;

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "START_CROP") {
        const { promise, cancel } = showCropOverlay(message.screenshot);
        cancelCropOverlay = cancel;
        promise
          .then((croppedImage: string) => {
            cancelCropOverlay = null;
            sendResponse({ croppedImage });
          })
          .catch(() => {
            cancelCropOverlay = null;
            sendResponse({ croppedImage: null });
          });
        return true; // 비동기 응답
      }

      if (message.type === "CANCEL_CROP") {
        console.log("Crop cancelled via message");
        cancelCropOverlay?.();
        cancelCropOverlay = null;
      }

      if (message.type === "START_SELECTION_MONITOR") {
        let isMonitoring = true;

        const handleSelectionChange = () => {
          if (!isMonitoring) return;

          const selectedText = window.getSelection()?.toString().trim() || "";
          browser.runtime.sendMessage({
            type: "SELECTION_UPDATE",
            text: selectedText,
          });
        };

        const handleMouseUp = () => {
          if (!isMonitoring) return;

          const selectedText = window.getSelection()?.toString().trim();
          if (selectedText) {
            isMonitoring = false;
            browser.runtime.sendMessage({
              type: "SELECTION_COMPLETE",
            });
            document.removeEventListener(
              "selectionchange",
              handleSelectionChange,
            );
            document.removeEventListener("mouseup", handleMouseUp);
          }
        };

        document.addEventListener("selectionchange", handleSelectionChange);
        document.addEventListener("mouseup", handleMouseUp);

        sendResponse({ started: true });
        return true;
      }
    });
  },
});
