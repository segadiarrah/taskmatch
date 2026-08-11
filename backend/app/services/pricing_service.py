"""Deterministic pricing engine.

TaskMatch — not the client, and not a bidding war between executors — decides what
a task costs. This module is the single place that decision is made.

Design contract
---------------
* **Pure.** No database, no network, no clock reads beyond what the caller passes
  in. Every function here is a total function of its arguments, so a quote can be
  recomputed and audited long after the fact.
* **Two routes, two formulas.** Work executed by an LLM is priced *cost-plus* from
  real token cost. Work that needs a human is priced as a *range*, so the expert
  decides whether to accept — but the range itself is set by TaskMatch.
* **Competitive by construction.** An LLM-executed task is capped at a fraction of
  its human-equivalent price. The engine cannot emit a price that makes the LLM
  route a bad deal for the client.

The rate tables below are *data*, not logic. They must be re-verified against the
providers' published pricing before each commercial campaign; ``RATES_AS_OF``
records when they were last checked.
"""

from __future__ import annotations

import math
import re
from dataclasses import asdict, dataclass, field
from decimal import ROUND_HALF_UP, Decimal
from enum import Enum
from typing import Any, Iterable, Optional

# Bumped whenever a rate table or formula changes, so a stored quote can always be
# traced back to the engine that produced it.
PRICING_VERSION = "2026-08-10.1"
RATES_AS_OF = "2026-08-10"


# --------------------------------------------------------------------------- #
#  Currency                                                                    #
# --------------------------------------------------------------------------- #

#: Providers publish in USD; TaskMatch quotes in EUR.
USD_TO_EUR = 0.92

BASE_CURRENCY = "EUR"


# --------------------------------------------------------------------------- #
#  Model cost catalog — USD per 1M tokens (input, output)                      #
# --------------------------------------------------------------------------- #

#: Keys are normalised slugs (see :func:`_normalise_model`). Covers every model in
#: ``app.services.providers.CATALOG``. Verified against first-party published
#: pricing on RATES_AS_OF.
MODEL_RATES_USD: dict[str, tuple[float, float]] = {
    # OpenAI
    "gpt-4o": (2.50, 10.00),
    "gpt-4-1": (2.00, 8.00),
    "gpt-4o-mini": (0.15, 0.60),
    "o3": (2.00, 8.00),
    # Anthropic
    "claude-opus-5": (5.00, 25.00),
    "claude-opus-4-8": (5.00, 25.00),
    "claude-sonnet-5": (3.00, 15.00),
    "claude-sonnet-4-5": (3.00, 15.00),
    "claude-haiku-4-5": (1.00, 5.00),
    # Google
    "gemini-2-5-pro": (1.25, 10.00),
    "gemini-2-5-flash": (0.30, 2.50),
    # Mistral
    "mistral-large-latest": (2.00, 6.00),
    "mistral-small-latest": (0.20, 0.60),
    # DeepSeek
    "deepseek-chat": (0.27, 1.10),
    "deepseek-reasoner": (0.55, 2.19),
    "deepseek-chat-v3-0324": (0.27, 1.10),
    # xAI
    "grok-4": (3.00, 15.00),
    "grok-3": (3.00, 15.00),
}

#: Used when a provider slug is not in the catalog. Deliberately on the expensive
#: side of the range: an unknown model must never be under-priced.
DEFAULT_RATE_USD: tuple[float, float] = (3.00, 15.00)


def _normalise_model(model: str | None) -> str:
    """Reduce a provider model string to a catalog key.

    Handles the three shapes that reach us: bare ids (``gpt-4o``), OpenRouter
    paths (``anthropic/claude-sonnet-5``), and dotted version ids
    (``claude-sonnet-4.5``), which the provider catalog still uses.
    """
    if not model:
        return ""
    slug = model.strip().lower()
    if "/" in slug:  # OpenRouter-style "vendor/model"
        slug = slug.rsplit("/", 1)[-1]
    slug = slug.replace(".", "-")
    return slug


