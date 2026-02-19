import type { Priority, Label } from '@/types'

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string; borderColor: string }> = {
  none: { label: 'None', color: 'text-content-tertiary', bgColor: 'bg-transparent', borderColor: 'transparent' },
  low: { label: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: '#3b82f6' },
  medium: { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: '#eab308' },
  high: { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: '#f97316' },
  urgent: { label: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: '#ef4444' }
}

export const COLUMN_COLORS: (string | null)[] = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#14b8a6', '#a855f7', '#f43f5e',
  '#0ea5e9', '#84cc16', '#d946ef', '#f59e0b',
  '#10b981', '#6366f1', '#e11d48', '#0891b2',
  null
]

export const DEFAULT_LABELS: Label[] = [
  { id: 'label-1', name: 'Bug', color: '#ef4444' },
  { id: 'label-2', name: 'Feature', color: '#3b82f6' },
  { id: 'label-3', name: 'Improvement', color: '#8b5cf6' },
  { id: 'label-4', name: 'Documentation', color: '#06b6d4' },
  { id: 'label-5', name: 'Design', color: '#ec4899' },
  { id: 'label-6', name: 'Testing', color: '#22c55e' }
]

export const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6366f1', '#14b8a6', '#84cc16', '#a855f7'
]

export const COMMON_EMOJIS = [
  '🐛', '✨', '🔧', '📝', '🎨', '🚀', '⚡', '🔥',
  '💡', '📌', '🏷️', '⭐', '❤️', '🟢', '🔴', '🟡',
  '🔵', '🟣', '⬛', '🏠', '📦', '🧪', '🎯', '🛠️'
]

export interface AccentColorDef {
  name: string
  label: string
  light: { accent: string; hover: string; subtle: string }
  dark: { accent: string; hover: string; subtle: string }
}

export const ACCENT_COLORS: AccentColorDef[] = [
  { name: 'indigo', label: 'Indigo', light: { accent: '99 102 241', hover: '79 70 229', subtle: '238 242 255' }, dark: { accent: '129 140 248', hover: '165 180 252', subtle: '30 27 75' } },
  { name: 'blue', label: 'Blue', light: { accent: '59 130 246', hover: '37 99 235', subtle: '219 234 254' }, dark: { accent: '96 165 250', hover: '147 197 253', subtle: '23 37 84' } },
  { name: 'violet', label: 'Violet', light: { accent: '139 92 246', hover: '124 58 237', subtle: '237 233 254' }, dark: { accent: '167 139 250', hover: '196 181 253', subtle: '46 16 101' } },
  { name: 'pink', label: 'Pink', light: { accent: '236 72 153', hover: '219 39 119', subtle: '253 242 248' }, dark: { accent: '244 114 182', hover: '249 168 212', subtle: '80 7 36' } },
  { name: 'rose', label: 'Rose', light: { accent: '244 63 94', hover: '225 29 72', subtle: '255 228 230' }, dark: { accent: '251 113 133', hover: '253 164 175', subtle: '76 5 25' } },
  { name: 'emerald', label: 'Emerald', light: { accent: '16 185 129', hover: '5 150 105', subtle: '209 250 229' }, dark: { accent: '52 211 153', hover: '110 231 183', subtle: '6 78 59' } },
  { name: 'teal', label: 'Teal', light: { accent: '20 184 166', hover: '13 148 136', subtle: '204 251 241' }, dark: { accent: '45 212 191', hover: '94 234 212', subtle: '13 80 73' } },
  { name: 'amber', label: 'Amber', light: { accent: '245 158 11', hover: '217 119 6', subtle: '254 243 199' }, dark: { accent: '251 191 36', hover: '252 211 77', subtle: '69 26 3' } },
  { name: 'orange', label: 'Orange', light: { accent: '249 115 22', hover: '234 88 12', subtle: '255 237 213' }, dark: { accent: '251 146 60', hover: '253 186 116', subtle: '67 20 7' } },
  { name: 'slate', label: 'Slate', light: { accent: '100 116 139', hover: '71 85 105', subtle: '241 245 249' }, dark: { accent: '148 163 184', hover: '203 213 225', subtle: '15 23 42' } },
  { name: 'cyan', label: 'Cyan', light: { accent: '6 182 212', hover: '8 145 178', subtle: '207 250 254' }, dark: { accent: '34 211 238', hover: '103 232 249', subtle: '8 51 68' } },
  { name: 'lime', label: 'Lime', light: { accent: '132 204 22', hover: '101 163 13', subtle: '236 252 203' }, dark: { accent: '163 230 53', hover: '190 242 100', subtle: '26 46 5' } },
  { name: 'fuchsia', label: 'Fuchsia', light: { accent: '192 38 211', hover: '162 28 175', subtle: '250 232 255' }, dark: { accent: '217 70 239', hover: '232 121 249', subtle: '74 4 78' } },
  { name: 'red', label: 'Red', light: { accent: '239 68 68', hover: '220 38 38', subtle: '254 226 226' }, dark: { accent: '248 113 113', hover: '252 165 165', subtle: '69 10 10' } },
  { name: 'yellow', label: 'Yellow', light: { accent: '234 179 8', hover: '202 138 4', subtle: '254 249 195' }, dark: { accent: '250 204 21', hover: '253 224 71', subtle: '66 32 6' } },
]

