"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Receipt,
  DollarSign,
  Clock,
  XCircle,
  CheckCircle2,
  RotateCcw,
  Eye,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DropdownSelect, SelectItem } from "@/components/ui/select";

const STATUS_FILTERS = [
  { label: "All Statuses", value: "" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

function statusBadge(status: string) {
  switch (status) {
    case "PAID":
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
    case "PENDING":
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "FAILED":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    case "REFUNDED":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><RotateCcw className="h-3 w-3 mr-1" />Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

type Invoice = {
  id: string;
  userId: string;
  amount: number;
  status: string;
  planId: string | null;
  description: string | null;
  fawaterakInvoiceId: number | null;
  fawaterakInvoiceKey: string | null;
  paymentMethodUsed: string | null;
  referenceNumber: string | null;
  successToken: string | null;
  currency: string;
  paidAt: string | Date | null;
  createdAt: string | Date;
  user: { id: string; name: string | null; email: string; image: string | null };
};

export default function AdminInvoicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { data, isLoading } = trpc.admin.invoiceList.useQuery(
    { page, limit: 20, status: status as "" | "PAID" | "PENDING" | "FAILED" | "REFUNDED", search },
  );
  const { data: stats } = trpc.admin.invoiceStats.useQuery();

  const utils = trpc.useUtils();
  const markPaid = trpc.admin.invoiceMarkPaid.useMutation({
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      void utils.admin.invoiceList.invalidate();
      void utils.admin.invoiceStats.invalidate();
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelInvoice = trpc.admin.invoiceCancel.useMutation({
    onSuccess: () => {
      toast.success("Invoice cancelled");
      void utils.admin.invoiceList.invalidate();
      void utils.admin.invoiceStats.invalidate();
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const refundInvoice = trpc.admin.invoiceRefund.useMutation({
    onSuccess: () => {
      toast.success("Invoice refunded & user downgraded");
      void utils.admin.invoiceList.invalidate();
      void utils.admin.invoiceStats.invalidate();
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteInvoice = trpc.admin.invoiceDelete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted");
      void utils.admin.invoiceList.invalidate();
      void utils.admin.invoiceStats.invalidate();
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAll = trpc.admin.invoiceDeleteAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCount} invoices`);
      void utils.admin.invoiceList.invalidate();
      void utils.admin.invoiceStats.invalidate();
      setDeleteConfirm("");
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkCancel = trpc.admin.invoiceBulkCancel.useMutation({
    onSuccess: (data) => {
      toast.success(`Cancelled ${data.cancelledCount} pending invoices`);
      void utils.admin.invoiceList.invalidate();
      void utils.admin.invoiceStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">View and manage all payment invoices</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total", value: stats?.total ?? 0, icon: Receipt, color: "text-foreground" },
          { label: "Paid", value: stats?.paid ?? 0, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-500" },
          { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, color: "text-red-500" },
          { label: "Revenue", value: `$${stats?.revenue ?? 0}`, icon: DollarSign, color: "text-indigo-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg bg-muted p-2 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Invoices</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, ID, plan..."
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <DropdownSelect
                value={status}
                onValueChange={(v) => { setStatus(v); setPage(1); }}
                placeholder="Status"
              >
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </DropdownSelect>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !data?.invoices.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Receipt className="mx-auto h-10 w-10 mb-2 opacity-40" />
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Fawaterak ID</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={inv.user.image ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {(inv.user.name?.[0] ?? inv.user.email[0])?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate text-xs">{inv.user.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{inv.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-semibold">{inv.amount} {inv.currency}</td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" className="capitalize text-xs">{inv.planId ?? "—"}</Badge>
                      </td>
                      <td className="py-3 pr-3">{statusBadge(inv.status)}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">{inv.paymentMethodUsed ?? "—"}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{inv.fawaterakInvoiceId ?? "—"}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(inv as unknown as Invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {data.pages} ({data.total} invoices)
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>Full technical details for this invoice</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Invoice ID" value={selected.id} mono />
                <Detail label="Status" value={selected.status} badge />
                <Detail label="Amount" value={`${selected.amount} ${selected.currency}`} />
                <Detail label="Plan" value={selected.planId ?? "—"} />
                <Detail label="User ID" value={selected.userId} mono />
                <Detail label="User Email" value={selected.user.email} />
                <Detail label="Payment Method" value={selected.paymentMethodUsed ?? "—"} />
                <Detail label="Reference #" value={selected.referenceNumber ?? "—"} mono />
                <Detail label="Fawaterak Invoice ID" value={selected.fawaterakInvoiceId?.toString() ?? "—"} mono />
                <Detail label="Fawaterak Invoice Key" value={selected.fawaterakInvoiceKey ?? "—"} mono />
                <Detail label="Description" value={selected.description ?? "—"} />
                <Detail label="Created" value={format(new Date(selected.createdAt), "PPpp")} />
                <Detail label="Paid At" value={selected.paidAt ? format(new Date(selected.paidAt), "PPpp") : "—"} />
                <Detail label="Has Success Token" value={selected.successToken ? "Yes" : "No"} />
              </div>

              {selected.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => markPaid.mutate({ invoiceId: selected.id })}
                    disabled={markPaid.isPending || cancelInvoice.isPending}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    {markPaid.isPending ? "Processing..." : "Mark as Paid"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => cancelInvoice.mutate({ invoiceId: selected.id })}
                    disabled={markPaid.isPending || cancelInvoice.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {cancelInvoice.isPending ? "Cancelling..." : "Cancel Invoice"}
                  </Button>
                </div>
              )}
              {selected.status === "PAID" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => refundInvoice.mutate({ invoiceId: selected.id })}
                  disabled={refundInvoice.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {refundInvoice.isPending ? "Processing..." : "Refund & Downgrade User"}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => deleteInvoice.mutate({ invoiceId: selected.id })}
                disabled={deleteInvoice.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteInvoice.isPending ? "Deleting..." : "Delete Invoice"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-sm">Cancel all pending invoices</p>
              <p className="text-xs text-muted-foreground">Mark all PENDING invoices as FAILED</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bulkCancel.mutate({ status: "PENDING" })}
              disabled={bulkCancel.isPending}
            >
              {bulkCancel.isPending ? "Cancelling..." : `Cancel All Pending (${stats?.pending ?? 0})`}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-sm text-destructive">Delete ALL invoices</p>
              <p className="text-xs text-muted-foreground">Permanently remove all invoice records. This cannot be undone.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type DELETE_ALL_INVOICES"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-52 h-8 text-xs"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteAll.mutate({ confirm: "DELETE_ALL_INVOICES" })}
                disabled={deleteConfirm !== "DELETE_ALL_INVOICES" || deleteAll.isPending}
              >
                {deleteAll.isPending ? "Deleting..." : "Delete All"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {badge ? (
        statusBadge(value)
      ) : (
        <p className={`font-medium text-sm ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</p>
      )}
    </div>
  );
}
