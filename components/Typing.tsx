export default function Typing() {
    return (
      <div className="flex items-center gap-1.5 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-1.5 w-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-1.5 w-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary animate-bounce"></span>
      </div>
    );
  }
