import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { updateProfile } from '@/app/actions/profile-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                </>
            ) : (
                'Salva Modifiche'
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
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Profilo Personale</CardTitle>
                    <CardDescription>
                        Gestisci le tue informazioni personali e di contatto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">L'email non può essere modificata.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={profile?.full_name || ''}
                            placeholder="Mario Rossi"
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefono</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={profile?.phone || ''}
                            placeholder="+39 333 1234567"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
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
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Il Mio Account</h1>

            <div className="grid gap-8">
                <ProfileForm user={user} profile={profile} />

                {/* Potremmo aggiungere altre sezioni qui, es. Cambio Password o Cancellazione Account */}
            </div>
        </div>
    );
}
