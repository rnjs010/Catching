import {
  EventSourceMessage,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

export type AnalysisSSEEvent =
  | { type: "status"; payload: string }
  | { type: "source"; payload: string }
  | { type: "data"; payload: string }
  | { type: "analysisId"; payload: number }
  | { type: "complete" }
  | {
      type:
        | "company-summary"
        | "company-issue"
        | "position-main-business"
        | "position-issue";
      payload: string;
    };

interface StartAnalysisParams {
  url: string;
  token: string;
  body: object;
  signal: AbortSignal;
  onEvent: (event: AnalysisSSEEvent) => void;
}

function normalizeDataPayload(data: string): string {
  try {
    const json = JSON.parse(data);
    return json.content ?? "";
  } catch {
    return data;
  }
}

export const startAnalysisSSE = async ({
  url,
  token,
  body,
  signal,
  onEvent,
}: StartAnalysisParams) => {
  await fetchEventSource(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,

    async onopen(response) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    },

    onmessage(event: EventSourceMessage) {
      const { event: type, data } = event;

      switch (type) {
        case "complete":
          onEvent({ type: "complete" });
          break;

        case "analysisId":
          onEvent({ type: "analysisId", payload: Number(data) });
          break;

        case "data":
          onEvent({ type: "data", payload: normalizeDataPayload(data) });
          break;

        case "status":
        case "source":
        case "company-summary":
        case "company-issue":
        case "position-main-business":
        case "position-issue":
          onEvent({
            type,
            payload: data,
          });
          break;

        default:
          console.warn("Unknown SSE event:", type);
      }
    },

    onerror(err) {
      throw err;
    },
  });
};
