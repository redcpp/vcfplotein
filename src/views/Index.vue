<template>
  <div id="index">
    <!-- ============================================================ hero -- -->
    <section class="hero">
      <div class="mx-auto grid max-w-6xl items-center gap-12 px-6
                  py-16 md:grid-cols-2 md:py-24">
        <!-- copy ------------------------------------------------------------ -->
        <div class="anim-rise" style="animation-delay:.02s">
          <p class="eyebrow">Clinical genomics &middot; Variant interpretation</p>

          <h1 class="mt-3 text-5xl font-bold leading-[1.05] tracking-tight
                     text-ink md:text-6xl">
            VCF/Plotein
          </h1>

          <p class="mt-5 max-w-md text-lg leading-relaxed text-ink-2">
            A web application to facilitate the clinical interpretation of
            genetic and genomic variants from exome sequencing projects
          </p>

          <!-- CTAs ---------------------------------------------------------- -->
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <router-link
              to="/wizard"
              class="t-base rounded-xl bg-primary px-6 py-3 text-sm
                     font-semibold text-white shadow-sm
                     hover:bg-primary-hover hover:shadow-md"
            >
              Get started
            </router-link>
            <router-link
              :to="{ path: '/wizard', query: { demo: true } }"
              class="t-base rounded-xl border border-border bg-surface px-6
                     py-3 text-sm font-semibold text-ink-2
                     hover:border-border-strong hover:text-ink"
            >
              Demo
            </router-link>
          </div>

          <!-- credibility line --------------------------------------------- -->
          <div class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2
                      text-xs font-medium text-ink-3">
            <span class="inline-flex items-center gap-1.5">
              <i class="fa fa-book text-primary"></i>
              Published in Bioinformatics (2019)
            </span>
            <span class="hidden h-3 w-px bg-border-strong sm:inline-block"></span>
            <span class="inline-flex items-center gap-1.5">
              <i class="fa fa-flask text-primary"></i>
              Built at LIIGH-UNAM
            </span>
          </div>
        </div>

        <!-- product specimen ---------------------------------------------- -->
        <div class="anim-rise" style="animation-delay:.12s">
          <figure class="card overflow-hidden shadow-lg">
            <figcaption class="flex items-center gap-1.5 border-b border-border
                               bg-surface-2 px-4 py-2.5">
              <span class="h-2.5 w-2.5 rounded-full bg-pathogenic/70"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-uncertain/70"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-benign/70"></span>
              <span class="ml-2 font-mono text-xs text-ink-3">
                BAP1 &middot; protein lollipop plot
              </span>
            </figcaption>
            <img
              src="/bap1.png"
              alt="bap1.png"
              class="block w-full bg-surface"
            />
          </figure>
        </div>
      </div>
    </section>

    <!-- ====================================================== feature row -- -->
    <section class="border-t border-border bg-surface">
      <div class="mx-auto max-w-6xl px-6 py-14">
        <p class="eyebrow text-center">How it works</p>
        <h2 class="mt-2 text-center text-2xl font-bold tracking-tight text-ink">
          From exome VCF to clinical insight
        </h2>

        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(feature, i) in features"
            :key="feature.title"
            class="card anim-rise t-base p-5 hover:shadow-md"
            :style="{ animationDelay: `${0.04 * i + 0.05}s` }"
          >
            <div class="flex h-10 w-10 items-center justify-center
                        rounded-xl bg-primary-soft text-primary">
              <i :class="['fa', feature.icon, 'text-lg']"></i>
            </div>
            <h3 class="mt-4 text-sm font-semibold text-ink">
              {{ feature.title }}
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed text-ink-2">
              {{ feature.body }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================= faq -- -->
    <section class="border-t border-border">
      <div class="mx-auto flex max-w-6xl flex-col items-center gap-4
                  px-6 py-12 text-center sm:flex-row sm:justify-between
                  sm:text-left">
        <div>
          <p class="eyebrow">Documentation</p>
          <h2 class="mt-1 text-lg font-semibold text-ink">
            Frequently asked questions
          </h2>
          <p class="mt-1 text-sm text-ink-2">
            Step-by-step guidance for running and interpreting an analysis.
          </p>
        </div>
        <a
          href="https://drive.google.com/open?id=15yokctWbhkj7up-Y3xntdrCkohLgr_ez"
          target="_blank"
          rel="noopener"
          class="t-base inline-flex items-center gap-2 rounded-xl border
                 border-border bg-surface px-5 py-3 text-sm font-semibold
                 text-ink-2 hover:border-border-strong hover:text-ink"
        >
          <i class="fa fa-file-pdf text-pathogenic"></i>
          Read the FAQ
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
// Ported from pages/index.vue.
// - b-img/b-button + `:to` -> <img> and <router-link> with Tailwind classes.
// - The page never used `vue-faq-accordion`; the FAQ block is just a PDF link,
//   ported faithfully.
// - The leftover Vue-Tour marker `#v-step-0` div was dead markup and is removed.
// - Feature copy describes only what the app genuinely does.
const features = [
  {
    icon: 'fa-shield-alt',
    title: 'Private by design',
    body: 'Variants are parsed in your browser. Raw genomic data is never uploaded to a server.',
  },
  {
    icon: 'fa-dna',
    title: 'Ensembl VEP annotation',
    body: 'Variants are annotated with consequence and protein-level effect via Ensembl VEP.',
  },
  {
    icon: 'fa-database',
    title: 'Clinical cross-reference',
    body: 'Cross-referenced against ClinVar, COSMIC, dbSNP and gnomAD evidence tracks.',
  },
  {
    icon: 'fa-chart-bar',
    title: 'Interactive lollipop plots',
    body: 'Variants mapped onto the protein as D3 lollipop plots with domain context.',
  },
]
</script>

<style scoped>
/* Landing layout — rebuilt on the light clinical-genomics design system. */
#index {
  background-color: var(--color-canvas);
}
.hero {
  background:
    radial-gradient(
      60rem 32rem at 78% -8%,
      rgba(58, 91, 217, 0.07),
      transparent 70%
    ),
    var(--color-canvas);
}
</style>
