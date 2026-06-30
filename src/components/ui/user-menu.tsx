"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LogOut, ChevronDown, Loader2 } from "lucide-react";

interface UserMenuProps {
  name: string;
  email: string;
  image?: string | null;
}

export default function UserMenu({ name, email, image }: UserMenuProps) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  if (signingOut) {
    return (
      <div className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        <span className="text-muted-foreground text-sm">Signing out...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-accent flex items-center gap-2 rounded-full border py-1 pr-2.5 pl-1 transition-colors">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-6 w-6 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
              {name[0]?.toUpperCase()}
            </div>
          )}
          <span className="hidden text-sm font-medium md:block">{name}</span>
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground text-xs font-normal">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleSignOut()}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
