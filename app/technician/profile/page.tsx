import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfileForm } from '@/components/technician/profile-form';

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

    // Pass data to client component
    const profileData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: user.email!,
        phone: profile.phone,
        primary_role: profile.primary_role,
        coverage_area: profile.coverage_area,
        full_name: profile.full_name, // Fallback
    };

    return (
        <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Profilo Tecnico</h1>
                <p className="text-muted-foreground">Gestisci le tue informazioni personali e le tue competenze.</p>
            </div>

            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4 border-b border-border flex flex-col items-center text-center">
                    <Avatar
                        size="xl"
                        className="w-32 h-32 border-4 border-card shadow-lg mb-4"
                        src={user.user_metadata?.avatar_url || null}
                        fallback={profile.first_name?.charAt(0) || profile.full_name?.charAt(0) || 'T'}
                        alt={profile.full_name || 'Avatar'}
                    />
                    <div className="space-y-1">
                        <CardTitle className="text-2xl text-card-foreground">{profile.full_name || 'Tecnico'}</CardTitle>
                        <CardDescription className="flex items-center justify-center gap-2 text-emerald-400 font-medium">
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                Verificato
                            </Badge>
                            <span>• LIV. {Math.floor((profile.loyalty_points || 0) / 100) + 1}</span>
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <ProfileForm initialData={profileData} />
                </CardContent>
            </Card>
        </div>
    );
}
