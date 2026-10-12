import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Uaway home"
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      <Image
        src="/uaway-logo.jpeg"
        alt=""
        width={640}
        height={640}
        className="size-full object-contain"
      />
    </Link>
  );
}
