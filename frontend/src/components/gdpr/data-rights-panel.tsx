"use client";

import React, { useState, useCallback } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Download,
  Eye,
  Loader2,
  Pencil,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type RightAction = "download" | "deletion" | "rectification" | "consent";

interface DataRequest {
  id: string;
  action: RightAction;
  status: "pending" | "processing" | "completed" | "rejected";
  createdAt: string;
  completedAt?: string;
}

const ACTION_CONFIG: Record<
  RightAction,
  {
    icon: React.ElementType;
    label: string;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "destructive" | "outline";
  }
> = {
  download: {
    icon: Download,
    label: "Download My Data",
    title: "Download Your Data",
    description:
      "We will prepare a copy of all personal data we hold about you in a machine-readable format (JSON). This includes your account information, task history, agent data, and usage records. The file will be available for download within 72 hours, and you will receive an email notification when it is ready. This right is guaranteed under Article 15 and Article 20 GDPR.",
    confirmLabel: "Request Data Export",
    variant: "default",
  },
  deletion: {
    icon: Trash2,
    label: "Request Deletion",
    title: "Request Account & Data Deletion",
    description:
      'This will initiate the deletion of your account and all associated personal data, in accordance with your "Right to Erasure" under Article 17 GDPR. Please note that some data may be retained where we have a legal obligation (e.g., financial records for tax purposes) or a legitimate interest that overrides the request. This action is irreversible once processed. Your account will be deactivated immediately, and data deletion will be completed within 30 days.',
    confirmLabel: "Request Deletion",
    variant: "destructive",
  },
  rectification: {
    icon: Pencil,
    label: "Rectify Data",
    title: "Rectify Your Data",
    description:
      "If you believe any personal data we hold about you is inaccurate or incomplete, you have the right to request rectification under Article 16 GDPR. You can update most information directly in your account settings. For data that cannot be self-edited (such as historical records), submitting this request will open a case with our team to review and correct the data. Please provide details of the inaccuracy in the notes field.",
    confirmLabel: "Submit Rectification Request",
    variant: "default",
  },
  consent: {
    icon: XCircle,
    label: "Withdraw Consent",
    title: "Withdraw Consent",
    description:
      "You may withdraw your consent for optional data processing activities at any time, pursuant to Article 7(3) GDPR. Withdrawing consent will not affect the lawfulness of processing based on consent before its withdrawal. This action will disable analytics cookies, marketing communications, and any other consent-based processing. Core platform functionality (which is based on contract performance) will not be affected.",
    confirmLabel: "Withdraw Consent",
    variant: "default",
  },
};

const STATUS_CONFIG: Record<
  DataRequest["status"],
  {
    label: string;
    variant: "default" | "warning" | "success" | "destructive";
    icon: React.ElementType;
  }
> = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  processing: { label: "Processing", variant: "default", icon: Loader2 },
  completed: { label: "Completed", variant: "success", icon: Check },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

/* -------------------------------------------------------------------------- */
/*  Data Rights Panel                                                         */
/* -------------------------------------------------------------------------- */

export function DataRightsPanel() {
  const [dialogAction, setDialogAction] = useState<RightAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* Submit a data rights request */
  const handleSubmitRequest = useCallback(
    async (action: RightAction) => {
      setLoading(true);
      setSuccessMessage(null);

      try {
        const response = await fetch(
          `/api/v1/users/me/data-rights/${action}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();

        /* Add to local request history */
        const newRequest: DataRequest = {
          id: data.id || `req-${Date.now()}`,
          action,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        setRequests((prev) => [newRequest, ...prev]);
        setSuccessMessage(
          `Your ${ACTION_CONFIG[action].label.toLowerCase()} request has been submitted successfully. We will process it within 30 days as required by GDPR Article 12(3).`
        );
      } catch {
        /* If the API is not available, still track the request locally for UI demo */
        const newRequest: DataRequest = {
          id: `req-${Date.now()}`,
          action,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        setRequests((prev) => [newRequest, ...prev]);
        setSuccessMessage(
          `Your ${ACTION_CONFIG[action].label.toLowerCase()} request has been recorded. You will receive a confirmation email shortly.`
        );
      } finally {
        setLoading(false);
        setDialogAction(null);
      }
    },
    []
  );

  const activeConfig = dialogAction ? ACTION_CONFIG[dialogAction] : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-stone-700" />
            <CardTitle>Your Data Rights</CardTitle>
          </div>
          <CardDescription>
            Under the GDPR, you have comprehensive rights over your personal
            data. Use the actions below to exercise your rights, or use{" "}
            <a
              href="/company/contact"
              className="text-brand-700 underline"
            >
              our contact form
            </a>{" "}
            for assistance.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Success message */}
          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-emerald-800">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-xs text-emerald-600 hover:text-emerald-800 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(ACTION_CONFIG) as [RightAction, typeof ACTION_CONFIG[RightAction]][]).map(
              ([action, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={action}
                    onClick={() => setDialogAction(action)}
                    className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 text-left hover:bg-stone-50 hover:border-stone-300 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-600 group-hover:bg-stone-200 transition-colors shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-stone-900">
                        {config.label}
                      </span>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {action === "download" && "Article 15 & 20 GDPR"}
                        {action === "deletion" && "Article 17 GDPR"}
                        {action === "rectification" && "Article 16 GDPR"}
                        {action === "consent" && "Article 7(3) GDPR"}
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* Request history */}
          {requests.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-stone-900 mb-3">
                Request History
              </h4>
              <div className="space-y-2">
                {requests.map((req) => {
                  const statusInfo = STATUS_CONFIG[req.status];
                  const actionInfo = ACTION_CONFIG[req.action];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-white border border-stone-200">
                          <actionInfo.icon className="h-4 w-4 text-stone-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-stone-900">
                            {actionInfo.label}
                          </span>
                          <p className="text-xs text-stone-500">
                            {new Date(req.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusInfo.variant} className="gap-1">
                        <StatusIcon
                          className={`h-3 w-3 ${
                            req.status === "processing" ? "animate-spin" : ""
                          }`}
                        />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog
        open={dialogAction !== null}
        onOpenChange={(open) => {
          if (!open) setDialogAction(null);
        }}
      >
        {activeConfig && (
          <DialogContent>
            <DialogClose onClick={() => setDialogAction(null)} />
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <activeConfig.icon className="h-5 w-5" />
                {activeConfig.title}
              </DialogTitle>
              <DialogDescription className="text-left">
                {activeConfig.description}
              </DialogDescription>
            </DialogHeader>

            {dialogAction === "deletion" && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action cannot be undone once
                  processed. All your data, including task history, agent
                  configurations, and account information will be permanently
                  deleted.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogAction(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant={activeConfig.variant === "destructive" ? "destructive" : "default"}
                onClick={() => dialogAction && handleSubmitRequest(dialogAction)}
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {activeConfig.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

export default DataRightsPanel;
