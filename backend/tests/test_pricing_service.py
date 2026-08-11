"""Tests for the pricing engine.

The engine is the commercial contract in code: if it drifts, TaskMatch either
loses money or overcharges. These tests pin the properties that must hold, not
the exact euro amounts — those are expected to be tuned.
"""

from __future__ import annotations

import pytest

from app.services import pricing_service as ps


# --------------------------------------------------------------------------- #
#  Model rates                                                                 #
# --------------------------------------------------------------------------- #


class TestModelRates:
    def test_every_catalog_model_has_a_rate(self):
        """Any model an admin can enable must be priceable without the fallback.

        Checks key coverage rather than comparing the returned rate to the
        default: several real models legitimately share the default's values, and
        equal tuple literals in one module are folded to a single object, so an
        identity check reports them as missing.
        """
        from app.services.providers import CATALOG

        missing = []
        for provider, meta in CATALOG.items():
            for model in meta["models"]:
                slug = ps._normalise_model(model)
                covered = slug in ps.MODEL_RATES_USD or any(
                    slug.startswith(key) for key in ps.MODEL_RATES_USD
                )
                if not covered:
                    missing.append(f"{provider}/{model} (slug={slug})")
        assert not missing, f"models with no catalog rate: {missing}"

    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("gpt-4o", "gpt-4o"),
            ("anthropic/claude-sonnet-5", "claude-sonnet-5"),
            ("claude-sonnet-4.5", "claude-sonnet-4-5"),
            ("openai/gpt-4o", "gpt-4o"),
        ],
    )
    def test_normalises_provider_slugs(self, raw, expected):
        assert ps._normalise_model(raw) == expected

    def test_unknown_model_falls_back_rather_than_raising(self):
        assert ps.resolve_model_rate("some-model-that-does-not-exist") == (
            ps.DEFAULT_RATE_USD
        )

    def test_output_is_never_cheaper_than_input(self):
        """A rate table where output < input is almost certainly a transcription slip."""
        for model, (rate_in, rate_out) in ps.MODEL_RATES_USD.items():
            assert rate_out >= rate_in, f"{model}: output {rate_out} < input {rate_in}"


# --------------------------------------------------------------------------- #
#  Complexity                                                                  #
# --------------------------------------------------------------------------- #


class TestComplexity:
    def test_trivial_task_is_small_even_inside_a_large_job(self):
        """Job-level deliverables must not inflate a one-line task.

        Regression guard: weighting job context heavily sized a typo fix the same
        as the migration sitting next to it in the same job.
        """
        tier = ps.classify_complexity(
            description="Fix the typo in the button label.",
            task_type="general",
            deliverable_count=6,
            criteria_count=5,
        )
        assert tier is ps.ComplexityTier.S

    def test_structural_signals_raise_the_tier(self):
        plain = ps.classify_complexity(
            description="Build the reporting page with a table and filters. " * 3,
            task_type="development",
        )
        loaded = ps.classify_complexity(
            description=(
                "Build the reporting page with a table and filters. "
                "Requires a multi-tenant architecture, a data migration and a "
                "security audit of the whole pipeline. " * 3
            ),
            task_type="development",
        )
        assert loaded.value != plain.value or loaded is ps.ComplexityTier.XL
        assert ps.TIER_HUMAN_HOURS[loaded] >= ps.TIER_HUMAN_HOURS[plain]

    def test_tiers_are_monotonic_in_hours_and_output(self):
        order = [
            ps.ComplexityTier.S,
            ps.ComplexityTier.M,
            ps.ComplexityTier.L,
            ps.ComplexityTier.XL,
        ]
        for smaller, bigger in zip(order, order[1:]):
            assert ps.TIER_HUMAN_HOURS[smaller] < ps.TIER_HUMAN_HOURS[bigger]
            assert ps.TIER_OUTPUT_TOKENS[smaller] < ps.TIER_OUTPUT_TOKENS[bigger]
            assert (
                ps.ORCHESTRATION_FEE_EUR[smaller] < ps.ORCHESTRATION_FEE_EUR[bigger]
            )


