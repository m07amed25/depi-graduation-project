import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";

export const metadata = {
  title: "Admin — Code Catch",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  const isOwner = dbUser?.email === process.env.OWNER_MAIL;

  if (!isOwner && dbUser?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        admin={{
          name: session.user.name ?? "Admin",
          email: session.user.email,
          image: session.user.image ?? null,
        }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 pt-20 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
