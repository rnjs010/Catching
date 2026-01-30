import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function preprocessMarkdown(text: string) {
  return (
    text
      // ~~ escape
      .replace(/~~/g, "\\~\\~")

      // 타이틀 강제 마커 삽입
      .replace(/(^|\n)\*\*([^*\n]+?)\*\*/g, "\n**@@ISSUE_TITLE@@$2**")

      // 날짜 및 링크 전처리
      .replace(
        /날짜\s*:\s*["']?(.+?)["']?(?=\n|$)/g,
        (_, date) => `\n📅 **${date.trim()}**\n`
      )

      .replace(
        /\[([^\]]+)\]\s*:\s*["']?(https?:\/\/[^\s"')]+)["']?/g,
        "\n🔗 [$1]($2)"
      )

      // 리스트 타이틀 줄바꿈 보정
      .replace(/(\-\s*\*\*[^*\n]+?\*\*)(\s*)([^\n])/g, "$1\n\n$3")
  );
}

export function MarkdownRender({ text }: { text: string }) {
  const processed = preprocessMarkdown(text);

  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-xl font-bold mt-5 mb-2" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-lg font-semibold mt-5 mb-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-base font-semibold mt-4 mb-1" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="ml-6 list-disc" {...props} />
        ),
        strong: ({ children }) => {
          const text = React.Children.toArray(children)
            .filter((c) => typeof c === "string")
            .join("");

          if (text.startsWith("@@ISSUE_TITLE@@")) {
            return (
              <strong className="block mt-4 mb-0 text-sm font-semibold">
                {text.replace("@@ISSUE_TITLE@@", "")}
              </strong>
            );
          }

          return <strong className="font-semibold">{children}</strong>;
        },
        a: ({ node, ...props }) => (
          <a
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        p: ({ children }) => {
          const text = React.Children.toArray(children)
            .map((c) => (typeof c === "string" ? c : ""))
            .join("")
            .trim();

          if (text.startsWith("📅")) {
            return (
              <p className="text-xs text-gray-600 leading-tight">{children}</p>
            );
          }

          return <p className="leading-relaxed">{children}</p>;
        },
      }}
    >
      {processed}
    </ReactMarkdown>
  );
}
