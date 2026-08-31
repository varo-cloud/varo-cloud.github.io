<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import AppIcon, { type AppIconName } from '@/components/common/AppIcon.vue'
import { SOCIAL_PROFILES } from '@/seo/social'

export type SeedCreatorLandingCopy = {
  seedCap: string | number
  seedBonus: string
  inviterReward: string
  inviteeReward: string
  minDeposit: string
  depositWindow: string
  bonusTtl: string
}

const props = defineProps<{
  copy: SeedCreatorLandingCopy
}>()

const emit = defineEmits<{
  getStarted: []
}>()

const { t } = useI18n()

const openFaqId = ref('professional')

const xUrl = SOCIAL_PROFILES.find((p) => p.key === 'x')?.href ?? 'https://x.com/varocloud'
const discordUrl =
  SOCIAL_PROFILES.find((p) => p.key === 'discord')?.href ?? 'https://discord.gg/GPth9qEUtB'

type AboutMosaicItem =
  | { type: 'image'; src: string }
  | { type: 'video'; src: string; poster: string }

const aboutMosaicItems: AboutMosaicItem[] = [
  { type: 'image', src: 'https://assets.varo.cloud/uploads/39855da77e47422fb3fb496430d71c13.jpg' },
  { type: 'image', src: 'https://assets.varo.cloud/uploads/71ba6a6936bf4138935d57723812576b.jpg' },
  {
    type: 'video',
    src: 'https://assets.varo.cloud/uploads/eb28eb061a3d477cb2b8ca96aa6d4c15.mp4',
    poster: 'https://assets.varo.cloud/uploads/7d3a40ce6e0c4927a1081051a1fd0006.jpg',
  },
  { type: 'image', src: 'https://assets.varo.cloud/uploads/1a8de56978c445548eb979924d9d42c4.jpg' },
  { type: 'image', src: 'https://assets.varo.cloud/uploads/92b074390e2c4e3cb8d6d66ac66e608a.jpg' },
]

const whyJoinItems = computed(() => [
  {
    icon: 'star-smile-fill' as AppIconName,
    title: t('pages.seedCreator.landing.whyJoin.items.earlyAccess.title'),
    body: t('pages.seedCreator.landing.whyJoin.items.earlyAccess.body'),
  },
  {
    icon: 'gift-fill' as AppIconName,
    title: t('pages.seedCreator.landing.whyJoin.items.credits.title'),
    body: t('pages.seedCreator.landing.whyJoin.items.credits.body', props.copy),
  },
  {
    icon: 'team-fill' as AppIconName,
    title: t('pages.seedCreator.landing.whyJoin.items.community.title'),
    body: t('pages.seedCreator.landing.whyJoin.items.community.body'),
  },
  {
    icon: 'message-3-fill' as AppIconName,
    title: t('pages.seedCreator.landing.whyJoin.items.feedback.title'),
    body: t('pages.seedCreator.landing.whyJoin.items.feedback.body'),
  },
  {
    icon: 'stack-fill' as AppIconName,
    title: t('pages.seedCreator.landing.whyJoin.items.rewards.title'),
    body: t('pages.seedCreator.landing.whyJoin.items.rewards.body'),
  },
])

const benefitCards = computed(() => [
  {
    title: t('pages.seedCreator.landing.benefits.cards.credit.title', props.copy),
    body: t('pages.seedCreator.landing.benefits.cards.credit.body'),
  },
  {
    title: t('pages.seedCreator.landing.benefits.cards.support.title'),
    body: t('pages.seedCreator.landing.benefits.cards.support.body'),
  },
  {
    title: t('pages.seedCreator.landing.benefits.cards.community.title'),
    body: t('pages.seedCreator.landing.benefits.cards.community.body'),
  },
  {
    title: t('pages.seedCreator.landing.benefits.cards.access.title'),
    body: t('pages.seedCreator.landing.benefits.cards.access.body'),
  },
])

const howSteps = computed(() => [
  {
    title: t('pages.seedCreator.landing.how.step1Title'),
    body: null as string | null,
  },
  {
    title: t('pages.seedCreator.landing.how.step2Title'),
    body: t('pages.seedCreator.landing.how.step2Body'),
  },
  {
    title: t('pages.seedCreator.landing.how.step3Title'),
    body: t('pages.seedCreator.landing.how.step3Body'),
  },
])

