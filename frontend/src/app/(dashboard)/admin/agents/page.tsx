"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { cn, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Bot,
  UserRound,
  Search,
  Star,
  TrendingUp,
  CheckCircle2,
  Filter,
  ExternalLink,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  developer_name: string;
  kind?: "agent" | "human";
  status: string;
  capabilities: string[];
  success_rate: number;
  avg_score: number;
  completed_tasks: number;
  active_tasks: number;
  created_at: string;
}

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  active: { color: "border-success/40 bg-success/5", label: "Active", dot: "bg-success" },
  paused: { color: "border-warning/40 bg-warning/5", label: "Paused", dot: "bg-warning" },
  disabled: { color: "border-danger/40 bg-danger/5", label: "Disabled", dot: "bg-danger" },
};

const allCapabilities = [
  "react", "nextjs", "nodejs", "python", "typescript", "postgresql",
  "aws", "docker", "ml", "api-design", "testing", "devops",
];

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capabilityFilter, setCapabilityFilter] = useState("all");

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    try {
      const data = await apiGet<Agent[]>("/v1/admin/agents");
      setAgents(data);
    } catch {
      setAgents([
        { id: "a-1", name: "ReactMaster", developer_name: "Sarah Chen", status: "active", capabilities: ["react", "nextjs", "typescript"], success_rate: 0.92, avg_score: 4.6, completed_tasks: 47, active_tasks: 2, created_at: "2025-11-01T00:00:00Z" },
        { id: "a-2", name: "UIBuilder", developer_name: "Alex Kim", status: "active", capabilities: ["react", "typescript", "testing"], success_rate: 0.85, avg_score: 4.3, completed_tasks: 31, active_tasks: 1, created_at: "2025-12-15T00:00:00Z" },
        { id: "a-3", name: "DataWiz", developer_name: "Marcus Johnson", status: "active", capabilities: ["python", "postgresql", "ml"], success_rate: 0.94, avg_score: 4.8, completed_tasks: 62, active_tasks: 3, created_at: "2025-10-01T00:00:00Z" },
        { id: "a-4", name: "NodeNinja", developer_name: "Priya Patel", status: "active", capabilities: ["nodejs", "typescript", "api-design", "postgresql"], success_rate: 0.88, avg_score: 4.4, completed_tasks: 38, active_tasks: 1, created_at: "2025-11-20T00:00:00Z" },
        { id: "a-5", name: "FullStackBot", developer_name: "Jordan Lee", status: "paused", capabilities: ["react", "nodejs", "postgresql", "docker"], success_rate: 0.90, avg_score: 4.4, completed_tasks: 55, active_tasks: 0, created_at: "2025-09-15T00:00:00Z" },
        { id: "a-6", name: "MLEngine", developer_name: "Dr. Wei Zhang", status: "active", capabilities: ["python", "ml", "aws"], success_rate: 0.96, avg_score: 4.9, completed_tasks: 28, active_tasks: 2, created_at: "2026-01-10T00:00:00Z" },
        { id: "a-7", name: "DevOpsGuard", developer_name: "Carlos Rivera", status: "active", capabilities: ["docker", "aws", "devops"], success_rate: 0.91, avg_score: 4.5, completed_tasks: 44, active_tasks: 1, created_at: "2025-10-20T00:00:00Z" },
        { id: "a-8", name: "NextJSPro", developer_name: "Emily Wang", status: "disabled", capabilities: ["react", "nextjs"], success_rate: 0.72, avg_score: 3.8, completed_tasks: 15, active_tasks: 0, created_at: "2026-02-01T00:00:00Z" },
        { id: "a-9", name: "APIWizard", developer_name: "Tom Baker", status: "active", capabilities: ["nodejs", "api-design", "testing"], success_rate: 0.89, avg_score: 4.3, completed_tasks: 36, active_tasks: 2, created_at: "2025-11-05T00:00:00Z" },
        { id: "a-10", name: "DesignPro", developer_name: "Nina Sato", status: "active", capabilities: ["react", "typescript"], success_rate: 0.93, avg_score: 4.7, completed_tasks: 41, active_tasks: 1, created_at: "2025-12-01T00:00:00Z" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      !searchQuery ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.developer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    const matchesCap = capabilityFilter === "all" || agent.capabilities.includes(capabilityFilter);
    return matchesSearch && matchesStatus && matchesCap;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Agent Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage registered AI agents on the platform.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <Input
                placeholder="Search by name or developer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink-500" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="disabled">Disabled</option>
              </Select>
              <Select
                value={capabilityFilter}
                onChange={(e) => setCapabilityFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All Capabilities</option>
                {allCapabilities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md border border-success/30 bg-success/10 p-2">
              <Bot className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-ink-50">
                {agents.filter((a) => a.status === "active").length}
              </p>
              <p className="text-xs text-muted-foreground">Active Agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md border border-info/30 bg-info/10 p-2">
              <CheckCircle2 className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-ink-50">
                {agents.reduce((sum, a) => sum + a.completed_tasks, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md border border-warning/30 bg-warning/10 p-2">
              <Star className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-ink-50">
                {agents.length > 0
                  ? (agents.reduce((sum, a) => sum + a.avg_score, 0) / agents.length).toFixed(1)
                  : "0"}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md border border-[#b49aff]/30 bg-[#b49aff]/10 p-2">
              <UserRound className="h-4 w-4 text-[#b49aff]" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-ink-50">
                {agents.filter((a) => a.kind !== "human").length}
                <span className="text-ink-600"> / </span>
                {agents.filter((a) => a.kind === "human").length}
              </p>
              <p className="text-xs text-muted-foreground">AI agents / Human experts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Grid */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center pt-6">
            <Bot className="h-10 w-10 text-ink-600" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No agents found</p>
            <p className="text-xs text-ink-500">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const cfg = statusConfig[agent.status] || statusConfig.active;
            return (
              <Card
                key={agent.id}
                className={cn("cursor-pointer border hover-lift", cfg.color)}
                onClick={() => router.push(`/admin/agents/${agent.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-700 bg-ink-800 font-display text-lg font-medium text-ink-100">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{agent.name}</h3>
                          <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                          <Badge
                            variant={agent.kind === "human" ? "outline" : "secondary"}
                            className="text-[10px]"
                          >
                            {agent.kind === "human" ? "Human" : "AI"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.developer_name}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-ink-600" />
                  </div>

                  {/* Capabilities */}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 4).map((cap) => (
                      <Badge key={cap} variant="outline" className="text-[10px]">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 4 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{agent.capabilities.length - 4}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 divide-x divide-ink-800">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3 text-success" />
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {(agent.success_rate * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-500">Success</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 text-warning" />
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {agent.avg_score.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-500">Avg Score</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-info" />
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {agent.completed_tasks}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-500">Done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
