import { useCallback, useRef } from "react";
import {
  ANALYSIS_SECTION_KEYS,
  AnalysisSections,
  AnalysisSource,
  useAnalysisStore,
} from "@/stores/analysisStore";
import {
  startAnalysisSSE,
  AnalysisSSEEvent,
} from "../services/analysisService";
import { parseMarkdownToSections } from "../utils/parseMarkdown";
import { removeSectionTitle } from "../utils/removeSectionTitle";
import { API_BASE_URL } from "@/config/env";
import { useAuthStore } from "@/stores/authStore";

const SECTION_EVENT_MAP = {
  "company-summary": "companySummary",
  "company-issue": "companyIssue",
  "position-main-business": "positionMainBusiness",
  "position-issue": "positionIssue",
} as const;

export const useAnalysisSSE = () => {
  const abortRef = useRef<AbortController | null>(null);
  const sectionBuffers = useRef<Partial<AnalysisSections>>({});

  const {
    setSource,
    source,
    appendSection,
    setAnalysisId,
    setStatus,
    setComplete,
    setLoading,
    setTyping,
    reset,
  } = useAnalysisStore();

  /** 타이핑 유틸 */
  const fakeTyping = async (
    key: keyof AnalysisSections,
    text: string,
    signal: AbortSignal,
    speed = 40
  ) => {
    setLoading(key, false);
    setTyping(key, true);

    for (const chunk of text.split(/(\s+)/)) {
      if (signal.aborted) return;
      appendSection(key, chunk);
      await new Promise((r) => setTimeout(r, speed));
    }

    setTyping(key, false);
  };

  const startTypingSequentially = async (signal: AbortSignal) => {
    for (const key of ANALYSIS_SECTION_KEYS) {
      const text = sectionBuffers.current[key];
      if (text) {
        await fakeTyping(key, text, signal);
      }
    }
    setComplete();
  };

  /** SSE 이벤트 처리 */
  const handleEvent = useCallback(
    (event: AnalysisSSEEvent, signal: AbortSignal) => {
      switch (event.type) {
        case "status":
          setStatus(event.payload);
          break;

        case "source":
          setSource(event.payload as AnalysisSource);
          break;

        case "data":
          if (source === "ai") return;
          console.log("data:", event.payload);
          const parsed = parseMarkdownToSections(event.payload);
          sectionBuffers.current = parsed;
          break;

        case "analysisId":
          setAnalysisId(event.payload);
          break;

        case "complete":
          startTypingSequentially(signal);
          break;

        default:
          if (event.type in SECTION_EVENT_MAP) {
            const key =
              SECTION_EVENT_MAP[event.type as keyof typeof SECTION_EVENT_MAP];
            console.log(event.type, "data:", event.payload);
            sectionBuffers.current[key] = removeSectionTitle(
              event.payload,
              key
            );
          }
      }
    },
    [source]
  );

  const start = useCallback(
    async (params: {
      company: string;
      position: string;
      today: string;
      analysisDepth: string;
      token: string;
    }) => {
      reset();
      sectionBuffers.current = {};

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const executeSSE = async (currentToken: string) => {
        await startAnalysisSSE({
          url: `${API_BASE_URL}/analysis/text`,
          token: currentToken,
          body: params,
          signal: controller.signal,
          onEvent: (event) => handleEvent(event, controller.signal),
        });
      };

      try {
        await executeSSE(params.token);
      } catch (e: any) {
        if (!controller.signal.aborted) {
          if (e.message === "HTTP 401") {
            try {
              // 401 발생 시 authStore의 checkAuth를 호출하여 api 인터셉터의 리프레시 로직을 트리거
              await useAuthStore.getState().checkAuth();
              const newToken = await useAuthStore.getState().getToken();
              
              if (newToken && !controller.signal.aborted) {
                // 성공적으로 발급받은 새 토큰으로 SSE 재시도
                await executeSSE(newToken);
                return;
              }
            } catch (refreshError) {
              console.error("SSE token refresh retry failed:", refreshError);
            }
          }
          console.warn("SSE error", e);
        }
      }
    },
    [handleEvent, reset]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { start, stop };
};