def resolve_model_rate(model: str | None) -> tuple[float, float]:
    """Return ``(usd_per_1m_input, usd_per_1m_output)`` for a model slug.

    Falls back to :data:`DEFAULT_RATE_USD` rather than raising — an unrecognised
    model must still produce a quote.
    """
    slug = _normalise_model(model)
    if slug in MODEL_RATES_USD:
        return MODEL_RATES_USD[slug]
    # Tolerate suffixed deployment ids ("claude-sonnet-5-fast", dated snapshots).
    for key, rate in MODEL_RATES_USD.items():
        if slug.startswith(key):
            return rate
    return DEFAULT_RATE_USD


# --------------------------------------------------------------------------- #
#  Complexity                                                                  #
# --------------------------------------------------------------------------- #


class ComplexityTier(str, Enum):
    """How much work a task represents, independent of who executes it."""

    S = "S"
    M = "M"
    L = "L"
    XL = "XL"


#: Expected deliverable size in output tokens, per tier.
TIER_OUTPUT_TOKENS: dict[ComplexityTier, int] = {
    ComplexityTier.S: 900,
    ComplexityTier.M: 2_400,
    ComplexityTier.L: 6_000,
    ComplexityTier.XL: 14_000,
}

#: Fixed orchestration fee in EUR, per tier. Covers formatting, decomposition,
#: agent matching, bid ranking, audit logging and escrow handling — platform work
#: that happens regardless of which model executes the task.
ORCHESTRATION_FEE_EUR: dict[ComplexityTier, float] = {
    ComplexityTier.S: 1.20,
    ComplexityTier.M: 2.50,
    ComplexityTier.L: 5.50,
    ComplexityTier.XL: 11.00,
}

#: Baseline human hours per tier, before the task-type factor.
TIER_HUMAN_HOURS: dict[ComplexityTier, float] = {
    ComplexityTier.S: 1.5,
    ComplexityTier.M: 5.0,
    ComplexityTier.L: 14.0,
    ComplexityTier.XL: 34.0,
}

#: Ceiling on how much job-level context (deliverables, acceptance criteria) can
#: contribute to a task's complexity score. Keeps a small task small no matter how
#: large the job around it is.
JOB_CONTEXT_CAP = 1.5

#: Lexical signals that a task is harder than its length suggests.
_COMPLEXITY_SIGNALS = re.compile(
    r"\b("
    r"migrat\w*|architect\w*|refactor\w*|audit\w*|securit\w*|s[ée]curit\w*|"
    r"scalab\w*|distribu\w*|compliance|conformit[ée]|rgpd|gdpr|"
    r"end[- ]to[- ]end|multi[- ]tenant|orchestrat\w*|infrastructur\w*"
    r")\b",
    re.IGNORECASE,
)


# --------------------------------------------------------------------------- #
#  Task-type profiles                                                          #
# --------------------------------------------------------------------------- #


@dataclass(frozen=True)
class TaskTypeProfile:
    """How a family of tasks behaves for pricing purposes.

    ``output_factor`` scales the tier's expected output size; ``hours_factor``
    scales the tier's baseline human hours; ``discipline`` and ``seniority`` pick
    the human rate band.
    """

    discipline: str
    seniority: str
    output_factor: float = 1.0
    hours_factor: float = 1.0


TASK_TYPE_PROFILES: dict[str, TaskTypeProfile] = {
    "planning": TaskTypeProfile("product", "senior", 0.8, 0.6),
    "research": TaskTypeProfile("research", "senior", 1.1, 0.9),
    "analysis": TaskTypeProfile("data", "senior", 1.0, 0.9),
    "data": TaskTypeProfile("data", "senior", 1.0, 1.0),
    "writing": TaskTypeProfile("content", "senior", 1.3, 0.8),
    "documentation": TaskTypeProfile("content", "senior", 1.3, 0.8),
    "design": TaskTypeProfile("design", "senior", 0.9, 1.1),
    "development": TaskTypeProfile("engineering", "senior", 1.2, 1.2),
    "execution": TaskTypeProfile("engineering", "senior", 1.1, 1.0),
    "testing": TaskTypeProfile("engineering", "junior", 0.9, 0.8),
    "review": TaskTypeProfile("engineering", "senior", 0.7, 0.5),
    "integration": TaskTypeProfile("engineering", "senior", 1.1, 1.3),
    "deployment": TaskTypeProfile("devops", "senior", 0.7, 1.2),
    "installation": TaskTypeProfile("devops", "senior", 0.7, 1.4),
    "legal": TaskTypeProfile("legal", "senior", 1.0, 1.0),
    "general": TaskTypeProfile("engineering", "senior", 1.0, 1.0),
}

