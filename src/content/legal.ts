import type { LocaleType } from '@/i18n'

import privacyEn from '../../隐私政策文件/Varo隐私政策.md?raw'
import termsEn from '../../隐私政策文件/Varo-Terms-of-Service.md?raw'

export type LegalDocumentKind = 'privacy' | 'terms'

const contentByLocale: Record<LegalDocumentKind, Record<LocaleType, string>> = {
  privacy: {
    'en-US': privacyEn,
    'zh-CN': privacyEn,
  },
  terms: {
    'en-US': termsEn,
    'zh-CN': termsEn,
  },
}

export function getLegalContent(kind: LegalDocumentKind, locale: LocaleType): string {
  return contentByLocale[kind][locale] ?? contentByLocale[kind]['en-US']
}
