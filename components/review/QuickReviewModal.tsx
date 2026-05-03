"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createQuickReview } from "@/app/actions/reviews";
import { createReviewMedia } from "@/app/actions/media";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BADGE_ICONS } from "@/lib/badges/badge-utils";
import { Zap, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { VibeTag } from "@prisma/client";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "review-media";

const VIBE_CATEGORIES: Record<string, string[]> = {
  "🏠 Ambiente": ["Instagramável", "Música alta", "Bom pra trabalhar"],
  "🍽️ Comida": ["Porções generosas", "Boa carta de vinhos", "Preço justo"],
  "⭐ Serviço": ["Atendimento top", "Demora pra servir"],
  "💡 Ocasião": ["Bom para date", "Pet friendly"],
};

const EMOJIS = ["😡", "😕", "😐", "😊", "🤩"];
const EMOJI_LABELS = ["Péssimo", "Ruim", "Ok", "Bom", "Incrível"];
const CONFETTI_COLORS = ["#5C191E", "#C4954A", "#4A5A3C", "#E0BE82", "#7A2D33", "#6B7D5A"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i / 48) * 100 + (((i * 7) % 5) - 2)}%`,
        size: 6 + (i % 5) * 2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        isCircle: i % 3 === 0,
        duration: 0.8 + (i % 6) * 0.12,
        delay: (i % 10) * 0.04,
      })),
    []
  );

  return (
    <>
      <style>{`
        @keyframes mangut-confetti {
          0%   { transform: translateY(-8px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(600deg); opacity: 0; }
        }
        .mangut-confetti-piece { animation: mangut-confetti linear forwards; }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
        {pieces.map((p) => (
          <div
            key={p.id}
            className="mangut-confetti-piece absolute"
            style={{
              left: p.left,
              top: "-12px",
              width: p.size,
              height: p.size + 2,
              borderRadius: p.isCircle ? "50%" : "2px",
              backgroundColor: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function TagChip({ tag, selected, onToggle }: { tag: VibeTag; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-body border transition-all duration-150 active:scale-95 select-none",
        selected
          ? "bg-olive text-cream border-olive shadow-sm scale-105"
          : "bg-cream text-charcoal border-cream-dark hover:border-olive-light hover:bg-olive/10"
      )}
    >
      {tag.label}
    </button>
  );
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex justify-center items-center gap-2 py-1">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            s === step ? "w-8 bg-burgundy" : s < step ? "w-2 bg-gold" : "w-2 bg-cream-dark"
          )}
        />
      ))}
    </div>
  );
}