DEFAULT_PROFILE = TASK_TYPE_PROFILES["general"]


def profile_for(task_type: str | None) -> TaskTypeProfile:
    """Return the pricing profile for a task type, with substring fallback."""
    tt = (task_type or "general").strip().lower()
    if tt in TASK_TYPE_PROFILES:
        return TASK_TYPE_PROFILES[tt]
    for key, profile in TASK_TYPE_PROFILES.items():
        if key in tt or tt in key:
            return profile
    return DEFAULT_PROFILE


# --------------------------------------------------------------------------- #
#  Human rate card — blended remote, EUR/hour (low, high)                      #
# --------------------------------------------------------------------------- #

BLENDED_REMOTE_RATES_EUR: dict[str, dict[str, tuple[float, float]]] = {
    "engineering": {"junior": (22.0, 35.0), "senior": (55.0, 85.0)},
    "devops": {"junior": (25.0, 40.0), "senior": (60.0, 95.0)},
    "data": {"junior": (25.0, 40.0), "senior": (65.0, 95.0)},
    "research": {"junior": (20.0, 32.0), "senior": (50.0, 80.0)},
    "content": {"junior": (15.0, 25.0), "senior": (35.0, 55.0)},
    "design": {"junior": (20.0, 32.0), "senior": (45.0, 75.0)},
    "product": {"junior": (25.0, 40.0), "senior": (60.0, 90.0)},
    "legal": {"junior": (35.0, 55.0), "senior": (90.0, 150.0)},
}

DEFAULT_HUMAN_RATE_EUR: tuple[float, float] = (40.0, 70.0)


def human_rate_band(discipline: str, seniority: str) -> tuple[float, float]:
    """Return the ``(low, high)`` hourly EUR band for a discipline/seniority."""
    by_seniority = BLENDED_REMOTE_RATES_EUR.get(discipline)
    if not by_seniority:
        return DEFAULT_HUMAN_RATE_EUR
    return by_seniority.get(seniority) or by_seniority.get("senior") or DEFAULT_HUMAN_RATE_EUR


# --------------------------------------------------------------------------- #
#  Routing                                                                     #
# --------------------------------------------------------------------------- #


class ExecutionRoute(str, Enum):
    """Who executes a task."""

    llm = "llm"
    human = "human"
    #: Produced by an LLM, reviewed by a human before delivery.
    hybrid = "hybrid"


#: Task types no model can complete alone: they need credentials, physical
#: presence, a signature, or accountability a platform agent cannot carry.
HUMAN_ONLY_TASK_TYPES = frozenset({"installation", "deployment", "legal", "onboarding"})

#: Lexical signals of the same thing, for tasks whose declared type is generic.
_HUMAN_SIGNALS = re.compile(
    r"\b("
    # "déploie", "déployer", "déploiement" — the stem alternation matters: French
    # infinitives take -y- where the conjugated form takes -i-.
    r"install\w*|d[ée]plo[iy]\w*|deploy\w*|on[- ]premise|sur site|"
    r"acc[èe]s client|client access|credential\w*|identifiant\w*|"
    r"signature|notari\w*|"
    # Certification only when it is *of conformity* — a bare "certificat" also
    # matches "certificat SSL", which an agent installs perfectly well, and
    # mis-routing that to a human costs the client two orders of magnitude.
    r"certification\s+(?:de\s+)?conformit[ée]|attestation\s+de\s+conformit[ée]|"
    # An audit needs a human only when it is external, legal, or regulatory —
    # an internal code audit does not.
    r"audit\s+(?:\w+\s+)?(?:externe|l[ée]gal|r[ée]glementaire|de\s+conformit[ée])|"
    r"legal review"
    r")\b",
    re.IGNORECASE,
)

