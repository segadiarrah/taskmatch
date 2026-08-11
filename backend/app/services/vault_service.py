"""Credential vault — symmetric encryption for access grants.

Installing a deliverable on a client's own infrastructure means credentials have
to change hands. This module is the only place a secret is encrypted or decrypted;
nothing else in the codebase touches plaintext credentials, and plaintext is never
written to the database or to a log line.

Key material comes from ``settings.VAULT_SECRET_KEY``, falling back to
``SECRET_KEY``. The key is derived (not used raw) so an operator can set a
human-typed passphrase without producing an invalid Fernet key.
"""

from __future__ import annotations

import base64
import hashlib
import re
from typing import Optional

import structlog

from app.core.config import settings

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


class VaultUnavailableError(RuntimeError):
    """Raised when encryption is impossible — never fall back to plaintext."""


def _derive_key(secret: str) -> bytes:
    """Derive a urlsafe-base64 32-byte Fernet key from arbitrary key material.

    A plain SHA-256 is sufficient here: the input is a high-entropy server-side
    secret, not a user password, so a slow KDF would buy nothing.
    """
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def _fernet():
    """Build a Fernet instance, or raise if the primitives are unavailable."""
    try:
        from cryptography.fernet import Fernet  # noqa: WPS433 — lazy, optional dep
    except ImportError as exc:  # pragma: no cover — cryptography ships with jose
        raise VaultUnavailableError(
            "cryptography is not installed; cannot store access credentials"
        ) from exc

    secret = getattr(settings, "VAULT_SECRET_KEY", None) or settings.SECRET_KEY
    if not secret or secret == "change-me-in-production":
        # Refusing here is deliberate: silently encrypting with a default key
        # would give an operator false confidence that secrets are protected.
        raise VaultUnavailableError(
            "VAULT_SECRET_KEY (or SECRET_KEY) must be set to a real value before "
            "credentials can be stored"
        )
    return Fernet(_derive_key(secret))


def vault_available() -> bool:
    """Whether credentials can currently be stored. Cheap enough to call per request."""
    try:
        _fernet()
    except VaultUnavailableError:
        return False
    return True


def encrypt(plaintext: str) -> str:
    """Encrypt a credential. Returns the ciphertext as a str for DB storage."""
    if not plaintext:
        raise ValueError("refusing to store an empty credential")
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt(ciphertext: str) -> str:
    """Decrypt a credential.

    Raises :class:`VaultUnavailableError` when the ciphertext cannot be read —
    typically because the key was rotated after the grant was written.
    """
    from cryptography.fernet import InvalidToken  # noqa: WPS433

    try:
        return _fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        logger.warning("vault.decrypt_failed", reason="invalid_token")
        raise VaultUnavailableError(
            "credential cannot be decrypted with the current key"
        ) from exc


#: Hard ceiling on a hint's length. A hint is shown in listings and stored in the
#: clear, so it must never be able to grow into a usable credential.
_MAX_HINT_LENGTH = 48


def hint_for(plaintext: str, kind: Optional[str] = None) -> str:
    """Build a non-secret preview safe to show in listings.

    URLs keep their scheme and host so the client recognises which credential
    this is; everything else is reduced to a masked tail. Whatever the shape of
    the input, the result is capped and must never be usable to authenticate.
    """
    value = (plaintext or "").strip()
    if not value:
        return ""

    # Only ever consider the first whitespace-delimited token. Credentials are
    # routinely pasted as "<url> KEY=<material>" or "<host> <token>", and a hint
    # built from the whole string would carry the material with it.
    head = value.split()[0]

    if "://" in head:
        scheme, _, rest = head.partition("://")
        # Strip any userinfo, then keep only the authority component — stopping
        # at the first path, query or fragment delimiter.
        authority = rest.rsplit("@", 1)[-1]
        host = re.split(r"[/?#]", authority, maxsplit=1)[0]
        return f"{scheme}://{host}"[:_MAX_HINT_LENGTH]

    if len(head) <= 8:
        return "•" * len(head)
    return f"{head[:3]}…{head[-4:]}"
