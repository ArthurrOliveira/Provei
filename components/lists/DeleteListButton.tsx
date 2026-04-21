"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteList } from "@/app/actions/lists";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function DeleteListButton({ listId }: { listId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await deleteList(listId);
    if (res.success) {
      toast.success("Lista excluída");
      router.push("/app/lists");
      router.refresh();
    } else {
      toast.error("Erro ao excluir: " + res.error);
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-red-300 hover:text-red-500 transition-all"
      >
        <Trash2 className="w-4 h-4" />
        Excluir
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir lista?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Esta ação não pode ser desfeita. A lista e todos os restaurantes nela
            serão removidos permanentemente.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
