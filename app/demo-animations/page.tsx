'use client';

import {
  AIThinkingAnimation,
  ThinkingDots,
  WaveBars,
  ShimmerEffect,
  TypingEffect
} from '@/components/chat/ai-thinking-animation';
import { Bot } from 'lucide-react';

export default function AnimationsDemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50">
            🎨 AI Thinking Animations
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Animazioni moderne e fluide per indicare che l&apos;AI sta elaborando
          </p>
        </div>

        {/* Random Animation (Auto-switch) */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            🎲 Random Mode (si alterna ogni 4 secondi)
          </h2>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
            <AIThinkingAnimation variant="random" interval={4000} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ✨ Alterna tra 4 animazioni: Dots → Wave → Shimmer → Typing
          </p>
          <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
            {`<AIThinkingAnimation variant="random" interval={4000} />`}
          </pre>
        </section>

        {/* Individual Animations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            🎯 4 Animazioni Disponibili
          </h2>

          {/* Animation 1: Dots */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              1. Thinking Dots (Classico migliorato)
            </h3>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
              <AIThinkingAnimation variant="dots" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ✅ Perfetto per: Risposte brevi, caricamenti veloci
            </p>
          </div>

          {/* Animation 2: Wave */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              2. Wave Bars (Audio Visualizer)
            </h3>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
              <AIThinkingAnimation variant="wave" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ✅ Perfetto per: Elaborazione complessa, analisi dati
            </p>
          </div>

          {/* Animation 3: Shimmer */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              3. Shimmer Effect (Loading Skeleton)
            </h3>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
              <AIThinkingAnimation variant="shimmer" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ✅ Perfetto per: Caricamento contenuti, preparazione risposta
            </p>
          </div>

          {/* Animation 4: Typing */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              4. Typing Effect (Macchina da scrivere)
            </h3>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
              <AIThinkingAnimation variant="typing" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ✅ Perfetto per: Generazione testo, scrittura risposta
            </p>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            📖 Come Usarle
          </h2>
          <div className="bg-slate-900 text-slate-50 p-6 rounded-2xl space-y-4 overflow-x-auto">
            <div>
              <p className="text-slate-400 text-sm mb-2">{"// 1. Modalità Random (consigliata)"}</p>
              <code className="text-blue-400">
                {`<AIThinkingAnimation variant="random" interval={4000} />`}
              </code>
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-2">{"// 2. Animazione Specifica"}</p>
              <code className="text-green-400">
                {`<AIThinkingAnimation variant="dots" />`}
              </code>
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-2">{"// 3. Componente Standalone"}</p>
              <code className="text-purple-400">
                {`import { ThinkingDots } from '@/components/chat/ai-thinking-animation';
<ThinkingDots />`}
              </code>
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-2">{"// 4. Nella Chat"}</p>
              <code className="text-orange-400">
                {`{isLoading && <AIThinkingAnimation variant="random" interval={4000} />}`}
              </code>
            </div>
          </div>
        </section>

        {/* Customization */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            ⚙️ Personalizzazione
          </h2>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl space-y-3">
            <div>
              <span className="font-mono text-sm text-blue-700 dark:text-blue-400">variant:</span>
              <span className="ml-2 text-slate-700 dark:text-slate-300">
                &apos;dots&apos; | &apos;wave&apos; | &apos;shimmer&apos; | &apos;typing&apos; | &apos;random&apos;
              </span>
            </div>
            <div>
              <span className="font-mono text-sm text-blue-700 dark:text-blue-400">interval:</span>
              <span className="ml-2 text-slate-700 dark:text-slate-300">
                millisecondi tra cambio animazione (default: 4000ms)
              </span>
            </div>
          </div>
        </section>

        {/* Dark Mode Comparison */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            🌓 Compatibilità Dark Mode
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Light */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500 mb-4 uppercase font-bold">Light Mode</p>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                  <ThinkingDots />
                </div>
              </div>
            </div>

            {/* Dark */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700">
              <p className="text-xs text-slate-400 mb-4 uppercase font-bold">Dark Mode</p>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                  <ThinkingDots />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            🎨 Creato con ❤️ per NikiTuttoFare
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Animazioni ispirate a Claude AI
          </p>
        </div>
      </div>
    </div>
  );
}
