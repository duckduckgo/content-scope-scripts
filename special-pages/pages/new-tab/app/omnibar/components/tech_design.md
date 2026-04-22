Background & Requirements
Duck.ai now supports configurable reasoning effort on capable models. The NTP omnibar doesn't expose this control, so users who enter duck.ai via the NTP can't adjust it.

We need to add a reasoning picker to the NTP omnibar (shown only for models that support it), persist the user's last selection across app restarts, apply it to chats submitted from the NTP, and reset to a valid default when switching to an incompatible model. Shipping behind a feature flag.
Problem Statement
Users who enter duck.ai through the NTP omnibar have no way to choose the reasoning effort for models that support it, creating a gap with the native omnibar and leaving the feature inaccessible from the most common entry point.
Recommended Approach
The NTP omnibar is a web widget bridged to native via NewTabPageOmnibarClient. Reasoning effort plugs into the same seams that carry model selection today — no new message types are needed, only new fields on existing messages and a new persisted preference. Native is the single point of control for rollout: the NTP web app stays flag-unaware and reacts only to the data it's handed.

Implementation steps

 Native (macOS)
Data model (NewTabPageDataModel+Omnibar.swift) — add supportedReasoningEffort: [String] to AIModelItem, selectedReasoningEffort: String? to OmnibarConfig, and reasoningEffort: String? to SubmitChatAction.
Config provider (NewTabPageOmnibarConfigProvider) — add selectedReasoningEffort backed by keyValueStore under a new key, firing aiChatNtpReasoningEffortSelected on change.
Models provider (NewTabPageOmnibarModelsProvider) — populate supportedReasoningEffort on each AIModelItem from the fetched AIChatModel.
Client (NewTabPageOmnibarClient) — include selectedReasoningEffort in getConfig / setConfig / notifyConfigUpdated; validate incoming values against the current model's supportedReasoningEffort in setConfig[1].
Actions handler (NewTabPageOmnibarActionsHandler.submitChat) — accept reasoningEffort and forward it through AIChatNativePrompt.queryPrompt(..., reasoningEffort:).

NTP front-end
Picker UI — render a reasoning picker chip from the new supportedReasoningEffort field on AIModelItem, hidden when the array is empty (designs here)
 Persist selection — send omnibar_setConfig with the new selectedReasoningEffort when the user picks one; reflect the value returned in omnibar_getConfig and pushed via omnibar_onConfigUpdate.
 Submit — include reasoningEffort in every omnibar_submitChat payload.

Feature Flag
Feature flag — gated natively behind aiChatOmnibarReasoningEffort, shared with the native omnibar project, so both surfaces roll out together. When the flag is off, native returns empty supportedReasoningEffort on every AIModelItem and nil for selectedReasoningEffort in OmnibarConfig, and ignores any incoming reasoningEffort on omnibar_setConfig /
omnibar_submitChat. The NTP web app renders the picker from supportedReasoningEffort alone— no flag check on the web side[2].

AL1/ Also, this feature flag depends on enableAiChatTools since reasoning depends on the model picker being available.

Notes
[1] Validating on the write path prevents stale values from persisting when the user's model list changes between sessions (e.g., a subscription tier or backend capability change).

[2] Alternative considered: an explicit shouldShowReasoningEffort: Bool field on OmnibarConfig. Rejected because it creates two sources of truth for "should the picker be visible" (the flag and supportedReasoningEffort), forces the web app to combine them, and adds a contract surface without a behavioral benefit — the end result in both cases is "hide the picker". Collapsing the two into a single empty-array signal is simpler for both sides.
Testing

Unit tests
Cover the different macOS scenarios with unit tests

Manual
Each effort produces a visibly different response on a reasoning-capable model.
Picker hides when the selected model has supportedReasoningEffort: [].
Switching to a model that doesn't support the current effort resets to a valid default.
Selection persists across an app restart.
With the feature flag off, the picker never appears and no reasoningEffort is sent.

Additional Considerations (if applicable)
Localization / Internationalization
User-facing strings (labels and subtitles) are owned and localized by the NTP web app. The native side only passes through stable server keys.