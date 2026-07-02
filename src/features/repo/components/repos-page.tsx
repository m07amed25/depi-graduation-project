"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Github, Globe, Lock, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { ConnectedRepoCard } from "./connected-repo-card";
import { GettingStartedCard } from "./getting-started-card";
import { GithubReposPanel } from "./github-repos-panel";

const ease = [0.16, 1, 0.3, 1] as const;

export function ReposPage() {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [repoToDelete, setRepoToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const connectedRepos = trpc.repository.list.useQuery();
  const githubRepos = trpc.repository.fetchFromGithub.useQuery(undefined, {
    enabled: showGitHubRepos,
  });
  const onboarding = trpc.profile.onboardingStatus.useQuery();

  const connectMutation = trpc.repository.connect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
      void utils.profile.onboardingStatus.invalidate();
      setSelectedRepos(new Set());
      setShowGitHubRepos(false);
      toast.success("Repositories connected");
    },
    onError: (error) => toast.error(error.message || "Failed to connect"),
  });

  const disconnectMutation = trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
      void utils.profile.onboardingStatus.invalidate();
      toast.success("Repository disconnected");
      setRepoToDelete(null);
    },
    onError: (error) => toast.error(error.message || "Failed to disconnect"),
  });

  const connectedIds = new Set(connectedRepos.data?.map((repo) => repo.githubId) ?? []);
  const availableRepos =
    githubRepos.data?.filter((repo) => !connectedIds.has(repo.githubId)) ?? [];
  const filteredRepos = availableRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleRepo = (githubId: number) => {
    const nextRepos = new Set(selectedRepos);
    if (nextRepos.has(githubId)) {
      nextRepos.delete(githubId);
    } else {
      nextRepos.add(githubId);
    }
    setSelectedRepos(nextRepos);
  };

  const handleConnect = () => {
    const reposToConnect = availableRepos
      .filter((repo) => selectedRepos.has(repo.githubId))
      .map((repo) => ({
        githubId: repo.githubId,
        name: repo.name,
        fullName: repo.fullName,
        private: repo.private,
        htmlUrl: repo.htmlUrl,
      }));

    connectMutation.mutate({ repos: reposToConnect });
  };

  const openImport = () => {
    setShowGitHubRepos(true);
    setSearchQuery("");
    setSelectedRepos(new Set());
  };

  const handleLinkGithub = async () => {
    const { linkSocial } = await import("@/lib/auth-client");
    await linkSocial({ provider: "github", callbackURL: window.location.href });
  };

  const repos = connectedRepos.data ?? [];
  const privateCount = repos.filter((repo) => repo.private).length;
  const publicCount = repos.length - privateCount;

  return (
    <div className="space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Your repositories</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {repos.length > 0 ? (
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-foreground/80">{repos.length}</span>
                <span>watching for pull requests</span>
                <span className="text-border">·</span>
                {privateCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {privateCount} private
                  </span>
                ) : null}
                {privateCount > 0 && publicCount > 0 ? (
                  <span className="text-border">·</span>
                ) : null}
                {publicCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {publicCount} public
                  </span>
                ) : null}
              </span>
            ) : (
              "Link a GitHub repo and reviews start on the next PR. Takes about 30 seconds."
            )}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setShowGitHubRepos((isOpen) => !isOpen);
            setSearchQuery("");
            setSelectedRepos(new Set());
          }}
          variant={showGitHubRepos ? "outline" : "default"}
          className="h-8 gap-1.5 text-[13px] shrink-0"
        >
          {showGitHubRepos ? (
            <>
              <X className="h-3.5 w-3.5" />
              Close
            </>
          ) : (
            <>
              <Github className="h-3.5 w-3.5" />
              Add repos
            </>
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {showGitHubRepos ? (
          <motion.div
            key="import"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <GithubReposPanel
              availableRepos={availableRepos}
              filteredRepos={filteredRepos}
              selectedRepos={selectedRepos}
              searchQuery={searchQuery}
              isLoading={githubRepos.isLoading}
              isFetching={githubRepos.isFetching}
              error={githubRepos.error as { message?: string; data?: { code?: string } } | null}
              isConnecting={connectMutation.isPending}
              onToggle={toggleRepo}
              onSelectAll={() =>
                setSelectedRepos(new Set(availableRepos.map((repo) => repo.githubId)))
              }
              onClearSelection={() => setSelectedRepos(new Set())}
              onConnect={handleConnect}
              onRefresh={() => githubRepos.refetch()}
              onSearchChange={setSearchQuery}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease }}
      >
        {connectedRepos.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-sm" />
            ))}
          </div>
        ) : repos.length > 0 ? (
          <div className="space-y-3">
            {onboarding.data && !onboarding.data.hasReviews ? (
              <GettingStartedCard
                variant="slim"
                status={onboarding.data}
                onLinkGithub={handleLinkGithub}
                onChooseRepos={openImport}
              />
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {repos.map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, delay: index * 0.03, ease }}
                  >
                    <ConnectedRepoCard
                      repo={repo}
                      isDeleting={disconnectMutation.isPending}
                      onDelete={setRepoToDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <GettingStartedCard
            variant="full"
            status={onboarding.data}
            isLoading={onboarding.isLoading}
            onLinkGithub={handleLinkGithub}
            onChooseRepos={openImport}
          />
        )}
      </motion.div>

      <AlertDialog
        open={repoToDelete !== null}
        onOpenChange={() => setRepoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-medium text-foreground">{repoToDelete?.name}</span>{" "}
              from your account. You can reconnect it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRepoToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (repoToDelete) {
                  disconnectMutation.mutate({ id: repoToDelete.id });
                }
              }}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
