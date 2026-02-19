import { useAppStore } from '@/store'
import { translations, type TranslationKey } from '@/i18n'

export function useTranslation() {
  const language = useAppStore((s) => s.language)
  const dict = translations[language] ?? translations.en

  function t(key: TranslationKey, vars?: Record<string, string>): string {
    let result: string = dict[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        result = result.replace(`{${k}}`, v)
      }
    }
    return result
  }

  return { t, language }
}
