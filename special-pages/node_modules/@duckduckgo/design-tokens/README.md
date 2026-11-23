# DuckDuckGo Design Tokens

![GitHub Release](https://img.shields.io/github/v/release/duckduckgo/design-tokens?color=8a2be2)

A repo to generate style variables for all the things. But we're starting with static-pages. Tokens act as our single source of truth. They can be transformed and formatted to meet the needs of any platform (Web, Android, iOS, etc). A single change to a property file can be transformed and compiled for consumption by any platform using our tokens.

[Style Dictionary Docs](https://styledictionary.com/reference/api/)

## Table of Contents

- [DuckDuckGo Design Tokens](#duckduckgo-design-tokens)
  - [Table of Contents](#table-of-contents)
  - [Getting started](#getting-started)
  - [What is a Design Token?](#what-is-a-design-token)
  - [Token Types](#token-types)
    - [Option Tokens](#option-tokens)
    - [Semantic Tokens](#semantic-tokens)
    - [Component Tokens](#component-tokens)
  - [Naming Approach](#naming-approach)
    - [Option \& Semantic Tokens](#option--semantic-tokens)
      - [Prefix](#prefix)
    - [Component Tokens](#component-tokens-1)
  - [What surfaces consume this library?](#what-surfaces-consume-this-library)
  - [How to best consume this library](#how-to-best-consume-this-library)
  - [Building \& Updating Browser themes (for macOS, Windows, and Embedded FE)](#building--updating-browser-themes-for-macos-windows-and-embedded-fe)
  - [Release Process](#release-process)

## Getting started

Recommended node version: v24

```bash
npm i

npm run build
```

Then check out what is output to `build` folder

## What is a Design Token?

**Top level answer:** A key-value pair representing a design decision in code.

## Token Types

We have 3 types of tokens that have varying levels of specificity. This increased specificity creates a visible path from design decisions to implementation.

### Option Tokens

These are primitive values represented by context-agnostic names. This token type generally consist of global styles like color, typography and spacing, elevation. These tokens are commonly referenced and inherited by the other 3 token types.

### Semantic Tokens

Semantic tokens have a contextual name that communicates their intended purpose. These types of tokens often inherit option tokens.

Examples

- `ds-color-primary`
- `ds-color-disabled-text-color`
- `ds-color-page-background`

### Component Tokens

These are hyper-specific tokens relating to a single component and its various variants and states. They can inherit option or semantic tokens and have a very specific name to ensure correct usage during component development.

## Naming Approach

### Option & Semantic Tokens

`prefix-property-variant` or `prefix-property-variant-modifier`

**Examples:**
- `ds-color-white`
- `ds-color-mandarin-400`
- `ds-radius-x04`
- `ds-font-family-display`

#### Prefix

The dedicated prefix for our design system values is `ds`

### Component Tokens

`prefix-component-variant-state-property`

These are tokens that can get detailed about specific components like buttons,


<!-- ## Creating Tokens -->

<!-- <incoming> -->

## What surfaces consume this library?
- SERP: DuckDuckGo search engine results page
- Duck.ai: DuckDuckGo's Ai tool
- Marketing pages: Homepage, Hiring, App download pages, Subscription sales pages
- Embedded FE: DuckDuckGo's Mac & Windows desktop browser new tab page, Privacy dashboard

**Coming soon!**
- MacOS DDG browser
- Windows DDG browser

## How to best consume this library
It is recommended to lock to specific version, then update when ready instead of using semver notation like ^.

## Building & Updating Browser themes (for macOS, Windows, and Embedded FE)

The Desktop Browsers' theme colors (`src/properties/embedded-fe/theme.ts`) are automatically generated from an export of the Global Colors & Styles theme in Figma.

To re-generate this file, obtain a Figma JSON export (e.g. `theme-variables.json`) and then run:

```
node scripts/convert-figma-theme-export-to-tokens.ts --input theme-variables.json --output src/properties/embedded-fe/theme.ts
```

## Release Process

1. Update Changelog: As last commit on a branch you intend to merge then release, run the Changelog Claude skill. `/changelog update` will provide a formatted output of all changes to be included. Take a look at this before committing.
1. Navigate to https://github.com/duckduckgo/design-tokens/actions/workflows/release.yml
2. Click _Run workflow_ and type in the version number to release. For example, `0.45.0`. Most releases will be minor. Use patches for experiments for ease of importing & testing.
