import Link from 'next/link';
import { ArrowRight, ArrowLeft, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TechnicianBenefits } from '@/components/technician/technician-benefits';
import { TechnicianOnboardingSteps } from '@/components/technician/technician-onboarding-steps';
import { TechnicianRequirements } from '@/components/technician/technician-requirements';
import { TechnicianRegisterForm } from '@/components/technician/technician-register-form';
import { TechnicianFAQ } from '@/components/technician/technician-faq';

export const metadata = {
    title: 'Diventa Tecnico NikiTuttoFare | Lavora con Noi',
    description: 'Unisciti alla rete di tecnici NikiTuttoFare: più clienti, pagamenti garantiti, flessibilità totale. Candidati ora!',
};

export default function TechnicianRegisterPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Torna al sito</span>
                    </Link>
                    <Link href="/technician/login" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        Già registrato? Accedi
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative py-16 sm:py-24 px-4 bg-gradient-to-b from-slate-50 to-background dark:from-slate-900/50 dark:to-background overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/30 mb-8">
                        <HardHat className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-tight">
                        Diventa Tecnico Certificato
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            NikiTuttoFare
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Unisciti alla nostra rete d&apos;élite: più clienti, meno burocrazia, pagamenti garantiti.
                        La tua carriera si evolve qui.
                    </p>

                    <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-full shadow-xl">
                        <a href="#form" className="flex items-center gap-2">
                            Candidati Ora
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </Button>
                </div>
            </section>

            {/* Sections */}
            <TechnicianBenefits />
            <TechnicianOnboardingSteps />
            <TechnicianRequirements />
            <TechnicianRegisterForm />
            <TechnicianFAQ />

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-border bg-card/50">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Hai domande? Scrivici a{' '}
                        <a href="mailto:bronovito@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                            bronovito@gmail.com
                        </a>
                    </p>
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                        <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
                        <span>•</span>
                        <Link href="/" className="hover:text-foreground hover:underline">NikiTuttoFare.it</Link>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">© 2026 NikiTuttoFare. Tutti i diritti riservati.</p>
                </div>
            </footer>
        </div>
    );
}
