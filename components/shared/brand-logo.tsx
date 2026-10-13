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
        "relative inline-flex h-16 w-44 shrink-0 overflow-hidden rounded-lg bg-white",
        className,
      )}
    >
      <Image
        src="/newlogo.jpg"
        alt=""
        width={256}
        height={256}
        className="absolute left-0 top-1/2 h-auto w-full -translate-y-1/2"
      />
    </Link>
  );
}
