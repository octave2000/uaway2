"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import type { UploadRouter } from "@/app/api/uploadthing/core";

type UploadFieldEndpoint = keyof UploadRouter;

type FileUploadFieldProps = {
  accept: string;
  acceptedLabel: string;
  endpoint: UploadFieldEndpoint;
  helper: string;
  kind?: "image" | "document";
  label: string;
  name: string;
  value?: string | null;
};

function getFileName(url: string) {
  const filePath = url.split("/").pop() ?? url;
  return decodeURIComponent(filePath);
}

function isPdfFile(url: string) {
  return url.toLowerCase().includes(".pdf");
}

export function FileUploadField({
  accept,
  acceptedLabel,
  endpoint,
  helper,
  kind = "image",
  label,
  name,
  value,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState(value ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (files) => {
      const uploaded = files[0];
      const nextUrl =
        uploaded?.serverData?.url ?? uploaded?.ufsUrl ?? uploaded?.url ?? "";

      if (!nextUrl) {
        setUploadError("Upload completed but no file URL was returned.");
        return;
      }

      setUploadedUrl(nextUrl);
      setUploadError(null);
    },
    onUploadError: (error) => {
      setUploadError(error.message);
    },
  });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);
    await startUpload([file]);
  }

  const uploadedFileName = useMemo(
    () => (uploadedUrl ? getFileName(uploadedUrl) : null),
    [uploadedUrl],
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={uploadedUrl} />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={cn(
          "rounded-[1.5rem] border border-dashed border-border/60 bg-muted/10 p-4 transition-colors",
          isUploading ? "border-primary/50 bg-primary/5" : "hover:border-primary/40",
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">
              {helper}
            </div>
          </div>
          {uploadedUrl ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Uploaded
            </span>
          ) : null}
        </div>

        {kind === "image" && uploadedUrl ? (
          <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-[1.25rem] border border-border/50 bg-background/70">
            <Image
              src={uploadedUrl}
              alt={label}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : kind === "image" ? (
          <div className="mb-4 flex min-h-28 items-center justify-center rounded-[1.25rem] border border-border/50 bg-background/70 px-6 text-center text-sm font-medium text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-7 w-7 text-primary/50" />
              <span>Upload a preview image for this file.</span>
            </div>
          </div>
        ) : uploadedUrl ? (
          <div className="mb-4 flex items-center gap-3 rounded-[1.25rem] border border-border/50 bg-background/70 p-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">
                {uploadedFileName}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {isPdfFile(uploadedUrl) ? "PDF document uploaded" : "Image document uploaded"}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex min-h-28 items-center justify-center rounded-[1.25rem] border border-border/50 bg-background/70 px-6 text-center text-sm font-medium text-muted-foreground">
            No file uploaded yet.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-muted-foreground">{acceptedLabel}</div>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                {uploadedUrl ? "Replace file" : "Choose file"}
              </>
            )}
          </Button>
        </div>

        {uploadError ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {uploadError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
