<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'

const { t } = useI18n()

const cards = [
  {
    key: 'models',
    image: '/assets/home/feature-models.png',
    points: ['point1', 'point2', 'point3'] as const,
  },
  {
    key: 'scale',
    image: '/assets/home/feature-scale.png',
    points: ['point1', 'point2', 'point3'] as const,
  },
  {
    key: 'cost',
    image: '/assets/home/feature-cost.png',
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
                {{ t(`pages.home.valueProps.cards.${card.key}.${point}`) }}
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
  padding: 80px 16px;
  background: rgba(6, 182, 212, 0.04);
}

.home-value__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  text-align: center;
}

.home-value__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #222;
}

.home-value__subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  color: #9b9dab;
}

.home-value__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
  text-align: left;
}

.home-value__card {
  position: relative;
  overflow: hidden;
  min-height: 463px;
  border: 1px solid #eee;
  border-radius: 24px;
  background: #111;
  color: #ebf4fb;
}

.home-value__card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

.home-value__card-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  min-height: 463px;
  padding: 24px 20px;
  background: linear-gradient(transparent 35%, rgba(0, 0, 0, 0.78));
}

.home-value__card-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.home-value__card-desc {
  margin: 12px 0 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: #9b9dab;
}

.home-value__card-list {
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.home-value__card-list li {
  position: relative;
  margin-top: 10px;
  padding-left: 28px;
  font-size: 14px;
  font-weight: 500;
  color: #9b9dab;
}

.home-value__card-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(6, 182, 212, 0.25);
  box-shadow: inset 0 0 0 4px #06b6d4;
}

@media (max-width: 1000px) {
  .home-value__grid {
    grid-template-columns: 1fr;
  }
}
</style>
