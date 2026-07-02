"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, ExternalLink, Loader2, Shield, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  providerId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface Provider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  description: string;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface ConnectedAccountsCardProps {
  accounts: Account[];
  providers: Provider[];
  connectingProvider: string | null;
  disconnectTarget: { accountId: string; providerName: string } | null;
  setDisconnectTarget: (v: { accountId: string; providerName: string } | null) => void;
  onConnect: (providerId: string) => void;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  hasPassword: boolean;
}

export function ConnectedAccountsCard({
  accounts,
  providers,
  connectingProvider,
  disconnectTarget,
  setDisconnectTarget,
  onConnect,
  onDisconnect,
  isDisconnecting,
  hasPassword,
}: ConnectedAccountsCardProps) {
  const router = useRouter();
  const connectedCount = accounts.filter((a) => a.providerId !== "credential").length;

  return (
    <>
      <div className="rounded-md border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] font-semibold">Connected Accounts</h3>
          <span className="font-mono text-xs text-muted-foreground">{connectedCount}/{providers.length}</span>
        </div>

        <div className="space-y-2">
          {providers.map((provider) => {
            const account = accounts.find((a) => a.providerId === provider.id);
            const isConnected = !!account;
            const isConnecting = connectingProvider === provider.id;
            const Icon = provider.icon;
            return (
              <div
                key={provider.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-md border transition-colors",
                  isConnected ? "border-border bg-muted/20" : "border-dashed border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex shrink-0 items-center justify-center size-8 rounded-md ${provider.color}`}>
                    <Icon className={`size-4 ${provider.textColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{provider.name}</p>
                    {isConnected ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        Connected{account.createdAt ? ` ${formatDate(account.createdAt)}` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  {isConnected ? (
                    <>
                      <Badge variant="secondary" className="hidden sm:flex gap-1 text-xs bg-emerald-500/10 text-emerald-500">
                        <Check className="size-3" />Active
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDisconnectTarget({ accountId: account.id, providerName: provider.name })}
                        aria-label={`Disconnect ${provider.name}`}
                      >
                        <Unlink className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onConnect(provider.id)} disabled={isConnecting} className="gap-1.5 h-7 text-xs">
                      {isConnecting ? <Loader2 className="size-3.5 animate-spin" /> : <><ExternalLink className="size-3" />Connect</>}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-2 mt-3 p-2.5 rounded-md bg-muted/30 text-xs text-muted-foreground">
          <Shield className="size-3.5 mt-0.5 shrink-0" />
          <p>Credentials are encrypted. Disconnecting revokes access but does not delete synced data.</p>
        </div>
      </div>

      <AlertDialog open={!!disconnectTarget} onOpenChange={(open) => !open && setDisconnectTarget(null)}>
        <AlertDialogContent>
          {(() => {
            const otherProviders = accounts.filter((a) => a.providerId !== "credential" && a.id !== disconnectTarget?.accountId);
            const isOnlyAuthMethod = !hasPassword && otherProviders.length === 0;
            return isOnlyAuthMethod ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
                    <Shield className="size-5" />Cannot Disconnect {disconnectTarget?.providerName}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This is your only sign-in method. Disconnecting would lock you out. To remove this connection, delete your account from Settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => { setDisconnectTarget(null); router.push("/settings#danger-zone"); }}>
                    Go to Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ) : (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect {disconnectTarget?.providerName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will not be able to sign in with {disconnectTarget?.providerName} until you reconnect it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDisconnect}>
                    {isDisconnecting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Unlink className="size-4 mr-2" />}
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
