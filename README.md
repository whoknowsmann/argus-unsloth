# Argus Vault (MVP)

A local-first, Obsidian-like markdown vault app built with Electron + React + TypeScript. It provides fast vault browsing, live preview, wikilinks, tabs, backlinks, and global search.

## Install & Run

```bash
npm install
npm run dev
```

## Architecture Overview

- **Electron main process**: Owns filesystem access, vault settings persistence, file watching, and search/backlink indexing.
- **Preload bridge**: Exposes a minimal, typed API to the renderer for safe IPC.
- **React renderer**: Renders the UI (file tree, tabs, editor/preview, search, backlinks) and handles user interaction.

## Key Design Decisions

- **Local-only**: All file operations happen locally via Electron IPC; no network or cloud dependencies.
- **Search indexing in main**: `MiniSearch` indexes title/content for fast global search without freezing the UI.
- **Simple wikilink support**: `[[Note]]` and `[[Note|Alias]]` are converted to clickable links in preview.
- **Autosave by default**: Debounced writes keep edits safe without a manual save button.

## Command Palette + Quick Switcher

Open the command palette with **Ctrl/Cmd + P**. From there you can:

- **Open Note**: fuzzy-search note titles and press Enter to open.
- **Create Note**: type a new title and press Enter to create in the vault root or last-used folder.
- **Toggle Preview** / **Toggle Split View**.
- **Open Daily Note**: opens today’s note (creates it if missing).

While the palette is open, use ↑/↓ to navigate results and **Esc** to close.

## Known Limitations

- Callouts are basic and only detect `> [!TYPE]`-style blockquotes.
- File rename updates the filesystem, but open tabs may keep their old title until reopened.
- No drag-and-drop reordering in the file tree.

## Next Steps

- Graph view for backlinks.
- Smarter conflict handling if files are edited externally.
