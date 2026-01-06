import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/supabase-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file fornito' },
        { status: 400 }
      );
    }

    // Valida il tipo di file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Solo file immagine sono permessi' },
        { status: 400 }
      );
    }

    // Valida la dimensione (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 10MB' },
        { status: 400 }
      );
    }

    // Use admin client to bypass storage RLS policies
    const supabase = createAdminClient();

    // Genera un nome file univoco - include user ID for organization
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Carica il file su Supabase Storage (bucket: ticket-photos, path: userId/filename)
    const { data, error } = await supabase.storage
      .from('ticket-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Errore upload Supabase:', error);

      // Gestione errori specifici
      if (error.message.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Servizio di storage non configurato. Riprova più tardi.' },
          { status: 500 }
        );
      }

      if (error.message.includes('Duplicate')) {
        return NextResponse.json(
          { error: 'File già esistente' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Errore durante l\'upload dell\'immagine' },
        { status: 500 }
      );
    }

    // Ottieni l'URL pubblico (o signed URL per file privati)
    const { data: urlData } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Impossibile ottenere l\'URL del file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName.split('/').pop(), // Just the filename
      filePath: fileName // Full path including user folder
    });

  } catch (error) {
    console.error('Errore nell\'upload dell\'immagine:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}