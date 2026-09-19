# `@workspace/ui`

This package provides reusable UI components, hooks, styles and utilities for building consistent interfaces. It exposes a single styling entrypoint in `src/styles/globals.css` and uses semantic design tokens so visuals stay coherent across apps.

## Design System Contract

### Token layers

- **Reference tokens**: raw brand/foundation values internal to the package.
- **Semantic tokens**: shared intent-driven tokens such as `background`, `foreground`, `primary`, `muted`, `border`, `success`, `warning`, `info`, `display`.
- **Component tokens**: narrowly scoped tokens for stable extension points such as control height, card padding, sidebar width and pricing highlight treatment.

Consumers should rely on semantic tokens and exported component variants. Reference tokens are private implementation details.

### Styling rules

Allowed patterns:

- Tailwind utility classes that consume semantic tokens such as `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`.
- Component tokens via CSS variables when a primitive needs a stable extension point, for example `var(--control-height-sm)`.
- PrimeReact pass-through classes only when they map back to the same token contract.

Banned patterns inside `packages/ui`:

- Raw palette classes such as `bg-white`, `text-neutral-*`, `border-neutral-*`.
- Inline visual styles like `style={{ backgroundColor: ... }}`.
- Hex, `rgb()`, or ad hoc color literals in exported components.
- One-off font-family declarations in component markup.
- Arbitrary shadow literals for brand visuals.

### Adding tokens

1. Add or adjust the foundation value in `src/styles/tokens.css`.
2. Map it through the semantic contract in the same file.
3. Expose it through `@theme inline` only if Tailwind utilities must consume it.
4. Use a component token only when the value is a reusable component contract, not a one-off visual fix.

### Review checklist

- Uses semantic tokens only.
- Supports light and dark mode.
- Hover, focus, active, disabled and error states are covered.
- No consumer-specific selectors were introduced into the shared package.
- PrimeReact overrides are scoped to `src/styles/vendor/primereact.css`.

## Resources

- **Components**: forms, layout, overlay, feedback, dashboard and pricing primitives.
- **Hooks**: `useLocalStorage`, `useDebounce`, `useToggle`, `useClickOutside`, `useMediaQuery`, `useMounted`, `useCallbackRef`, `useToast`.
- **Themes**: token layers and vendor overrides in `src/styles/`.
- **Utilities**: `cn()` and `toast` helpers.

## Installation

Internal monorepo package. To use it in another package:

```json
{
  "dependencies": {
    "@workspace/ui": "workspace:*"
  }
}
```

Import the public stylesheet once in the consumer app:

```ts
import '@workspace/ui/styles/globals.css';
```

## Usage

```tsx
import { Button, Card, Input } from '@workspace/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Email" />
      <Button className="mt-4">Save</Button>
    </Card>
  );
}
```

For tree-shaking, use subpath exports such as `@workspace/ui/button`, `@workspace/ui/card`, and `@workspace/ui/styles/globals.css`.
