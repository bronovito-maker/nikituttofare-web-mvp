'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface ReviewFormProps {
  ticket: Ticket;
}

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Idraulico',
  electric: 'Elettricista',
  locksmith: 'Fabbro',
  climate: 'Climatizzazione',
  handyman: 'Tuttofare',
  generic: 'Generico',
};

const RATING_LABELS = [
  { rating: 1, label: 'Insoddisfacente', emoji: '😞' },
  { rating: 2, label: 'Da migliorare', emoji: '😕' },
  { rating: 3, label: 'Buono', emoji: '😊' },
  { rating: 4, label: 'Molto buono', emoji: '😄' },
  { rating: 5, label: 'Eccellente', emoji: '🤩' },
];

export function ReviewForm({ ticket }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const currentRating = hoverRating || rating;
  const ratingInfo = RATING_LABELS.find((r) => r.rating === currentRating);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Seleziona una valutazione');
      return;
    }

    if (review.length > 500) {
      toast.error('Il commento è troppo lungo (max 500 caratteri)');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          review: review.trim() || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Errore durante invio recensione');
      }

      toast.success('Grazie per la tua recensione! 🌟', {
        description: 'Il tuo feedback ci aiuta a migliorare il servizio.',
      });

      router.push('/dashboard/conversations');
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Errore durante invio recensione'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        <div>
          <CardTitle className="text-2xl mb-2">Come è andato l&apos;intervento?</CardTitle>
          <p className="text-sm text-muted-foreground">
            La tua opinione è preziosa per noi e aiuta altri clienti a scegliere il miglior tecnico
          </p>
        </div>

        {/* Ticket Info */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <Badge variant="outline" className="text-sm">
            {CATEGORY_LABELS[ticket.category || 'generic']}
          </Badge>
          <p className="text-xs text-muted-foreground line-clamp-2 max-w-md">
            {ticket.description}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all hover:scale-125 active:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded-full p-1"
                  aria-label={`Valuta ${star} stelle`}
                >
                  <Star
                    className={`w-12 h-12 transition-all ${
                      star <= currentRating
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_2px_4px_rgba(250,204,21,0.5)]'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Label */}
            {ratingInfo && (
              <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {ratingInfo.emoji} {ratingInfo.label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {rating > 0 ? `Hai selezionato ${rating} stelle` : 'Passa il mouse sulle stelle per valutare'}
                </p>
              </div>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              Vuoi aggiungere un commento? <span className="text-muted-foreground font-normal">(opzionale)</span>
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Racconta la tua esperienza... Cosa ti è piaciuto? Cosa potremmo migliorare?"
              rows={5}
              maxLength={500}
              className="resize-none text-base"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Il commento sarà pubblico e visibile agli altri utenti</span>
              <span className={review.length > 450 ? 'text-orange-500 font-semibold' : ''}>
                {review.length}/500
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Invio in corso...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5 mr-2 fill-current" />
                  Invia Recensione
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="h-12 text-base"
            >
              Annulla
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground mt-6 pt-6 border-t">
          💡 <strong>Suggerimento:</strong> Le recensioni dettagliate aiutano altri clienti e premiano i tecnici migliori
        </p>
      </CardContent>
    </Card>
  );
}
