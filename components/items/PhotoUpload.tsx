"use client";

import { useMutation } from "convex/react";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";

/** Skala ner klient-side till max 1600px JPEG innan uppladdning. */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === "image/jpeg") return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85),
  );
}

export function PhotoUpload({
  photoUrl,
  itemName,
  onUploaded,
}: {
  photoUrl: string | null;
  itemName?: string;
  onUploaded: (photoId: Id<"_storage">) => void;
}) {
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const src = preview ?? photoUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-card bg-photo"
        style={src ? {} : { border: "1.5px dashed #D8D7CF", background: "transparent" }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={itemName ?? "Foto"} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted">
            <Camera size={26} strokeWidth={2} />
            <span className="text-[13.5px] font-semibold">
              {busy ? "Laddar upp…" : "Ta ett foto"}
            </span>
          </span>
        )}
        {src && (
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-3 py-1.5 text-[12px] font-semibold text-bg">
            {busy ? "Laddar upp…" : "Byt foto"}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const blob = await downscale(file);
            setPreview(URL.createObjectURL(blob));
            const url = await generateUploadUrl();
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "image/jpeg" },
              body: blob,
            });
            const { storageId } = (await res.json()) as {
              storageId: Id<"_storage">;
            };
            onUploaded(storageId);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
