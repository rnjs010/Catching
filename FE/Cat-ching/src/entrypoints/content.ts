export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('extension loaded')
    // 자소설닷컴 감지
    if (window.location.href.includes('jasoseol.com')) {
      let lastModalState = false
      let lastUrl = window.location.href

      const sendUpdate = (delay = 1000) => {
        setTimeout(() => {
          browser.runtime.sendMessage({ action: 'jasoseolChanged' })
        }, delay)
      }

      const checkModalState = () => {
        const backdrop = document.querySelector('.recruit-slide-backdrop')
        const hasNoScroll = document.body.classList.contains('no-scroll')
        const isModal = backdrop !== null || hasNoScroll

        if (isModal !== lastModalState) {
          lastModalState = isModal
          sendUpdate()
        }
      }

      const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href
          sendUpdate()
        }
      }

      const observer = new MutationObserver(() => {
        checkModalState()
      })

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        subtree: true
      })

      const originalPushState = history.pushState
      const originalReplaceState = history.replaceState

      history.pushState = function (...args) {
        originalPushState.apply(this, args)
        checkUrlChange()
      }

      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args)
        checkUrlChange()
      }

      window.addEventListener('popstate', checkUrlChange)

      setInterval(() => {
        checkUrlChange()
        checkModalState()
      }, 1000)
    }

    // 잡플래닛 URL 파라미터 변경 감지
    if (window.location.href.includes('jobplanet.co.kr/job/search')) {
      let lastUrl = window.location.href

      const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href
          setTimeout(() => {
            browser.runtime.sendMessage({ action: 'jobplanetChanged' })
          }, 3000)
        }
      }

      const originalPushState = history.pushState
      const originalReplaceState = history.replaceState

      history.pushState = function (...args) {
        originalPushState.apply(this, args)
        checkUrlChange()
      }

      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args)
        checkUrlChange()
      }

      window.addEventListener('popstate', checkUrlChange)
      setInterval(checkUrlChange, 500)
    }

    // 잡다 모달 감지
    if (window.location.href.includes('jobda.im/jobs')) {
      let lastModalState = false

      const sendUpdate = (delay = 500) => {
        setTimeout(() => {
          browser.runtime.sendMessage({ action: 'jobdaChanged' })
        }, delay)
      }

      const checkModalState = () => {
        const modalContent = document.querySelector('#modal ._modal_u2wjv_24')
        const isModal = modalContent !== null

        if (isModal !== lastModalState) {
          lastModalState = isModal
          sendUpdate(500)
        }
      }

      const modalContainer = document.querySelector('#modal')
      
      if (modalContainer) {
        const observer = new MutationObserver(() => {
          checkModalState()
        })

        observer.observe(modalContainer, {
          childList: true,
          subtree: true
        })
      }

      setInterval(checkModalState, 1000)
    }
  },
});