# --------------------------------------------------------------------------- #
#  Cost-plus                                                                   #
# --------------------------------------------------------------------------- #


class TestCostPlus:
    def test_price_is_the_sum_of_its_published_components(self):
        """The breakdown shown to the client must actually add up to the price."""
        tp = ps.price_task(
            description="Write the integration guide for the billing API. " * 6,
            task_type="documentation",
            model="claude-sonnet-5",
        )
        components = tp.compute_cost + tp.orchestration_fee + tp.validation_cost
        if not tp.capped_by_competitiveness and not tp.raised_to_floor:
            assert tp.price == pytest.approx(components, abs=0.02)

    def test_expensive_model_costs_more_than_cheap_model(self):
        kwargs = dict(
            description="Summarise the quarterly figures. " * 10,
            task_type="analysis",
        )
        cheap = ps.price_task(model="gpt-4o-mini", **kwargs)
        dear = ps.price_task(model="claude-opus-5", **kwargs)
        assert dear.token_cost > cheap.token_cost
        assert dear.price >= cheap.price

    def test_retry_overhead_is_priced_in(self):
        """Clients are not surprise-billed for a task that failed validation once."""
        tp = ps.price_task(description="x" * 400, task_type="general", model="gpt-4o")
        assert tp.est_attempts > 1.0
        assert tp.est_attempts == pytest.approx(1.0 + ps.RETRY_RATE)

    def test_never_priced_below_the_floor(self):
        tp = ps.price_task(description="Hi.", task_type="general", model="gpt-4o-mini")
        assert tp.price >= ps.MIN_TASK_PRICE_EUR


# --------------------------------------------------------------------------- #
#  Competitiveness — the property the whole product rests on                   #
# --------------------------------------------------------------------------- #


class TestCompetitiveness:
    @pytest.mark.parametrize(
        "task_type",
        ["documentation", "development", "analysis", "design", "research", "general"],
    )
    @pytest.mark.parametrize("model", ["claude-opus-5", "gpt-4o", "gpt-4o-mini"])
    def test_llm_price_always_beats_the_human_low_end(self, task_type, model):
        """An LLM-routed task must never cost more than a fraction of a human.

        This is what makes the price defensible: the client can always see the
        comparison, so the engine must not be able to emit a price that loses it.
        """
        tp = ps.price_task(
            description="Deliver the requested work item. " * 20,
            task_type=task_type,
            model=model,
            deliverable_count=4,
            criteria_count=3,
        )
        if tp.route is ps.ExecutionRoute.human:
            pytest.skip("human-routed task has no LLM price to compare")
        ceiling = tp.human_price_low * ps.COMPETITIVE_CEILING
        assert tp.price <= max(ceiling, ps.MIN_TASK_PRICE_EUR) + 0.01

    def test_savings_are_reported_honestly(self):
        tp = ps.price_task(
            description="Draft the onboarding documentation. " * 15,
            task_type="documentation",
            model="claude-sonnet-5",
        )
        expected = 1.0 - (tp.price / tp.human_price_low)
        assert tp.savings_vs_human == pytest.approx(expected, abs=0.001)
        assert 0.0 <= tp.savings_vs_human <= 1.0


# --------------------------------------------------------------------------- #
#  Human range                                                                 #
# --------------------------------------------------------------------------- #


