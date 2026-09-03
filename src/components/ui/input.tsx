import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-[#17233e]/15 bg-white px-4 text-base text-[#17233e] outline-none transition placeholder:text-[#637083]/70 focus:border-[#a6751d] focus:ring-2 focus:ring-[#a6751d]/20",
        className,
      )}
      {...props}
    />
  );
}
