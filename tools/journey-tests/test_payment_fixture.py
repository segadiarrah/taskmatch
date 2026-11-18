"""Provider fixture IDs must stay unique when APIs restart over preserved test DBs."""

import httpx
import pytest

from payment_fixture import CheckoutFixture, PaymentFixture


def provider_request(path, data, key="fixture-idempotency"):
    return httpx.Request(
        "POST", "https://api.stripe.example.test/v1" + path,
        data=data, headers={"idempotency-key": key},
    )


PAYMENT = {
    "mode": "payment", "client_reference_id": "fixture-funding",
    "line_items[0][price_data][unit_amount]": "100",
    "line_items[0][price_data][currency]": "eur",
}
TRANSFER = {"amount": "100", "currency": "eur", "destination": "acct_fixture",
            "transfer_group": "fixture-group"}


@pytest.mark.asyncio
@pytest.mark.parametrize("path,data", [
    ("/checkout/sessions", PAYMENT),
    ("/customers", {}),
    ("/checkout/sessions", {"mode": "setup", "customer": "cus_fixture", "client_reference_id": "fixture-principal"}),
    ("/payment_intents", {"amount": "100", "currency": "eur", "customer": "cus_fixture", "payment_method": "pm_fixture"}),
    ("/transfers", TRANSFER),
    ("/refunds", {"charge": "ch_fixture"}),
])
async def test_fresh_provider_instances_do_not_reuse_persisted_ids(path, data):
    identifiers = []
    for provider in (PaymentFixture(), PaymentFixture()):
        provider.charges["ch_fixture"] = {"id": "ch_fixture", "amount": 100, "currency": "eur"}
        response = await provider.handle(provider_request(path, data))
        identifiers.append(response.json()["id"])
    assert identifiers[0] != identifiers[1], "API restarts must not reuse IDs retained in PostgreSQL"


@pytest.mark.asyncio
@pytest.mark.parametrize("path,data", [("/checkout/sessions", PAYMENT), ("/transfers", TRANSFER)])
async def test_provider_idempotency_reuses_the_original_namespaced_resource(path, data):
    provider = PaymentFixture()
    first = await provider.handle(provider_request(path, data))
    repeated = await provider.handle(provider_request(path, data))
    assert first.json() == repeated.json()
    resources = provider.sessions if path == "/checkout/sessions" else provider.transfers
    assert len(resources) == 1


@pytest.mark.asyncio
async def test_base_checkout_fixture_keeps_its_deterministic_ids():
    response = await CheckoutFixture().handle(provider_request("/checkout/sessions", PAYMENT))
    assert response.json()["id"] == "cs_test_1"
