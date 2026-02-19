import { en } from './en'
import { ru } from './ru'

export type TranslationKey = keyof typeof en
export type Translations = Record<TranslationKey, string>

export const translations: Record<string, Translations> = { en, ru }
