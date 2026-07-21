<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'

const { t } = useI18n()

const page = ref(0)
const pageCount = 5

const SHOWCASE_IMAGES = [
  '/assets/home/showcase-01.png',
  '/assets/home/showcase-02.jpeg',
  '/assets/home/showcase-03.png',
  '/assets/home/showcase-04.png',
  '/assets/home/showcase-05.png',
  '/assets/home/showcase-06.png',
  '/assets/home/showcase-07.png',
  '/assets/home/showcase-08.png',
  '/assets/home/showcase-09.png',
  '/assets/home/showcase-10.png',
] as const

const items = computed(() =>
  SHOWCASE_IMAGES.map((image, index) => ({
    id: index + 1,
    image: assetUrl(image),
    title: t('pages.home.showcase.itemTitle'),
    meta: t('pages.home.showcase.itemMeta'),
  })),
)

function goPage(next: number) {
  page.value = next
}
</script>

<template>
  <section class="home-showcase" aria-labelledby="home-showcase-title">
    <div class="home-showcase__inner">
      <h2 id="home-showcase-title" class="home-showcase__title">
        {{ t('pages.home.showcase.title') }}
      </h2>
      <p class="home-showcase__subtitle">{{ t('pages.home.showcase.subtitle') }}</p>

      <div class="home-showcase__grid">
        <article v-for="item in items" :key="item.id" class="home-showcase__card">
          <img class="home-showcase__img" :src="item.image" :alt="item.title" loading="lazy" />
          <div class="home-showcase__body">
            <p class="home-showcase__name">{{ item.title }}</p>
            <p class="home-showcase__meta">{{ item.meta }}</p>
          </div>
        </article>
      </div>

      <div class="home-showcase__dots" role="tablist" :aria-label="t('pages.home.showcase.pagination')">
        <button
          v-for="n in pageCount"
          :key="n"
          type="button"
          class="home-showcase__dot"
          :class="{ 'is-active': page === n - 1 }"
          :aria-label="t('pages.home.showcase.page', { n })"
          @click="goPage(n - 1)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-showcase {
  padding: 80px 16px;
  background: rgba(6, 182, 212, 0.04);
}

.home-showcase__inner {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  text-align: center;
}

.home-showcase__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #222;
}

.home-showcase__subtitle {
  margin: 20px auto 0;
  max-width: 908px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #9b9dab;
}

.home-showcase__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.home-showcase__card {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 20px;
  background: #111;
}

.home-showcase__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-showcase__body {
  position: absolute;
  inset: auto 0 0;
  padding: 14px 16px 16px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  text-align: left;
  border-radius: 0 0 20px 20px;
}

.home-showcase__name {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.home-showcase__meta {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.home-showcase__dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 28px;
}

.home-showcase__dot {
  width: 40px;
  height: 6px;
  border: 0;
  border-radius: 2px;
  background: #eee;
  cursor: pointer;
}

.home-showcase__dot.is-active {
  background: #06b6d4;
}

@media (max-width: 1100px) {
  .home-showcase__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .home-showcase__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}
</style>
