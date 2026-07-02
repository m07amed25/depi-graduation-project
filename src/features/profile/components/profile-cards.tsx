"use client";

import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Mail, Calendar, Camera, Loader2, ImageIcon } from "lucide-react";

interface Profile {
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date | string;
  plan: { id: string; name: string; accentColor: string };
  stats: { repositories: number; reviews: number; teamMembers: number };
  accounts: Array<{ id: string; providerId: string; createdAt?: Date | string; updatedAt?: Date | string }>;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

interface ProfileHeaderCardProps {
  profile: Profile;
  isEditing: boolean;
  editName: string;
  editEmail: string;
  editImage: string;
  setEditName: (v: string) => void;
  setEditImage: (v: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  onAvatarFileSelected: (file: File) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProfileHeaderCard({
  profile,
  isEditing,
  editName,
  editImage,
  isUploading,
  uploadProgress,
  onAvatarFileSelected,
}: ProfileHeaderCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayImage = isEditing ? editImage : (profile.image ?? "");
  const displayName = isEditing ? editName : profile.name;
  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarFileSelected(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-md border border-border">
      <div className="relative shrink-0">
        <Avatar className="size-16 ring-2 ring-border">
          <AvatarImage src={displayImage || undefined} alt={displayName} className="object-cover" />
          <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
        {isEditing && !isUploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
            aria-label="Upload avatar"
          >
            <Camera className="size-3" />
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" onChange={handleFileChange} className="hidden" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight truncate">{displayName || "User"}</h2>
          <Badge className={cn("text-xs h-5 px-1.5 font-medium border-none shrink-0", (() => {
            const colorMap: Record<string, string> = {
              slate: "bg-muted text-muted-foreground",
              indigo: "bg-primary/10 text-primary",
              amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
              blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            };
            return colorMap[profile.plan.accentColor] || "bg-muted text-muted-foreground";
          })())}>{profile.plan.name}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="size-3.5" />{profile.email}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Calendar className="size-3.5" />Joined {formatDate(profile.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface PersonalInfoCardProps {
  profile: Profile;
  isEditing: boolean;
  editName: string;
  editEmail: string;
  editImage: string;
  setEditName: (v: string) => void;
  setEditEmail: (v: string) => void;
  setEditImage: (v: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function PersonalInfoCard({
  profile,
  isEditing,
  editName,
  editEmail,
  editImage,
  setEditName,
  setEditEmail,
  setEditImage,
  nameInputRef,
}: PersonalInfoCardProps) {
  return (
    <div className="rounded-md border border-border p-4">
      <h3 className="text-[0.9375rem] font-semibold mb-4">Personal Information</h3>
      <div className="space-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="profile-name" className="text-sm text-muted-foreground">Name</Label>
          {isEditing ? (
            <Input ref={nameInputRef} id="profile-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your full name" className="max-w-sm" />
          ) : (
            <p className="text-sm font-medium">{profile.name}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="profile-email" className="text-sm text-muted-foreground">Email</Label>
          {isEditing ? (
            <Input id="profile-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="your@email.com" className="max-w-sm" />
          ) : (
            <p className="text-sm font-medium">{profile.email}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="profile-image" className="text-sm text-muted-foreground">Avatar URL</Label>
          {isEditing ? (
            <div className="flex items-center gap-2 max-w-sm">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input id="profile-image" value={editImage} onChange={(e) => setEditImage(e.target.value)} placeholder="https://example.com/avatar.jpg" className="pl-9" />
              </div>
              {editImage && (
                <Avatar className="size-8 ring-1 ring-border shrink-0">
                  <AvatarImage src={editImage} alt="Preview" />
                  <AvatarFallback className="text-xs">?</AvatarFallback>
                </Avatar>
              )}
            </div>
          ) : (
            <p className="font-mono text-xs text-muted-foreground truncate">
              {profile.image || <span className="italic">No custom avatar</span>}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm text-muted-foreground">Member since</Label>
          <p className="font-mono text-xs">{formatDate(profile.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
