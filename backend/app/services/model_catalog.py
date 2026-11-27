"""Verified text-generation IDs and USD / million token standard rate ceilings.

Checked 2026-10-29 against the linked first-party documentation. No discounts,
cache hits or batch rates are assumed. DeepSeek uses peak rates; Gemini uses
announced post-promotion rates so an accepted quote survives the price change.
Input is capped at 64k, below all long-context surcharge thresholds.
"""
RATES_AS_OF = '2026-10-29'
SOURCES = {
    'openai': 'https://openai.com/api/',
    'anthropic': 'https://platform.claude.com/docs/en/models/overview',
    'google': 'https://ai.google.dev/gemini-api/docs/pricing',
    'mistral': 'https://docs.mistral.ai/inference/pricing',
    'deepseek': 'https://api-docs.deepseek.com/quick_start/pricing',
    'xai': 'https://docs.x.ai/developers/models/grok-4.7',
    'openrouter': 'https://openrouter.ai/api/v1/models',
}
MODEL_RATES = {
    'openai': {'gpt-6.1-sol': (2., 10.), 'gpt-6.1-terra': (1., 5.), 'gpt-6-astra': (10., 50.), 'gpt-6-luna': (.1, .5), 'gpt-4o': (2.5, 10.), 'gpt-4.1': (2., 8.), 'gpt-4o-mini': (.15, .6), 'o3': (2., 8.)},
    'anthropic': {'claude-sonnet-5-5': (2., 10.), 'claude-opus-5-5': (4., 20.), 'claude-haiku-5-5': (.1, .5), 'claude-fable-5-1': (10., 50.), 'claude-sonnet-4-5': (3., 15.), 'claude-haiku-4-5': (1., 5.)},
    'google': {'gemini-4-argon': (4., 20.), 'gemini-3.8-flash': (1.5, 7.5), 'gemini-2.5-pro': (1.25, 10.), 'gemini-2.5-flash': (.3, 2.5)},
    'mistral': {'mistral-large-4': (1.36, 4.18), 'mistral-large-2512': (.5, 1.5), 'mistral-medium-3-5': (1.5, 7.5), 'mistral-small-2603': (.15, .6), 'mistral-large-latest': (2., 6.), 'mistral-small-latest': (.2, .6)},
    'deepseek': {'deepseek-flash': (.3, 1.2), 'deepseek-v4-pro': (1.32, 3.96), 'deepseek-chat': (.27, 1.10), 'deepseek-reasoner': (.55, 2.19)},
    'xai': {'grok-4.7': (2., 6.), 'grok-4': (3., 15.), 'grok-3': (3., 15.)},
    'openrouter': {'openai/gpt-6.1-sol': (2., 10.), 'openai/gpt-6.1-terra': (1., 5.), 'openai/gpt-6-astra': (10., 50.), 'anthropic/claude-sonnet-5.5': (2., 10.), 'openai/gpt-4o': (2.5, 10.), 'anthropic/claude-sonnet-4.5': (3., 15.), 'deepseek/deepseek-chat-v3-0324': (.27, 1.1)},
}
PROVIDERS = {
    'openai': ('OpenAI', 'https://api.openai.com/v1'),
    'anthropic': ('Anthropic', 'https://api.anthropic.com/v1'),
    'google': ('Google', 'https://generativelanguage.googleapis.com/v1beta/openai'),
    'mistral': ('Mistral', 'https://api.mistral.ai/v1'),
    'deepseek': ('DeepSeek', 'https://api.deepseek.com/v1'),
    'xai': ('xAI (Grok)', 'https://api.x.ai/v1'),
    'openrouter': ('OpenRouter', 'https://openrouter.ai/api/v1'),
}
CATALOG = {provider: {'label': label, 'base_url': url, 'models': list(MODEL_RATES[provider])}
           for provider, (label, url) in PROVIDERS.items()}


def model_rate(provider: str, model: str) -> tuple[float, float]:
    try:
        return MODEL_RATES[provider][model]
    except KeyError:
        raise ValueError(f'No verified model rate for {provider}/{model}') from None
