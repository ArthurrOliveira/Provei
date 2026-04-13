"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createReview } from "@/app/actions/reviews";
import { createReviewMedia } from "@/app/actions/media";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import StarRating from "./StarRating";
import { Upload, X, Film, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VibeTag } from "@prisma/client";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "review-media";
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

type FilePreview = {
  file: File;
  preview: string;
  type: "IMAGE" | "VIDEO";
  thumbnail?: string;
};

export default function ReviewForm({
  restaurantId,
  userId,
  vibeTags,
}: {
  restaurantId: string;
  userId: string;
  vibeTags: VibeTag[];
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function generateVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.currentTime = 1;
      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (files.length + picked.length > MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} arquivos`);
      return;
    }

    for (const file of picked) {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        toast.error(`Tipo não permitido: ${file.type}`);
        continue;
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        toast.error("Imagem excede 10MB");
        continue;
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        toast.error("Vídeo excede 100MB");
        continue;
      }

      const type = isImage ? "IMAGE" : "VIDEO";
      const preview = URL.createObjectURL(file);
      const thumbnail = isVideo
        ? await generateVideoThumbnail(file)
        : undefined;

      setFiles((prev) => [...prev, { file, preview, type, thumbnail }]);
    }

    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadFile(fp: FilePreview, reviewId: string) {
    const ext = fp.file.name.split(".").pop();
    const path = `${userId}/${reviewId}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, fp.file, { upsert: false });

    if (error) throw new Error(error.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

    let thumbnailUrl: string | undefined;
    if (fp.thumbnail) {
      const thumbPath = `${userId}/${reviewId}/thumb_${Date.now()}.jpg`;
      const thumbBlob = await fetch(fp.thumbnail).then((r) => r.blob());
      const { data: td } = await supabase.storage
        .from(BUCKET)
        .upload(thumbPath, thumbBlob, { contentType: "image/jpeg" });
      if (td) {
        const { data: tpu } = supabase.storage.from(BUCKET).getPublicUrl(td.path);
        thumbnailUrl = tpu.publicUrl;
      }
    }

    return { url: publicUrl, type: fp.type, thumbnailUrl };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Escreva um comentário");
      return;
    }

    setSubmitting(true);
    try {
      const reviewRes = await createReview({
        userId,
        restaurantId,
        rating: rating > 0 ? rating : undefined,
        comment,
        vibeTagIds: selectedTags,
      });

      if (!reviewRes.success) throw new Error(reviewRes.error);

      const reviewId = reviewRes.data.id;

      for (const fp of files) {
        const uploaded = await uploadFile(fp, reviewId);
        await createReviewMedia({
          reviewId,
          url: uploaded.url,
          type: uploaded.type,
          thumbnailUrl: uploaded.thumbnailUrl,
        });
      }

      toast.success("Avaliação criada!");
      router.push(`/app/restaurants/${restaurantId}`);
      router.refresh();
    } catch (err) {
      toast.error("Erro: " + String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="mb-2 block">Nota (opcional)</Label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <button
            type="button"
            onClick={() => setRating(0)}
            className="text-xs text-gray-400 mt-1 hover:text-gray-600"
          >
            Limpar nota
          </button>
        )}
      </div>

      <div>
        <Label htmlFor="comment" className="mb-2 block">
          Comentário *
        </Label>
        <Textarea
          id="comment"
          rows={4}
          placeholder="Conte como foi sua experiência..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          className="resize-none"
        />
      </div>

      <div>
        <Label className="mb-3 block">Vibe Tags</Label>
        <div className="flex flex-wrap gap-2">
          {vibeTags.map((tag) => {
            const selected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  selected
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Fotos e Vídeos (opcional, máx. 5)</Label>

        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {files.map((fp, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {fp.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fp.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Film className="w-8 h-8 text-white opacity-70" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                {fp.type === "VIDEO" && (
                  <Badge className="absolute bottom-1 left-1 text-xs py-0 bg-black/60">
                    <Film className="w-2.5 h-2.5 mr-0.5" />
                    Vídeo
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {files.length < MAX_IMAGES && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              <ImageIcon className="w-4 h-4" />
              Adicionar fotos ou vídeos
            </button>
          </>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {submitting ? "Enviando..." : "Publicar Avaliação"}
      </Button>
    </form>
  );
}
