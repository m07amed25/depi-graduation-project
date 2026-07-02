"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);

  const acceptMutation = trpc.team.acceptTeamInvite.useMutation({
    onSuccess: () => {
      toast.success("You've joined the team!");
      setDone(true);
      router.push("/teams");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to accept invite");
    },
  });

  const declineMutation = trpc.team.declineTeamInvite.useMutation({
    onSuccess: () => {
      toast.info("Invite declined");
      setDone(true);
      router.push("/");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to decline invite");
    },
  });

  const isPending = acceptMutation.isPending || declineMutation.isPending;

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              No invite token was found in the link. Please use the link from
              your invitation email.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You have been invited to join a team. Accept to become a member or
            decline if this was a mistake.
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={isPending || done}
            onClick={() => declineMutation.mutate({ token })}
          >
            {declineMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Decline
          </Button>
          <Button
            className="flex-1"
            disabled={isPending || done}
            onClick={() => acceptMutation.mutate({ token })}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
