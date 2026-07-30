# Navigation collapse-state fix

Replace:

```text
public/js/main.js
public/js/tool-base.js
```

Behavior after this update:

- Clicking **Repo** returns to the homepage with Notes collapsed.
- Opening any tool starts with Notes collapsed.
- Choosing another tool also preserves the collapsed state.
- Moving from one note to another preserves the current Notes open/collapsed state.
- Opening a note from an already-open tool sidebar preserves that open state on the note page.
