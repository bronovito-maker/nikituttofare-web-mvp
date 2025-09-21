// components/Typing.tsx
export default function Typing() {
  return (
    // Contenitore che allinea le linee in basso e definisce un'altezza fissa
    <div className="flex items-end gap-1.5 py-2 h-8">
      <span
        className="w-1.5 rounded-full bg-muted-foreground animate-wave"
        style={{ animationDelay: '-0.4s' }} // Ritardo per la prima linea
      ></span>
      <span
        className="w-1.5 rounded-full bg-muted-foreground animate-wave"
        style={{ animationDelay: '-0.2s' }} // Ritardo per la seconda linea
      ></span>
      <span
        className="w-1.5 rounded-full bg-muted-foreground animate-wave"
        // La terza linea parte senza ritardo
      ></span>
    </div>
  );
}