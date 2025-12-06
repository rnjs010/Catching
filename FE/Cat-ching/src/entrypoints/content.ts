import { showCropOverlay } from "@/features/OCR/hooks/cropOverlay";

export default defineContentScript({
  matches: ["<all_urls>"],
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
            '.transition-left[class*="recruit-slide"]'
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

      history.pushState = function (...args) {
        originalPushState.apply(this, args);
        checkUrlChange();
      };

      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        checkUrlChange();
      };

      window.addEventListener("popstate", checkUrlChange);

      setInterval(() => {
        checkUrlChange();
        checkModalState();
      }, 1000);
    }

    // 잡플래닛 URL 파라미터 변경 감지
    if (window.location.href.includes("jobplanet.co.kr/job/search")) {
      let lastUrl = window.location.href;

      const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          setTimeout(() => {
            browser.runtime.sendMessage({ action: "jobplanetChanged" });
          }, 3000);
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
      setInterval(checkUrlChange, 500);
    }

    // 잡다 모달 감지
    if (window.location.href.includes("jobda.im/jobs")) {
      let lastModalState = false;
      let lastCompanyName: string | null = null;

      const sendUpdate = (delay = 500) => {
        setTimeout(() => {
          browser.runtime.sendMessage({ action: "jobdaChanged" });
        }, delay);
      };

      const checkModalState = () => {
        // #modal 안에 자식 요소가 있는지 확인 -> 자식 div._modal_u2wjv_24가 생기면 모달창 생긴 것.
        const modalContainer = document.querySelector("#modal");
        const isModal = !!(
          modalContainer && modalContainer.children.length > 0
        );

        // 모달이 열려있으면 회사명도 체크 -> 열린 채로 옆으로 넘기는 경우도 확인하기 위함
        let currentCompanyName: string | null = null;
        if (isModal) {
          const companyElement = document.querySelector<HTMLElement>(
            "a.jobPostModal_jobPostInfoText__zA5OZ"
          );
          currentCompanyName = companyElement?.textContent?.trim() || null;
        }

        // 모달 상태가 변경되었거나, 모달 내 회사명이 변경되었으면 업데이트
        if (
          isModal !== lastModalState ||
          (isModal && currentCompanyName !== lastCompanyName)
        ) {
          lastModalState = isModal;
          lastCompanyName = currentCompanyName;
          sendUpdate(500);
        }
      };

      // MutationObserver로 #modal 감지
      const setupObserver = () => {
        const modalContainer = document.querySelector("#modal");

        if (modalContainer) {
          const observer = new MutationObserver(() => {
            checkModalState();
          });

          observer.observe(modalContainer, {
            childList: true,
            subtree: true,
          });

          console.log("Jobda modal observer set up");
          return true;
        }
        return false;
      };

      // 즉시 시도
      if (!setupObserver()) {
        // #modal이 아직 없으면 body를 감시하다가 #modal이 생기면 설정
        const bodyObserver = new MutationObserver(() => {
          if (setupObserver()) {
            bodyObserver.disconnect();
          }
        });

        bodyObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      setInterval(checkModalState, 1000);
    }

    // OCR 크롭 UI 및 선택 모니터링 메시지 리스너
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "START_CROP") {
        showCropOverlay(message.screenshot)
          .then((croppedImage: string) => {
            sendResponse({ croppedImage });
          })
          .catch(() => {
            sendResponse({ croppedImage: null });
          });
        return true; // 비동기 응답을 위해 true 반환
      }

      if (message.type === "START_SELECTION_MONITOR") {
        // 선택 모니터링 시작
        let isMonitoring = true;

        const handleSelectionChange = () => {
          if (!isMonitoring) return;

          const selectedText = window.getSelection()?.toString().trim() || "";
          // 실시간 업데이트 전송
          browser.runtime.sendMessage({
            type: "SELECTION_UPDATE",
            text: selectedText,
          });
        };

        const handleMouseUp = () => {
          if (!isMonitoring) return;

          const selectedText = window.getSelection()?.toString().trim();
          if (selectedText) {
            // 최종 선택 완료
            isMonitoring = false;
            browser.runtime.sendMessage({
              type: "SELECTION_COMPLETE",
            });
            // 리스너 제거
            document.removeEventListener(
              "selectionchange",
              handleSelectionChange
            );
            document.removeEventListener("mouseup", handleMouseUp);
          }
        };

        // selectionchange 이벤트로 실시간 감지
        document.addEventListener("selectionchange", handleSelectionChange);
        // mouseup 이벤트로 선택 완료 감지
        document.addEventListener("mouseup", handleMouseUp);

        sendResponse({ started: true });
        return true;
      }
    });
  },
});