// Dark theme color presets — override all surface/text/border CSS variables
export interface ThemePresetDef {
  name: string
  label: string
  labelRu: string
  preview: string // small color swatch hex
  vars: {
    bgPrimary: string
    bgSecondary: string
    bgTertiary: string
    bgElevated: string
    textPrimary: string
    textSecondary: string
    textTertiary: string
    borderColor: string
    borderHover: string
  }
}

export const DARK_THEME_PRESETS: ThemePresetDef[] = [
  {
    name: 'default', label: 'Default Dark', labelRu: 'Стандартная', preview: '#111115',
    vars: {
      bgPrimary: '17 17 21', bgSecondary: '24 24 30', bgTertiary: '32 33 40', bgElevated: '39 40 48',
      textPrimary: '243 244 246', textSecondary: '156 163 175', textTertiary: '107 114 128',
      borderColor: '55 56 66', borderHover: '75 76 88'
    }
  },
  {
    name: 'amoled', label: 'AMOLED Black', labelRu: 'AMOLED', preview: '#000000',
    vars: {
      bgPrimary: '0 0 0', bgSecondary: '10 10 10', bgTertiary: '20 20 20', bgElevated: '28 28 28',
      textPrimary: '245 245 245', textSecondary: '160 160 160', textTertiary: '100 100 100',
      borderColor: '38 38 38', borderHover: '55 55 55'
    }
  },
  {
    name: 'midnight', label: 'Midnight Blue', labelRu: 'Полуночный', preview: '#0d1117',
    vars: {
      bgPrimary: '13 17 23', bgSecondary: '22 27 34', bgTertiary: '33 38 45', bgElevated: '45 50 58',
      textPrimary: '230 237 243', textSecondary: '139 148 158', textTertiary: '110 118 129',
      borderColor: '48 54 61', borderHover: '68 76 86'
    }
  },
  {
    name: 'warm', label: 'Warm Dark', labelRu: 'Тёплая', preview: '#1a1614',
    vars: {
      bgPrimary: '26 22 20', bgSecondary: '35 30 27', bgTertiary: '45 39 35', bgElevated: '55 48 43',
      textPrimary: '240 235 230', textSecondary: '170 160 150', textTertiary: '120 112 105',
      borderColor: '65 58 52', borderHover: '85 76 68'
    }
  },
  {
    name: 'forest', label: 'Forest', labelRu: 'Лесная', preview: '#0f1a14',
    vars: {
      bgPrimary: '15 26 20', bgSecondary: '20 33 26', bgTertiary: '28 42 34', bgElevated: '35 52 42',
      textPrimary: '220 240 230', textSecondary: '140 170 155', textTertiary: '100 130 115',
      borderColor: '45 62 52', borderHover: '60 80 68'
    }
  },
  {
    name: 'ocean', label: 'Ocean', labelRu: 'Океан', preview: '#0a1628',
    vars: {
      bgPrimary: '10 22 40', bgSecondary: '16 30 52', bgTertiary: '24 40 65', bgElevated: '32 50 78',
      textPrimary: '220 230 245', textSecondary: '140 158 185', textTertiary: '95 112 140',
      borderColor: '40 55 80', borderHover: '55 72 100'
    }
  },
  {
    name: 'plum', label: 'Plum', labelRu: 'Сливовая', preview: '#1a0f20',
    vars: {
      bgPrimary: '26 15 32', bgSecondary: '35 22 42', bgTertiary: '45 30 55', bgElevated: '55 38 68',
      textPrimary: '238 228 245', textSecondary: '165 145 180', textTertiary: '120 105 135',
      borderColor: '60 45 72', borderHover: '80 62 95'
    }
  },
  {
    name: 'nord', label: 'Nord', labelRu: 'Nord', preview: '#2e3440',
    vars: {
      bgPrimary: '46 52 64', bgSecondary: '59 66 82', bgTertiary: '67 76 94', bgElevated: '76 86 106',
      textPrimary: '236 239 244', textSecondary: '216 222 233', textTertiary: '143 150 168',
      borderColor: '76 86 106', borderHover: '94 105 126'
    }
  },
  {
    name: 'dracula', label: 'Dracula', labelRu: 'Dracula', preview: '#282a36',
    vars: {
      bgPrimary: '40 42 54', bgSecondary: '49 51 65', bgTertiary: '60 62 78', bgElevated: '68 71 90',
      textPrimary: '248 248 242', textSecondary: '189 147 249', textTertiary: '98 114 164',
      borderColor: '68 71 90', borderHover: '85 88 110'
    }
  },
  {
    name: 'monokai', label: 'Monokai', labelRu: 'Monokai', preview: '#272822',
    vars: {
      bgPrimary: '39 40 34', bgSecondary: '48 49 42', bgTertiary: '58 59 52', bgElevated: '66 67 60',
      textPrimary: '248 248 242', textSecondary: '190 190 178', textTertiary: '117 113 94',
      borderColor: '68 69 60', borderHover: '85 86 76'
    }
  },
  {
    name: 'solarized', label: 'Solarized Dark', labelRu: 'Solarized', preview: '#002b36',
    vars: {
      bgPrimary: '0 43 54', bgSecondary: '7 54 66', bgTertiary: '17 64 76', bgElevated: '27 74 86',
      textPrimary: '253 246 227', textSecondary: '147 161 161', textTertiary: '101 123 131',
      borderColor: '37 74 86', borderHover: '55 92 104'
    }
  },
  {
    name: 'gruvbox', label: 'Gruvbox', labelRu: 'Gruvbox', preview: '#282828',
    vars: {
      bgPrimary: '40 40 40', bgSecondary: '50 48 47', bgTertiary: '60 56 54', bgElevated: '80 73 69',
      textPrimary: '251 241 199', textSecondary: '213 196 161', textTertiary: '146 131 116',
      borderColor: '80 73 69', borderHover: '102 92 84'
    }
  },
  {
    name: 'catppuccin', label: 'Catppuccin Mocha', labelRu: 'Catppuccin', preview: '#1e1e2e',
    vars: {
      bgPrimary: '30 30 46', bgSecondary: '24 24 37', bgTertiary: '49 50 68', bgElevated: '69 71 90',
      textPrimary: '205 214 244', textSecondary: '166 173 200', textTertiary: '127 132 156',
      borderColor: '69 71 90', borderHover: '88 91 112'
    }
  },
  {
    name: 'one-dark', label: 'One Dark', labelRu: 'One Dark', preview: '#282c34',
    vars: {
      bgPrimary: '40 44 52', bgSecondary: '33 37 43', bgTertiary: '50 54 62', bgElevated: '55 59 69',
      textPrimary: '171 178 191', textSecondary: '152 159 172', textTertiary: '92 99 112',
      borderColor: '60 64 72', borderHover: '78 82 92'
    }
  },
  {
    name: 'tokyo-night', label: 'Tokyo Night', labelRu: 'Tokyo Night', preview: '#1a1b26',
    vars: {
      bgPrimary: '26 27 38', bgSecondary: '22 22 30', bgTertiary: '41 46 66', bgElevated: '52 59 88',
      textPrimary: '169 177 214', textSecondary: '130 137 170', textTertiary: '86 95 137',
      borderColor: '41 46 66', borderHover: '59 66 97'
    }
  },
  {
    name: 'kanagawa', label: 'Kanagawa', labelRu: 'Kanagawa', preview: '#1f1f28',
    vars: {
      bgPrimary: '31 31 40', bgSecondary: '22 22 29', bgTertiary: '43 43 55', bgElevated: '54 54 70',
      textPrimary: '220 215 186', textSecondary: '195 186 151', textTertiary: '130 125 107',
      borderColor: '54 54 70', borderHover: '72 72 90'
    }
  },
  {
    name: 'rose-pine', label: 'Rosé Pine', labelRu: 'Rosé Pine', preview: '#191724',
    vars: {
      bgPrimary: '25 23 36', bgSecondary: '30 28 42', bgTertiary: '38 35 53', bgElevated: '57 53 82',
      textPrimary: '224 222 244', textSecondary: '144 140 170', textTertiary: '110 106 134',
      borderColor: '57 53 82', borderHover: '78 72 108'
    }
  },
  {
    name: 'cyberpunk', label: 'Cyberpunk', labelRu: 'Киберпанк', preview: '#0a0a18',
    vars: {
      bgPrimary: '10 10 24', bgSecondary: '16 14 35', bgTertiary: '25 20 50', bgElevated: '32 28 62',
      textPrimary: '0 255 200', textSecondary: '180 120 255', textTertiary: '100 70 180',
      borderColor: '50 30 90', borderHover: '80 50 140'
    }
  },
  {
    name: 'sunset', label: 'Sunset', labelRu: 'Закат', preview: '#1a0e1e',
    vars: {
      bgPrimary: '26 14 30', bgSecondary: '36 18 35', bgTertiary: '50 25 42', bgElevated: '62 32 52',
      textPrimary: '255 220 200', textSecondary: '220 150 130', textTertiary: '160 100 90',
      borderColor: '75 40 58', borderHover: '100 55 75'
    }
  },
  {
    name: 'aurora', label: 'Aurora', labelRu: 'Аврора', preview: '#08101a',
    vars: {
      bgPrimary: '8 16 26', bgSecondary: '12 24 38', bgTertiary: '18 35 52', bgElevated: '25 45 65',
      textPrimary: '180 240 220', textSecondary: '100 200 170', textTertiary: '60 140 120',
      borderColor: '30 55 72', borderHover: '45 75 95'
    }
  },
  {
    name: 'volcanic', label: 'Volcanic', labelRu: 'Вулканическая', preview: '#1a0a0a',
    vars: {
      bgPrimary: '26 10 10', bgSecondary: '35 14 12', bgTertiary: '48 20 18', bgElevated: '60 28 24',
      textPrimary: '255 210 190', textSecondary: '200 130 100', textTertiary: '150 90 70',
      borderColor: '72 35 30', borderHover: '95 48 40'
    }
  },
  {
    name: 'matrix', label: 'Matrix', labelRu: 'Матрица', preview: '#020e02',
    vars: {
      bgPrimary: '2 14 2', bgSecondary: '5 22 5', bgTertiary: '10 32 10', bgElevated: '15 42 15',
      textPrimary: '0 230 60', textSecondary: '0 170 45', textTertiary: '0 110 30',
      borderColor: '0 50 12', borderHover: '0 75 20'
    }
  },
  {
    name: 'arctic', label: 'Arctic', labelRu: 'Арктическая', preview: '#0c1420',
    vars: {
      bgPrimary: '12 20 32', bgSecondary: '18 28 44', bgTertiary: '26 38 58', bgElevated: '34 48 72',
      textPrimary: '210 230 250', textSecondary: '150 175 210', textTertiary: '95 120 160',
      borderColor: '40 56 82', borderHover: '55 75 108'
    }
  },
  {
    name: 'cherry', label: 'Cherry Blossom', labelRu: 'Сакура', preview: '#1a0f18',
    vars: {
      bgPrimary: '26 15 24', bgSecondary: '35 22 32', bgTertiary: '48 30 44', bgElevated: '60 38 55',
      textPrimary: '255 210 230', textSecondary: '200 140 170', textTertiary: '145 95 125',
      borderColor: '70 42 62', borderHover: '92 58 82'
    }
  },
  {
    name: 'copper', label: 'Copper', labelRu: 'Медная', preview: '#181210',
    vars: {
      bgPrimary: '24 18 16', bgSecondary: '34 26 22', bgTertiary: '46 36 30', bgElevated: '58 46 38',
      textPrimary: '240 220 200', textSecondary: '200 168 140', textTertiary: '150 120 100',
      borderColor: '68 54 44', borderHover: '88 72 60'
    }
  },
  {
    name: 'nebula', label: 'Nebula', labelRu: 'Туманность', preview: '#0e0818',
    vars: {
      bgPrimary: '14 8 24', bgSecondary: '22 14 38', bgTertiary: '32 22 52', bgElevated: '44 30 68',
      textPrimary: '220 210 255', textSecondary: '160 140 220', textTertiary: '110 95 165',
      borderColor: '52 38 78', borderHover: '72 55 105'
    }
  },
]

