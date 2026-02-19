import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClear?: () => void
  selected?: string
  className?: string
}

interface EmojiCategory {
  id: string
  icon: string
  nameEn: string
  nameRu: string
  emojis: string[]
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'recent',
    icon: '🕐',
    nameEn: 'Frequent',
    nameRu: 'Частые',
    emojis: []
  },
  {
    id: 'smileys',
    icon: '😀',
    nameEn: 'Smileys',
    nameRu: 'Смайлы',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
      '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
      '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪',
      '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴',
      '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟',
      '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰',
      '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
      '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
      '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
    ]
  },
  {
    id: 'gestures',
    icon: '👋',
    nameEn: 'Gestures',
    nameRu: 'Жесты',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
      '👀', '👁️', '👅', '👄', '💋', '🧠', '❤️', '🧡', '💛', '💚',
      '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓',
      '💗', '💖', '💘', '💝', '💟'
    ]
  },
  {
    id: 'animals',
    icon: '🐱',
    nameEn: 'Animals',
    nameRu: 'Животные',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖',
      '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬',
      '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘'
    ]
  },
  {
    id: 'food',
    icon: '🍕',
    nameEn: 'Food',
    nameRu: 'Еда',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆',
      '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅',
      '🍄', '🥜', '🫘', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯',
      '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕',
      '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘',
      '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🍱', '🍘', '🍙', '🍚'
    ]
  },
  {
    id: 'objects',
    icon: '💡',
    nameEn: 'Objects',
    nameRu: 'Объекты',
    emojis: [
      '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💾', '💿',
      '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '📞', '☎️', '📟',
      '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰',
      '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯',
      '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎',
      '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚',
      '🔩', '⚙️', '🪤', '🧲', '🔫', '💣', '🧨', '🪓', '🗡️', '⚔️'
    ]
  },
  {
    id: 'symbols',
    icon: '⭐',
    nameEn: 'Symbols',
    nameRu: 'Символы',
    emojis: [
      '⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥', '☀️', '🌈', '🎯',
      '🏷️', '📌', '📍', '🔖', '📎', '🖇️', '📐', '📏', '✂️', '📝',
      '✏️', '🔍', '🔎', '🔐', '🔒', '🔓', '🔑', '🗝️', '❗', '❓',
      '‼️', '⁉️', '❌', '⭕', '🚫', '💯', '✅', '☑️', '✔️', '➕',
      '➖', '➗', '✖️', '♾️', '💲', '⚠️', '♻️', '🔰', '⚜️', '🔱',
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🔴', '🟠', '🟡', '🟢',
      '🔵', '🟣', '🟤', '⚫', '⚪', '🔶', '🔷', '🔸', '🔹', '▪️'
    ]
  },
  {
    id: 'flags',
    icon: '🚀',
    nameEn: 'Travel',
    nameRu: 'Путешествия',
    emojis: [
      '🚀', '✈️', '🚁', '🛸', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇',
      '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐',
      '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🛻',
      '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🛺', '🚲', '🛴', '🛹',
      '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏢', '🏣', '🏤', '🏥', '🏦',
      '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼',
      '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁'
    ]
  }
]

// Search keywords for common emojis
const EMOJI_KEYWORDS: Record<string, string[]> = {
  '🐛': ['bug', 'баг', 'ошибка', 'жук'],
  '✨': ['feature', 'фича', 'новое', 'sparkle', 'звёзд'],
  '🔧': ['fix', 'исправ', 'wrench', 'ключ', 'ремонт'],
  '📝': ['note', 'заметка', 'запис', 'docs', 'документ'],
  '🎨': ['design', 'дизайн', 'art', 'стиль', 'красив'],
  '🚀': ['deploy', 'релиз', 'rocket', 'ракета', 'запуск', 'release'],
  '⚡': ['fast', 'быстр', 'perf', 'производ', 'молния'],
  '🔥': ['hot', 'fire', 'огонь', 'удалить', 'remove'],
  '💡': ['idea', 'идея', 'лампа', 'lamp', 'light'],
  '📌': ['pin', 'закрепить', 'важно', 'important'],
  '🏷️': ['tag', 'метка', 'label', 'тег'],
  '⭐': ['star', 'звезда', 'favorite', 'избранн'],
  '❤️': ['heart', 'сердце', 'love', 'люб'],
  '🎯': ['target', 'цель', 'goal'],
  '🛠️': ['tool', 'инструм', 'build', 'сборка'],
  '🧪': ['test', 'тест', 'lab', 'эксперимент'],
  '📦': ['package', 'пакет', 'box', 'коробка'],
  '🔴': ['red', 'красн', 'stop', 'стоп'],
  '🟢': ['green', 'зелен', 'go', 'ок'],
  '🟡': ['yellow', 'жёлт', 'warn', 'предупр'],
  '🔵': ['blue', 'голуб', 'син'],
  '🟣': ['purple', 'фиолет'],
  '💀': ['dead', 'мертв', 'skull', 'череп', 'critical', 'критич'],
  '🤖': ['robot', 'робот', 'bot', 'бот', 'ai'],
  '✅': ['done', 'готово', 'check', 'complete', 'выполн'],
  '❌': ['no', 'нет', 'cancel', 'отмена', 'cross', 'крест'],
  '⚠️': ['warning', 'предупр', 'alert', 'внимание', 'danger', 'опасн'],
  '🔒': ['lock', 'замок', 'secure', 'безопасн', 'закрыт'],
  '🔑': ['key', 'ключ', 'auth', 'авторизац', 'пароль', 'password'],
  '💻': ['computer', 'компьютер', 'code', 'код', 'dev'],
  '📱': ['phone', 'телефон', 'mobile', 'мобил'],
  '🏠': ['home', 'дом', 'house'],
  '💰': ['money', 'деньги', 'финанс', 'finance', 'бюджет', 'budget'],
  '📅': ['calendar', 'календарь', 'дата', 'date', 'schedule'],
  '🔍': ['search', 'поиск', 'find', 'найти'],
  '💬': ['chat', 'чат', 'message', 'сообщ', 'comment', 'коммент'],
  '📊': ['chart', 'график', 'stats', 'статист', 'data', 'данные'],
  '🎉': ['party', 'праздник', 'celebrate', 'celebr', 'поздрав'],
  '👍': ['like', 'лайк', 'thumb', 'хорош', 'good', 'ok'],
  '👎': ['dislike', 'дизлайк', 'bad', 'плох'],
  '💪': ['strong', 'сил', 'muscle', 'мускул', 'power'],
  '🏁': ['finish', 'финиш', 'end', 'конец', 'flag', 'флаг'],
  '🚩': ['flag', 'флаг', 'red flag', 'проблем'],
}

