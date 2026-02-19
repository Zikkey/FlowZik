# FlowZik

Desktop Kanban board for personal task management. Built with Electron, React, TypeScript, Tailwind CSS, and Zustand.

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)
![Electron](https://img.shields.io/badge/Electron-40-47848F)

## Features

- **Kanban boards** — drag & drop columns and cards, multiple boards
- **Card details** — labels, priorities, due dates, subtasks, checklists, comments, file attachments, cover images
- **Board views** — kanban, table, timeline, heatmap
- **Dashboard** — overdue, today, and upcoming cards at a glance
- **Search** — global search (`Ctrl+K`) and quick add (`Ctrl+Q`)
- **Archive** — soft-delete with restore or permanent removal
- **Templates & automations** — board templates and rule-based automations
- **Sticky notes** — per-board quick notes
- **Themes** — dark / light / system with accent color presets
- **Localization** — Russian and English
- **Import / Export** — JSON, CSV, PDF
- **Keyboard shortcuts** — full keyboard navigation and multi-card selection
- **UI sounds & notifications** — optional sound effects and due date reminders
- **Zoom control** — adjustable UI scale

## Download

Go to [Releases](https://github.com/Zikkey/FlowZik/releases) and download the latest `FlowZik-*-win-portable.zip`.

Unzip and run `FlowZik.exe` — no installation needed.

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build distributable
npm run pack
```

Output goes to `dist/win-unpacked/`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 40 |
| UI | React 18, Tailwind CSS 3 |
| State | Zustand + zundo (undo/redo) |
| DnD | dnd-kit |
| Build | electron-vite, electron-builder |
| Language | TypeScript |

## License

MIT
