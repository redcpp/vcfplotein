<template>
  <div id="index">
    <div class="landing">
      <div class="landing-left text-center">
        <h1 class="mt-3 text-5xl font-bold">VCF/Plotein</h1>
        <h3 class="mt-0 text-xl">
          A web application to facilitate the clinical interpretation of genetic
          and genomic variants from exome sequencing projects
        </h3>
      </div>
      <div class="landing-right">
        <img
          src="/bap1.png"
          alt="bap1.png"
          class="mr-3"
          style="width: 100%;"
        />
        <div class="p-0 pt-3">
          <router-link
            to="/wizard"
            class="mr-3 inline-block rounded border border-go-primary px-12 py-3
                   text-lg text-go-primary transition-colors
                   hover:bg-go-primary hover:text-white"
          >
            Get started
          </router-link>
          <router-link
            :to="{ path: '/wizard', query: { demo: true } }"
            class="inline-block rounded border border-go-secondary px-12 py-3
                   text-lg text-go-secondary transition-colors
                   hover:bg-go-secondary hover:text-white"
          >
            Demo
          </router-link>
        </div>
      </div>
    </div>

    <div class="bg-gray-100 py-12 text-center">
      <h4 class="text-lg font-semibold">FAQ</h4>
      <a
        href="https://drive.google.com/open?id=15yokctWbhkj7up-Y3xntdrCkohLgr_ez"
        target="_blank"
        rel="noopener"
      >
        <p class="text-6xl"><i class="fa fa-file-pdf"></i></p>
      </a>
    </div>
  </div>
</template>

<script setup>
// Ported from pages/index.vue.
// - b-img/b-button + `:to` -> <img> and <router-link> with Tailwind classes.
// - The page never used `vue-faq-accordion`; the FAQ block is just a PDF link,
//   ported faithfully.
// - The leftover Vue-Tour marker `#v-step-0` div was dead markup and is removed.
</script>

<style scoped>
/* Landing layout — ported from assets/scss/_index.scss. */
#index {
  font-family: var(--font-raleway), 'Raleway', sans-serif;
}
.landing {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: calc(100vh - 50px);
  margin-top: 50px;
}
.landing > div {
  padding: 20px 30px;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .landing {
    display: grid;
    height: 100vh;
    grid-template-columns: 40% 1fr;
    margin-top: auto;
  }
}
.landing-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  grid-row: 1;
  grid-column: 1;
  text-align: left;
}
.landing-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  grid-row: 1;
  grid-column: 2;
}
</style>
