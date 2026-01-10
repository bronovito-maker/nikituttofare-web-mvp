import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { addTechnician, deleteTechnician, toggleTechnicianStatus } from '@/app/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 🔒 PROTEZIONE PAGINA
  if (!user || user.email !== 'bronovito@gmail.com') {
    redirect('/');
  }

  // Fetch Dati
  const { data: technicians } = await supabase.from('technicians').select('*').order('created_at', { ascending: false });
  const { data: tickets } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel 🛡️</h1>
          <p className="text-slate-500">Loggato come: {user.email}</p>
        </div>
        <form action={async () => { 'use server'; const sb = await createServerClient(); await sb.auth.signOut(); redirect('/'); }}>
           <Button variant="outline">Esci</Button>
        </form>
      </header>

      <Tabs defaultValue="technicians" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="technicians">👷 Gestione Tecnici</TabsTrigger>
          <TabsTrigger value="tickets">🎫 Lista Ticket</TabsTrigger>
        </TabsList>

        {/* --- TAB TECNICI --- */}
        <TabsContent value="technicians">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Form Aggiunta */}
            <Card className="md:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Aggiungi Tecnico</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={async (formData) => {
                  'use server';
                  await addTechnician({
                    name: formData.get('name') as string,
                    phone: formData.get('phone') as string,
                    skills: formData.get('skills') as string,
                  });
                }} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium">Nome</label>
                    <Input id="name" name="name" placeholder="Mario Rossi" required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium">Telefono (con +39)</label>
                    <Input id="phone" name="phone" placeholder="+393331234567" required />
                  </div>
                  <div>
                    <label htmlFor="skills" className="text-sm font-medium">Competenze (virgola)</label>
                    <Input id="skills" name="skills" placeholder="idraulico, caldaie" />
                  </div>
                  <Button type="submit" className="w-full">Registra Tecnico</Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista Tecnici */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tecnici Abilitati ({technicians?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {technicians?.map((tech) => (
                    <div key={tech.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{tech.name}</h3>
                          {tech.is_active ? 
                            <Badge className="bg-green-500">Attivo</Badge> : 
                            <Badge variant="destructive">Sospeso</Badge>
                          }
                        </div>
                        <p className="text-sm text-slate-500 font-mono">{tech.phone}</p>
                        <div className="flex gap-1 mt-1">
                          {tech.skills?.map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <form action={toggleTechnicianStatus.bind(null, tech.id, tech.is_active)}>
                           <Button size="sm" variant="outline">
                             {tech.is_active ? 'Sospendi' : 'Riattiva'}
                           </Button>
                        </form>
                        <form action={deleteTechnician.bind(null, tech.id)}>
                           <Button size="sm" variant="destructive">Elimina</Button>
                        </form>
                      </div>
                    </div>
                  ))}
                  {technicians?.length === 0 && <p className="text-center text-slate-500">Nessun tecnico registrato.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB TICKETS --- */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader><CardTitle>Ultimi Lavori</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                 {tickets?.map((t) => (
                   <div key={t.id} className="p-3 border rounded flex justify-between items-center hover:bg-slate-50">
                     <div>
                       <div className="font-medium text-sm">#{t.id.slice(0,8)} - {t.category || 'Richiesta'}</div>
                       <div className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</div>
                     </div>
                     <Badge variant={t.status === 'open' ? 'default' : 'secondary'}>
                       {t.status}
                     </Badge>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
