import { MessageSquare, Sparkles, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HowItWorks() {
    const steps = [
        {
            icon: MessageSquare,
            title: 'Descrivi il problema',
            description: 'Scrivi cosa non va, come se parlassi a un amico.',
            lightIconBg: 'bg-blue-100 text-blue-600',
        },
        {
            icon: Sparkles,
            title: "L'AI Analizza",
            description: 'Niki capisce l\'urgenza e trova il tecnico giusto in zona.',
            lightIconBg: 'bg-purple-100 text-purple-600',
        },
        {
            icon: Wrench,
            title: 'Problema Risolto',
            description: 'Un professionista certificato ti contatta subito.',
            lightIconBg: 'bg-emerald-100 text-emerald-600',
        },
    ];

    return (
        <section className="py-12 md:py-24 bg-slate-50 dark:bg-black/50 overflow-hidden">
            <div className="container max-w-6xl mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-black text-center mb-16 tracking-tight text-foreground">
                    Come Funziona
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <Card key={step.title}
                                className="
                  relative border-0 transition-all duration-300 h-full rounded-[32px] overflow-hidden
                  
                  /* LIGHT MODE STYLES */
                  bg-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] 
                  
                  /* DARK MODE: GLASSMORPHISM */
                  dark:bg-[#121212]/80 dark:backdrop-blur-md dark:border dark:border-white/10 dark:shadow-none
                "
                            >
                                {/* Subtle Gradient Glow for Dark Mode */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none" />

                                <CardHeader className="flex flex-col items-center pt-10 pb-6 relative z-10">
                                    <div className={`
                      w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform hover:scale-110 duration-300
                      ${step.lightIconBg}
                      dark:bg-gradient-to-br dark:from-blue-600 dark:to-purple-600 dark:text-white dark:shadow-lg dark:shadow-blue-900/40
                    `}>
                                        <Icon className="w-9 h-9" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-center text-[#1A1A1B] dark:text-white">
                                        {step.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10 pb-10 px-8">
                                    <p className="text-center text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
                                        {step.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