const howChecklist = computed(() => [
  t('pages.seedCreator.landing.how.check1'),
  t('pages.seedCreator.landing.how.check2'),
  t('pages.seedCreator.landing.how.check3', props.copy),
])

const inviteFlow = computed(() => [
  t('pages.seedCreator.landing.invite.flow1'),
  t('pages.seedCreator.landing.invite.flow2', props.copy),
  t('pages.seedCreator.landing.invite.flow3', props.copy),
])

const rules = computed(() => [
  t('pages.seedCreator.landing.rulesList.seed', props.copy),
  t('pages.seedCreator.landing.rulesList.inviteQuota'),
  t('pages.seedCreator.landing.rulesList.winner', props.copy),
  t('pages.seedCreator.landing.rulesList.reward', props.copy),
  t('pages.seedCreator.landing.rulesList.bonus', props.copy),
])

const modelTags = computed(() => [
  t('pages.seedCreator.landing.platform.tags.seedance'),
  t('pages.seedCreator.landing.platform.tags.minimax'),
  t('pages.seedCreator.landing.platform.tags.wan'),
  t('pages.seedCreator.landing.platform.tags.more'),
])

const modalities = computed(() => [
  {
    title: t('pages.seedCreator.landing.platform.modalities.image.title'),
    body: t('pages.seedCreator.landing.platform.modalities.image.body'),
  },
  {
    title: t('pages.seedCreator.landing.platform.modalities.video.title'),
    body: t('pages.seedCreator.landing.platform.modalities.video.body'),
  },
  {
    title: t('pages.seedCreator.landing.platform.modalities.audio.title'),
    body: t('pages.seedCreator.landing.platform.modalities.audio.body'),
  },
])

const faqItems = computed(() => {
  const ids = [
    'professional',
    'followers',
    'benefits',
    'after-bonus',
    'invite-count',
    'invite-reward',
    'bonus-ttl',
    'permanent',
    'feedback',
  ] as const
  return ids.map((id) => ({
    id,
    question: t(`pages.seedCreator.landing.faq.items.${id}.question`, props.copy),
    answer: t(`pages.seedCreator.landing.faq.items.${id}.answer`, props.copy),
  }))
})

useHead(
  computed(() => ({
    script: [
      {
        key: 'seed-creator-faq-ld',
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.value.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }),
      },
    ],
  })),
)