const RECENT_KEY = 'flowzik-recent-emojis'

function getRecentEmojis(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentEmoji(emoji: string) {
  try {
    const recent = getRecentEmojis().filter((e) => e !== emoji)
    recent.unshift(emoji)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 24)))
  } catch { /* ignore */ }
}

export function EmojiPicker({ onSelect, onClear, selected, className }: EmojiPickerProps) {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('smileys')
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const recentEmojis = useMemo(() => getRecentEmojis(), [])

  const categories = useMemo(() => {
    const cats = [...EMOJI_CATEGORIES]
    cats[0] = { ...cats[0], emojis: recentEmojis }
    return cats
  }, [recentEmojis])

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const results: string[] = []
    const seen = new Set<string>()

    // Search in keywords
    for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
      if (keywords.some((kw) => kw.includes(q)) || emoji.includes(q)) {
        if (!seen.has(emoji)) {
          seen.add(emoji)
          results.push(emoji)
        }
      }
    }

    // Search in all categories
    for (const cat of EMOJI_CATEGORIES) {
      for (const emoji of cat.emojis) {
        if (!seen.has(emoji)) {
          seen.add(emoji)
          // Simple character match
          if (emoji.includes(q)) {
            results.push(emoji)
          }
        }
      }
    }

    return results
  }, [search])

  const handleSelect = (emoji: string) => {
    saveRecentEmoji(emoji)
    onSelect(emoji)
  }

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const activeCat = categories.find((c) => c.id === activeCategory)

  return (
    <div className={cn('w-[280px] bg-surface-elevated border border-border rounded-lg shadow-xl overflow-hidden', className)}>
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-1.5 bg-surface-tertiary rounded-md px-2">
          <Search size={13} className="text-content-tertiary shrink-0" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск эмодзи...' : 'Search emoji...'}
            className="flex-1 h-7 bg-transparent text-xs text-content-primary placeholder:text-content-tertiary outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-content-tertiary hover:text-content-primary">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex border-b border-border px-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex-1 py-1.5 text-center text-sm hover:bg-surface-tertiary transition-colors rounded-t',
                activeCategory === cat.id && 'bg-surface-tertiary'
              )}
              title={lang === 'ru' ? cat.nameRu : cat.nameEn}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div ref={gridRef} className="h-[200px] overflow-y-auto p-2">
        {search ? (
          <>
            {searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-8 gap-0.5">
                {searchResults.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelect(emoji)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center text-base rounded hover:bg-surface-tertiary transition-colors',
                      selected === emoji && 'bg-accent/20 ring-1 ring-accent'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-content-tertiary">
                {lang === 'ru' ? 'Ничего не найдено' : 'No results'}
              </div>
            )}
          </>
        ) : (
          <>
            {activeCat && activeCat.emojis.length > 0 ? (
              <>
                <div className="text-[10px] text-content-tertiary uppercase tracking-wider mb-1 px-1">
                  {lang === 'ru' ? activeCat.nameRu : activeCat.nameEn}
                </div>
                <div className="grid grid-cols-8 gap-0.5">
                  {activeCat.emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => handleSelect(emoji)}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center text-base rounded hover:bg-surface-tertiary transition-colors hover:scale-110',
                        selected === emoji && 'bg-accent/20 ring-1 ring-accent'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-content-tertiary">
                {lang === 'ru' ? 'Нет недавних эмодзи' : 'No recent emojis'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: clear button */}
      {onClear && (
        <div className="border-t border-border p-1.5 flex justify-between items-center">
          <button
            onClick={onClear}
            className="text-xs text-content-tertiary hover:text-content-primary transition-colors px-2 py-1 rounded hover:bg-surface-tertiary"
          >
            {lang === 'ru' ? 'Без эмодзи' : 'No emoji'}
          </button>
          {selected && (
            <span className="text-sm">{selected}</span>
          )}
        </div>
      )}
    </div>
  )
}
