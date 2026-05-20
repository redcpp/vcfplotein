<template>
  <div class="container mx-auto flex min-h-screen flex-col justify-center
              px-4 py-12">
    <div class="anim-rise mx-auto w-full max-w-2xl text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center
                  rounded-2xl bg-primary-soft text-primary-ink">
        <i class="fa fa-dna text-xl"></i>
      </div>

      <p class="eyebrow mt-6">About</p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight text-ink">
        About VCF/Plotein
      </h1>
      <p class="mt-5 text-base leading-relaxed text-ink-2">
        VCF/Plotein is a clinical-genomics tool for visualizing and interpreting
        genetic variants from exome sequencing projects. It maps variants onto
        the protein as an interactive lollipop plot, with protein domains and
        ClinVar, COSMIC, dbSNP and gnomAD cross-reference tracks. The tool was
        published in <em>Bioinformatics</em> (2019) and developed at LIIGH-UNAM.
      </p>

      <div class="mt-8 grid gap-3 sm:grid-cols-3">
        <div class="card p-4 text-left">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl
                      bg-surface-2 text-ink-3">
            <i class="fa fa-wave-square text-sm"></i>
          </div>
          <p class="mt-3 text-sm font-semibold text-ink">Lollipop plot</p>
          <p class="mt-1 text-xs leading-relaxed text-ink-3">
            Variants mapped onto the protein with domain tracks.
          </p>
        </div>
        <div class="card p-4 text-left">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl
                      bg-surface-2 text-ink-3">
            <i class="fa fa-database text-sm"></i>
          </div>
          <p class="mt-3 text-sm font-semibold text-ink">Cross-references</p>
          <p class="mt-1 text-xs leading-relaxed text-ink-3">
            ClinVar, COSMIC, dbSNP and gnomAD lookups per variant.
          </p>
        </div>
        <div class="card p-4 text-left">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl
                      bg-surface-2 text-ink-3">
            <i class="fa fa-flask text-sm"></i>
          </div>
          <p class="mt-3 text-sm font-semibold text-ink">Exome workflows</p>
          <p class="mt-1 text-xs leading-relaxed text-ink-3">
            Built for interpreting variants from exome sequencing.
          </p>
        </div>
      </div>

      <p class="mt-8 text-xs text-ink-4">
        Published in <em>Bioinformatics</em> (2019) · Developed at LIIGH-UNAM
      </p>
    </div>
  </div>
</template>

<script setup>
// Ported from pages/about.vue. Centered Tailwind layout; content unchanged.
</script>
