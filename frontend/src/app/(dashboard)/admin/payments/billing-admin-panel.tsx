"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { formatMinor } from "@/lib/billing";
import { formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataLoadError } from "@/components/dashboard/data-load-error";

interface Funding {
  id: string;
  job_id: string;
  job_title: string;
  payer_name: string;
  amount_minor: number;
  currency: string;
  refunded_minor: number;
  status: string;
  error: string | null;
  can_refund: boolean;
}
interface Operation {
  id: string;
  kind: string;
  entity_id: string;
  status: string;
  attempts: number;
  available_at: string | null;
  last_error: string | null;
  job_title?: string | null;
  amount_minor?: number | null;
  currency?: string | null;
}

export default function BillingAdminPanel() {
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [fundingPage, setFundingPage] = useState(0);
  const [operationPage, setOperationPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refund, setRefund] = useState<Funding | null>(null);
  const [retry, setRetry] = useState<Operation | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setLoadError(false);
    try {
      const [fundingRows, operationRows] = await Promise.all([
        apiGet<Funding[]>(`/v1/billing/admin/fundings?skip=${fundingPage * 50}&limit=50`),
        apiGet<Operation[]>(`/v1/billing/admin/operations?skip=${operationPage * 50}&limit=50`),
      ]);
      setFundings(fundingRows); setOperations(operationRows);
    } catch { setLoadError(true); }
    finally { setLoading(false); }
  }, [fundingPage, operationPage]);
  useEffect(() => { void load(); }, [load]);

  async function confirmRefund() {
    if (!refund) return;
    setBusy(true); setActionError(null);
    try {
      await apiPost(`/v1/billing/jobs/${refund.job_id}/refund`, {});
      setRefund(null);
      await load();
    } catch (error) { setActionError(error instanceof ApiError ? error.message : "Could not request the refund. Check the saved status before retrying."); }
    finally { setBusy(false); }
  }
  async function retryOperation() {
    if (!retry) return;
    setBusy(true); setActionError(null);
    try {
      await apiPost(`/v1/billing/admin/operations/${retry.id}/retry`, {});
      setRetry(null); await load();
    } catch (error) { setActionError(error instanceof ApiError ? error.message : "Could not retry this operation. Check Stripe and the saved status before retrying."); }
    finally { setBusy(false); }
  }
  const relatedFunding = retry && fundings.find(item => item.id === retry.entity_id || item.job_id === retry.entity_id);
  const retryAmount = retry?.amount_minor != null && retry.currency ? formatMinor(retry.amount_minor, retry.currency) : relatedFunding ? formatMinor(relatedFunding.amount_minor - relatedFunding.refunded_minor, relatedFunding.currency) : null;

  return <div className="space-y-6">
    {actionError && <p role="alert" data-testid="funding-action-error" className="rounded-lg border border-danger/40 p-4 text-sm text-danger">{actionError}</p>}
    <Card>
      <CardHeader><CardTitle>Client funding</CardTitle><CardDescription>Track quote funding, refunds and review holds. Payment and refund completion require confirmation from Stripe.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {loadError ? <DataLoadError onRetry={() => void load()} /> : loading ? <p className="text-sm text-muted-foreground">Loading billing records…</p> : fundings.length === 0 ? <p className="text-sm text-muted-foreground">No Stripe funding records on this page.</p> : <Table>
          <TableHeader><TableRow><TableHead>Job / Client</TableHead><TableHead>Quote amount</TableHead><TableHead>Refund total</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
          <TableBody>{fundings.map(item => <TableRow key={item.id} data-testid="funding-row">
            <TableCell><p>{item.job_title}</p><p className="text-xs text-muted-foreground">{item.payer_name}</p></TableCell>
            <TableCell className="font-mono">{formatMinor(item.amount_minor, item.currency)}</TableCell>
            <TableCell className="font-mono">{formatMinor(item.refunded_minor, item.currency)}</TableCell>
            <TableCell><Badge variant={item.status === "paid" ? "success" : "secondary"}>{formatStatus(item.status)}</Badge>{item.error && <p className="mt-1 max-w-xs text-xs text-danger">{item.error}</p>}</TableCell>
            <TableCell>{item.can_refund && <Button variant="outline" size="sm" disabled={busy} onClick={() => { setActionError(null); setRefund(item); }}>Refund in full</Button>}</TableCell>
          </TableRow>)}</TableBody>
        </Table>}
        <div className="flex items-center justify-between"><Button variant="outline" disabled={loading || fundingPage === 0} onClick={() => setFundingPage(fundingPage - 1)}>Previous funding page</Button><span className="text-xs text-muted-foreground">Page {fundingPage + 1}</span><Button variant="outline" disabled={loading || fundings.length < 50} onClick={() => setFundingPage(fundingPage + 1)}>Next funding page</Button></div>
      </CardContent>
    </Card>
    <Card data-testid="billing-operations">
      <CardHeader><CardTitle>Billing operations</CardTitle><CardDescription>Pending, blocked and failed work is retained for recovery. A transfer credits a connected Stripe balance; it does not confirm a bank payout.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {loadError ? <DataLoadError onRetry={() => void load()} /> : loading ? <p className="text-sm text-muted-foreground">Loading operations…</p> : operations.length === 0 ? <p className="text-sm text-muted-foreground">No billing operations on this page.</p> : <Table>
          <TableHeader><TableRow><TableHead>Operation / Record</TableHead><TableHead>Status</TableHead><TableHead>Attempts</TableHead><TableHead>Next attempt</TableHead><TableHead>Error / Action</TableHead></TableRow></TableHeader>
          <TableBody>{operations.map(operation => <TableRow key={operation.id}>
            <TableCell><p>{formatStatus(operation.kind)}</p><p className="max-w-xs break-all font-mono text-xs text-muted-foreground">{operation.entity_id}</p></TableCell>
            <TableCell><Badge variant={operation.status === "done" ? "success" : "secondary"}>{formatStatus(operation.status)}</Badge></TableCell>
            <TableCell>{operation.attempts}</TableCell><TableCell className="text-xs">{formatDate(operation.available_at)}</TableCell>
            <TableCell>{operation.last_error && <p className="mb-2 max-w-sm text-xs text-danger">{operation.last_error}</p>}{["failed", "blocked"].includes(operation.status) && <Button variant="outline" size="sm" disabled={busy} onClick={() => { setActionError(null); setRetry(operation); }}>Retry operation</Button>}</TableCell>
          </TableRow>)}</TableBody>
        </Table>}
        <div className="flex items-center justify-between"><Button variant="outline" disabled={loading || operationPage === 0} onClick={() => setOperationPage(operationPage - 1)}>Previous operations page</Button><span className="text-xs text-muted-foreground">Page {operationPage + 1}</span><Button variant="outline" disabled={loading || operations.length < 50} onClick={() => setOperationPage(operationPage + 1)}>Next operations page</Button></div>
        <Button variant="outline" disabled={loading || busy} onClick={() => void load()}>Refresh billing records</Button>
      </CardContent>
    </Card>
    <Dialog open={Boolean(refund)} onOpenChange={open => { if (!open && !busy) setRefund(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Refund this payment in full?</DialogTitle><DialogDescription>Execution and new transfers will be stopped. Existing transfers are reconciled or reversed before Stripe processes the refund. This action cannot be undone here.</DialogDescription></DialogHeader>
        {refund && <div className="space-y-2 py-4"><p className="font-medium">{refund.job_title}</p><p>{refund.payer_name}</p><p className="font-mono text-xl">{formatMinor(refund.amount_minor - refund.refunded_minor, refund.currency)}</p><p className="text-xs text-muted-foreground">The amount is the remaining refundable balance of the original payment.</p></div>}
        {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setRefund(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => void confirmRefund()}>{busy ? "Requesting refund…" : "Confirm full refund"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(retry)} onOpenChange={open => { if (!open && !busy) setRetry(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Retry this billing operation?</DialogTitle><DialogDescription>Check the related funding or payment record and reconcile any uncertain Stripe outcome first. A retry can initiate a real transfer or refund.</DialogDescription></DialogHeader>
        {retry && <div className="space-y-2 py-4"><p>{formatStatus(retry.kind)}</p>{retry.job_title && <p className="font-medium">{retry.job_title}</p>}<p className="break-all font-mono text-sm">{retry.entity_id}</p>{retryAmount && <p className="font-mono text-xl">{retryAmount}</p>}{retry.last_error && <p className="text-sm text-danger">{retry.last_error}</p>}</div>}
        {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setRetry(null)}>Cancel</Button><Button disabled={busy} onClick={() => void retryOperation()}>{busy ? "Retrying…" : "Confirm retry"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
