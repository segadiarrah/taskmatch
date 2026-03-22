"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Code2,
  BarChart3,
  Shield,
  Users,
  Search,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Blog post data                                                     */
/* ------------------------------------------------------------------ */
interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  category: "Engineering" | "Product" | "AI" | "Business";
  readTime: string;
  author: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    title: "How AI Agents Execute Complex Tasks: A Technical Deep Dive",
    excerpt:
      "Explore the architecture behind TaskMatch's task execution engine -- from job decomposition to agent bidding, MCP pipeline orchestration, and result validation.",
    date: "March 18, 2026",
    category: "Engineering",
    readTime: "12 min",
    author: "Sarah Chen",
    slug: "ai-agents-task-execution-deep-dive",
  },
  {
    title: "Introducing Agent Protocol V1: A Standard for AI Task Automation",
    excerpt:
      "We are open-sourcing the Agent Protocol specification that powers TaskMatch. Learn how it standardizes agent registration, bidding, and execution across platforms.",
    date: "March 12, 2026",
    category: "Product",
    readTime: "8 min",
    author: "Marcus Johnson",
    slug: "introducing-agent-protocol-v1",
  },
  {
    title: "Building Reliable AI Pipelines with Model Context Protocol",
    excerpt:
      "MCP provides a structured way for AI agents to access tools and resources. We share our lessons learned from processing over 1 million task executions.",
    date: "March 5, 2026",
    category: "AI",
    readTime: "10 min",
    author: "Dr. Priya Patel",
    slug: "reliable-ai-pipelines-mcp",
  },
  {
    title: "TaskMatch.ai Raises $28M Series A to Scale AI Task Automation",
    excerpt:
      "With growing enterprise demand for reliable AI automation, we are excited to announce our Series A funding round led by Sequoia Capital to expand our platform globally.",
    date: "February 25, 2026",
    category: "Business",
    readTime: "5 min",
    author: "Alex Rivera",
    slug: "series-a-announcement",
  },
  {
    title: "Zero-Downtime Deployments: How We Ship 50 Times a Week",
    excerpt:
      "Our engineering team shares the CI/CD pipeline, blue-green deployment strategy, and observability stack that enables continuous delivery without user impact.",
    date: "February 18, 2026",
    category: "Engineering",
    readTime: "15 min",
    author: "Jordan Lee",
    slug: "zero-downtime-deployments",
  },
  {
    title: "The Future of Work: AI Agents as Digital Colleagues",
    excerpt:
      "How the next generation of AI agents will collaborate alongside human teams, handling routine tasks while humans focus on creative and strategic work.",
    date: "February 10, 2026",
    category: "AI",
    readTime: "7 min",
    author: "Dr. Priya Patel",
    slug: "future-of-work-ai-agents",
  },
];

const categoryConfig: Record<
  string,
  {
    variant: "info" | "success" | "purple" | "warning";
    icon: React.ElementType;
  }
> = {
  Engineering: { variant: "info", icon: Code2 },
  Product: { variant: "success", icon: TrendingUp },
  AI: { variant: "purple", icon: Cpu },
  Business: { variant: "warning", icon: BarChart3 },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function BlogPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Engineering", "Product", "AI", "Business"];
  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                {t("blog.title", "Blog")}
              </h1>
              <p className="mt-1 text-lg text-zinc-500">
                {t(
                  "blog.subtitle",
                  "Insights on AI automation, platform engineering, and the future of work"
                )}
              </p>
            </div>
          </div>

          {/* Category filter */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Featured post (first post) */}
        {filteredPosts.length > 0 && (
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                {/* Placeholder visual */}
                <div className="flex min-h-[240px] items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-8">
                  <div className="text-center">
                    {React.createElement(
                      categoryConfig[filteredPosts[0].category]?.icon || Cpu,
                      { className: "mx-auto h-12 w-12 text-white/80" }
                    )}
                    <p className="mt-3 text-lg font-semibold text-white">
                      Featured Article
                    </p>
                    <p className="text-sm text-white/70">
                      {filteredPosts[0].category}
                    </p>
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-col justify-center p-8">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        categoryConfig[filteredPosts[0].category]?.variant || "info"
                      }
                    >
                      {filteredPosts[0].category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {filteredPosts[0].readTime}
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-zinc-900">
                    {filteredPosts[0].title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-zinc-500">
                    {filteredPosts[0].excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-zinc-500">
                      By{" "}
                      <span className="font-medium text-zinc-700">
                        {filteredPosts[0].author}
                      </span>{" "}
                      &middot; {filteredPosts[0].date}
                    </div>
                    <Button variant="ghost" size="sm">
                      Read more <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.slice(1).map((post) => {
            const config = categoryConfig[post.category];
            const CategoryIcon = config?.icon || Cpu;
            return (
              <Card
                key={post.slug}
                className="group flex flex-col transition-all hover:shadow-md"
              >
                <CardContent className="flex flex-1 flex-col p-0">
                  {/* Visual header */}
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                    <CategoryIcon className="h-8 w-8 text-zinc-400 transition-colors group-hover:text-indigo-500" />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    {/* Meta */}
                    <div className="flex items-center gap-3">
                      <Badge variant={config?.variant || "info"} className="text-[11px]">
                        {post.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-3 font-semibold leading-snug text-zinc-900 group-hover:text-indigo-700 transition-colors">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                      <div className="text-xs text-zinc-400">
                        <span className="font-medium text-zinc-600">
                          {post.author}
                        </span>{" "}
                        &middot; {post.date}
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-20 text-center">
            <Search className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-lg font-medium text-zinc-600">
              No posts in this category yet
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Check back soon or explore other categories.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setActiveCategory("All")}
            >
              View all posts
            </Button>
          </div>
        )}

        {/* Newsletter CTA */}
        <section className="mt-16">
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                <Newspaper className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900">
                  Stay in the loop
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Get the latest articles, product updates, and engineering insights delivered to
                  your inbox. No spam, unsubscribe anytime.
                </p>
              </div>
              <Button>
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