function toggleFaq(id: string) {
  openFaqId.value = openFaqId.value === id ? '' : id
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="scl" data-seo-ready="seed-creator-landing">
    <!-- Hero -->
    <section class="scl-hero" aria-labelledby="seed-creator-hero-title">
      <img
        class="scl-hero__media"
        src="https://assets.varo.cloud/uploads/a0558ef92e6444288781759c582d78a6.jpg"
        alt=""
        aria-hidden="true"
      />
      <div class="scl-hero__overlay" aria-hidden="true" />
      <div class="scl-hero__inner">
        <h1 id="seed-creator-hero-title" class="scl-hero__title">
          {{ t('pages.seedCreator.landing.hero.title') }}
        </h1>
        <p class="scl-hero__subtitle">
          {{ t('pages.seedCreator.landing.hero.subtitle') }}
        </p>
      </div>
    </section>

    <!-- Intro -->
    <section class="scl-intro" aria-labelledby="seed-creator-intro-title">
      <div class="scl-inner scl-inner--narrow">
        <h2 id="seed-creator-intro-title" class="scl-intro__title">
          {{ t('pages.seedCreator.landing.intro.title') }}
        </h2>
        <p class="scl-intro__lead">
          {{ t('pages.seedCreator.landing.intro.lead') }}
        </p>
        <p class="scl-intro__body">
          {{ t('pages.seedCreator.landing.intro.body') }}
        </p>
        <div class="scl-intro__actions">
          <button type="button" class="scl-btn scl-btn--primary" @click="emit('getStarted')">
            {{ t('pages.seedCreator.landing.cta.getStarted') }}
          </button>
          <button type="button" class="scl-btn scl-btn--ghost" @click="scrollTo('seed-landing-about')">
            {{ t('pages.seedCreator.landing.cta.learnMore') }}
          </button>
        </div>
      </div>
    </section>

    <!-- About / More Than Early Access -->
    <section id="seed-landing-about" class="scl-section" aria-labelledby="seed-about-title">
      <div class="scl-inner scl-split">
        <div class="scl-split__copy">
          <p class="scl-eyebrow">{{ t('pages.seedCreator.landing.about.eyebrow') }}</p>
          <h2 id="seed-about-title" class="scl-h2 scl-h2--left">
            {{ t('pages.seedCreator.landing.about.title') }}
          </h2>
          <p class="scl-body">{{ t('pages.seedCreator.landing.about.lead') }}</p>
          <p class="scl-body">
            {{ t('pages.seedCreator.landing.about.body', copy) }}
          </p>
          <dl class="scl-stats">
            <div class="scl-stats__item">
              <dt class="scl-stats__value">{{ copy.seedCap }}</dt>
              <dd class="scl-stats__label">{{ t('pages.seedCreator.landing.about.statSlots') }}</dd>
            </div>
            <div class="scl-stats__item">
              <dt class="scl-stats__value">{{ copy.seedBonus }}</dt>
              <dd class="scl-stats__label">{{ t('pages.seedCreator.landing.about.statCredit') }}</dd>
            </div>
            <div class="scl-stats__item">
              <dt class="scl-stats__value">1</dt>
              <dd class="scl-stats__label">{{ t('pages.seedCreator.landing.about.statInvite') }}</dd>
            </div>
          </dl>
        </div>
        <div class="scl-mosaic scl-mosaic--5 scl-mosaic--about" aria-hidden="true">
          <div
            v-for="(item, index) in aboutMosaicItems"
            :key="item.type === 'video' ? item.src : item.src"
            class="scl-mosaic__cell"
            :class="{ 'scl-mosaic__cell--lg': index === 0 }"
          >
            <video
              v-if="item.type === 'video'"
              class="scl-mosaic__img"
              :src="item.src"
              :poster="item.poster"
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
            />
            <img
              v-else
              class="scl-mosaic__img"
              :src="item.src"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Why Join -->
    <section class="scl-section" aria-labelledby="seed-why-title">
      <div class="scl-inner">
        <p class="scl-eyebrow scl-eyebrow--center">
          {{ t('pages.seedCreator.landing.whyJoin.eyebrow') }}
        </p>
        <h2 id="seed-why-title" class="scl-h2">
          {{ t('pages.seedCreator.landing.whyJoin.title') }}
        </h2>
        <p class="scl-section-lead">
          {{ t('pages.seedCreator.landing.whyJoin.lead') }}
        </p>
        <div class="scl-why-grid">
          <article v-for="item in whyJoinItems" :key="item.title" class="scl-why-card">
            <div class="scl-icon-slot" aria-hidden="true">
              <AppIcon :name="item.icon" :size="24" color="#06b6d4" />
            </div>
            <h3 class="scl-why-card__title">{{ item.title }}</h3>
            <p class="scl-why-card__body">{{ item.body }}</p>
          </article>
          <article class="scl-why-card scl-why-card--cta">
            <div class="scl-icon-slot" aria-hidden="true">
              <AppIcon name="thumb-up-fill" :size="24" color="#06b6d4" />
            </div>
            <h3 class="scl-why-card__title">
              {{ t('pages.seedCreator.landing.whyJoin.ctaTitle') }}
            </h3>
            <p class="scl-why-card__body">
              {{ t('pages.seedCreator.landing.whyJoin.ctaBody', copy) }}
            </p>
            <button type="button" class="scl-link-cta" @click="emit('getStarted')">
              {{ t('pages.seedCreator.landing.cta.applyNow') }}
            </button>
          </article>
        </div>
      </div>
    </section>

    <!-- Showcase strip -->
    <section class="scl-strip" aria-hidden="true">
      <div class="scl-strip__track">
        <div v-for="n in 6" :key="n" class="scl-strip__item media-skeleton" />
      </div>
    </section>

    <!-- Benefits -->
    <section class="scl-section" aria-labelledby="seed-benefits-title">
      <div class="scl-inner scl-split scl-split--reverse">
        <div class="scl-mosaic scl-mosaic--5" aria-hidden="true">
          <div class="scl-mosaic__cell scl-mosaic__cell--lg media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
        </div>
        <div class="scl-split__copy">
          <p class="scl-eyebrow">{{ t('pages.seedCreator.landing.benefits.eyebrow') }}</p>
          <h2 id="seed-benefits-title" class="scl-h2 scl-h2--left">
            {{ t('pages.seedCreator.landing.benefits.title') }}
          </h2>
          <p class="scl-body">{{ t('pages.seedCreator.landing.benefits.lead') }}</p>
          <div class="scl-credit-chip">
            <p class="scl-credit-chip__value">{{ copy.seedBonus }}</p>
            <p class="scl-credit-chip__label">
              {{ t('pages.seedCreator.landing.benefits.creditLabel') }}
            </p>
          </div>
          <div class="scl-benefit-grid">
            <article v-for="card in benefitCards" :key="card.title" class="scl-benefit-card">
              <div class="scl-icon-slot scl-icon-slot--sm" aria-hidden="true" />
              <div>
                <h3 class="scl-benefit-card__title">{{ card.title }}</h3>
                <p class="scl-benefit-card__body">{{ card.body }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="scl-section" aria-labelledby="seed-how-title">
      <div class="scl-inner scl-split">
        <div class="scl-split__copy">
          <p class="scl-eyebrow">{{ t('pages.seedCreator.landing.how.eyebrow') }}</p>
          <h2 id="seed-how-title" class="scl-h2 scl-h2--left">
            {{ t('pages.seedCreator.landing.how.title') }}
          </h2>
          <p class="scl-body">{{ t('pages.seedCreator.landing.how.lead') }}</p>
          <ol class="scl-steps">
            <li v-for="(step, index) in howSteps" :key="step.title" class="scl-steps__item">
              <span class="scl-steps__index" aria-hidden="true">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <div>
                <h3 class="scl-steps__title">{{ step.title }}</h3>
                <p v-if="index === 0" class="scl-steps__body">
                  {{ t('pages.seedCreator.landing.how.step1Before') }}
                  <a :href="xUrl" target="_blank" rel="noopener noreferrer">{{
                    t('pages.seedCreator.landing.how.xLink')
                  }}</a>
                  {{ t('pages.seedCreator.landing.how.step1Mid') }}
                  <a :href="discordUrl" target="_blank" rel="noopener noreferrer">{{
                    t('pages.seedCreator.landing.how.discordLink')
                  }}</a>
                  {{ t('pages.seedCreator.landing.how.step1After') }}
                </p>
                <p v-else class="scl-steps__body">{{ step.body }}</p>
              </div>
            </li>
          </ol>
          <button type="button" class="scl-btn scl-btn--primary" @click="emit('getStarted')">
            {{ t('pages.seedCreator.landing.cta.applyNow') }}
          </button>
        </div>
        <aside class="scl-bonus-card" :aria-label="t('pages.seedCreator.landing.how.bonusTitle')">
          <p class="scl-bonus-card__title">
            {{ t('pages.seedCreator.landing.how.bonusTitle') }}
          </p>
          <p class="scl-bonus-card__amount">{{ copy.seedBonus }}</p>
          <p class="scl-bonus-card__label">
            {{ t('pages.seedCreator.landing.how.bonusLabel', copy) }}
          </p>
          <div class="scl-bonus-card__media" aria-hidden="true">
            <div class="scl-bonus-card__img media-skeleton" />
            <div class="scl-bonus-card__img media-skeleton" />
          </div>
          <ul class="scl-bonus-card__list">
            <li v-for="item in howChecklist" :key="item">
              <span class="scl-check" aria-hidden="true" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <!-- Invite -->
    <section class="scl-section" aria-labelledby="seed-invite-title">
      <div class="scl-inner scl-split">
        <div class="scl-mosaic scl-mosaic--5" aria-hidden="true">
          <div class="scl-mosaic__cell scl-mosaic__cell--lg media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
        </div>
        <div class="scl-split__copy">
          <p class="scl-eyebrow">{{ t('pages.seedCreator.landing.invite.eyebrow') }}</p>
          <h2 id="seed-invite-title" class="scl-h2 scl-h2--left">
            {{ t('pages.seedCreator.landing.invite.title') }}
          </h2>
          <p class="scl-body">{{ t('pages.seedCreator.landing.invite.lead') }}</p>
          <p class="scl-body">
            {{ t('pages.seedCreator.landing.invite.body', copy) }}
          </p>
          <div class="scl-invite-box">
            <div class="scl-invite-box__head">
              <p class="scl-invite-box__title">
                {{ t('pages.seedCreator.landing.invite.howTitle') }}
              </p>
              <p class="scl-invite-box__badge">
                {{ t('pages.seedCreator.landing.invite.badge', copy) }}
              </p>
            </div>
            <div class="scl-invite-flow">
              <div v-for="(item, index) in inviteFlow" :key="index" class="scl-invite-flow__item">
                <div class="scl-icon-slot scl-icon-slot--sm" aria-hidden="true" />
                <p>{{ item }}</p>
              </div>
            </div>
          </div>
          <button type="button" class="scl-btn scl-btn--primary" @click="emit('getStarted')">
            {{ t('pages.seedCreator.landing.cta.invite') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Rules -->
    <section id="seed-landing-rules" class="scl-section" aria-labelledby="seed-rules-title">
      <div class="scl-inner scl-inner--narrow">
        <p class="scl-eyebrow scl-eyebrow--center">
          {{ t('pages.seedCreator.landing.rulesSection.eyebrow') }}
        </p>
        <h2 id="seed-rules-title" class="scl-h2">
          {{ t('pages.seedCreator.landing.rulesSection.title') }}
        </h2>
        <p class="scl-section-lead">
          {{ t('pages.seedCreator.landing.rulesSection.lead') }}
        </p>
        <ul class="scl-rules">
          <li v-for="(rule, index) in rules" :key="index" class="scl-rules__item">
            <span class="scl-check" aria-hidden="true" />
            <span>{{ rule }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Platform -->
    <section class="scl-section" aria-labelledby="seed-platform-title">
      <div class="scl-inner scl-split">
        <div class="scl-split__copy">
          <p class="scl-eyebrow">{{ t('pages.seedCreator.landing.platform.eyebrow') }}</p>
          <h2 id="seed-platform-title" class="scl-h2 scl-h2--left">
            {{ t('pages.seedCreator.landing.platform.title') }}
          </h2>
          <p class="scl-body">{{ t('pages.seedCreator.landing.platform.body') }}</p>
          <div class="scl-tags">
            <span
              v-for="(tag, index) in modelTags"
              :key="tag"
              class="scl-tag"
              :class="{ 'scl-tag--muted': index === modelTags.length - 1 }"
            >
              {{ tag }}
            </span>
          </div>
          <dl class="scl-stats scl-stats--modalities">
            <div v-for="item in modalities" :key="item.title" class="scl-stats__item">
              <dt class="scl-stats__value scl-stats__value--sm">{{ item.title }}</dt>
              <dd class="scl-stats__label">{{ item.body }}</dd>
            </div>
          </dl>
        </div>
        <div class="scl-mosaic scl-mosaic--3" aria-hidden="true">
          <div class="scl-mosaic__cell scl-mosaic__cell--tall media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
          <div class="scl-mosaic__cell media-skeleton" />
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="scl-faq" aria-labelledby="seed-faq-title">
      <div class="scl-inner">
        <h2 id="seed-faq-title" class="scl-h2">
          {{ t('pages.seedCreator.landing.faq.title') }}
        </h2>
        <div class="scl-faq__list">
          <div
            v-for="item in faqItems"
            :key="item.id"
            class="scl-faq__item"
            :class="{ 'is-open': openFaqId === item.id }"
          >
            <button
              type="button"
              class="scl-faq__trigger"
              :aria-expanded="openFaqId === item.id"
              :aria-controls="`seed-faq-panel-${item.id}`"
              @click="toggleFaq(item.id)"
            >
              <span class="scl-faq__question">{{ item.question }}</span>
              <AppIcon
                :name="openFaqId === item.id ? 'close-line' : 'add-line'"
                :size="24"
                color="#06b6d4"
              />
            </button>
            <div
              v-show="openFaqId === item.id"
              :id="`seed-faq-panel-${item.id}`"
              class="scl-faq__answer"
              role="region"
            >
              <p>{{ item.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scl {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  background: #fff;
  color: #222;
}

.scl-inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 16px;
}

.scl-inner--narrow {
  max-width: 1100px;
}

.scl-section {
  padding: 100px 0 0;
}

.scl-eyebrow {
  margin: 0 0 20px;
  color: #06b6d4;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
}

.scl-eyebrow--center {
  text-align: center;
}

.scl-h2 {
  margin: 0;
  color: #222;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.scl-h2--left {
  text-align: left;
}

.scl-section-lead {
  margin: 20px auto 0;
  max-width: 908px;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
}

.scl-body {
  margin: 20px 0 0;
  max-width: 637px;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.scl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.scl-btn--primary {
  background: #222;
  color: #fff;
}

.scl-btn--primary:hover {
  background: #000;
}

.scl-btn--ghost {
  background: transparent;
  border-color: #f4f7f7;
  color: #222;
}

.scl-btn--ghost:hover {
  border-color: #d9e0e0;
}

.scl-link-cta {
  margin-top: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #06b6d4;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  cursor: pointer;
  text-align: left;
}

.scl-link-cta:hover {
  text-decoration: underline;
}

.scl-icon-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(6, 182, 212, 0.1);
}

.scl-icon-slot--sm {
  width: 36px;
  height: 36px;
  border-radius: 40px;
  flex-shrink: 0;
}

.scl-check {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(6, 182, 212, 0.15);
  position: relative;
}

.scl-check::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 6px;
  width: 6px;
  height: 10px;
  border: solid #06b6d4;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Hero */
.scl-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 460px;
  padding: 120px 16px 80px;
  overflow: hidden;
  background: #0a0a0e;
  color: #ebf4fb;
}

.scl-hero__media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

.scl-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.scl-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 1242px;
  text-align: center;
}

.scl-hero__title {
  margin: 0;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.15;
  color: #ebf4fb;
}

.scl-hero__subtitle {
  margin: 0;
  max-width: 800px;
  color: #ebf4fb;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 400;
  line-height: 1.4;
  opacity: 0.5;
}

/* Intro */
.scl-intro {
  padding: 80px 16px 0;
  text-align: center;
}

.scl-intro__title {
  margin: 0;
  color: #222;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
}

.scl-intro__lead,
.scl-intro__body {
  margin: 20px auto 0;
  max-width: 908px;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.scl-intro__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  margin-top: 40px;
}

/* Split layouts */
.scl-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}

.scl-split--reverse {
  direction: ltr;
}

.scl-split__copy {
  min-width: 0;
}

/* Stats */
.scl-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 60px 0 0;
  padding: 0;
}

.scl-stats__item {
  position: relative;
  min-width: 120px;
  padding-right: 24px;
  margin-right: 24px;
}

.scl-stats__item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 6px;
  width: 1px;
  height: 61px;
  background: #eee;
}

.scl-stats__value {
  margin: 0;
  color: #222;
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}

.scl-stats__value--sm {
  font-size: 24px;
  line-height: 1.33;
}

.scl-stats__label {
  margin: 12px 0 0;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
}

.scl-stats--modalities {
  margin-top: 40px;
}

/* Mosaic placeholders */
.scl-mosaic {
  display: grid;
  gap: 24px;
  min-height: 490px;
}

.scl-mosaic--5 {
  grid-template-columns: 1.65fr 1fr;
  grid-template-rows: 131px 131px 181px;
}

.scl-mosaic--5 .scl-mosaic__cell--lg {
  grid-row: 1 / 3;
  min-height: 286px;
}

.scl-mosaic--5 .scl-mosaic__cell:nth-child(4) {
  grid-column: 1;
}

.scl-mosaic--5 .scl-mosaic__cell:nth-child(5) {
  grid-column: 2;
}

/* About section — Figma: 412×266 | 232×131×2 | 322×181×2 */
.scl-mosaic--about {
  position: relative;
  width: 668px;
  max-width: 100%;
  height: 471px;
  min-height: 0;
  display: block;
}

.scl-mosaic--about .scl-mosaic__cell {
  position: absolute;
  min-height: 0;
}

.scl-mosaic--about .scl-mosaic__cell--lg {
  left: 0;
  top: 0;
  width: 412px;
  height: 266px;
}

.scl-mosaic--about .scl-mosaic__cell:nth-child(2) {
  left: 436px;
  top: 0;
  width: 232px;
  height: 131px;
}

.scl-mosaic--about .scl-mosaic__cell:nth-child(3) {
  left: 436px;
  top: 135px;
  width: 232px;
  height: 131px;
}

.scl-mosaic--about .scl-mosaic__cell:nth-child(4) {
  left: 0;
  top: 290px;
  width: 322px;
  height: 181px;
}

.scl-mosaic--about .scl-mosaic__cell:nth-child(5) {
  left: 346px;
  top: 290px;
  width: 322px;
  height: 181px;
}

.scl-mosaic--3 {
  grid-template-columns: 1.4fr 1fr;
  grid-template-rows: 1fr 1fr;
  min-height: 366px;
}

.scl-mosaic--3 .scl-mosaic__cell--tall {
  grid-row: 1 / 3;
}

.scl-mosaic__cell {
  position: relative;
  border-radius: 24px;
  min-height: 120px;
  overflow: hidden;
}

.scl-mosaic__img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* Why join */
.scl-why-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 60px;
}

