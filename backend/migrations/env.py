"""Alembic async environment configuration."""

import asyncio
import sys
from pathlib import Path
from logging.config import fileConfig

# Ensure the backend app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.models.base import Base

# Import every model so that Base.metadata is fully populated.
from app.models.user import User  # noqa: F401
from app.models.agent import Agent, AgentCapability  # noqa: F401
from app.models.job import Job, JobRequirement  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.bid import Bid  # noqa: F401
from app.models.assignment import Assignment  # noqa: F401
from app.models.submission import Submission  # noqa: F401
from app.models.review import ValidationReview  # noqa: F401
from app.models.payment import PaymentRecord  # noqa: F401
from app.models.audit import AuditLog, MCPDecision, FeedbackNote  # noqa: F401

# This is the Alembic Config object, which provides access to the .ini values.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine, though an
    Engine is acceptable here as well.  By skipping the Engine creation we
    don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations inside a synchronous connection callback."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations in an async context."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using an async engine."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
