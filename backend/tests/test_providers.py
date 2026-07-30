"""Unit tests for the LLM provider registry (file-backed, no network/DB)."""

from __future__ import annotations

import app.services.providers as pv


def _isolate(tmp_path, monkeypatch):
    monkeypatch.setattr(pv, "_DATA_DIR", str(tmp_path), raising=False)
    monkeypatch.setattr(pv, "_STORE_PATH", str(tmp_path / "providers.json"), raising=False)


def test_catalog_has_major_providers():
    for p in ["openai", "anthropic", "google", "mistral", "deepseek", "xai", "openrouter"]:
        assert p in pv.CATALOG
        assert pv.CATALOG[p]["models"]  # each has at least one version


def test_list_providers_defaults_off_and_no_key(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    providers = pv.list_providers()
    assert {p["provider"] for p in providers} == set(pv.CATALOG)
    for p in providers:
        assert p["enabled"] is False
        assert p["key_set"] is False
        assert p["key_hint"] is None


def test_update_sets_and_masks_key(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    out = pv.update_provider("openai", api_key="sk-abcd12345678wxyz", enabled=True, selected_model="gpt-4o")
    assert out is not None and out["enabled"] is True
    # public view never leaks the raw key
    pub = next(p for p in pv.list_providers() if p["provider"] == "openai")
    assert pub["key_set"] is True
    assert pub["key_hint"] == "sk-a…wxyz"
    assert "sk-abcd12345678wxyz" not in str(pub)
    assert pub["selected_model"] == "gpt-4o"


def test_enabled_providers_requires_key_and_toggle(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    pv.update_provider("mistral", api_key="key-123456789", enabled=True)
    pv.update_provider("openai", enabled=True)  # enabled but no key -> not competing
    pv.update_provider("google", api_key="key-abcdefghi", enabled=False)  # keyed but off
    assert pv.enabled_providers() == ["mistral"]


def test_persists_to_disk(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    pv.update_provider("deepseek", api_key="dk-999888777", enabled=True)
    assert (tmp_path / "providers.json").exists()
    # a fresh read (new call) still sees it
    assert "deepseek" in pv.enabled_providers()


def test_unknown_provider_is_none(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    assert pv.update_provider("not-a-provider", enabled=True) is None
    assert pv.get_provider("not-a-provider") is None


def test_selected_model_must_be_in_catalog(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    pv.update_provider("openai", selected_model="totally-made-up")
    got = pv.get_provider("openai")
    # invalid model ignored -> falls back to a real catalog default
    assert got["selected_model"] in pv.CATALOG["openai"]["models"]
