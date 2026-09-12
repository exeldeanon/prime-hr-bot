import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type PracticeBrandProps = {
  className?: string;
  href?: string;
  showLabel?: boolean;
};

export function PracticeBrand({
  className,
  href = "/",
  showLabel = true,
}: PracticeBrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#00a98e]/60 focus-visible:ring-offset-4",
        className,
      )}
      aria-label="HR Prime"
    >
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[15px] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(0,169,181,.13)] transition duration-300 group-hover:-translate-y-0.5 dark:border-white/10">
        <Image
          src="/hr-prime-logo.png"
          alt=""
          width={1254}
          height={1254}
          className="size-[52px] max-w-none scale-[1.14] select-none"
          priority
        />
      </span>
      {showLabel && (
        <span className="text-[19px] font-black tracking-[-.055em] text-slate-950 dark:text-white">
          HR{" "}
          <span className="bg-gradient-to-r from-[#00a98e] via-[#00b4d8] to-[#00c9a7] bg-clip-text text-transparent">
            Prime
          </span>
        </span>
      )}
    </Link>
  );
}

export default PracticeBrand;
