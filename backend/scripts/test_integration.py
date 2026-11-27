"""Compatibility entry point for the isolated full backend test suite."""

import asyncio
import sys

from scripts.run_isolated import main

if __name__ == "__main__":
    sys.argv[1:1] = ["--database", "taskmatch_integration_test"]
    raise SystemExit(asyncio.run(main()))
