"use client";

import React, { useState, useEffect } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { apiGet } from "@/lib/api";
import { cn, formatStatus, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ScrollText,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Bot,
  Brain,
  Shield,
  Settings,
  Activity,
  Clock,
  FileText,
  Code,
} from "lucide-react";

interface AuditEntry {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  payload_json?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

const actorTypes = ["Admin", "Client", "Agent", "MCP", "System"];
const entityTypes = ["Job", "Task", "Agent", "Submission", "Payment", "Bid", "User"];

const actorIcons: Record<string, React.ElementType> = {
  Admin: Shield,
  Client: User,
  Agent: Bot,
  MCP: Brain,
  System: Settings,
};

const actorColors: Record<string, { variant: "default" | "secondary" | "outline" | "info" | "purple"; box: string }> = {
  Admin: { variant: "secondary", box: "border border-ink-700 bg-ink-800 text-ink-300" },
  Client: { variant: "info", box: "bg-info/10 text-info" },
  Agent: { variant: "purple", box: "bg-[#b49aff]/10 text-[#b49aff]" },
  MCP: { variant: "default", box: "bg-signal-500/10 text-signal-400" },
  System: { variant: "outline", box: "bg-ink-800 text-ink-400" },
};

const actionColors: Record<string, string> = {
  created: "text-success",
  updated: "text-info",
  deleted: "text-danger",
  submitted: "text-info",
  formatted: "text-signal-400",
  decomposed: "text-[#b49aff]",
  matched: "text-info",
  assigned: "text-warning",
  placed_bid: "text-warning",
  ranked_bids: "text-warning",
  approved: "text-success",
  rejected: "text-danger",
  validated: "text-[#b49aff]",
  released_payment: "text-success",
  completed: "text-success",
  paused: "text-warning",
  disabled: "text-danger",
  reactivated: "text-success",
  flagged: "text-danger",
  logged_in: "text-ink-400",
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actorTypeFilter, setActorTypeFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog();
  }, []);

  async function fetchAuditLog() {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await apiGet<AuditEntry[]>("/v1/dashboard/audit-logs");
      setEntries(data);
    } catch {
      setLoadError(true);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesActor = actorTypeFilter === "all" || entry.actor_type === actorTypeFilter;
    const matchesEntity = entityTypeFilter === "all" || entry.entity_type === entityTypeFilter;
    return matchesActor && matchesEntity;
  });

  function toggleExpand(id: string) {
    setExpandedRow(expandedRow === id ? null : id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chronological record of all platform actions and events.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {actorTypes.map((type) => {
          const count = entries.filter((e) => e.actor_type === type).length;
          const Icon = actorIcons[type] || Activity;
          return (
            <Card key={type}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-md p-2", actorColors[type]?.box || "bg-ink-800 text-ink-300")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-medium text-ink-50">{count}</p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink-500" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
            <Select
              value={actorTypeFilter}
              onChange={(e) => setActorTypeFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Actors</option>
              {actorTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Entities</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <span className="font-mono text-sm text-ink-500">
              {filteredEntries.length} of {entries.length} events
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
                <p className="text-sm text-muted-foreground">Loading audit log...</p>
              </div>
            </div>
          ) : loadError ? (
            <DataLoadError onRetry={fetchAuditLog} />
          ) : filteredEntries.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ScrollText className="h-10 w-10 text-ink-600" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No audit entries found</p>
              <p className="text-xs text-ink-500">Try adjusting the filters</p>
            </div>
          ) : (
            <Table className="font-mono text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-44">Timestamp</TableHead>
                  <TableHead className="w-36">Actor</TableHead>
                  <TableHead className="w-36">Action</TableHead>
                  <TableHead className="w-36">Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const ActorIcon = actorIcons[entry.actor_type] || Activity;
                  const isExpanded = expandedRow === entry.id;
                  const payloadData = entry.payload_json ?? entry.payload ?? null;
                  const hasPayload = payloadData != null && Object.keys(payloadData).length > 0;

                  return (
                    <React.Fragment key={entry.id}>
                      <TableRow
                        className={cn(
                          hasPayload && "cursor-pointer",
                          isExpanded && "bg-ink-900/70"
                        )}
                        onClick={() => hasPayload && toggleExpand(entry.id)}
                      >
                        <TableCell>
                          {hasPayload ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-ink-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-ink-500" />
                            )
                          ) : (
                            <span className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-ink-500">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="text-xs">{formatDateTime(entry.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={actorColors[entry.actor_type]?.variant || "secondary"} className="text-[10px]">
                              <ActorIcon className="mr-1 h-2.5 w-2.5" />
                              {entry.actor_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            actionColors[entry.action] || "text-ink-400"
                          )}>
                            {formatStatus(entry.action)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {entry.entity_type}
                            </Badge>
                            <span className="text-xs text-ink-500">{entry.entity_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[300px] truncate text-xs text-ink-300">
                            {entry.details}
                          </p>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (entry.payload_json ?? entry.payload) && (
                        <TableRow className="bg-ink-900/70">
                          <TableCell colSpan={6}>
                            <div className="px-4 py-3">
                              <div className="mb-2 flex items-center gap-2">
                                <Code className="h-3.5 w-3.5 text-ink-500" />
                                <span className="eyebrow text-ink-500">
                                  Payload
                                </span>
                              </div>
                              <pre className="overflow-x-auto rounded-md border border-ink-800 bg-ink-950 p-4 text-xs text-ink-300">
                                {JSON.stringify((entry.payload_json ?? entry.payload), null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