#: Task types whose deliverable is a document. The lexical signals above are
#: suppressed for these: writing *about* an installation is not performing one,
#: and "guide de déploiement" must not route a 2.50 € doc to a 180 € expert.
#: An explicit ``requires_human`` flag and the human-only types still apply.
DOCUMENT_ONLY_TASK_TYPES = frozenset({"writing", "documentation", "content"})

#: Above this price, an LLM-produced deliverable gets a human review pass before
#: it reaches the client — the stake is high enough to justify the overhead.
HYBRID_REVIEW_THRESHOLD_EUR = 120.0


# --------------------------------------------------------------------------- #
#  Cost-plus knobs                                                             #
# --------------------------------------------------------------------------- #

#: Raw token cost is multiplied by this to cover infrastructure, provider
#: markup, failed generations, and the variance between estimate and actual.
COMPUTE_MULTIPLIER = 8.0

#: Validation is a second LLM pass; its cost carries a smaller multiplier
#: because it is short, predictable, and runs on a cheaper model.
VALIDATION_MULTIPLIER = 3.0

#: Share of tasks that fail validation and are re-executed, amortised into every
#: quote rather than billed as a surprise.
RETRY_RATE = 0.25

#: Floor: below this, a task costs more to bill than it earns.
MIN_TASK_PRICE_EUR = 1.50

#: An LLM-executed task may never be priced above this share of the low end of
#: its human-equivalent range. This is what makes the price competitive by
#: construction rather than by hope.
COMPETITIVE_CEILING = 0.35

#: Tokens per character, for prompt-size estimation. Conservative for French and
#: for code, which tokenise less efficiently than English prose.
CHARS_PER_TOKEN = 3.4

#: System prompt, spec, output schema and matching context sent with every task.
CONTEXT_OVERHEAD_TOKENS = 1_200

#: Input/output sizes for the validation pass.
VALIDATION_OUTPUT_TOKENS = 350

#: Platform commission on the quote total. Mirrors
#: ``payment_service.PLATFORM_FEE_RATE``; kept as a float here so the pure engine
#: stays importable without the payment module.
PLATFORM_FEE_RATE = 0.10

#: How long a quote stays honourable. Beyond this, provider rates may have moved.
QUOTE_VALIDITY_DAYS = 14


# --------------------------------------------------------------------------- #
#  Results                                                                     #
# --------------------------------------------------------------------------- #


def _money(value: float) -> float:
    """Round to cents, half-up — the rounding a customer expects on an invoice."""
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


@dataclass
class TokenEstimate:
    """Estimated token volume for one task, including retries and validation."""

    input_tokens: int
    output_tokens: int
    attempts: float
    validation_input_tokens: int
    validation_output_tokens: int

    @property
    def billable_input_tokens(self) -> float:
        return self.input_tokens * self.attempts

    @property
    def billable_output_tokens(self) -> float:
        return self.output_tokens * self.attempts


@dataclass
class TaskPrice:
    """The full, auditable price decision for a single task."""

    route: ExecutionRoute
    complexity: ComplexityTier
    task_type: str
    currency: str = BASE_CURRENCY
    pricing_version: str = PRICING_VERSION

    # -- LLM route ---------------------------------------------------------
    model: Optional[str] = None
    est_input_tokens: int = 0
    est_output_tokens: int = 0
    est_attempts: float = 1.0
    token_cost: float = 0.0
    compute_cost: float = 0.0
    orchestration_fee: float = 0.0
    validation_cost: float = 0.0
    price: float = 0.0
    #: True when the competitive ceiling, not the formula, set the price.
    capped_by_competitiveness: bool = False
    #: True when the floor, not the formula, set the price.
    raised_to_floor: bool = False

    # -- Human route -------------------------------------------------------
    human_hours: float = 0.0
    human_rate_low: float = 0.0
    human_rate_high: float = 0.0
    human_price_low: float = 0.0
    human_price_high: float = 0.0
    discipline: str = ""
    seniority: str = ""

    #: Client-facing saving vs the low end of the human range (0.0–1.0).
    savings_vs_human: float = 0.0
    rationale: str = ""

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["route"] = self.route.value
        data["complexity"] = self.complexity.value
        return data


