import type { AppIconName } from '@/components/common/AppIcon.vue'

export interface SocialProfile {
  key: string
  href: string
  labelKey: string
  icon: AppIconName
  /** Include in Organization JSON-LD `sameAs` (public profile URLs only). */
  sameAs: boolean
}

/** Official social / contact profiles — shared by footer UI and JSON-LD `sameAs`. */
export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  {
    key: 'discord',
    href: 'https://discord.gg/GPth9qEUtB',
    labelKey: 'footer.discord',
    icon: 'discord',
    sameAs: true,
  },
  {
    key: 'email',
    href: 'mailto:support@varo.cloud',
    labelKey: 'footer.supportEmail',
    icon: 'email',
    sameAs: false,
  },
  {
    key: 'x',
    href: 'https://x.com/varocloud',
    labelKey: 'footer.x',
    icon: 'x',
    sameAs: true,
  },
  {
    key: 'youtube',
    href: 'https://www.youtube.com/@varocloud',
    labelKey: 'footer.youtube',
    icon: 'youtube',
    sameAs: true,
  },
  {
    key: 'linkedin',
    href: 'https://www.linkedin.com/company/varo-cloud/',
    labelKey: 'footer.linkedin',
    icon: 'linkedin',
    sameAs: true,
  },
]

/** Absolute profile URLs for Organization JSON-LD `sameAs`. */
export const SOCIAL_SAME_AS = SOCIAL_PROFILES.filter((p) => p.sameAs).map((p) => p.href)

export const TWITTER_SITE = '@varocloud'
