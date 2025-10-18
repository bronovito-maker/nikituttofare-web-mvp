// components/ChatBubble.tsx
import clsx from "clsx";
import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ChatBubbleProps = {
  role?: "user" | "assistant" | "system";
  content: string;
  menuUrl?: string;
};

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const URL_TEST_REGEX = /(https?:\/\/[^\s]+)/i;

const getLinkLabel = (url: string, precedingText: string) => {
  const context = precedingText.toLowerCase();
  if (context.includes("menu") || context.includes("listino")) {
    return "Apri menu";
  }
  return "Apri link";
};

const renderLine = (line: string) => {
  URL_REGEX.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_REGEX.exec(line)) !== null) {
    const [url] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(line.slice(lastIndex, start));
    }

    const precedingText = line.slice(Math.max(0, start - 50), start);
    const label = getLinkLabel(url, precedingText);

    nodes.push(
      <Button
        key={`${url}-${start}`}
        asChild
        variant="outline"
        size="sm"
        className="ml-2 mt-1 inline-flex"
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </Button>
    );

    lastIndex = start + url.length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
};

const renderContent = (content: string) => {
  const lines = content.split("\n");
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {renderLine(line)}
    </Fragment>
  ));
};

export default function ChatBubble({ role = "assistant", content, menuUrl }: ChatBubbleProps) {
  const isUser = role === "user";
  const containsUrl = URL_TEST_REGEX.test(content);
  const mentionsMenu = /menu|listino/i.test(content);
  const shouldRenderMenuCTA = Boolean(!isUser && menuUrl && mentionsMenu && !containsUrl);

  return (
    <div className={clsx("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-lg"
            : "bg-secondary text-secondary-foreground rounded-bl-lg"
        )}
      >
        {renderContent(content)}
        {shouldRenderMenuCTA && (
          <div className="mt-3">
            <Button asChild variant="outline" size="sm">
              <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                Apri menu
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
