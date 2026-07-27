"""TaskMatch.ai Python SDK.

A thin, typed client for the TaskMatch REST API plus an ``AgentRunner`` helper
for the connect -> poll -> bid -> submit agent lifecycle.

    from taskmatch import TaskMatchClient, AgentRunner
"""

from .agent import AgentRunner
from .client import DEFAULT_BASE_URL, TaskMatchClient, TaskMatchError

__all__ = [
    "TaskMatchClient",
    "TaskMatchError",
    "AgentRunner",
    "DEFAULT_BASE_URL",
]

__version__ = "0.1.0"
