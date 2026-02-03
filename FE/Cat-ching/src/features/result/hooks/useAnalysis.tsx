import { useCallback, useRef } from "react";
import {
  AnalysisSections,
  AnalysisSource,
  useAnalysisStore,
} from "@/stores/analysisStore";
import { startAnalysisSSE } from "../services/analysisService";
import { parseMarkdownToSections } from "../utils/parseMarkdown";
import { removeSectionTitle } from "../utils/removeSectionTitle";
import { API_BASE_URL } from "@/config/env";

const SECTION_ORDER: (keyof AnalysisSections)[] = [
  "companySummary",
  "companyIssue",
  "positionMainBusiness",
  "positionIssue",
];

export const useAnalysisSSE = () => {
  const abortRef = useRef<AbortController | null>(null);

  // SSE로 받은 전체 텍스트 임시 저장
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

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fakeTyping = async (
    key: keyof AnalysisSections,
    text: string,
    signal: AbortSignal,
    speed = 40
  ) => {
    setLoading(key, false);
    setTyping(key, true);

    // 단어 단위 타이핑
    const words = text.split(/(\s+)/);

    for (const word of words) {
      if (signal.aborted) return;
      appendSection(key, word);
      await sleep(speed);
    }

    setTyping(key, false);
  };

  const startTypingSequentially = async (signal: AbortSignal) => {
    for (const key of SECTION_ORDER) {
      const text = sectionBuffers.current[key];
      if (!text) continue;
      await fakeTyping(key, text, signal);
    }

    setComplete();
  };

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

      try {
        await startAnalysisSSE({
          url: `${API_BASE_URL}/analysis/text`,
          token: params.token,
          body: {
            company: params.company,
            position: params.position,
            today: params.today,
            analysisDepth: params.analysisDepth,
          },
          signal: controller.signal,

          onEvent: (event) => {
            const type = event.event;
            const data = event.data as any;

            switch (type) {
              case "status":
                console.log("status SSE data:", data);
                setStatus(data);
                break;

              case "source":
                console.log("source SSE data:", data);
                setSource(data as AnalysisSource);
                break;

              /** redis / database */
              case "data":
                if (!data) return;
                if (source == "ai") {
                  console.log("Ignoring data SSE in AI source mode");
                  return;
                }

                let raw = "";

                if (typeof data === "string") {
                  try {
                    const parsedJson = JSON.parse(data);
                    raw = parsedJson.content ?? "";
                  } catch {
                    raw = data;
                  }
                }

                if (!raw) return;

                console.log("data SSE data:", raw);
                const parsed = parseMarkdownToSections(raw);

                // sectionBuffers.current = parsed;
                sectionBuffers.current = {
                  companySummary: parsed.companySummary,
                  companyIssue: parsed.companyIssue,
                  positionMainBusiness: parsed.positionMainBusiness,
                  positionIssue: parsed.positionIssue,
                };
                break;

              /** AI 스트리밍 */
              case "company-summary":
                console.log("company-summary SSE data:", data);
                sectionBuffers.current.companySummary = removeSectionTitle(
                  data,
                  "companySummary"
                );
                break;

              case "company-issue":
                console.log("company-issue SSE data:", data);
                sectionBuffers.current.companyIssue = removeSectionTitle(
                  data,
                  "companyIssue"
                );
                break;

              case "position-main-business":
                console.log("position-main-business SSE data:", data);
                sectionBuffers.current.positionMainBusiness =
                  removeSectionTitle(data, "positionMainBusiness");
                break;

              case "position-issue":
                console.log("position-issue SSE data:", data);
                sectionBuffers.current.positionIssue = removeSectionTitle(
                  data,
                  "positionIssue"
                );
                break;

              case "analysisId":
                setAnalysisId(Number(data));
                break;

              case "complete":
                console.log("Analysis complete.");
                // 순차 타이핑 시작
                startTypingSequentially(controller.signal);
                break;

              default:
                console.warn("Unknown SSE event:", type);
            }
          },
        });

        console.log("SSE finished normally");
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("SSE aborted by user");
        } else {
          console.warn("SSE ended with error (treated as complete)", error);
        }
      }
    },
    []
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { start, stop };
};