@dataclass
class JobQuote:
    """A priced job: one :class:`TaskPrice` per task, plus the totals."""

    currency: str
    subtotal: float
    platform_fee: float
    total: float
    pricing_version: str
    task_prices: list[TaskPrice] = field(default_factory=list)
    #: Sum of the low ends of every human-equivalent range, for comparison.
    human_equivalent_low: float = 0.0
    human_equivalent_high: float = 0.0
    savings_vs_human: float = 0.0
    #: True when at least one task must be done by a human.
    requires_human: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "currency": self.currency,
            "subtotal": self.subtotal,
            "platform_fee": self.platform_fee,
            "total": self.total,
            "pricing_version": self.pricing_version,
            "human_equivalent_low": self.human_equivalent_low,
            "human_equivalent_high": self.human_equivalent_high,
            "savings_vs_human": self.savings_vs_human,
            "requires_human": self.requires_human,
            "tasks": [tp.to_dict() for tp in self.task_prices],
        }


# --------------------------------------------------------------------------- #
#  Estimation                                                                  #
# --------------------------------------------------------------------------- #


def classify_complexity(
    *,
    description: str,
    task_type: str | None = None,
    deliverable_count: int = 0,
    criteria_count: int = 0,
) -> ComplexityTier:
    """Assign a complexity tier from the task's own content.

    Deterministic and explainable on purpose: a client who disputes a price must
    be able to be shown exactly why the task landed in its tier.
    """
    text = description or ""
    score = 0.0

    # The task's own brief is the primary signal — a longer brief is a bigger job.
    score += min(len(text) / 150.0, 6.0)

    # Deliverables and criteria are *job*-level context, shared by every task of
    # the job. They nudge, and the nudge is capped: without a ceiling, a job with
    # many deliverables would size a one-line typo fix the same as the migration
    # sitting next to it, because both tasks see the identical job context.
    score += min(deliverable_count * 0.35 + criteria_count * 0.15, JOB_CONTEXT_CAP)

    # Lexical markers of structural work.
    score += len(_COMPLEXITY_SIGNALS.findall(text)) * 1.2

    # Some task families are inherently heavier than their brief suggests.
    tt = (task_type or "").lower()
    if tt in {"development", "integration", "installation", "deployment"}:
        score += 1.5
    elif tt in {"review", "testing"}:
        score -= 0.5

    if score < 2.5:
        return ComplexityTier.S
    if score < 6.0:
        return ComplexityTier.M
    if score < 11.0:
        return ComplexityTier.L
    return ComplexityTier.XL


def estimate_tokens(
    *,
    description: str,
    complexity: ComplexityTier,
    profile: TaskTypeProfile,
    job_context_chars: int = 0,
) -> TokenEstimate:
    """Estimate the token volume one task will consume end to end."""
    prompt_chars = len(description or "") + max(0, job_context_chars)
    input_tokens = int(CONTEXT_OVERHEAD_TOKENS + prompt_chars / CHARS_PER_TOKEN)
    output_tokens = int(TIER_OUTPUT_TOKENS[complexity] * profile.output_factor)

    # The validation pass reads the deliverable and returns a short verdict.
    validation_input = int(output_tokens + CONTEXT_OVERHEAD_TOKENS * 0.5)

    return TokenEstimate(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        attempts=1.0 + RETRY_RATE,
        validation_input_tokens=validation_input,
        validation_output_tokens=VALIDATION_OUTPUT_TOKENS,
    )


def token_cost_eur(
    tokens_in: float, tokens_out: float, model: str | None
) -> float:
    """Raw provider cost in EUR for a given token volume."""
    rate_in, rate_out = resolve_model_rate(model)
    usd = (tokens_in / 1_000_000.0) * rate_in + (tokens_out / 1_000_000.0) * rate_out
    return usd * USD_TO_EUR


def estimate_human_hours(complexity: ComplexityTier, profile: TaskTypeProfile) -> float:
    """Estimated hours a human expert needs for a task of this size and type."""
    return round(TIER_HUMAN_HOURS[complexity] * profile.hours_factor, 2)


