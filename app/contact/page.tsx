import { Metadata } from 'next';
import { PhoneCall, MessageSquare, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ContactForm } from '@/components/contact/contact-form';
import { COMPANY_PHONE, COMPANY_PHONE_LINK } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Contatti - NikiTuttoFare | Pronto Intervento Rimini H24',
    description: 'Hai un&apos;emergenza idraulica, elettrica o di climatizzazione? Contatta NikiTuttoFare. Rispondiamo H24 a Rimini, Riccione e zone limitrofe.',
};

export default function ContactPage() {
    const whatsappNumber = '+393461027447';
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Ciao Niki, ho bisogno di assistenza`;
    const supportEmail = 'bronovito@gmail.com';

    const contactMethods = [
        {
            icon: <PhoneCall className="h-6 w-6 text-red-500 animate-pulse" />,
            title: 'Numero Rosso (Emergenze)',
            value: COMPANY_PHONE,
            description: 'Disponibile H24 per guasti urgenti.',
            link: COMPANY_PHONE_LINK,
            cta: 'Chiama Ora',
            variant: 'destructive' as const,
        },
        {
            icon: <MessageSquare className="h-6 w-6 text-[#25D366]" />,
            title: 'WhatsApp Diretto',
            value: '+39 346 102 7447',
            description: 'Invia foto del guasto per un preventivo rapido.',
            link: whatsappUrl,
            cta: 'Scrivici su WA',
            variant: 'default' as const,
            className: 'bg-[#25D366] hover:bg-[#128C7E] text-slate-900',
        },
        {
            icon: <Mail className="h-6 w-6 text-blue-500" />,
            title: 'Email Supporto',
            value: supportEmail,
            description: 'Per preventivi non urgenti o info commerciali.',
            link: `mailto:${supportEmail}`,
            cta: 'Invia Email',
            variant: 'outline' as const,
        },
    ];

    const cities = [
        'Rimini', 'Riccione', 'Cattolica', 'Misano Adriatico',
        'Bellaria-Igea Marina', 'Santarcangelo', 'San Marino', 'Verucchio'
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
            <SiteHeader />

            <main className="flex-1 pb-20">
                {/* --- HERO SECTION --- */}
                <section className="relative pt-16 pb-12 px-4 sm:px-6 overflow-hidden">
                    <div className="max-w-4xl mx-auto text-center space-y-4">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                            Siamo qui per <span className="text-blue-600">Aiutarti</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Scegli il metodo che preferisci. In ogni caso, troveremo la soluzione più rapida al tuo problema domestico.
                        </p>
                    </div>
                </section>

                {/* --- CONTACT METHODS GRID --- */}
                <section className="py-12 px-4 md:px-6">
                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {contactMethods.map((method, index) => (
                            <Card key={index} className="bg-card/50 border-border/50 hover:border-blue-500/30 transition-all duration-300 group overflow-hidden">
                                <CardContent className="p-8 flex flex-col items-center text-center space-y-4 h-full">
                                    <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300">
                                        {method.icon}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-xl font-bold">{method.title}</h3>
                                        <p className="font-mono text-lg text-blue-500 font-bold">{method.value}</p>
                                        <p className="text-sm text-muted-foreground">{method.description}</p>
                                    </div>
                                    <Button asChild variant={method.variant} className={`w-full font-bold ${method.className || ''}`}>
                                        <Link href={method.link}>{method.cta}</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* --- FORM & INFO SECTION --- */}
                <section className="py-12 px-4 md:px-6 bg-slate-900/50">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
                        {/* Left: Info & Map */}
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">Perché scegliere <span className="text-blue-600 uppercase tracking-wider text-2xl px-2 py-1 bg-blue-600/10 rounded ml-1">Niki</span>?</h2>

                                <div className="grid gap-6">
                                    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold">Intervento Rapido</h4>
                                            <p className="text-sm text-muted-foreground">Media di arrivo 45 minuti in tutta la provincia di Rimini.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold">Garanzia 100% NTF</h4>
                                            <p className="text-sm text-muted-foreground">Ogni riparazione è garantita. Se non sei soddisfatto, non paghi.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold">Zone Servite</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {cities.map(city => (
                                                    <span key={city} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">
                                                        {city}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Map Placeholder / Badge */}
                            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 space-y-4">
                                    <h3 className="text-2xl font-black italic">PRONTO INTERVENTO H24</h3>
                                    <p className="text-blue-100/90 font-medium">Non restare ad aspettare. La tua emergenza è la nostra priorità.</p>
                                    <div className="flex items-center gap-2 pt-4">
                                        <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-sm font-bold tracking-widest uppercase">7 Tecnici Disponibili Ora</span>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-12 opacity-10 transform scale-150 rotate-12">
                                    <PhoneCall size={200} />
                                </div>
                            </div>
                        </div>

                        {/* Right: The Form */}
                        <div className="space-y-6">
                            <div className="text-center lg:text-left space-y-2">
                                <h3 className="text-2xl font-bold">Invia un messaggio</h3>
                                <p className="text-muted-foreground">Usa il form qui sotto se non hai un&apos;urgenza immediata.</p>
                            </div>
                            <ContactForm />
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
