# Execution provider selection

Set `EXECUTION_PROVIDER` in the backend and worker environment to one of `openai`, `anthropic`, `google`, `mistral`, `deepseek`, `xai`, or `openrouter`. The default is `openai`. Configure that provider's key, enabled state and selected model in the admin provider page. New AI and hybrid quotes use only this route; enabling another provider does not select it automatically.

A failed catalog refresh blocks new quotes for the configured provider until a successful refresh. Its last good catalog remains visible for diagnosis. Changing credentials or the endpoint after account verification requires refreshing the catalog again. Catalog access does not prove that generation will succeed.

Each accepted quote freezes the provider, model, rates, FX conversion, token limits, attempt limit and maximum EUR cost. Changing `EXECUTION_PROVIDER` affects future quotes only. Execution uses the accepted route and its current key; provider failures never trigger a different provider. Human-only quotes need no AI provider.

Historical `legacy_manual` workflows retain an offline OpenAI estimate when OpenAI is selected and has no key or prior account catalog. This estimate does not authorize generation: the worker still requires a valid enabled provider and the accepted execution budget. Stripe quotes always require the configured provider to be available.
