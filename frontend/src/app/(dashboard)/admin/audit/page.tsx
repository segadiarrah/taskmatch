"use client";

import React, { useState, useEffect } from "react";
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

const actorColors: Record<string, string> = {
  Admin: "bg-zinc-900 text-white",
  Client: "bg-blue-100 text-blue-700",
  Agent: "bg-purple-100 text-purple-700",
  MCP: "bg-indigo-100 text-indigo-700",
  System: "bg-zinc-100 text-zinc-700",
};

const actionColors: Record<string, string> = {
  created: "text-emerald-600",
  updated: "text-blue-600",
  deleted: "text-red-600",
  submitted: "text-blue-600",
  formatted: "text-indigo-600",
  decomposed: "text-purple-600",
  matched: "text-cyan-600",
  assigned: "text-amber-600",
  placed_bid: "text-amber-600",
  ranked_bids: "text-amber-600",
  approved: "text-emerald-600",
  rejected: "text-red-600",
  validated: "text-purple-600",
  released_payment: "text-emerald-600",
  completed: "text-emerald-600",
  paused: "text-amber-600",
  disabled: "text-red-600",
  reactivated: "text-emerald-600",
  flagged: "text-red-600",
  logged_in: "text-zinc-600",
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorTypeFilter, setActorTypeFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog();
  }, []);

  async function fetchAuditLog() {
    setLoading(true);
    try {
      const data = await apiGet<AuditEntry[]>("/v1/dashboard/audit-logs");
      setEntries(data);
    } catch {
      setEntries([
        { id: "au-1", actor_type: "MCP", actor_id: "system", action: "validated", entity_type: "Submission", entity_id: "s-1", details: "Auto-validation completed for Mobile App UI Screens submission. Score: 91/100. Result: Pass.", payload_json: { score: 91, passed: true, checks_passed: 4, checks_total: 4 }, created_at: "2026-03-22T09:05:00Z" },
        { id: "au-2", actor_type: "Agent", actor_id: "a-5", action: "submitted", entity_type: "Submission", entity_id: "s-1", details: "DesignPro submitted deliverable for Mobile App UI Screens task.", payload_json: { deliverable_url: "https://github.com/example/pr/55", summary_length: 180 }, created_at: "2026-03-22T09:00:00Z" },
        { id: "au-3", actor_type: "Admin", actor_id: "u-1", action: "released_payment", entity_type: "Payment", entity_id: "p-1", details: "$5,500 payment released to Alice Dev for Frontend UI Development.", payload_json: { amount: 5500, developer: "Alice Dev", agent: "ReactMaster" }, created_at: "2026-03-21T10:00:00Z" },
        { id: "au-4", actor_type: "MCP", actor_id: "system", action: "ranked_bids", entity_type: "Task", entity_id: "t-2", details: "Ranked 3 bids for Backend API Development. NodeNinja selected as top candidate.", payload_json: { bid_count: 3, top_bid: { agent: "NodeNinja", score: 0.91 } }, created_at: "2026-03-20T15:00:00Z" },
        { id: "au-5", actor_type: "Admin", actor_id: "u-1", action: "assigned", entity_type: "Task", entity_id: "t-2", details: "Assigned NodeNinja to Backend API Development task.", payload_json: { agent_id: "a-2", agent_name: "NodeNinja", bid_amount: 5000 }, created_at: "2026-03-20T16:00:00Z" },
        { id: "au-6", actor_type: "Agent", actor_id: "a-11", action: "placed_bid", entity_type: "Bid", entity_id: "b-5", details: "DataBot bid $3,800 on ETL Pipeline Setup task.", payload_json: { amount: 3800, estimated_hours: 45, task_id: "t-7" }, created_at: "2026-03-20T11:00:00Z" },
        { id: "au-7", actor_type: "MCP", actor_id: "system", action: "matched", entity_type: "Task", entity_id: "t-1", details: "4 agents matched for Frontend UI Development. Top match: ReactMaster (95%).", payload_json: { matched_count: 4, top_match: { agent: "ReactMaster", score: 0.95 }, algorithm: "capability_hybrid_v2" }, created_at: "2026-03-19T08:00:00Z" },
        { id: "au-8", actor_type: "MCP", actor_id: "system", action: "decomposed", entity_type: "Job", entity_id: "j-1", details: "E-commerce Platform Rebuild decomposed into 5 tasks.", payload_json: { task_count: 5, task_types: ["development", "development", "development", "integration", "testing"] }, created_at: "2026-03-18T14:32:00Z" },
        { id: "au-9", actor_type: "MCP", actor_id: "system", action: "formatted", entity_type: "Job", entity_id: "j-1", details: "Job description auto-formatted from raw client submission.", payload_json: { raw_length: 1200, formatted_length: 2400, sections: 5, confidence: 0.94 }, created_at: "2026-03-18T14:30:00Z" },
        { id: "au-10", actor_type: "Client", actor_id: "u-5", action: "created", entity_type: "Job", entity_id: "j-1", details: "TechCorp Inc submitted new job: E-commerce Platform Rebuild.", payload_json: { title: "E-commerce Platform Rebuild", budget_min: 15000, budget_max: 25000 }, created_at: "2026-03-18T10:00:00Z" },
        { id: "au-11", actor_type: "Admin", actor_id: "u-1", action: "approved", entity_type: "Submission", entity_id: "s-4", details: "Approved REST API Endpoints submission from APIWizard. Score: 4.5/5.", payload_json: { score: 4.5, notes: "Excellent API design with comprehensive documentation." }, created_at: "2026-03-19T09:00:00Z" },
        { id: "au-12", actor_type: "Admin", actor_id: "u-1", action: "rejected", entity_type: "Submission", entity_id: "s-5", details: "Rejected Authentication System submission from FrontendPro. Security vulnerabilities found.", payload_json: { score: 2.8, reason: "MFA security vulnerabilities", rework_possible: true }, created_at: "2026-03-17T10:00:00Z" },
        { id: "au-13", actor_type: "MCP", actor_id: "system", action: "flagged", entity_type: "Agent", entity_id: "a-8", details: "TestRunner flagged for performance review. 3 of 5 recent submissions rejected.", payload_json: { rejection_rate: 0.6, quality_trend: "declining", recommendation: "pause" }, created_at: "2026-03-17T10:00:00Z" },
        { id: "au-14", actor_type: "Admin", actor_id: "u-1", action: "disabled", entity_type: "Agent", entity_id: "a-8", details: "TestRunner disabled pending developer review.", payload_json: { previous_status: "active", reason: "quality_issues" }, created_at: "2026-03-17T10:30:00Z" },
        { id: "au-15", actor_type: "System", actor_id: "system", action: "completed", entity_type: "Payment", entity_id: "p-3", details: "Payment of $3,000 completed for REST API Endpoints. Funds transferred to Dan Dev.", payload_json: { gross_amount: 3000, platform_fee: 300, net_amount: 2700 }, created_at: "2026-03-19T09:00:00Z" },
        { id: "au-16", actor_type: "Client", actor_id: "u-8", action: "created", entity_type: "Job", entity_id: "j-3", details: "DataDriven LLC submitted new job: Data Pipeline Optimization.", payload_json: { title: "Data Pipeline Optimization", budget_min: 8000, budget_max: 12000 }, created_at: "2026-03-12T14:00:00Z" },
        { id: "au-17", actor_type: "Agent", actor_id: "a-1", action: "submitted", entity_type: "Submission", entity_id: "s-6", details: "ReactMaster submitted Dashboard Components deliverable.", payload_json: { deliverable_url: "https://github.com/example/pr/42", components_count: 15 }, created_at: "2026-03-10T09:00:00Z" },
        { id: "au-18", actor_type: "Admin", actor_id: "u-1", action: "approved", entity_type: "Submission", entity_id: "s-6", details: "Approved Dashboard Components from ReactMaster. Score: 4.8/5.", payload_json: { score: 4.8, notes: "Beautifully crafted components" }, created_at: "2026-03-10T14:00:00Z" },
      ]);
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Audit Log</h1>
        <p className="mt-1 text-sm text-zinc-500">
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
                  <div className={cn("rounded-lg p-2", actorColors[type] || "bg-zinc-100 text-zinc-700")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-zinc-900">{count}</p>
                    <p className="text-xs text-zinc-500">{type}</p>
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
              <Filter className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-500">Filter by:</span>
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
            <span className="text-sm text-zinc-400">
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                <p className="text-sm text-zinc-500">Loading audit log...</p>
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ScrollText className="h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-500">No audit entries found</p>
              <p className="text-xs text-zinc-400">Try adjusting the filters</p>
            </div>
          ) : (
            <Table>
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
                          isExpanded && "bg-zinc-50/80"
                        )}
                        onClick={() => hasPayload && toggleExpand(entry.id)}
                      >
                        <TableCell>
                          {hasPayload ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-zinc-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-zinc-400" />
                            )
                          ) : (
                            <span className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="text-xs">{formatDateTime(entry.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-[10px]", actorColors[entry.actor_type] || "bg-zinc-100 text-zinc-700")}>
                              <ActorIcon className="mr-1 h-2.5 w-2.5" />
                              {entry.actor_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-sm font-medium",
                            actionColors[entry.action] || "text-zinc-600"
                          )}>
                            {formatStatus(entry.action)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {entry.entity_type}
                            </Badge>
                            <span className="text-xs text-zinc-400">{entry.entity_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-zinc-600 truncate max-w-[300px]">
                            {entry.details}
                          </p>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (entry.payload_json ?? entry.payload) && (
                        <TableRow className="bg-zinc-50/80">
                          <TableCell colSpan={6}>
                            <div className="px-4 py-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Code className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                                  Payload
                                </span>
                              </div>
                              <pre className="rounded-lg bg-zinc-900 p-4 text-xs text-zinc-300 overflow-x-auto">
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
