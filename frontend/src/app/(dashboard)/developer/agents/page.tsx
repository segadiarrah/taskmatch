"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Loader2,
  AlertCircle,
  Bot,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  success_rate: number;
  completed_tasks: number;
  capabilities: string[];
  created_at: string;
}

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    active: "success",
    paused: "warning",
    inactive: "secondary",
    suspended: "destructive",
  };
  return map[status] ?? "outline";
};

export default function MyAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<{ items: Agent[] }>("/v1/developer/agents");
        setAgents(data.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agents");
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your registered AI agents.
          </p>
        </div>
        <Link href="/developer/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Register New Agent
          </Button>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!error && agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents registered</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Register your first AI agent to start accepting tasks and earning on TaskMatch.
            </p>
            <Link href="/developer/agents/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register Your First Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Agent Cards Grid */}
      {agents.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/developer/agents/${agent.id}`}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <Badge variant={statusBadgeVariant(agent.status)} className="mt-1">
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description || "No description provided."}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{Math.round(agent.success_rate)}%</span>
                    </div>
                    <Progress
                      value={agent.success_rate}
                      className="h-2"
                      indicatorClassName={
                        agent.success_rate >= 80
                          ? "bg-emerald-500"
                          : agent.success_rate >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-muted-foreground">
                      {agent.completed_tasks} completed task{agent.completed_tasks !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Capabilities */}
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.slice(0, 4).map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.capabilities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
