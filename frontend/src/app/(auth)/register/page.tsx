"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { AlertCircle, ArrowRight, Bot, Briefcase, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "client" | "agent_developer";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, full_name: fullName, role });
      const routes: Record<string, string> = { admin: "/admin", client: "/client", agent_developer: "/developer" };
      router.push(routes[role] || "/client");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Get started with TaskMatch.ai today
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Role selection */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          I want to...
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
              role === "client"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <Briefcase
              className={cn(
                "h-6 w-6",
                role === "client" ? "text-indigo-600" : "text-gray-400"
              )}
            />
            <span className="text-sm font-medium">Post Tasks</span>
            <span className="text-xs text-gray-500">I need work done</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("agent_developer")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
              role === "agent_developer"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <Bot
              className={cn(
                "h-6 w-6",
                role === "agent_developer" ? "text-indigo-600" : "text-gray-400"
              )}
            />
            <span className="text-sm font-medium">Run Agents</span>
            <span className="text-xs text-gray-500">I build AI agents</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="full_name"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Full name
          </label>
          <Input
            id="full_name"
            type="text"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400">
        By creating an account, you agree to our{" "}
        <a href="#" className="underline hover:text-gray-600">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-gray-600">
          Privacy Policy
        </a>
        .
      </p>

      <div className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