.scl-why-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 212px;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 24px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.scl-why-card:hover {
  border-color: transparent;
  background: rgba(6, 182, 212, 0.1);
}

.scl-why-card__title {
  margin: 16px 0 0;
  color: #222;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
}

.scl-why-card__body {
  margin: 8px 0 0;
  color: #222;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

/* Showcase strip */
.scl-strip {
  margin-top: 100px;
  overflow: hidden;
}

.scl-strip__track {
  display: flex;
  gap: 24px;
  width: max-content;
  padding: 0 16px;
}

.scl-strip__item {
  width: min(322px, 70vw);
  height: 188px;
  border-radius: 24px;
  border: 1px solid #eee;
  flex-shrink: 0;
}

/* Benefits */
.scl-credit-chip {
  margin-top: 40px;
  width: fit-content;
  min-width: 206px;
  padding: 16px 20px;
  border-radius: 24px;
  background: rgba(6, 182, 212, 0.04);
}

.scl-credit-chip__value {
  margin: 0;
  color: #06b6d4;
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}

.scl-credit-chip__label {
  margin: 8px 0 0;
  color: #222;
  font-size: 16px;
  font-weight: 500;
}

.scl-benefit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.scl-benefit-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-height: 88px;
  padding: 16px 20px;
  border: 1px solid #eee;
  border-radius: 24px;
}

