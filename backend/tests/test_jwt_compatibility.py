"""HS256 interoperability vectors signed offline with python-jose 3.5.0."""
import pytest
from jwt import ExpiredSignatureError, InvalidSignatureError

from app.core.config import settings
from app.core.security import create_access_token, verify_token

KEY = "fixture-only-hs256-compatibility-key-20261124"
SUBJECT = "00000000-0000-4000-8000-000000000001"
DELEGATION_ID = "00000000-0000-4000-8000-000000000002"
SESSION = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoiY2xpZW50IiwiZXhwIjo0MTAyNDQ0ODAwfQ."
    "RPeJ21DF0Qimg2w-6yyp7cdj4zCuYo1b3bbx4aO6sVw"
)
VERSIONED_SESSION = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoiY2xpZW50Iiwic3YiOjEsImV4cCI6NDEwMjQ0NDgwMH0."
    "i4qnNWawZkBLrsfq4OtqWii7AWKq5gAkqBfgu73Q98s"
)
DELEGATION = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJzY29wZSI6Imh1bWFuX3Rhc2tzIiwiZGVsZWdhdGlvbl9pZCI6IjAwMDAwMDAwLTAwMDAtNDAwMC04MDAwLTAwMDAwMDAwMDAwMiIsImV4cCI6NDEwMjQ0NDgwMH0."
    "dfMZSaW2QyHilwGIwqQcUtL-807STq7cjUTL7VJcjFs"
)
EXPIRED = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoiY2xpZW50IiwiZXhwIjo5NDY2ODQ4MDB9."
    "U7xxz8qNvF0Tmb2vTEuiTI4uNj2-wjJu99KclTxdeAk"
)

@pytest.fixture(autouse=True)
def synthetic_settings(monkeypatch):
    monkeypatch.setattr(settings, "SECRET_KEY", KEY)
    monkeypatch.setattr(settings, "ALGORITHM", "HS256")


@pytest.mark.parametrize(("token", "claims"), [
    (SESSION, {"role": "client"}),
    (VERSIONED_SESSION, {"role": "client", "sv": 1}),
    (DELEGATION, {"scope": "human_tasks", "delegation_id": DELEGATION_ID}),
])
def test_previous_issuer_claims_survive(token, claims):
    assert verify_token(token) == {"sub": SUBJECT, **claims, "exp": 4102444800}


def test_expired_previous_issuer_session_is_rejected():
    with pytest.raises(ExpiredSignatureError):
        verify_token(EXPIRED)


def test_unrelated_fixture_key_is_rejected(monkeypatch):
    monkeypatch.setattr(settings, "SECRET_KEY", "unrelated-fixture-only-hs256-key-20261124")
    with pytest.raises(InvalidSignatureError):
        verify_token(SESSION)


def test_current_issuer_preserves_account_claims():
    token = create_access_token({"sub": SUBJECT, "role": "client", "sv": 1})
    claims = verify_token(token)
    assert isinstance(claims.pop("exp"), int)
    assert claims == {"sub": SUBJECT, "role": "client", "sv": 1}
