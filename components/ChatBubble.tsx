import { ReactNode } from "react";

export default function ChatBubble({
  role = "system",
  children,
}: {
  role?: "user" | "assistant" | "system";
  children: ReactNode;
}) {
  const isUser = role === "user";

  return (
    <div className="w-full flex mb-3">
      <div
        className={`chat-bubble ${
          isUser
            ? "chat-bubble-user ml-auto"   // forza a destra
            : "chat-bubble-bot mr-auto"    // forza a sinistra
        }`}
      >
        {children}
      </div>
    </div>
  );
}