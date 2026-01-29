'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { updateTechnicianProfile, ProfileState } from '@/app/actions/profile-actions';
import { User, Phone, Mail, MapPin, Save, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormProps {
    initialData: {
        first_name?: string | null;
        last_name?: string | null;
        email: string;
        phone?: string | null;
        primary_role?: string | null;
        coverage_area?: string | null;
        full_name?: string | null;
    };
}

const ROLES = [
    'Idraulico',
    'Elettricista',
    'Fabbro',
    'Tuttofare',
    'Tecnico Caldaie',
    'Tecnico Condizionatori',
];

const initialState: ProfileState = {
    message: '',
    errors: {},
};

export function ProfileForm({ initialData }: Readonly<ProfileFormProps>) {
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<ProfileState>(initialState);

    // Fallback logic for first/last name if not present but full_name is
    const defaultFirstName = initialData.first_name || (initialData.full_name ? initialData.full_name.split(' ')[0] : '');
    const defaultLastName = initialData.last_name || (initialData.full_name ? initialData.full_name.split(' ').slice(1).join(' ') : '');

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const newState = await updateTechnicianProfile(initialState, formData);
            setState(newState);

            if (newState.success) {
                toast.success('Profilo aggiornato con successo');
            } else if (newState.message) {
                toast.error(newState.message);
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <ProfileContactInfo
                initialData={initialData}
                defaultFirstName={defaultFirstName}
                defaultLastName={defaultLastName}
                errors={state.errors}
            />

            <div className="h-px bg-border" />

            <ProfileSkills
                initialData={initialData}
                errors={state.errors}
            />

            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-11 shadow-lg shadow-orange-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvataggio...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salva Modifiche
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

interface SubComponentProps {
    initialData: ProfileFormProps['initialData'];
    errors?: Record<string, string[]>;
    defaultFirstName?: string;
    defaultLastName?: string;
}

function ProfileContactInfo({ initialData, defaultFirstName, defaultLastName, errors }: Readonly<SubComponentProps>) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Informazioni Personali
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-muted-foreground">Nome</Label>
                    <Input
                        id="first_name"
                        name="first_name"
                        placeholder="Nome"
                        defaultValue={defaultFirstName}
                        className={`bg-secondary border-input text-foreground focus:border-orange-500/50 focus:ring-orange-500/20 ${errors?.first_name ? 'border-red-500' : ''}`}
                    />
                    {errors?.first_name && <p className="text-red-500 text-xs">{errors.first_name[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-muted-foreground">Cognome</Label>
                    <Input
                        id="last_name"
                        name="last_name"
                        placeholder="Cognome"
                        defaultValue={defaultLastName}
                        className={`bg-secondary border-input text-foreground focus:border-orange-500/50 focus:ring-orange-500/20 ${errors?.last_name ? 'border-red-500' : ''}`}
                    />
                    {errors?.last_name && <p className="text-red-500 text-xs">{errors.last_name[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            value={initialData.email}
                            readOnly
                            className="pl-9 bg-muted border-input text-muted-foreground focus-visible:ring-offset-0 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-muted-foreground">Telefono</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={initialData.phone || ''}
                            placeholder="+39 ..."
                            className={`pl-9 bg-secondary border-input text-foreground focus:border-orange-500/50 focus:ring-orange-500/20 ${errors?.phone ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors?.phone && <p className="text-red-500 text-xs">{errors.phone[0]}</p>}
                </div>
            </div>
        </div>
    );
}

function ProfileSkills({ initialData, errors }: Readonly<Pick<SubComponentProps, 'initialData' | 'errors'>>) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Competenze & Zona
            </h3>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="primary_role" className="text-muted-foreground">Ruolo Principale</Label>
                    <Select name="primary_role" defaultValue={initialData.primary_role || undefined}>
                        <SelectTrigger className={`bg-secondary border-input text-foreground ${errors?.primary_role ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Seleziona un ruolo" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            {ROLES.map((role) => (
                                <SelectItem key={role} value={role} className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.primary_role && <p className="text-red-500 text-xs">{errors.primary_role[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="coverage_area" className="text-muted-foreground">Zone di Copertura</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                        <Textarea
                            id="coverage_area"
                            name="coverage_area"
                            placeholder="Es. Rimini Centro, Riccione, Miramare"
                            defaultValue={initialData.coverage_area || ''}
                            className={`pl-9 min-h-[80px] bg-secondary border-input text-foreground focus:border-orange-500/50 focus:ring-orange-500/20 ${errors?.coverage_area ? 'border-red-500' : ''}`}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Elenca le città o i quartieri dove operi abitualmente.</p>
                    {errors?.coverage_area && <p className="text-red-500 text-xs">{errors.coverage_area[0]}</p>}
                </div>
            </div>
        </div>
    );
}