.scl-benefit-card__title {
  margin: 0;
  color: #222;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
}

.scl-benefit-card__body {
  margin: 4px 0 0;
  color: #222;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

/* Steps */
.scl-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 40px 0 32px;
  padding: 0;
  list-style: none;
}

.scl-steps__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.scl-steps__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #06b6d4;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.scl-steps__title {
  margin: 0;
  color: #222;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.33;
}

.scl-steps__body {
  margin: 4px 0 0;
  color: #222;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

.scl-steps__body a {
  color: #06b6d4;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.scl-bonus-card {
  position: relative;
  min-height: 432px;
  padding: 48px 24px 24px;
  border-radius: 24px;
  background: rgba(6, 182, 212, 0.1);
  overflow: hidden;
}

.scl-bonus-card__title {
  margin: 0;
  color: #222;
  font-size: 18px;
  font-weight: 700;
}

.scl-bonus-card__amount {
  margin: 20px 0 0;
  color: #06b6d4;
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}

.scl-bonus-card__label {
  margin: 20px 0 0;
  color: #929ca5;
  font-size: 16px;
  font-weight: 600;
}

.scl-bonus-card__media {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(310px, 48%);
}

.scl-bonus-card__img {
  width: 100%;
  height: 180px;
  border-radius: 24px;
}

.scl-bonus-card__list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 235px;
  margin: 120px 0 0;
  padding: 0;
  list-style: none;
}

