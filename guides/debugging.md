# Content Scope Scripts Debugging

## Overview

When developing or debugging Content Scope Scripts, validate script integrity, build outputs, and injection across all platforms.

## Feature Not Working Triage Checklist

When a feature is not working, check these in order:

1. **Feature enabled in config** — is the feature present and enabled in the privacy config for this site?
2. **Feature bundled on the platform** — is it included in the platform's entry point (`entry-points/<platform>.js`)?
3. **Sub-feature or setting enabled** — are the specific settings/sub-features turned on?
4. **Messaging wired and listened to** — are message handlers registered and the bridge initialized?
5. **Script integrity** — does the injected script match what you expect? (see below)

## Script Integrity and Build Issues

**[`injected/docs/build-and-troubleshooting.md`](../injected/docs/build-and-troubleshooting.md)** covers:

- **Verification Steps** — Validate injected script integrity across build directory, native app, and web inspector
- **Config and Platform Parameters Validation** — Using `processConfig` breakpoint to validate config state and platform parameters
- **Build Branch Hash Validation** — For native engineers using build branches
- **Quick Validation Test** — Test page for verifying C-S-S injection
- Platform-specific setup and troubleshooting (iOS/macOS, Android, Windows, Extensions)
- Source maps configuration
- Local dependency linking

## Messaging Issues

**[`injected/docs/message-bridge.md`](../injected/docs/message-bridge.md)** covers:

- Missing messageName debugging
- Message handler registration
- Messaging bridge initialization

## Additional Resources

- **[`injected/docs/features-guide.md`](../injected/docs/features-guide.md)** — Feature development and debugging
- **[`injected/docs/testing-guide.md`](../injected/docs/testing-guide.md)** — Testing and validation approaches
- **[`CONTRIBUTING.md`](../CONTRIBUTING.md)** — Release process and breaking changes protocol