class TestHumanRange:
    def test_range_is_ordered_and_positive(self):
        tp = ps.price_task(
            description="Install and configure the platform on the client cluster.",
            task_type="installation",
        )
        assert 0 < tp.human_price_low < tp.human_price_high

    def test_expert_offer_must_fall_inside_the_range(self):
        tp = ps.price_task(
            description="Install the stack on the client's infrastructure.",
            task_type="installation",
        )
        mid = (tp.human_price_low + tp.human_price_high) / 2
        assert ps.offer_is_acceptable(tp, mid)
        assert ps.offer_is_acceptable(tp, tp.human_price_low)
        assert ps.offer_is_acceptable(tp, tp.human_price_high)
        assert not ps.offer_is_acceptable(tp, tp.human_price_low - 1.0)
        assert not ps.offer_is_acceptable(tp, tp.human_price_high + 1.0)

    def test_every_discipline_in_the_profiles_has_a_rate_band(self):
        """A profile pointing at a missing discipline would silently use defaults."""
        for name, profile in ps.TASK_TYPE_PROFILES.items():
            assert profile.discipline in ps.BLENDED_REMOTE_RATES_EUR, name
            assert (
                profile.seniority
                in ps.BLENDED_REMOTE_RATES_EUR[profile.discipline]
            ), name


# --------------------------------------------------------------------------- #
#  Routing                                                                     #
# --------------------------------------------------------------------------- #


class TestRouting:
    @pytest.mark.parametrize(
        "task_type", sorted(ps.HUMAN_ONLY_TASK_TYPES)
    )
    def test_human_only_types_never_route_to_an_llm(self, task_type):
        tp = ps.price_task(description="Do the thing.", task_type=task_type)
        assert tp.route is ps.ExecutionRoute.human

    def test_installation_wording_forces_a_human_even_on_a_generic_type(self):
        tp = ps.price_task(
            description="Déployer la solution sur l'infrastructure du client.",
            task_type="general",
        )
        assert tp.route is ps.ExecutionRoute.human

    @pytest.mark.parametrize(
        "description,expect_human",
        [
            # An external / regulatory audit carries accountability a model cannot.
            ("Organiser un audit externe pour valider la conformité OHADA.", True),
            ("Préparer les éléments pour un audit OHADA externe.", True),
            ("Obtenir la certification de conformité RGPD.", True),
            # ...but an internal code audit is ordinary review work.
            ("Effectuer un audit de code interne sur le module.", False),
            # A bare certificate is not a compliance certification. Regression
            # guard: matching any "certif*" routed SSL work to a human and
            # multiplied its price by two orders of magnitude.
            ("Générer les certificats de test pour la CI.", False),
            ("Rédiger la documentation utilisateur.", False),
        ],
    )
    def test_compliance_signals_are_narrow(self, description, expect_human):
        tp = ps.price_task(description=description, task_type="review")
        assert (tp.route is ps.ExecutionRoute.human) is expect_human

    def test_french_infinitive_deployer_is_detected(self):
        """Regression guard: the stem is -y- in the infinitive, -i- when conjugated."""
        for wording in (
            "Déployer la solution sur l'infrastructure du client.",
            "Le déploiement se fera sur le cluster du client.",
            "On déploie ensuite en production.",
        ):
            tp = ps.price_task(description=wording, task_type="general")
            assert tp.route is ps.ExecutionRoute.human, wording

    @pytest.mark.parametrize("task_type", sorted(ps.DOCUMENT_ONLY_TASK_TYPES))
    def test_writing_about_deployment_stays_on_the_llm(self, task_type):
        """Regression guard: a doc *about* an install is not an install.

        "Rédaction du guide de déploiement" was routed to a human expert at
        ~180 EUR purely because the word "déploiement" appeared, where the same
        deliverable costs ~2.50 EUR on the LLM route.
        """
        tp = ps.price_task(
            description="Rédaction du guide de déploiement et d'installation.",
            task_type=task_type,
        )
        assert tp.route is not ps.ExecutionRoute.human

    def test_actually_deploying_still_routes_to_a_human(self):
        """The suppression must not leak into task types that do the work."""
        for task_type in ("general", "execution", "development"):
            tp = ps.price_task(
                description="Déployer et installer la solution chez le client.",
                task_type=task_type,
            )
            assert tp.route is ps.ExecutionRoute.human, task_type

    def test_document_suppression_does_not_override_an_explicit_flag(self):
        tp = ps.price_task(
            description="Rédaction du guide de déploiement.",
            task_type="documentation",
            requires_human=True,
        )
        assert tp.route is ps.ExecutionRoute.human

    def test_explicit_requires_human_flag_is_honoured(self):
        tp = ps.price_task(
            description="Write a short summary.",
            task_type="writing",
            requires_human=True,
        )
        assert tp.route is ps.ExecutionRoute.human


