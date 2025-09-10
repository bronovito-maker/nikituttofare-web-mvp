export default function Typing() {
  return (
    <div className="flex items-center gap-1 text-slate-400 text-sm select-none">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"></span>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:120ms]"></span>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:240ms]"></span>
    </div>
  );
}