.scl-bonus-card__list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
}

/* Invite */
.scl-invite-box {
  margin: 40px 0 24px;
  padding: 24px;
  border-radius: 24px;
  background: #f8f8f8;
}

.scl-invite-box__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 24px;
}

.scl-invite-box__title {
  margin: 0;
  color: #222;
  font-size: 16px;
  font-weight: 700;
}

.scl-invite-box__badge {
  margin: 0;
  color: #06b6d4;
  font-size: 14px;
  font-weight: 500;
}

.scl-invite-flow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.scl-invite-flow__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.scl-invite-flow__item p {
  margin: 0;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

/* Rules */
.scl-rules {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 60px 0 0;
  padding: 0;
  list-style: none;
}

.scl-rules__item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: 70px;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 24px;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.scl-rules__item :deep(strong) {
  color: #06b6d4;
  font-weight: 600;
}

/* Platform tags */
.scl-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 40px;
}

.scl-tag {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 30px;
  background: #06b6d4;
  color: #ebf4fb;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.15;
}

.scl-tag--muted {
  background: #f8f8f8;
  color: #222;
}

/* FAQ */
.scl-faq {
  padding: 100px 0 120px;
}

.scl-faq__list {
  margin-top: 60px;
  border-top: 0.5px solid rgba(6, 182, 212, 0.3);
}

