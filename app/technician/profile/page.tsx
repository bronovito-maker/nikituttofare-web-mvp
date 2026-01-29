import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Save, Briefcase } from 'lucide-react';

export default async function TechnicianProfilePage() {
    const supabase = await createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/technician/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/technician/login');
    }

    return (
        <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-white">Profilo Tecnico</h1>
                <p className="text-slate-400">Gestisci le tue informazioni personali e le tue competenze.</p>
            </div>

            <Card className="border-[#333] bg-[#1E1E1E]/80 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4 border-b border-[#333]">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar
                            size="xl"
                            className="w-24 h-24 border-4 border-[#333] shadow-lg"
                            src={user.user_metadata?.avatar_url || null}
                            fallback={profile.full_name?.charAt(0) || 'T'}
                            alt={profile.full_name || 'Avatar'}
                        />
                        <div className="text-center md:text-left space-y-1">
                            <CardTitle className="text-2xl text-white">{profile.full_name}</CardTitle>
                            <CardDescription className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 font-medium">
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                    Verificato
                                </Badge>
                                <span>• LIV. {Math.floor((profile.loyalty_points || 0) / 100) + 1}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" /> Informazioni Personali
                        </h3>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        value={user.email}
                                        readOnly
                                        className="pl-9 bg-[#121212] border-[#333] text-slate-400 focus-visible:ring-offset-0 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-300">Telefono</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="phone"
                                        defaultValue={profile.phone || ''}
                                        placeholder="+39 ..."
                                        className="pl-9 bg-[#121212] border-[#333] text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#333]" />

                    {/* Skills & Zone */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Competenze & Zona
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Ruolo Principale</Label>
                                <Input
                                    defaultValue={profile.role === 'technician' ? 'Tecnico Specializzato' : profile.role}
                                    readOnly
                                    className="bg-[#121212] border-[#333] text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Area di Copertura</Label>
                                <div className="flex items-center gap-2 p-3 rounded-md bg-[#121212] border border-[#333]">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-white">Torino, TO (Default)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-11 shadow-lg shadow-orange-900/20">
                            <Save className="w-4 h-4 mr-2" />
                            Salva Modifiche
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
