'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { updateProfile } from '@/app/actions/profile-actions';
import { toast } from 'sonner';
import { useFormStatus } from 'react-dom';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { LogOut, Loader2, ArrowLeft, Save } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full sm:mx-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvataggio...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-5 w-5" />
                    Salva Modifiche
                </>
            )}
        </Button>
    );
}

interface ProfilePageProps {
    user: any;
    profile: any;
}

// Client component wrapper that handles form state
function ProfileForm({ user, profile }: Readonly<ProfilePageProps>) {
    // We use standard form action with toast feedback
    const handleSubmit = async (formData: FormData) => {
        const result = await updateProfile({}, formData);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <form action={handleSubmit}>
            <Card className="max-w-2xl mx-auto border-0 bg-[#1E1E1E]/90 backdrop-blur-md shadow-2xl rounded-[24px] ring-1 ring-white/10">
                <CardHeader className="pb-8 pt-8">
                    <CardTitle className="text-3xl font-bold text-white">Profilo Personale</CardTitle>
                    <CardDescription className="text-[#CCCCCC] text-base">
                        Gestisci le tue informazioni personali e di contatto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-3">
                        <Label htmlFor="email" className="text-[#CCCCCC] text-sm font-medium pl-1">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-[#2A2A2A] border-white/10 text-white/50 h-12 rounded-xl focus-visible:ring-orange-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-white/30 pl-1">L&apos;email non può essere modificata.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="full_name" className="text-[#CCCCCC] text-sm font-medium pl-1">Nome Completo</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                defaultValue={profile?.full_name || ''}
                                placeholder="Mario Rossi"
                                required
                                minLength={2}
                                className="bg-transparent border-white/20 text-white h-12 rounded-xl focus:border-orange-500 focus-visible:ring-0 focus-visible:border-orange-500 transition-colors placeholder:text-white/20"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="phone" className="text-[#CCCCCC] text-sm font-medium pl-1">Telefono</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                defaultValue={profile?.phone || ''}
                                placeholder="+39 333 1234567"
                                className="bg-transparent border-white/20 text-white h-12 rounded-xl focus:border-orange-500 focus-visible:ring-0 focus-visible:border-orange-500 transition-colors placeholder:text-white/20"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-white/10 p-8">
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    );
}




export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setUser(user);
            setProfile(profile);
            setLoading(false);
        };

        fetchProfile();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0F0F0F]">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white selection:bg-orange-500/30">
            <SiteHeader />

            <div className="container py-8 max-w-4xl px-4 md:px-6">
                <div className="mb-8 pt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-6 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Torna alla Home
                        </Link>

                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">Il Mio Account</h1>
                        <p className="text-gray-400">Bentornato, {profile?.full_name?.split(' ')[0] || 'Utente'}.</p>
                    </div>

                    <Button
                        asChild
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 self-start md:self-auto h-12 px-6 rounded-xl border border-red-500/20"
                    >
                        <Link href="/auth/signout">
                            <LogOut className="w-5 h-5 mr-2" />
                            Esci dall'account
                        </Link>
                    </Button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <ProfileForm user={user} profile={profile} />
                </div>
            </div>
        </div>
    );
}