export const LIGHT_THEME_PRESETS: ThemePresetDef[] = [
  {
    name: 'default', label: 'Default Light', labelRu: 'Стандартная', preview: '#ffffff',
    vars: {
      bgPrimary: '255 255 255', bgSecondary: '248 249 250', bgTertiary: '241 243 245', bgElevated: '255 255 255',
      textPrimary: '17 24 39', textSecondary: '107 114 128', textTertiary: '156 163 175',
      borderColor: '229 231 235', borderHover: '209 213 219'
    }
  },
  {
    name: 'warm-light', label: 'Warm Light', labelRu: 'Тёплая светлая', preview: '#faf8f5',
    vars: {
      bgPrimary: '250 248 245', bgSecondary: '244 240 235', bgTertiary: '235 230 222', bgElevated: '252 250 248',
      textPrimary: '40 30 20', textSecondary: '110 100 88', textTertiary: '155 145 135',
      borderColor: '220 212 200', borderHover: '200 190 178'
    }
  },
  {
    name: 'cool-light', label: 'Cool Light', labelRu: 'Прохладная', preview: '#f0f4f8',
    vars: {
      bgPrimary: '240 244 248', bgSecondary: '232 238 244', bgTertiary: '222 230 240', bgElevated: '245 248 252',
      textPrimary: '20 30 48', textSecondary: '80 95 120', textTertiary: '130 145 165',
      borderColor: '210 218 230', borderHover: '188 198 215'
    }
  },
  {
    name: 'paper', label: 'Paper', labelRu: 'Бумажная', preview: '#f8f5f0',
    vars: {
      bgPrimary: '248 245 240', bgSecondary: '240 236 228', bgTertiary: '230 224 214', bgElevated: '252 250 246',
      textPrimary: '50 42 35', textSecondary: '105 95 82', textTertiary: '155 145 132',
      borderColor: '218 210 198', borderHover: '198 188 175'
    }
  },
  {
    name: 'sepia', label: 'Sepia', labelRu: 'Сепия', preview: '#f4ecd8',
    vars: {
      bgPrimary: '244 236 216', bgSecondary: '236 226 204', bgTertiary: '225 214 190', bgElevated: '248 242 225',
      textPrimary: '60 48 30', textSecondary: '110 95 70', textTertiary: '150 135 115',
      borderColor: '210 198 175', borderHover: '190 178 155'
    }
  },
  {
    name: 'mint', label: 'Mint', labelRu: 'Мятная', preview: '#f0faf5',
    vars: {
      bgPrimary: '240 250 245', bgSecondary: '228 242 235', bgTertiary: '215 232 224', bgElevated: '245 252 248',
      textPrimary: '15 40 30', textSecondary: '60 100 80', textTertiary: '110 145 130',
      borderColor: '200 220 210', borderHover: '180 202 192'
    }
  },
  {
    name: 'sky', label: 'Sky', labelRu: 'Небесная', preview: '#edf5ff',
    vars: {
      bgPrimary: '237 245 255', bgSecondary: '225 236 250', bgTertiary: '212 225 242', bgElevated: '242 248 255',
      textPrimary: '15 30 55', textSecondary: '60 85 125', textTertiary: '110 135 170',
      borderColor: '198 215 238', borderHover: '178 198 225'
    }
  },
  {
    name: 'catppuccin-latte', label: 'Catppuccin Latte', labelRu: 'Catppuccin Latte', preview: '#eff1f5',
    vars: {
      bgPrimary: '239 241 245', bgSecondary: '230 233 239', bgTertiary: '220 224 232', bgElevated: '244 246 250',
      textPrimary: '76 79 105', textSecondary: '108 111 133', textTertiary: '140 143 161',
      borderColor: '204 208 218', borderHover: '188 192 204'
    }
  },
  {
    name: 'one-light', label: 'One Light', labelRu: 'One Light', preview: '#fafafa',
    vars: {
      bgPrimary: '250 250 250', bgSecondary: '240 240 240', bgTertiary: '228 228 228', bgElevated: '255 255 255',
      textPrimary: '56 58 66', textSecondary: '80 83 95', textTertiary: '135 138 150',
      borderColor: '218 220 225', borderHover: '195 198 205'
    }
  },
  {
    name: 'solarized-light', label: 'Solarized Light', labelRu: 'Solarized Light', preview: '#fdf6e3',
    vars: {
      bgPrimary: '253 246 227', bgSecondary: '238 232 213', bgTertiary: '224 222 204', bgElevated: '255 250 235',
      textPrimary: '40 62 62', textSecondary: '88 110 117', textTertiary: '131 148 150',
      borderColor: '214 208 190', borderHover: '195 188 168'
    }
  },
  {
    name: 'rose-pine-dawn', label: 'Rosé Pine Dawn', labelRu: 'Rosé Pine Dawn', preview: '#faf4ed',
    vars: {
      bgPrimary: '250 244 237', bgSecondary: '242 233 222', bgTertiary: '232 222 210', bgElevated: '255 250 245',
      textPrimary: '87 82 121', textSecondary: '121 117 147', textTertiary: '152 147 165',
      borderColor: '218 210 198', borderHover: '198 190 178'
    }
  },
  {
    name: 'nord-light', label: 'Nord Light', labelRu: 'Nord Light', preview: '#eceff4',
    vars: {
      bgPrimary: '236 239 244', bgSecondary: '229 233 240', bgTertiary: '216 222 233', bgElevated: '242 244 248',
      textPrimary: '46 52 64', textSecondary: '76 86 106', textTertiary: '122 130 148',
      borderColor: '210 216 228', borderHover: '192 200 216'
    }
  },
  {
    name: 'lavender', label: 'Lavender', labelRu: 'Лавандовая', preview: '#f0edf8',
    vars: {
      bgPrimary: '240 237 248', bgSecondary: '230 225 242', bgTertiary: '218 212 232', bgElevated: '246 243 252',
      textPrimary: '42 32 72', textSecondary: '85 70 120', textTertiary: '135 125 160',
      borderColor: '208 200 225', borderHover: '188 178 210'
    }
  },
  {
    name: 'peach', label: 'Peach', labelRu: 'Персиковая', preview: '#fef0e8',
    vars: {
      bgPrimary: '254 240 232', bgSecondary: '248 228 218', bgTertiary: '238 216 204', bgElevated: '255 246 240',
      textPrimary: '65 35 20', textSecondary: '120 75 55', textTertiary: '165 125 108',
      borderColor: '225 205 192', borderHover: '208 185 170'
    }
  },
  {
    name: 'sakura-light', label: 'Sakura', labelRu: 'Сакура', preview: '#fdf0f5',
    vars: {
      bgPrimary: '253 240 245', bgSecondary: '245 228 236', bgTertiary: '235 215 225', bgElevated: '255 246 250',
      textPrimary: '60 25 42', textSecondary: '115 65 88', textTertiary: '160 120 140',
      borderColor: '225 205 215', borderHover: '208 185 198'
    }
  },
  {
    name: 'sand', label: 'Sand', labelRu: 'Песчаная', preview: '#f5f0e0',
    vars: {
      bgPrimary: '245 240 224', bgSecondary: '235 228 210', bgTertiary: '222 215 195', bgElevated: '250 246 234',
      textPrimary: '55 48 30', textSecondary: '105 95 68', textTertiary: '148 138 115',
      borderColor: '212 205 185', borderHover: '192 185 165'
    }
  },
  {
    name: 'ocean-light', label: 'Ocean Breeze', labelRu: 'Морской бриз', preview: '#e8f5f5',
    vars: {
      bgPrimary: '232 245 245', bgSecondary: '218 238 238', bgTertiary: '202 228 228', bgElevated: '240 250 250',
      textPrimary: '15 50 50', textSecondary: '50 100 100', textTertiary: '100 145 145',
      borderColor: '192 218 218', borderHover: '170 200 200'
    }
  },
  {
    name: 'honey', label: 'Honey', labelRu: 'Медовая', preview: '#faf4e0',
    vars: {
      bgPrimary: '250 244 224', bgSecondary: '242 234 210', bgTertiary: '232 222 195', bgElevated: '255 250 234',
      textPrimary: '60 45 10', textSecondary: '115 95 40', textTertiary: '155 138 85',
      borderColor: '218 208 180', borderHover: '200 188 158'
    }
  },
  {
    name: 'ice', label: 'Ice', labelRu: 'Ледяная', preview: '#eaf2fa',
    vars: {
      bgPrimary: '234 242 250', bgSecondary: '222 232 245', bgTertiary: '208 220 238', bgElevated: '240 246 252',
      textPrimary: '20 35 60', textSecondary: '65 85 120', textTertiary: '115 135 165',
      borderColor: '198 212 232', borderHover: '178 195 218'
    }
  },
]

export const BOARD_BG_COLORS: string[] = [
  // Dark shades
  '#1e293b', '#1a1a2e', '#0f172a', '#1b2838',
  '#2d1b4e', '#1a2e1a', '#2e1a1a', '#1a2e2e',
  '#18181b', '#1c1917', '#0c0a09', '#172554',
  // Light shades
  '#f1f5f9', '#fef3c7', '#dbeafe', '#dcfce7',
  '#fce7f3', '#ede9fe', '#e0f2fe', '#f3e8ff',
  '#fefce8', '#ecfdf5', '#fff1f2', '#f0fdfa'
]
