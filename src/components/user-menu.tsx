"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { LogOut, User, Settings, CreditCard, Shield, Loader2, Sun, Moon, Monitor } from "lucide-react";

interface UserProps {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role?: string | null;
  planId?: string | null;
}

export function UserMenu({ user, side = "bottom", compact = false, trigger }: { user: UserProps; side?: "top" | "bottom" | "left" | "right"; compact?: boolean; trigger?: React.ReactNode }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch {
      setIsSigningOut(false);
    }
  };

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email[0]?.toUpperCase() ?? "U");

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-1.5 py-1 rounded-sm hover:bg-muted transition-colors duration-150">
          {trigger || (
            <>
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="text-[11px] font-medium bg-muted text-muted-foreground">{initials}</AvatarFallback>
              </Avatar>
              {!compact && <span className="text-sm max-w-[100px] truncate hidden sm:inline">{user.name ?? "User"}</span>}
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={compact ? "start" : "end"} side={side} className="w-56" sideOffset={8}>
        {/* Header */}
        <div className="px-3 py-2.5">
          <p className="text-sm font-medium truncate">{user.name ?? "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/profile")} className="gap-2 cursor-pointer">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/billing")} className="gap-2 cursor-pointer">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span>Billing</span>
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <DropdownMenuItem onClick={() => router.push("/admin")} className="gap-2 cursor-pointer">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Admin</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={cycleTheme} className="gap-2 cursor-pointer">
          <ThemeIcon className="h-4 w-4 text-muted-foreground" />
          <span>Theme</span>
          <span className="ml-auto text-xs text-muted-foreground capitalize">{theme || "system"}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
          {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
