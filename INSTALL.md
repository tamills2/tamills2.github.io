# Smart Character Inspector tooltip positioning

Replace:

```text
public/tools/character-inspector/tool.css
public/tools/character-inspector/tool.js
```

The tooltip now measures its real viewport position whenever a character is
hovered or focused. It remains centered normally, shifts right only when it
would cross the left edge, and shifts left only when it would cross the right
edge. This works independently for every character on every wrapped line.