function QuickReviewModal({
  open,
  onClose,
  restaurantId,
  userId,
  vibeTags,
}: {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  userId: string;
  vibeTags: VibeTag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { categorized, other } = useMemo(() => {
    const allCategorizedLabels = Object.values(VIBE_CATEGORIES).flat();
    return {
      categorized: Object.entries(VIBE_CATEGORIES).map(([cat, labels]) => ({
        cat,
        tags: vibeTags.filter((t) => labels.includes(t.label)),
      })),
      other: vibeTags.filter((t) => !allCategorizedLabels.includes(t.label)),
    };
  }, [vibeTags]);

  function reset() {
    setStep(1);
    setSelectedTags([]);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    setRating(null);
    setShowConfetti(false);
    setSubmitting(false);
  }

  function handleClose() { reset(); onClose(); }
  function toggleTag(id: string) {
    setSelectedTags((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 5) { toast.error("Máximo 5 tags"); return prev; }
      return [...prev, id];
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem excede 10MB"); return; }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
  }

  async function handleSubmit() {
    if (selectedTags.length === 0) { toast.error("Selecione ao menos uma tag"); setStep(1); return; }
    setSubmitting(true);
    try {
      const res = await createQuickReview({ userId, restaurantId, vibeTagIds: selectedTags, rating: rating ?? undefined });
      if (!res.success) throw new Error(res.error);

      if (photo) {
        const ext = photo.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${res.data.id}/${Date.now()}.${ext}`;
        const { data: uploaded, error } = await supabase.storage.from(BUCKET).upload(path, photo);
        if (!error && uploaded) {
          const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(uploaded.path);
          await createReviewMedia({ reviewId: res.data.id, url: publicUrl, type: "IMAGE" });
        }
      }

      const newBadges = res.data.newBadges ?? [];
      setShowConfetti(true);
      setTimeout(() => {
        toast.success("Review publicada! 🎉");
        for (const badge of newBadges) {
          toast.success(`Novo selo: ${badge.label}!`, {
            icon: BADGE_ICONS[badge.slug] ?? "🏅",
            duration: 6000,
            style: { background: "#E0BE82", border: "1px solid #C4954A", color: "#3D1014" },
          });
        }
        reset();
        onClose();
        router.refresh();
      }, 1400);
    } catch (err) {
      toast.error("Erro: " + String(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md w-full max-h-[88vh] overflow-y-auto bg-warm-white text-charcoal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-display">
              <Zap className="w-5 h-5 text-gold" />
              Review Rápida
            </DialogTitle>
          </DialogHeader>

          <ProgressDots step={step} />

          {/* STEP 1 — Vibe Tags */}
          {step === 1 && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="font-body font-semibold text-charcoal">Como foi a vibe?</p>
                <p className="text-xs text-sage font-body mt-0.5">Selecione de 1 a 5 tags</p>
              </div>

              {categorized.map(({ cat, tags }) =>
                tags.length > 0 ? (
                  <div key={cat}>
                    <p className="text-xs font-body font-semibold text-sage uppercase tracking-wide mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <TagChip key={tag.id} tag={tag} selected={selectedTags.includes(tag.id)} onToggle={() => toggleTag(tag.id)} />
                      ))}
                    </div>
                  </div>
                ) : null
              )}

              {other.length > 0 && (
                <div>
                  <p className="text-xs font-body font-semibold text-sage uppercase tracking-wide mb-2">Outros</p>
                  <div className="flex flex-wrap gap-2">
                    {other.map((tag) => (
                      <TagChip key={tag.id} tag={tag} selected={selectedTags.includes(tag.id)} onToggle={() => toggleTag(tag.id)} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-cream-dark">
                <span className="text-xs text-sage font-body">{selectedTags.length} de 5 selecionadas</span>
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedTags.length === 0}
                  className="bg-burgundy hover:bg-burgundy-light text-cream font-body gap-1"
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 — Foto */}
          {step === 2 && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="font-body font-semibold text-charcoal">Adicionar foto</p>
                <p className="text-xs text-sage font-body mt-0.5">Opcional — mostre como foi!</p>
              </div>

              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden bg-cream-dark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Prévia" className="w-full max-h-60 object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-cream-dark rounded-xl flex flex-col items-center justify-center gap-3 text-sage hover:border-olive hover:text-olive transition-colors font-body"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Toque para adicionar foto</span>
                </button>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />

              <div className="flex justify-between gap-2 pt-3 border-t border-cream-dark">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1 border-cream-dark font-body">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </Button>
                <Button onClick={() => setStep(3)} className="bg-burgundy hover:bg-burgundy-light text-cream font-body gap-1">
                  {photo ? "Próximo" : "Pular"} <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Rating */}
          {step === 3 && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="font-body font-semibold text-charcoal">O que achou?</p>
                <p className="text-xs text-sage font-body mt-0.5">Opcional — dê sua nota</p>
              </div>

              <div className="flex justify-center gap-1 py-3">
                {EMOJIS.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(rating === i + 1 ? null : i + 1)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-2 py-1 rounded-xl transition-all duration-150",
                      rating === i + 1 ? "scale-125 bg-cream" : "opacity-50 hover:opacity-90 hover:scale-110"
                    )}
                  >
                    <span className="text-3xl leading-none">{emoji}</span>
                    <span className="text-xs text-sage font-body whitespace-nowrap">{EMOJI_LABELS[i]}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t border-cream-dark">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-1 border-cream-dark font-body">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-burgundy hover:bg-burgundy-light text-cream font-body flex-1 font-semibold gap-1"
                >
                  {submitting ? "Publicando..." : "🎉 Publicar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function QuickReviewButton({
  restaurantId,
  userId,
  vibeTags,
}: {
  restaurantId: string;
  userId: string;
  vibeTags: VibeTag[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-gold to-gold-light text-burgundy-dark font-body font-bold gap-2 flex-shrink-0 hover:opacity-90 transition-opacity"
      >
        <Zap className="w-4 h-4" />
        Review Rápida
      </Button>
      {open && (
        <QuickReviewModal
          open={open}
          onClose={() => setOpen(false)}
          restaurantId={restaurantId}
          userId={userId}
          vibeTags={vibeTags}
        />
      )}
    </>
  );
}
