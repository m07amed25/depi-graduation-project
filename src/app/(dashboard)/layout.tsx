import { ErrorBoundary } from "@/components/error-boundary";
import { auth } from "@/server/auth";
import { db, withDbRetry } from "@/server/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";

function DashboardContent({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { id: string; name: string; email: string; image?: string | null; role?: string; planId?: string };
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background lg:flex">
        <DashboardSidebar user={user} />
        <div className="flex-1 min-w-0 pt-14 lg:pt-0">
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Breadcrumbs />
            {children}
          </main>
          <FeedbackButton />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const dbUser = await withDbRetry(() =>
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        planId: true,
        accounts: {
          where: { providerId: "github" },
          select: { id: true },
        },
        _count: {
          select: { teamMembers: true, repositories: true, reviews: true },
        },
      },
    })
  );

  return (
    <DashboardContent
      user={{
        id: session.user.id,
        name: session.user.name ?? "User",
        email: session.user.email,
        image: session.user.image,
        role: dbUser?.role ?? undefined,
        planId: dbUser?.planId ?? "free",
      }}
    >
      {children}
    </DashboardContent>
  );
}