def route_for_task(
    *,
    task_type: str | None,
    description: str,
    requires_human: bool = False,
    llm_price: float | None = None,
) -> ExecutionRoute:
    """Decide who executes a task.

    ``llm_price`` is optional: when supplied, an expensive LLM deliverable is
    upgraded to ``hybrid`` so a human reviews it before it reaches the client.
    """
    tt = (task_type or "").strip().lower()
    if requires_human or tt in HUMAN_ONLY_TASK_TYPES:
        return ExecutionRoute.human
    # The lexical scan looks for work that needs hands on a system. A document
    # that merely *describes* that work does not, so skip it for doc tasks.
    if tt not in DOCUMENT_ONLY_TASK_TYPES and _HUMAN_SIGNALS.search(description or ""):
        return ExecutionRoute.human
    if llm_price is not None and llm_price >= HYBRID_REVIEW_THRESHOLD_EUR:
        return ExecutionRoute.hybrid
    return ExecutionRoute.llm


# --------------------------------------------------------------------------- #
#  Pricing                                                                     #
# --------------------------------------------------------------------------- #


def price_task(
    *,
    title: str = "",
    description: str = "",
    task_type: str | None = None,
    model: str | None = None,
    deliverable_count: int = 0,
    criteria_count: int = 0,
    job_context_chars: int = 0,
    requires_human: bool = False,
) -> TaskPrice:
    """Price a single task. The engine's entry point.

    Always computes *both* the cost-plus LLM price and the human range: the
    client needs the comparison, the competitive ceiling needs the human floor,
    and a task can be re-routed later without a re-quote.
    """
    profile = profile_for(task_type)
    complexity = classify_complexity(
        description=description or title,
        task_type=task_type,
        deliverable_count=deliverable_count,
        criteria_count=criteria_count,
    )
    tokens = estimate_tokens(
        description=description or title,
        complexity=complexity,
        profile=profile,
        job_context_chars=job_context_chars,
    )

    # --- human equivalent (also the competitiveness anchor) ---------------
    hours = estimate_human_hours(complexity, profile)
    rate_low, rate_high = human_rate_band(profile.discipline, profile.seniority)
    human_low = _money(hours * rate_low)
    human_high = _money(hours * rate_high)

    # --- cost-plus -------------------------------------------------------
    raw_token_cost = token_cost_eur(
        tokens.billable_input_tokens, tokens.billable_output_tokens, model
    )
    compute = raw_token_cost * COMPUTE_MULTIPLIER
    orchestration = ORCHESTRATION_FEE_EUR[complexity]
    validation_raw = token_cost_eur(
        tokens.validation_input_tokens, tokens.validation_output_tokens, model
    )
    validation = validation_raw * VALIDATION_MULTIPLIER

    price = compute + orchestration + validation

    raised_to_floor = False
    if price < MIN_TASK_PRICE_EUR:
        price = MIN_TASK_PRICE_EUR
        raised_to_floor = True

    capped = False
    ceiling = human_low * COMPETITIVE_CEILING
    if ceiling > 0 and price > ceiling:
        price = ceiling
        capped = True
        raised_to_floor = False

    price = _money(price)

    route = route_for_task(
        task_type=task_type,
        description=description or title,
        requires_human=requires_human,
        llm_price=price,
    )

    savings = 0.0
    if human_low > 0 and route is not ExecutionRoute.human:
        savings = max(0.0, min(1.0, 1.0 - (price / human_low)))

    return TaskPrice(
        route=route,
        complexity=complexity,
        task_type=(task_type or "general"),
        model=model,
        est_input_tokens=int(tokens.billable_input_tokens),
        est_output_tokens=int(tokens.billable_output_tokens),
        est_attempts=tokens.attempts,
        token_cost=_money(raw_token_cost),
        compute_cost=_money(compute),
        orchestration_fee=_money(orchestration),
        validation_cost=_money(validation),
        price=price,
        capped_by_competitiveness=capped,
        raised_to_floor=raised_to_floor,
        human_hours=hours,
        human_rate_low=rate_low,
        human_rate_high=rate_high,
        human_price_low=human_low,
        human_price_high=human_high,
        discipline=profile.discipline,
        seniority=profile.seniority,
        savings_vs_human=round(savings, 4),
        rationale=_rationale(
            route=route,
            complexity=complexity,
            model=model,
            capped=capped,
            raised=raised_to_floor,
            hours=hours,
        ),
    )


