export const BOARD_ICONS = [
  'layout-dashboard', 'kanban', 'list-todo', 'clipboard-list', 'target',
  'rocket', 'zap', 'flame', 'star', 'heart',
  'trophy', 'medal', 'crown', 'gem', 'sparkles',
  'code-2', 'terminal', 'bug', 'cpu', 'database',
  'globe', 'compass', 'map', 'navigation', 'send',
  'briefcase', 'building-2', 'calendar', 'clock', 'timer',
  'users', 'user-check', 'graduation-cap', 'book-open', 'bookmark',
  'music', 'palette', 'camera', 'film', 'gamepad-2',
  'shopping-cart', 'package', 'truck', 'plane', 'anchor',
  'shield-check', 'lock', 'key', 'settings', 'wrench',
  'lightbulb', 'megaphone', 'bell', 'flag', 'tag',
  'folder', 'file-text', 'inbox', 'mail', 'message-circle',
  'home', 'mountain', 'sun', 'moon', 'cloud',
  'tree-pine', 'flower-2', 'paw-print', 'fish', 'bird',
  'pizza', 'coffee', 'wine', 'apple', 'cherry'
] as const

export type BoardIconName = (typeof BOARD_ICONS)[number]
