"""Small Stripe v1 HTTP boundary; credentials and provider bodies stay private."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import re
import time
from decimal import Decimal, InvalidOperation, localcontext
from functools import lru_cache
from typing import Any

import httpx

from app.core.config import settings

SUPPORTED_CURRENCIES = frozenset({"USD", "EUR", "GBP"})


class StripeGatewayError(Exception):
    """Safe public error; never includes request data, keys or Stripe response text."""

    def __init__(
        self,
        message: str = "Stripe could not complete the request. Please try again.",
        *,
        status_code: int = 502,
        retryable: bool = False,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


class StripeSignatureError(StripeGatewayError):
    def __init__(self) -> None:
        super().__init__("Invalid Stripe webhook signature or payload.", status_code=400)


def to_minor(amount: Decimal | str | int, currency: str) -> int:
    """Convert the product's two-decimal currencies without silent rounding."""
    if not isinstance(currency, str) or currency.upper() not in SUPPORTED_CURRENCIES:
        raise ValueError("Unsupported payment currency")
    if isinstance(amount, bool) or not isinstance(amount, (Decimal, str, int)):
        raise ValueError("Payment amounts must be exact decimals")
    try:
        value = Decimal(amount)
        if not value.is_finite() or value < 0 or value > Decimal("999999.99"):
            raise ValueError("Payment amount is outside the supported range")
        with localcontext() as context:
            context.prec = max(28, len(value.as_tuple().digits) + 2)
            minor = value * 100
            if minor != minor.to_integral_value():
                raise ValueError("Payment amount has fractional minor units")
            return int(minor)
    except InvalidOperation as exc:
        raise ValueError("Invalid payment amount") from exc


def verify_signature(payload: bytes, header: str, secret: str) -> dict[str, Any]:
    """Verify Stripe t/v1 signatures against raw bytes, including key rotation."""
    if not secret or not header:
        raise StripeSignatureError()
    timestamps: list[str] = []
    signatures: list[str] = []
    for part in header.split(","):
        name, separator, value = part.strip().partition("=")
        if separator and name == "t":
            timestamps.append(value)
        elif separator and name == "v1":
            signatures.append(value)
    try:
        if len(timestamps) != 1 or not signatures:
            raise ValueError
        stamp = int(timestamps[0])
        if abs(time.time() - stamp) > 300:
            raise ValueError
        expected = hmac.new(
            secret.encode(), timestamps[0].encode() + b"." + payload, hashlib.sha256
        ).hexdigest()
        if not any(hmac.compare_digest(expected, provided) for provided in signatures):
            raise ValueError

        def reject_constant(_value: str) -> None:
            raise ValueError

        result = json.loads(payload, parse_constant=reject_constant)
        if not isinstance(result, dict):
            raise ValueError
        return result
    except (ValueError, TypeError, UnicodeError, OverflowError) as exc:
        raise StripeSignatureError() from exc


class StripeGateway:
    """Async HTTPX Stripe client with bounded, idempotence-aware retries."""

    def __init__(
        self,
        secret_key: str | None = None,
        *,
        api_version: str | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
        retry_delay: float = 0.25,
    ) -> None:
        key = secret_key if secret_key is not None else settings.STRIPE_SECRET_KEY
        if not key or not re.fullmatch(r"[sr]k_(?:test|live)_[A-Za-z0-9_]+", key):
            raise StripeGatewayError("Stripe is not configured.", status_code=503)
        self._secret_key = key
        self._api_version = api_version or settings.STRIPE_API_VERSION
        self._transport = transport
        self._retry_delay = retry_delay
        self.livemode = key.startswith(("sk_live_", "rk_live_"))

    async def request(
        self,
        method: str,
        path: str,
        data: dict[str, Any] | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        method = method.upper()
        if (
            not re.fullmatch(r"/[A-Za-z0-9_./-]+", path)
            or path.startswith("//")
            or ".." in path.split("/")
        ):
            raise ValueError("Stripe paths must be relative API resource paths")
        if method not in {"GET", "POST", "DELETE"}:
            raise ValueError("Unsupported Stripe HTTP method")
        headers = {
            "Authorization": f"Bearer {self._secret_key}",
            "Stripe-Version": self._api_version,
        }
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
        can_retry = method == "GET" or (method == "POST" and bool(idempotency_key))
        attempts = 3 if can_retry else 1
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(20, connect=5),
            transport=self._transport,
            follow_redirects=False,
            trust_env=False,
        ) as client:
            for attempt in range(attempts):
                try:
                    response = await client.request(
                        method,
                        f"https://api.stripe.com/v1{path}",
                        headers=headers,
                        params=data if method == "GET" else None,
                        data=data if method != "GET" else None,
                    )
                except httpx.TransportError:
                    if attempt + 1 < attempts:
                        await asyncio.sleep(self._retry_delay * (2**attempt))
                        continue
                    raise StripeGatewayError(retryable=True) from None
                if not 200 <= response.status_code < 300:
                    retryable = response.status_code == 429 or response.status_code >= 500
                    if retryable and attempt + 1 < attempts:
                        await asyncio.sleep(self._retry_delay * (2**attempt))
                        continue
                    raise StripeGatewayError(status_code=response.status_code, retryable=retryable)
                try:
                    result = response.json()
                    if not isinstance(result, dict):
                        raise ValueError
                    return result
                except ValueError:
                    raise StripeGatewayError("Stripe returned an invalid response.") from None
        raise StripeGatewayError()  # Defensive: every loop branch returns or raises.


@lru_cache(maxsize=1)
def get_gateway() -> StripeGateway:
    """Inject this factory at the service/route boundary in isolated tests."""
    return StripeGateway()
