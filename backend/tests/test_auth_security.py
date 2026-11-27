"""Regression coverage for public authentication boundaries."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError

from app.api.v1.endpoints import auth
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.user import UserCreate


def test_public_registration_cannot_create_an_admin():
    with pytest.raises(ValidationError):
        UserCreate(email="attacker@example.com", password="strong-password", full_name="Test", role="admin")


def test_registration_normalizes_email_and_rejects_blank_name():
    user = UserCreate(email="Person@EXAMPLE.COM", password="strong-password", full_name="Test", role="client")
    assert user.email == "person@example.com"
    with pytest.raises(ValidationError):
        UserCreate(email="person@example.com", password="strong-password", full_name="   ", role="client")


def test_long_passwords_do_not_share_a_truncated_hash():
    prefix = "a" * 72
    hashed = hash_password(prefix + "one")
    assert verify_password(prefix + "one", hashed)
    assert not verify_password(prefix + "two", hashed)


def test_legacy_bcrypt_passwords_still_work():
    from passlib.hash import bcrypt
    hashed = bcrypt.hash("existing-password")
    assert verify_password("existing-password", hashed)
    assert not verify_password("wrong", hashed)


@pytest.mark.asyncio
@pytest.mark.parametrize("subject", ["not-a-uuid", "", "123"])
async def test_malformed_subject_is_unauthorized_before_querying_database(subject):
    db = AsyncMock()
    with pytest.raises(HTTPException) as exc:
        await get_current_user(token=create_access_token({"sub": subject}), db=db)
    assert exc.value.status_code == 401
    db.execute.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("identifier, expected", [(" SEGA ", "sega@taskmatch.ai"), (" Person@EXAMPLE.COM ", "person@example.com")])
async def test_login_normalizes_identifiers_and_limits_alias_to_admin(identifier, expected, monkeypatch):
    statements = []
    async def execute(statement):
        statements.append(statement)
        return SimpleNamespace(scalar_one_or_none=lambda: None)
    db = SimpleNamespace(execute=execute)
    with pytest.raises(HTTPException) as exc:
        await auth.login(form_data=OAuth2PasswordRequestForm(username=identifier, password="incorrect"), db=db)
    assert exc.value.status_code == 401
    params = list(statements[0].compile().params.values())
    assert expected in params
    if "@" not in identifier:
        assert "admin" in params
