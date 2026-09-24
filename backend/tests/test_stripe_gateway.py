"""Stripe boundary tests use HTTPX transport doubles, never external payments."""

import hashlib
import hmac
import json
import time
from decimal import Decimal
from urllib.parse import parse_qs

import httpx
import pytest

from app.services.stripe_gateway import (
    StripeGateway,
    StripeGatewayError,
    StripeSignatureError,
    to_minor,
    verify_signature,
)


def signed(payload, secret="whsec_unit_only", timestamp=None):
    stamp = int(time.time()) if timestamp is None else timestamp
    digest = hmac.new(secret.encode(), str(stamp).encode() + b"." + payload, hashlib.sha256)
    return f"t={stamp},v1={digest.hexdigest()}"


@pytest.mark.parametrize("currency", ["USD", "EUR", "GBP", "usd"])
def test_minor_units_preserve_exact_decimal_amount(currency):
    assert to_minor(Decimal("19.9900"), currency) == 1999
    assert to_minor("0.01", currency) == 1
    assert to_minor(0, currency) == 0


@pytest.mark.parametrize("amount", ["0.001", "-1", "NaN", "Infinity", "1e100", 0.1, True])
def test_minor_units_reject_rounding_nonfinite_and_float_input(amount):
    with pytest.raises(ValueError):
        to_minor(amount, "USD")


def test_minor_units_reject_unsupported_currency():
    with pytest.raises(ValueError):
        to_minor("12", "JPY")


def test_signature_verifies_exact_bytes_and_rotation_candidates():
    raw = b'{ "id": "evt_unit", "data": {"object": {}} }'
    header = signed(raw) + ",v1=wrong"
    assert verify_signature(raw, header, "whsec_unit_only")["id"] == "evt_unit"
    with pytest.raises(StripeSignatureError):
        verify_signature(json.dumps(json.loads(raw)).encode(), header, "whsec_unit_only")


@pytest.mark.parametrize("offset", [-301, 301])
def test_signature_rejects_stale_and_future_events(offset):
    raw = b'{"id":"evt_unit"}'
    with pytest.raises(StripeSignatureError):
        verify_signature(raw, signed(raw, timestamp=int(time.time()) + offset), "whsec_unit_only")


@pytest.mark.parametrize("header", ["", "v1=no_timestamp", "t=bad,v1=x", "t=1,t=2,v1=x"])
def test_signature_rejects_invalid_header(header):
    with pytest.raises(StripeSignatureError):
        verify_signature(b"{}", header, "whsec_unit_only")


@pytest.mark.parametrize("raw", [b"[]", b"null", b"invalid", b'{"number":NaN}'])
def test_signature_rejects_non_object_or_invalid_json(raw):
    with pytest.raises(StripeSignatureError):
        verify_signature(raw, signed(raw), "whsec_unit_only")


def test_signature_without_secret_fails_closed():
    with pytest.raises(StripeSignatureError):
        verify_signature(b"{}", signed(b"{}", secret=""), "")


async def test_gateway_pins_version_encodes_forms_and_retries_with_identical_key():
    calls = []

    def respond(request):
        calls.append(request)
        return httpx.Response(503 if len(calls) < 3 else 200, json={"id": "cs_unit"})

    gateway = StripeGateway("sk_test_unit", transport=httpx.MockTransport(respond), retry_delay=0)
    result = await gateway.request(
        "POST",
        "/checkout/sessions",
        data={"metadata[app]": "taskmatch", "line_items[0][price_data][unit_amount]": "1999"},
        idempotency_key="taskmatch:funding:unit",
    )
    assert result == {"id": "cs_unit"}
    assert len(calls) == 3
    assert len({request.content for request in calls}) == 1
    for request in calls:
        assert str(request.url) == "https://api.stripe.com/v1/checkout/sessions"
        assert request.headers["Stripe-Version"] == "2024-06-20"
        assert request.headers["Idempotency-Key"] == "taskmatch:funding:unit"
        assert request.headers["Authorization"] == "Bearer sk_test_unit"
        assert parse_qs(request.content.decode())["metadata[app]"] == ["taskmatch"]


async def test_network_failure_retries_get_with_query_parameters():
    calls = []

    def respond(request):
        calls.append(request)
        if len(calls) == 1:
            raise httpx.ReadTimeout("secret provider diagnostics", request=request)
        return httpx.Response(200, json={"id": "pi_unit"})

    gateway = StripeGateway("sk_test_unit", transport=httpx.MockTransport(respond), retry_delay=0)
    await gateway.request("GET", "/payment_intents/pi_unit", data={"expand[]": "latest_charge"})
    assert len(calls) == 2
    assert calls[0].url.params["expand[]"] == "latest_charge"


@pytest.mark.parametrize(
    "status,retryable,expected",
    [(429, True, 3), (500, True, 3), (400, False, 1), (401, False, 1), (302, False, 1)],
)
async def test_failure_is_bounded_and_does_not_leak_provider_body(status, retryable, expected):
    calls = []

    def respond(request):
        calls.append(request)
        return httpx.Response(
            status, json={"error": {"message": "sk_live_NEVER_EXPOSE payer@example.test"}}
        )

    gateway = StripeGateway("sk_test_unit", transport=httpx.MockTransport(respond), retry_delay=0)
    with pytest.raises(StripeGatewayError) as caught:
        await gateway.request(
            "POST", "/transfers", data={"amount": "100"}, idempotency_key="taskmatch:transfer:unit"
        )
    assert len(calls) == expected
    assert caught.value.status_code == status
    assert caught.value.retryable is retryable
    assert "NEVER_EXPOSE" not in str(caught.value)
    assert "@" not in str(caught.value)


async def test_mutation_without_idempotency_key_does_not_retry_uncertain_outcome():
    calls = []

    def respond(request):
        calls.append(request)
        raise httpx.ReadTimeout("unknown outcome", request=request)

    gateway = StripeGateway("sk_test_unit", transport=httpx.MockTransport(respond), retry_delay=0)
    with pytest.raises(StripeGatewayError):
        await gateway.request("POST", "/account_links", data={"account": "acct_unit"})
    assert len(calls) == 1


@pytest.mark.parametrize(
    "path", ["https://evil.test/accounts", "//evil.test/accounts", "/../accounts"]
)
async def test_gateway_cannot_send_credentials_to_arbitrary_origin(path):
    gateway = StripeGateway(
        "sk_test_unit", transport=httpx.MockTransport(lambda request: pytest.fail("network called"))
    )
    with pytest.raises(ValueError):
        await gateway.request("GET", path)


async def test_gateway_rejects_success_without_json_object():
    gateway = StripeGateway(
        "sk_test_unit",
        transport=httpx.MockTransport(lambda request: httpx.Response(200, text="not JSON")),
    )
    with pytest.raises(StripeGatewayError) as caught:
        await gateway.request("GET", "/accounts/acct_unit")
    assert caught.value.retryable is False


def test_gateway_without_valid_key_is_unavailable():
    with pytest.raises(StripeGatewayError):
        StripeGateway("not-a-stripe-key")