# --------------------------------------------------------------------------- #
#  Job totals                                                                  #
# --------------------------------------------------------------------------- #


class TestJobQuote:
    @staticmethod
    def _tasks():
        return [
            {
                "title": "Spec",
                "description": "Write the technical specification. " * 8,
                "task_type": "documentation",
            },
            {
                "title": "Build",
                "description": "Implement the service with tests. " * 12,
                "task_type": "development",
            },
            {
                "title": "Install",
                "description": "Install on the client infrastructure.",
                "task_type": "installation",
            },
        ]

    def test_total_is_subtotal_plus_platform_fee(self):
        q = ps.price_job(tasks=self._tasks(), model="claude-sonnet-5")
        assert q.total == pytest.approx(q.subtotal + q.platform_fee, abs=0.02)
        assert q.platform_fee == pytest.approx(
            q.subtotal * ps.PLATFORM_FEE_RATE, abs=0.02
        )

    def test_one_priced_line_per_task(self):
        tasks = self._tasks()
        q = ps.price_job(tasks=tasks, model="gpt-4o")
        assert len(q.task_prices) == len(tasks)

    def test_flags_that_a_human_is_required(self):
        q = ps.price_job(tasks=self._tasks(), model="gpt-4o")
        assert q.requires_human is True

    def test_all_llm_job_reports_no_human_requirement(self):
        q = ps.price_job(
            tasks=[
                {
                    "title": "Summarise",
                    "description": "Summarise the attached report. " * 5,
                    "task_type": "analysis",
                }
            ],
            model="gpt-4o-mini",
        )
        assert q.requires_human is False

    def test_job_is_cheaper_than_the_human_equivalent(self):
        q = ps.price_job(tasks=self._tasks(), model="claude-sonnet-5")
        assert q.total < q.human_equivalent_low
        assert q.savings_vs_human > 0

    def test_empty_job_prices_to_zero_without_raising(self):
        q = ps.price_job(tasks=[], model="gpt-4o")
        assert q.total == 0.0
        assert q.task_prices == []

    def test_pricing_is_deterministic(self):
        """Same inputs, same price — a quote must be reproducible for an audit."""
        a = ps.price_job(tasks=self._tasks(), model="claude-sonnet-5")
        b = ps.price_job(tasks=self._tasks(), model="claude-sonnet-5")
        assert a.total == b.total
        assert [t.price for t in a.task_prices] == [t.price for t in b.task_prices]

    def test_human_line_is_billed_at_the_midpoint_of_its_range(self):
        q = ps.price_job(tasks=self._tasks(), model="gpt-4o")
        human = next(
            t for t in q.task_prices if t.route is ps.ExecutionRoute.human
        )
        expected = (human.human_price_low + human.human_price_high) / 2
        assert ps.billed_amount(human) == pytest.approx(expected, abs=0.01)


# --------------------------------------------------------------------------- #
#  Serialisation                                                               #
# --------------------------------------------------------------------------- #


class TestSerialisation:
    def test_task_price_dict_is_json_safe(self):
        import json

        tp = ps.price_task(description="Do the work. " * 10, task_type="development")
        payload = json.dumps(tp.to_dict())
        assert "route" in payload and "complexity" in payload

    def test_job_quote_dict_is_json_safe(self):
        import json

        q = ps.price_job(
            tasks=[{"title": "t", "description": "d " * 30, "task_type": "general"}],
            model="gpt-4o",
        )
        payload = json.loads(json.dumps(q.to_dict()))
        assert payload["pricing_version"] == ps.PRICING_VERSION
        assert len(payload["tasks"]) == 1
