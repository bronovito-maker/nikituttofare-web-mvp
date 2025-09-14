// components/ChatBubble.tsx
import { ReactNode } from "react";
import clsx from "clsx";

export default function ChatBubble({
  role = "assistant",
  children,
}: {
  role?: "user" | "assistant";
  children: ReactNode;
}) {
  const isUser = role === "user";

  return (
    <div className={clsx("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] px-4 py-3 rounded-2xl",
          // Ecco la correzione per il testo: classi utility dirette
          isUser
            ? "bg-primary text-primary-foreground rounded-br-lg"
            : "bg-secondary text-secondary-foreground rounded-bl-lg"
        )}
      >
        {children}
      </div>
    </div>
  );
}