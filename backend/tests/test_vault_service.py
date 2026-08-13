"""Tests for the credential vault.

Credentials shared for an installation-mode delivery are the most sensitive data
the platform holds. These tests pin the properties that make storing them
defensible: encrypted at rest, never leaked through a hint, and refused outright
rather than stored in the clear when the key is not configured.
"""

from __future__ import annotations

import pytest

from app.core.config import settings
from app.services import vault_service


@pytest.fixture
def configured_key(monkeypatch):
    """A real vault key, as an operator would set in production."""
    monkeypatch.setattr(
        settings, "VAULT_SECRET_KEY", "a-real-vault-key-of-sufficient-length-1234", raising=False
    )
    yield


class TestKeyHandling:
    def test_refuses_to_encrypt_without_a_configured_key(self, monkeypatch):
        """Storing a secret under the default key would be false assurance."""
        monkeypatch.setattr(settings, "VAULT_SECRET_KEY", None, raising=False)
        monkeypatch.setattr(settings, "SECRET_KEY", "change-me-in-production")

        assert vault_service.vault_available() is False
        with pytest.raises(vault_service.VaultUnavailableError):
            vault_service.encrypt("super-secret")

    def test_falls_back_to_secret_key_when_no_dedicated_key(self, monkeypatch):
        monkeypatch.setattr(settings, "VAULT_SECRET_KEY", None, raising=False)
        monkeypatch.setattr(settings, "SECRET_KEY", "a-perfectly-usable-application-secret")

        assert vault_service.vault_available() is True
        assert vault_service.decrypt(vault_service.encrypt("x")) == "x"

    def test_arbitrary_passphrase_length_is_accepted(self, monkeypatch):
        """Operators type passphrases; they should not have to produce a Fernet key."""
        monkeypatch.setattr(settings, "VAULT_SECRET_KEY", "short", raising=False)
        assert vault_service.decrypt(vault_service.encrypt("value")) == "value"


class TestKeyDerivation:
    """The KDF must resist an offline attack on a leaked database.

    ``VAULT_SECRET_KEY`` is typed by an operator, so it is exactly the
    low-entropy input a single fast hash fails to protect.
    """

    def test_key_is_stretched_not_merely_hashed(self):
        import base64
        import hashlib

        secret = "operator-chosen-passphrase"
        derived = base64.urlsafe_b64decode(vault_service._derive_key(secret))
        naive = hashlib.sha256(secret.encode("utf-8")).digest()
        assert derived != naive, "key material must not be a bare SHA-256 digest"

    def test_iteration_count_meets_the_owasp_floor(self):
        assert vault_service._KDF_ITERATIONS >= 600_000

    def test_derivation_is_deterministic(self):
        """Same configuration must reopen yesterday's ciphertext."""
        assert vault_service._derive_key("k") == vault_service._derive_key("k")

    def test_distinct_secrets_derive_distinct_keys(self):
        assert vault_service._derive_key("a") != vault_service._derive_key("b")

    def test_derived_key_is_a_valid_fernet_key(self):
        from cryptography.fernet import Fernet

        Fernet(vault_service._derive_key("any-passphrase"))


class TestRoundTrip:
    def test_round_trip_preserves_the_secret(self, configured_key):
        secret = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI deploy@client"
        assert vault_service.decrypt(vault_service.encrypt(secret)) == secret

    def test_ciphertext_does_not_contain_the_plaintext(self, configured_key):
        secret = "postgres://admin:hunter2@db.client.internal:5432/prod"
        ciphertext = vault_service.encrypt(secret)
        assert "hunter2" not in ciphertext
        assert secret not in ciphertext

    def test_same_plaintext_encrypts_differently_each_time(self, configured_key):
        """Fernet embeds a nonce, so identical secrets must not look identical."""
        a = vault_service.encrypt("same-value")
        b = vault_service.encrypt("same-value")
        assert a != b
        assert vault_service.decrypt(a) == vault_service.decrypt(b) == "same-value"

    def test_unicode_survives_the_round_trip(self, configured_key):
        secret = "clé-d'accès-établie-2026 → ✓"
        assert vault_service.decrypt(vault_service.encrypt(secret)) == secret

    def test_empty_secret_is_refused(self, configured_key):
        with pytest.raises(ValueError):
            vault_service.encrypt("")

    def test_rotated_key_cannot_read_old_ciphertext(self, monkeypatch):
        """A key rotation must fail loudly, not return garbage."""
        monkeypatch.setattr(settings, "VAULT_SECRET_KEY", "first-key-value", raising=False)
        ciphertext = vault_service.encrypt("secret")

        monkeypatch.setattr(settings, "VAULT_SECRET_KEY", "second-key-value", raising=False)
        with pytest.raises(vault_service.VaultUnavailableError):
            vault_service.decrypt(ciphertext)

    def test_tampered_ciphertext_is_rejected(self, configured_key):
        ciphertext = vault_service.encrypt("secret")
        tampered = ciphertext[:-4] + "AAAA"
        with pytest.raises(vault_service.VaultUnavailableError):
            vault_service.decrypt(tampered)


class TestHints:
    def test_url_hint_keeps_scheme_and_host_but_drops_credentials(self):
        hint = vault_service.hint_for(
            "postgres://admin:hunter2@db.client.internal:5432/prod"
        )
        assert "hunter2" not in hint
        assert "admin" not in hint
        assert hint == "postgres://db.client.internal:5432"

    def test_token_hint_masks_the_middle(self):
        hint = vault_service.hint_for("sk-live-abcdefghijklmnop7f2a")
        assert "abcdefghijklmnop" not in hint
        assert hint.endswith("7f2a")

    def test_short_secret_is_fully_masked(self):
        assert vault_service.hint_for("abc123") == "••••••"

    def test_empty_secret_yields_empty_hint(self):
        assert vault_service.hint_for("") == ""

    def test_url_followed_by_key_material_does_not_leak_the_key(self):
        """Regression guard for a real leak.

        Credentials are routinely pasted as "<url> KEY=<material>". Extracting
        the host with a bare ``split("/")`` returned the whole remainder when the
        URL had no path, putting the key material straight into the listing.
        """
        secret = "ssh://deploy@10.0.4.7:22 KEY=AAAAC3NzaC1lZDI1NTE5secretvalue9f2a"
        hint = vault_service.hint_for(secret)
        assert hint == "ssh://10.0.4.7:22"
        assert "secretvalue9f2a" not in hint
        assert "AAAAC3" not in hint

    @pytest.mark.parametrize(
        "secret",
        [
            "sk-live-abcdefghijklmnop7f2a",
            "postgres://admin:hunter2@db:5432/prod",
            "ghp_averylongpersonalaccesstokenvalue",
            "short",
            # Multi-token shapes: everything after the first token is material.
            "ssh://deploy@10.0.4.7:22 KEY=AAAAC3NzaC1lZDI1NTE5secretvalue9f2a",
            "https://vault.example.com token=abcdef123456 user=admin",
            "10.0.4.7 s3cr3t-passphrase",
            "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXk\n-----END-----",
            # Authority-delimiter shapes.
            "redis://:password@cache.internal:6379/0",
            "https://host.example.com?token=leakme",
            "https://host.example.com#fragment-secret",
        ],
    )
    def test_hint_never_reproduces_the_whole_secret(self, secret):
        """A hint appears in listings; it must never be enough to authenticate."""
        hint = vault_service.hint_for(secret)
        assert hint != secret
        assert len(hint) <= 48
        # No whitespace-delimited token beyond the first may survive into a hint.
        for token in secret.split()[1:]:
            assert token not in hint
