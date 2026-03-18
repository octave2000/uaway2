import Image from "next/image";

import { cn } from "@/lib/utils";

type CarImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  imageClassName?: string;
};

export function CarImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "100vw",
  imageClassName,
}: CarImageProps) {
  const imageSrc = src?.trim() ? src : "/default-car-placeholder.svg";

  return (
    <div className={cn("relative overflow-hidden bg-muted/30", className)}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          src?.trim() ? "object-cover" : "object-contain p-5 opacity-85",
          imageClassName,
        )}
      />
    </div>
  );
}
