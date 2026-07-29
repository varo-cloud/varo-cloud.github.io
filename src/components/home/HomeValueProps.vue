<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'
import AppIcon from '@/components/common/AppIcon.vue'

const { t } = useI18n()

const cards = [
  {
    key: 'models',
    image: 'https://assets.varo.cloud/uploads/f8a9cff9443345198e6ac6cb92e3abe8.jpg',
    points: ['point1', 'point2', 'point3'] as const,
  },
  {
    key: 'scale',
    image: 'https://assets.varo.cloud/uploads/68f14d23cfec4690987c214afffdf58b.png',
    points: ['point1', 'point2', 'point3'] as const,
  },
  {
    key: 'cost',
    image: 'https://assets.varo.cloud/uploads/c37bca31df74425bbf0d766d2bb37de0.jpg',
    points: ['point1', 'point2', 'point3'] as const,
  },
] as const
</script>

<template>
  <section class="home-value" aria-labelledby="home-value-title">
    <div class="home-value__inner">
      <h2 id="home-value-title" class="home-value__title">
        {{ t('pages.home.valueProps.title') }}
      </h2>
      <p class="home-value__subtitle">{{ t('pages.home.valueProps.subtitle') }}</p>

      <div class="home-value__grid">
        <article v-for="card in cards" :key="card.key" class="home-value__card">
          <img
            class="home-value__card-bg"
            :src="assetUrl(card.image)"
            alt=""
            aria-hidden="true"
          />
          <div class="home-value__card-body">
            <h3 class="home-value__card-title">
              {{ t(`pages.home.valueProps.cards.${card.key}.title`) }}
            </h3>
            <p class="home-value__card-desc">
              {{ t(`pages.home.valueProps.cards.${card.key}.desc`) }}
            </p>
            <ul class="home-value__card-list">
              <li v-for="point in card.points" :key="point">
                <AppIcon name="check" class="home-value__check" :size="16" />
                <span>{{ t(`pages.home.valueProps.cards.${card.key}.${point}`) }}</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-value {
  padding: 60px 16px;
  background: #fff;
}

.home-value__inner {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  text-align: center;
}

@media (min-width: 1024px) {
  .home-value {
    padding-inline: 60px;
  }
}

.home-value__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: #222;
}

.home-value__subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
  color: #222;
}

.home-value__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
  text-align: left;
  align-items: stretch;
}

.home-value__card {
  position: relative;
  overflow: hidden;
  height: 463px;
  border: 1px solid #f0f0f0;
  border-radius: 24px;
  background: #fff;
  color: #222;
}

.home-value__card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.home-value__card-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
  height: 100%;
  padding: 271px 20px 20px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 45%,
    rgba(255, 255, 255, 0.72) 68%,
    rgba(255, 255, 255, 0.96) 100%
  );
}

.home-value__card-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 40px;
  min-height: 40px;
  color: #222;
}

.home-value__card-desc {
  margin: 14px 0 0;
  min-height: 32px;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  color: rgba(34, 34, 34, 0.5);
}

.home-value__card-list {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.home-value__card-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: rgba(34, 34, 34, 0.5);
}

.home-value__card-list li:first-child {
  margin-top: 0;
}

.home-value__check {
  flex-shrink: 0;
  color: #06b6d4;
}

@media (max-width: 1000px) {
  .home-value {
    padding: 56px 16px;
  }

  .home-value__subtitle {
    font-size: 14px;
  }

  .home-value__grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .home-value__card {
    height: 360px;
    min-height: 0;
    border-radius: 16px;
  }

  .home-value__card-body {
    padding: 180px 16px 16px;
  }

  .home-value__card-title {
    font-size: 20px;
    line-height: 28px;
    min-height: 28px;
  }

  .home-value__card-desc {
    min-height: 40px;
    font-size: 14px;
    line-height: 20px;
  }

  .home-value__card-list li {
    margin-top: 10px;
    font-size: 13px;
  }
}
</style>