.scl-faq__item {
  border-bottom: 0.5px solid rgba(6, 182, 212, 0.3);
}

.scl-faq__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 28px 24px;
  border: 0;
  background: transparent;
  color: #222;
  text-align: left;
  cursor: pointer;
}

.scl-faq__item.is-open .scl-faq__question {
  color: #06b6d4;
}

.scl-faq__question {
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 500;
  line-height: 1.3;
}

.scl-faq__answer {
  padding: 0 24px 28px;
}

.scl-faq__answer p {
  margin: 0;
  max-width: 1048px;
  color: #929ca5;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .scl-split {
    grid-template-columns: 1fr;
  }

  .scl-mosaic--about {
    margin-inline: auto;
  }

  .scl-why-grid {
    grid-template-columns: 1fr 1fr;
  }

  .scl-bonus-card__media {
    position: static;
    width: 100%;
    flex-direction: row;
    margin-top: 24px;
  }

  .scl-bonus-card__img {
    height: 140px;
  }

  .scl-bonus-card__list {
    max-width: none;
    margin-top: 32px;
  }
}

@media (max-width: 767px) {
  .scl-section {
    padding-top: 64px;
  }

  .scl-hero {
    min-height: 360px;
    padding: 100px 16px 56px;
  }

  .scl-intro {
    padding-top: 48px;
  }

  .scl-why-grid,
  .scl-benefit-grid,
  .scl-invite-flow {
    grid-template-columns: 1fr;
  }

  .scl-mosaic--5,
  .scl-mosaic--3 {
    min-height: 320px;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
  }

  .scl-mosaic--about {
    position: static;
    width: 100%;
    height: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .scl-mosaic--about .scl-mosaic__cell {
    position: static;
    width: auto !important;
    height: auto !important;
    min-height: 120px;
  }

  .scl-mosaic--5 .scl-mosaic__cell--lg,
  .scl-mosaic--3 .scl-mosaic__cell--tall {
    grid-column: 1 / -1;
    grid-row: auto;
    min-height: 200px;
  }

  .scl-stats__item {
    min-width: 90px;
    margin-right: 12px;
    padding-right: 12px;
  }

  .scl-stats__value {
    font-size: 28px;
  }

  .scl-faq {
    padding: 64px 0 80px;
  }

  .scl-faq__trigger {
    padding: 20px 8px;
  }

  .scl-faq__answer {
    padding: 0 8px 20px;
  }

  .scl-rules__item {
    padding: 16px;
  }

  .scl-bonus-card__media {
    flex-direction: column;
  }
}
</style>
