import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FileText, Users, Activity, Database } from "lucide-react";
import { COLORS } from "../types";

const quickActions = [
  {
    href: "/reviews",
    label: "View Reviews",
    icon: FileText,
    color: COLORS.primary,
  },
  {
    href: "/teams",
    label: "Manage Teams",
    icon: Users,
    color: COLORS.info,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Activity,
    color: COLORS.warning,
  },
  {
    href: "/repo",
    label: "Repositories",
    icon: Database,
    color: COLORS.success,
  },
];

export function QuickActionsCard() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-colors text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <action.icon
                  className="h-6 w-6"
                  style={{ color: action.color }}
                />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
