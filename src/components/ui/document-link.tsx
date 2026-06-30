"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface DocumentLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function DocumentLink({
  href,
  children,
  className,
}: DocumentLinkProps) {
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setClicked(true);
    startTransition(() => {
      router.push(href);
    });
  };

  const loading = isPending || clicked;

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`relative ${className ?? ""}`}
    >
      {children}
      {loading && (
        <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        </div>
      )}
    </a>
  );
}
