'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Loader2, Check, Send } from 'lucide-react';
import { toast } from 'sonner';

const SPECIALIZATIONS = [
    { id: 'idraulico', label: 'Idraulico' },
    { id: 'elettricista', label: 'Elettricista' },
    { id: 'fabbro', label: 'Fabbro' },
    { id: 'climatizzazione', label: 'Climatizzazione' },
    { id: 'tuttofare', label: 'Manutenzione Generica' },
    { id: 'edile', label: 'Edilizia' },
];

const ZONES = [
    { id: 'rimini', label: 'Rimini' },
    { id: 'riccione', label: 'Riccione' },
    { id: 'cattolica', label: 'Cattolica' },
    { id: 'misano', label: 'Misano Adriatico' },
    { id: 'bellaria', label: 'Bellaria Igea Marina' },
    { id: 'santarcangelo', label: 'Santarcangelo' },
    { id: 'verucchio', label: 'Verucchio' },
    { id: 'coriano', label: 'Coriano' },
    { id: 'morciano', label: 'Morciano' },
    { id: 'san-marino', label: 'San Marino' },
];

interface FormData {
    name: string;
    phone: string;
    email: string;
    specializations: string[];
    zones: string[];
    partitaIva: string;
    noPartitaIva: boolean;
    experience: string;
    notes: string;
}

const STEPS = ['Dati Personali', 'Specializzazioni', 'Zona Operativa', 'Dettagli'];

export function TechnicianRegisterForm() {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        email: '',
        specializations: [],
        zones: [],
        partitaIva: '',
        noPartitaIva: false,
        experience: '',
        notes: '',
    });

    const updateField = (field: keyof FormData, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArrayField = (field: 'specializations' | 'zones', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(v => v !== value)
                : [...prev[field], value],
        }));
    };

    const canProceed = () => {
        switch (step) {
            case 0: return formData.name.length > 2 && formData.phone.length > 8 && formData.email.includes('@');
            case 1: return formData.specializations.length > 0;
            case 2: return formData.zones.length > 0;
            case 3: return formData.noPartitaIva || formData.partitaIva.length >= 11;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/technician/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Errore invio');

            setSubmitted(true);
            toast.success('Candidatura inviata con successo!');
        } catch {
            toast.error('Errore durante l\'invio. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <section id="form" className="py-16 sm:py-24 bg-background">
                <div className="max-w-xl mx-auto px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-foreground mb-4">Candidatura Inviata!</h2>
                    <p className="text-muted-foreground text-lg">
                        Grazie {formData.name}! Ti contatteremo entro 24-48 ore per il colloquio di qualifica.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section id="form" className="py-16 sm:py-24 bg-background">
            <div className="max-w-2xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                        Compila il Modulo
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Candidati in meno di 2 minuti
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < step ? 'bg-emerald-500 text-white' :
                                    i === step ? 'bg-blue-500 text-white' :
                                        'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-8 sm:w-12 h-1 mx-1 rounded ${i < step ? 'bg-emerald-500' : 'bg-muted'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg">
                    {/* Step 0: Personal Data */}
                    {step === 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome e Cognome *</Label>
                                <Input
                                    id="name"
                                    placeholder="Mario Rossi"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefono *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+39 333 1234567"
                                    value={formData.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="mario.rossi@email.com"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className="h-12"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 1: Specializations */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <p className="text-sm text-muted-foreground">Seleziona almeno una specializzazione:</p>
                            <div className="grid grid-cols-2 gap-4">
                                {SPECIALIZATIONS.map((spec) => (
                                    <label
                                        key={spec.id}
                                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.specializations.includes(spec.id)
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-border hover:border-accent'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={formData.specializations.includes(spec.id)}
                                            onCheckedChange={() => toggleArrayField('specializations', spec.id)}
                                        />
                                        <span className="font-medium text-foreground">{spec.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Zones */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <p className="text-sm text-muted-foreground">Seleziona le zone in cui operi:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {ZONES.map((zone) => (
                                    <label
                                        key={zone.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.zones.includes(zone.id)
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-border hover:border-accent'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={formData.zones.includes(zone.id)}
                                            onCheckedChange={() => toggleArrayField('zones', zone.id)}
                                        />
                                        <span className="font-medium text-foreground text-sm">{zone.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="piva">Partita IVA {!formData.noPartitaIva && '*'}</Label>
                                <Input
                                    id="piva"
                                    placeholder="12345678901"
                                    maxLength={11}
                                    value={formData.partitaIva}
                                    onChange={(e) => updateField('partitaIva', e.target.value.replace(/\D/g, ''))}
                                    className="h-12 font-mono tracking-wide"
                                    disabled={formData.noPartitaIva}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            noPartitaIva: !prev.noPartitaIva,
                                            partitaIva: !prev.noPartitaIva ? '' : prev.partitaIva,
                                        }));
                                    }}
                                    className={`mt-2 px-4 py-2 text-sm rounded-lg border transition-all w-full ${formData.noPartitaIva
                                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-medium'
                                            : 'border-border text-muted-foreground hover:border-accent hover:text-foreground'
                                        }`}
                                >
                                    {formData.noPartitaIva ? '✓ Sto aprendo P.IVA' : 'Non ho ancora la Partita IVA'}
                                </button>
                                {formData.noPartitaIva && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Nessun problema! Ti contatteremo per discutere come procedere.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="exp">Anni di Esperienza</Label>
                                <Input
                                    id="exp"
                                    placeholder="es. 5 anni"
                                    value={formData.experience}
                                    onChange={(e) => updateField('experience', e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Note aggiuntive (opzionale)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Certificazioni, specializzazioni particolari, disponibilità..."
                                    value={formData.notes}
                                    onChange={(e) => updateField('notes', e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                        {step > 0 ? (
                            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={loading}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step < STEPS.length - 1 ? (
                            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                                Avanti <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={!canProceed() || loading}
                                className="bg-emerald-600 hover:bg-emerald-500"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                Invia Candidatura
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
