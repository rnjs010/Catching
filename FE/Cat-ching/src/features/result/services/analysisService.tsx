import {
  EventSourceMessage,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

interface StartAnalysisParams {
  url: string;
  token: string;
  body: object;
  signal: AbortSignal;
  onEvent: (event: EventSourceMessage) => void;
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

    onmessage(event) {
      onEvent(event);
    },

    onerror(err) {
      throw err; // 재연결 방지
    },
  });
};