def _rationale(
    *,
    route: ExecutionRoute,
    complexity: ComplexityTier,
    model: str | None,
    capped: bool,
    raised: bool,
    hours: float,
) -> str:
    """One sentence explaining the price, shown to the client and the expert."""
    if route is ExecutionRoute.human:
        return (
            f"Complexity {complexity.value}: this task needs a human expert "
            f"(~{hours}h estimated). The range is set by TaskMatch from blended "
            f"remote rates; the expert accepts or declines."
        )
    basis = f"cost-plus on {model or 'the assigned model'}"
    if capped:
        basis += ", capped so it stays well below the human-equivalent price"
    elif raised:
        basis += ", raised to the platform minimum"
    suffix = (
        " A human reviews the result before delivery."
        if route is ExecutionRoute.hybrid
        else ""
    )
    return f"Complexity {complexity.value}: priced {basis}.{suffix}"


def price_job(
    *,
    tasks: Iterable[dict[str, Any]],
    model: str | None = None,
    spec: dict[str, Any] | None = None,
    currency: str = BASE_CURRENCY,
) -> JobQuote:
    """Price every task of a job and assemble the totals.

    ``tasks`` are dicts carrying at least ``title``/``description``/``task_type``
    — the shape ``mcp_service.decompose_job`` already returns.
    """
    spec = spec or {}
    deliverables = spec.get("deliverables") or []
    criteria = spec.get("success_criteria") or []
    objective = str(spec.get("objective") or "")
    job_context_chars = len(objective) + sum(len(str(d)) for d in deliverables)

    prices: list[TaskPrice] = []
    for task in tasks:
        prices.append(
            price_task(
                title=str(task.get("title") or ""),
                description=str(task.get("description") or ""),
                task_type=task.get("task_type"),
                model=model,
                deliverable_count=len(deliverables),
                criteria_count=len(criteria),
                job_context_chars=job_context_chars,
                requires_human=bool(task.get("requires_human")),
            )
        )

    # A human-routed task is billed at the midpoint of its range: the client
    # needs one number, while the expert still sees the band they can accept.
    def _billed(tp: TaskPrice) -> float:
        if tp.route is ExecutionRoute.human:
            return _money((tp.human_price_low + tp.human_price_high) / 2.0)
        if tp.route is ExecutionRoute.hybrid:
            # LLM output plus a short human review pass.
            review = _money(tp.human_hours * 0.25 * tp.human_rate_low)
            return _money(tp.price + review)
        return tp.price

    subtotal = _money(sum(_billed(tp) for tp in prices))
    fee = _money(subtotal * PLATFORM_FEE_RATE)
    total = _money(subtotal + fee)

    human_low = _money(sum(tp.human_price_low for tp in prices))
    human_high = _money(sum(tp.human_price_high for tp in prices))
    savings = 0.0
    if human_low > 0:
        savings = max(0.0, min(1.0, 1.0 - (total / human_low)))

    return JobQuote(
        currency=currency,
        subtotal=subtotal,
        platform_fee=fee,
        total=total,
        pricing_version=PRICING_VERSION,
        task_prices=prices,
        human_equivalent_low=human_low,
        human_equivalent_high=human_high,
        savings_vs_human=round(savings, 4),
        requires_human=any(
            tp.route in (ExecutionRoute.human, ExecutionRoute.hybrid) for tp in prices
        ),
    )


def billed_amount(task_price: TaskPrice) -> float:
    """Public wrapper over the per-route billed amount used in job totals."""
    if task_price.route is ExecutionRoute.human:
        return _money((task_price.human_price_low + task_price.human_price_high) / 2.0)
    if task_price.route is ExecutionRoute.hybrid:
        review = _money(task_price.human_hours * 0.25 * task_price.human_rate_low)
        return _money(task_price.price + review)
    return task_price.price


def offer_is_acceptable(task_price: TaskPrice, offered: float) -> bool:
    """Whether an expert's asking price falls inside the quoted range.

    Experts do not bid freely: they accept a price TaskMatch has already
    arbitrated. A tiny tolerance absorbs rounding on the client side.
    """
    if task_price.human_price_low <= 0:
        return False
    return (task_price.human_price_low - 0.01) <= offered <= (
        task_price.human_price_high + 0.01
    )
