// app/api/upload-image/route.ts
// API route per caricare immagini su Supabase Storage

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Verifica autenticazione
    if (!session?.user) {
      console.error('Upload image: sessione non trovata', { session });
      return NextResponse.json(
        { error: 'Non autorizzato. Effettua il login.' },
        { status: 401 }
      );
    }
    
    // Usa id dalla sessione o email come fallback
    const userId = session.user.id || session.user.email || 'anonymous';
    
    if (!userId || userId === 'anonymous') {
      console.error('Upload image: userId non disponibile', { session });
      return NextResponse.json(
        { error: 'Errore di autenticazione. Ricarica la pagina.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file fornito' },
        { status: 400 }
      );
    }

    // Verifica che sia un'immagine
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Il file deve essere un\'immagine' },
        { status: 400 }
      );
    }

    // Verifica dimensione (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'L\'immagine è troppo grande. Massimo 10MB' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createServerClient();
    } catch (supabaseError) {
      console.error('Errore nella creazione del client Supabase:', supabaseError);
      return NextResponse.json(
        { error: 'Servizio di storage non disponibile. Verifica la configurazione di Supabase.' },
        { status: 503 }
      );
    }

    // Genera un nome file univoco
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Converti il file in ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Carica su Supabase Storage
    const { data, error } = await supabase.storage
      .from('ticket-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Errore nel caricamento su Supabase Storage:', error);
      
      // Messaggi di errore più specifici
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Bucket di storage non configurato. Contatta l\'amministratore.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Errore nel caricamento dell\'immagine' },
        { status: 500 }
      );
    }

    // Ottieni l'URL pubblico
    const { data: urlData } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      console.error('Errore nel recupero dell\'URL pubblico');
      return NextResponse.json(
        { error: 'Errore nel recupero dell\'URL dell\'immagine' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
    });

  } catch (error) {
    console.error('Errore nell\'upload dell\'immagine:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
