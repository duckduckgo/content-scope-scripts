# TypeScript Type Generation from JSON Schemas

This project provides a set of scripts to automatically generate TypeScript types from JSON Schema files. It supports generating types for two main purposes: `settings` and `messages`. These types are designed to integrate smoothly with features such as `@duckduckgo/messaging`, and ensure consistency across different schema definitions.

## How It Works

The script reads a configuration of mappings, which defines the schemas and output locations for each feature, and generates the corresponding TypeScript types.

### Mappings

The script uses two kinds of mappings:
- `SettingsKind`: Handles schemas that represent settings and outputs the generated TypeScript types to the specified file.
- `MessagesKind`: Handles schemas for messages, including creating TypeScript types that integrate with the `@duckduckgo/messaging` library.

Each mapping specifies:
- The paths to the schema files.
- The output location for the generated TypeScript files.
- Platform-specific exclusions where needed

### Example Usage

The script processes a `mapping` object where each entry represents a feature, such as:

```js
import { buildTypes } from "../types-generator/build-types.mjs";

const config = {
  "featureName": {
    "schema": "path/to/schema.json",
    "types": "path/to/output/types.d.ts",
    "kind": "settings"
  }
}

// this will write directly to disk.
buildTypes(config)
```

For messaging schemas, additional options like `resolve` and `className` functions are used to manage how paths and class names are structured in the output.

> [!NOTE]
> The script is designed to **fail fast**. Errors are intentionally not caught to ensure proper debugging and visibility into any issues during type generation.

> [!NOTE] 
> Do not manually edit the generated TypeScript files
> These are regenerated from schema files, and any manual changes will be overwritten the next time the script runs.

