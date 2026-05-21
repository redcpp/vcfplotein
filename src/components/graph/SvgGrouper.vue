<template>
  <!--
    Lollipop plot — clinical-genomics variant map.

    This component owns ALL D3 rendering for the plot. The four former
    renderless children (Lollipops / DomainsExpanded / ProteinBar / Metadata)
    have been consolidated here: a single drawing pass keeps zoom, transitions
    and selection state coherent. Those files remain as minimal valid SFCs but
    are no longer imported.

    The root <svg> KEEPS id="SvgGrouper" — the PNG/SVG export feature locates
    it via document.getElementById('SvgGrouper').
  -->
  <div ref="rootRef" class="vp-plot">
    <!-- Toolbar: zoom controls + consequence legend -->
    <div class="vp-toolbar">
      <div class="vp-zoom" role="group" aria-label="Zoom controls">
        <button
          type="button"
          class="vp-btn focus-ring"
          aria-label="Zoom out"
          title="Zoom out"
          @click="zoomBy(1 / 1.5)"
        >&minus;</button>
        <button
          type="button"
          class="vp-btn focus-ring"
          aria-label="Reset zoom"
          title="Reset zoom"
          @click="zoomReset"
        >Reset</button>
        <button
          type="button"
          class="vp-btn focus-ring"
          aria-label="Zoom in"
          title="Zoom in"
          @click="zoomBy(1.5)"
        >+</button>
      </div>

      <div class="vp-legend" aria-label="Consequence colors">
        <span
          v-for="c in consequenceLegend"
          :key="c.name"
          class="vp-legend-item"
        >
          <span class="vp-legend-dot" :style="{ background: c.color }" />
          <span class="vp-legend-label">{{ c.name }}</span>
        </span>
        <span v-if="selectedId" class="vp-legend-item vp-legend-clear">
          <button
            type="button"
            class="vp-clear focus-ring"
            @click="main.clearVariant()"
          >Clear selection</button>
        </span>
      </div>
    </div>

    <!-- Scroll wrapper keeps the SVG responsive without magic numbers. -->
    <div ref="scrollRef" class="vp-scroll">
      <svg id="SvgGrouper" ref="svgRef" :width="width" :height="grouperHeight" />
    </div>

    <!-- Tooltip — plain HTML card, positioned by JS, follows the cursor. -->
    <div ref="tipRef" class="vp-tip" role="tooltip" aria-hidden="true" />
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, computed, markRaw, onMounted, onUnmounted, watch, nextTick } from 'vue'

import { useMainStore } from '@/stores/main'

import calculatePositions from '@/lib/HandleMutations'
import intervalPartition from '@/lib/intervalPartition'
import dbNameFormat from '@/lib/dbNameFormat'

// SvgGrouper MUST keep accepting these props (MainCard renders it with them).
const props = defineProps({
  mutations: { type: Array, required: true },
  domains: { type: Array, required: true },
  consequences: { type: Array, required: true },
  proteinAASize: { type: Number, required: true },
  rightMargin: { type: Number, required: true },
  leftMargin: { type: Number, required: true },
  radius: { type: Number, required: true }
})

const main = useMainStore()

const rootRef = ref(null)
const scrollRef = ref(null)
const svgRef = ref(null)
const tipRef = ref(null)

// markRaw so Vue's reactivity proxy never wraps D3's internal arrays.
const svg = ref(null)
const width = ref(900)

// ---------------------------------------------------------------- layout ----
// Track band geometry (top → bottom). Values are tuned for a calm, generously
// spaced default view — every band gets clear vertical separation.
const PAD_L = 104         // left gutter for track labels
const PAD_R = 24
const PAD_T = 30          // headroom above the axis (also clears tilted labels)
const AXIS_H = 30         // amino-acid position axis
const LABEL_BAND_H = 56   // reserved strip for tilted variant labels
const LOLLI_TIER_H = 30   // vertical step between sample-count tiers
const LOLLI_BASE_H = 60   // lollipop band height when only one tier is used
const BACKBONE_H = 34     // gap between backbone and the domain rows
const DOMAIN_ROW_H = 22   // height of one packed domain row
const DOMAIN_GAP = 30     // gap between the domain rows and the db tracks
const DB_HEAD_H = 26      // "Database presence" caption strip
const DB_ROW_H = 44       // height of one database-presence row
const PAD_B = 24

const DATABASES = [
  { key: 'clinvar', label: 'ClinVar' },
  { key: 'cosmic', label: 'COSMIC' },
  { key: 'dbSnp', label: 'dbSNP' },
  { key: 'gnomad', label: 'gnomAD' }
]

// Design-system palette resolved to literals so that a standalone exported
// SVG (which carries no stylesheet) still renders with correct colors.
const PALETTE = {
  surface: '#ffffff',
  surface3: '#e4e9ef',
  border: '#e5e9ef',
  borderStrong: '#d2d9e2',
  ink: '#131a2a',
  ink2: '#475069',
  ink3: '#7a8499',
  primary: '#3a5bd9',
  accent: '#7a5cff',
  pathogenic: '#dc3b40'
}

const groups = computed(() => intervalPartition([...props.domains]))
const domainRows = computed(() => Math.max(1, groups.value.num))

// Vertical anchors for each band (top → bottom).
const axisY = PAD_T
// Tilted variant labels live in their own reserved strip below the axis.
const labelBandTop = computed(() => axisY + AXIS_H)
// The lollipop heads/stems sit below the label strip.
const lolliTop = computed(() => labelBandTop.value + LABEL_BAND_H)
const backboneY = computed(() => lolliTop.value + lolliBand.value)
const domainsTop = computed(() => backboneY.value + BACKBONE_H)
// Caption strip above the database tracks.
const dbHeadY = computed(
  () => domainsTop.value + domainRows.value * DOMAIN_ROW_H + DOMAIN_GAP
)
const dbTop = computed(() => dbHeadY.value + DB_HEAD_H)
const grouperHeight = computed(
  () => dbTop.value + DATABASES.length * DB_ROW_H + PAD_B
)

// Plottable inner extent.
const innerLeft = computed(() => PAD_L)
const innerRight = computed(() => width.value - PAD_R)

// Computed mutation positions (non-overlapping x via calculatePositions).
const data = ref([])

// Heads step up one tier per order-of-magnitude of sample count. Size the
// lollipop band to the tallest tier actually present so sparse datasets
// (every variant in one sample) don't leave a tall empty gap above the plot.
const maxSampleLevel = computed(() => {
  let max = 0
  for (const d of data.value) {
    const n = (d.samples || []).length
    const lvl = Math.min(3, Math.floor(Math.log10(Math.max(1, n))))
    if (lvl > max) max = lvl
  }
  return max
})
const lolliBand = computed(
  () => LOLLI_BASE_H + maxSampleLevel.value * LOLLI_TIER_H
)

// Base scale: amino-acid coordinate → x pixel. Zoom rescales this.
const baseScale = computed(() =>
  d3.scaleLinear()
    .domain([0, Math.max(1, props.proteinAASize)])
    .range([innerLeft.value, innerRight.value])
)

// Current (possibly zoomed) scale.
let zoomTransform = d3.zoomIdentity
let zoomBehavior = null

const selectedId = computed(() =>
  main.getVariant && main.getVariant.id != null ? main.getVariant.id : null
)

const consequenceLegend = computed(() => props.consequences.map(c => ({
  name: c.name,
  color: c.color
})))

const consequenceColor = computed(() => {
  const dict = {}
  for (const c of props.consequences) dict[c.name] = c.color
  return dict
})

// --------------------------------------------------------------- helpers ----
function aaChangeLabel (d) {
  const letters = (d.aa_change || '').split('/')
  return `${letters[0] || ''}${d.aa_pos}${letters[1] || ''}`
}

function variantConsequences (d) {
  const names = props.consequences.map(c => c.name)
  return (d.consequences || []).filter(c => names.includes(c))
}

function primaryColor (d) {
  const cs = variantConsequences(d)
  return cs.length ? consequenceColor.value[cs[0]] : '#7a8499'
}

function presentDatabases (d) {
  return DATABASES.filter(db => d[`${db.key}_${main.getVersion}`] === true)
}

// --------------------------------------------------------------- tooltip ----
function moveTip (event) {
  const el = tipRef.value
  if (!el || el.getAttribute('aria-hidden') === 'true') return
  const root = rootRef.value.getBoundingClientRect()
  const tw = el.offsetWidth
  const th = el.offsetHeight
  let x = event.clientX - root.left + 16
  let y = event.clientY - root.top + 16
  if (x + tw > root.width) x = event.clientX - root.left - tw - 16
  if (y + th > root.height) y = event.clientY - root.top - th - 16
  x = Math.max(4, x)
  y = Math.max(4, y)
  el.style.transform = `translate(${x}px, ${y}px)`
}

function showVariantTip (event, d) {
  const el = tipRef.value
  if (!el) return
  const cons = variantConsequences(d)
  const dbs = presentDatabases(d)
  el.innerHTML = `
    <div class="vp-tip-title">${aaChangeLabel(d)}</div>
    <dl class="vp-tip-dl">
      <dt>Consequence</dt><dd>${cons.length ? cons.join(', ') : '—'}</dd>
      <dt>Protein pos</dt><dd>${d.aa_pos}</dd>
      <dt>Genomic</dt><dd>chr${d.chr}:${d.pos} ${d.ref}&rsaquo;${d.alt}</dd>
      <dt>Samples</dt><dd>${(d.samples || []).length}</dd>
      <dt>Databases</dt><dd>${dbs.length ? dbs.map(x => x.label).join(', ') : 'none'}</dd>
    </dl>`
  el.setAttribute('aria-hidden', 'false')
  moveTip(event)
}

function showDomainTip (event, d) {
  const el = tipRef.value
  if (!el) return
  el.innerHTML = `
    <div class="vp-tip-title">${d.name}</div>
    <dl class="vp-tip-dl">
      <dt>Family</dt><dd>${d.family || '—'}</dd>
      <dt>Range</dt><dd>${d.start}&ndash;${d.end}</dd>
    </dl>`
  el.setAttribute('aria-hidden', 'false')
  moveTip(event)
}

function hideTip () {
  const el = tipRef.value
  if (el) el.setAttribute('aria-hidden', 'true')
}

// ------------------------------------------------------------ recalculate ----
function recalculate () {
  if (props.mutations.length) {
    data.value = calculatePositions({
      width: innerRight.value - innerLeft.value,
      transAASize: props.proteinAASize,
      leftMargin: 0,
      data: props.mutations,
      radius: props.radius
    })
  } else {
    data.value = []
  }
  draw()
}

// ----------------------------------------------------------------- draw -----
function draw () {
  if (!svg.value) return
  const t = d3.transition().duration(420).ease(d3.easeCubicOut)
  const xScale = zoomTransform.rescaleX(baseScale.value)
  // Variant marker x in zoomed space (markers keep their anti-overlap offset
  // relative to the protein anchor).
  const markerX = d =>
    xScale(d.aa_pos) + (d.position - d.protein_position)

  drawDefs()
  drawBackground()
  drawAxis(xScale, t)
  drawGuides(t)
  drawBackbone(xScale, t)
  drawDomains(xScale, t)
  drawLollipops(xScale, markerX, t)
  drawDatabaseTracks(xScale, markerX, t)
}

function drawDefs () {
  let defs = svg.value.selectAll('defs').data([null])
  defs = defs.enter().append('defs').merge(defs)
  const clip = defs.selectAll('#vp-clip').data([null])
  const clipEnter = clip.enter().append('clipPath').attr('id', 'vp-clip')
  clipEnter.append('rect')
  // The clip keeps markers from spilling over the left track-label gutter, but
  // it must not bisect the circle of the first or last variant. Bleed left by
  // a marker's radius (+halo) and extend right to the SVG edge — the right
  // padding (PAD_R) is blank space, so a full end circle has room to render.
  const bleed = props.radius + 6
  clipEnter.merge(clip).select('rect')
    .attr('x', innerLeft.value - bleed)
    .attr('y', 0)
    .attr('width', Math.max(0, width.value - (innerLeft.value - bleed)))
    .attr('height', grouperHeight.value)
}

// Explicit white background rect — keeps PNG/SVG exports on a clean surface
// (the SVG element's CSS background does not serialize into a standalone file).
function drawBackground () {
  const bg = svg.value.selectAll('rect.vp-bg').data([null])
  bg.enter().insert('rect', ':first-child')
    .attr('class', 'vp-bg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', PALETTE.surface)
    .merge(bg)
    .attr('width', width.value)
    .attr('height', grouperHeight.value)
}

function drawAxis (xScale, t) {
  let g = svg.value.selectAll('g.vp-axis').data([null])
  g = g.enter().append('g').attr('class', 'vp-axis').merge(g)
    .attr('transform', `translate(0,${axisY + AXIS_H - 4})`)
    .attr('clip-path', 'url(#vp-clip)')

  const axis = d3.axisTop(xScale)
    .ticks(Math.max(2, Math.round((innerRight.value - innerLeft.value) / 110)))
    .tickSize(4)
    .tickPadding(6)
  g.transition(t).call(axis)
  g.select('.domain').remove()
  g.selectAll('text')
    .attr('class', 'vp-axis-label')
    .attr('fill', PALETTE.ink3)
    .attr('font-family', '"IBM Plex Mono", ui-monospace, monospace')
    .attr('font-size', 10)
  g.selectAll('line')
    .attr('class', 'vp-axis-tick')
    .attr('stroke', PALETTE.borderStrong)
}

function drawGuides (t) {
  // Hairline separator framing the database-track block.
  let line = svg.value.selectAll('line.vp-sep').data([null])
  line = line.enter().append('line')
    .attr('class', 'vp-sep')
    .attr('stroke', PALETTE.border)
    .merge(line)
  line.transition(t)
    .attr('x1', 8).attr('x2', innerRight.value)
    .attr('y1', dbHeadY.value).attr('y2', dbHeadY.value)

  // Track-area caption — sits in its own strip above the tracks.
  const lbl = svg.value.selectAll('text.vp-band-label').data([null])
  lbl.enter().append('text')
    .attr('class', 'vp-band-label')
    .attr('fill', PALETTE.ink3)
    .attr('font-family', '"Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif')
    .attr('font-size', 10.5)
    .attr('font-weight', 600)
    .attr('letter-spacing', '0.08em')
    .merge(lbl)
    .attr('x', 8).attr('y', dbHeadY.value + DB_HEAD_H - 8)
    .text('DATABASE PRESENCE')
}

function drawBackbone (xScale, t) {
  let g = svg.value.selectAll('g.vp-backbone').data([null])
  g = g.enter().append('g').attr('class', 'vp-backbone')
    .attr('clip-path', 'url(#vp-clip)').merge(g)

  let bar = g.selectAll('rect').data([null])
  bar = bar.enter().append('rect')
    .attr('class', 'vp-protein-bar')
    .attr('fill', PALETTE.surface3)
    .attr('stroke', PALETTE.borderStrong)
    .merge(bar)
  bar.transition(t)
    .attr('x', xScale(0))
    .attr('y', backboneY.value - 4)
    .attr('width', Math.max(0, xScale(props.proteinAASize) - xScale(0)))
    .attr('height', 8)
    .attr('rx', 4)
}

function drawDomains (xScale, t) {
  let g = svg.value.selectAll('g.vp-domains').data([null])
  g = g.enter().append('g').attr('class', 'vp-domains')
    .attr('clip-path', 'url(#vp-clip)').merge(g)

  const sched = groups.value.schedule
  const domainY = d => domainsTop.value + (sched[d.id] - 1) * DOMAIN_ROW_H

  const cells = g.selectAll('g.vp-domain').data(props.domains, d => d.id)
  cells.exit().transition(t).style('opacity', 0).remove()

  const enter = cells.enter().append('g')
    .attr('class', 'vp-domain')
    .style('opacity', 0)
    .attr('tabindex', 0)
    .attr('role', 'img')
    .on('mouseover', showDomainTip)
    .on('mousemove', moveTip)
    .on('mouseout', hideTip)
    .on('focus', function (event, d) {
      const r = this.getBoundingClientRect()
      showDomainTip({ clientX: r.left + r.width / 2, clientY: r.top }, d)
    })
    .on('blur', hideTip)
  enter.append('rect')
    .attr('class', 'vp-domain-rect')
    .attr('stroke', 'rgba(17, 24, 39, 0.16)')
  enter.append('text')
    .attr('class', 'vp-domain-label')
    .attr('fill', '#ffffff')
    .attr('font-family', '"Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif')
    .attr('font-size', 10)
    .attr('font-weight', 600)
    .attr('paint-order', 'stroke')
    .attr('stroke', 'rgba(17, 24, 39, 0.32)')
    .attr('stroke-width', 2.2)

  const all = enter.merge(cells)
  all.select('title').remove()
  all.append('title').text(d => `${d.name} (${d.start}–${d.end})`)
  all.transition(t).style('opacity', 1)

  all.select('rect.vp-domain-rect')
    .attr('fill', d => d.color)
    .transition(t)
    .attr('x', d => xScale(d.start))
    .attr('y', d => domainY(d))
    .attr('width', d => Math.max(2, xScale(d.end) - xScale(d.start)))
    .attr('height', DOMAIN_ROW_H - 4)
    .attr('rx', 4)

  all.select('text.vp-domain-label')
    .text(d => d.name)
    .attr('y', d => domainY(d) + (DOMAIN_ROW_H - 4) / 2 + 3)
    .transition(t)
    .attr('x', d => xScale(d.start) + 6)
    .each(function (d) {
      // Hide the label when the block is too narrow to host it.
      const w = xScale(d.end) - xScale(d.start)
      d3.select(this).attr('display', w > 34 ? null : 'none')
      truncateText(this, w - 12)
    })
}

function truncateText (node, maxWidth) {
  const sel = d3.select(node)
  const full = sel.text()
  if (maxWidth <= 0) { sel.text(''); return }
  let text = full
  sel.text(text)
  while (text.length > 1 && node.getComputedTextLength() > maxWidth) {
    text = text.slice(0, -1)
    sel.text(text + '…')
  }
}

function drawLollipops (xScale, markerX, t) {
  let g = svg.value.selectAll('g.vp-lollis').data([null])
  g = g.enter().append('g').attr('class', 'vp-lollis')
    .attr('clip-path', 'url(#vp-clip)').merge(g)

  // Sample-count drives head height up the band (log10 buckets). The band is
  // LOLLI_H tall; heads step up in even tiers and never reach the label strip.
  const lvl = d => Math.min(3, Math.floor(Math.log10(Math.max(1, (d.samples || []).length))))
  const headY = d => backboneY.value - LOLLI_TIER_H - lvl(d) * LOLLI_TIER_H

  const items = g.selectAll('g.vp-lolli').data(data.value, d => d.id)
  items.exit().transition(t).style('opacity', 0).remove()

  const enter = items.enter().append('g')
    .attr('class', 'vp-lolli')
    .style('opacity', 0)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', d => `Variant ${aaChangeLabel(d)}`)
    .on('mouseover', showVariantTip)
    .on('mousemove', moveTip)
    .on('mouseout', hideTip)
    .on('click', (event, d) => {
      event.stopPropagation()
      main.setVariant(d)
    })
    .on('focus', function (event, d) {
      main.setVariant(d)
      const r = this.getBoundingClientRect()
      showVariantTip({ clientX: r.left + r.width / 2, clientY: r.top }, d)
    })
    .on('blur', hideTip)
    .on('keydown', function (event) {
      if (event.key === 'ArrowRight' && this.nextElementSibling) {
        this.nextElementSibling.focus()
      } else if (event.key === 'ArrowLeft' && this.previousElementSibling) {
        this.previousElementSibling.focus()
      } else if (event.key === 'Escape') {
        main.clearVariant()
      }
    })

  // anchor connector — head → backbone (a refined "lollipop").
  enter.append('polyline')
    .attr('class', 'vp-stem')
    .attr('fill', 'none')
    .attr('stroke-linejoin', 'round')
  enter.append('circle')
    .attr('class', 'vp-halo')   // selection ring
    .attr('fill', 'none')
  enter.append('circle')
    .attr('class', 'vp-head')
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1.5)
  enter.append('text')
    .attr('class', 'vp-lolli-label')
    .attr('font-family', '"IBM Plex Mono", ui-monospace, monospace')
    .attr('font-size', 9.5)
    .attr('text-anchor', 'start')

  const all = enter.merge(items)
  all.transition(t).style('opacity', 1)
  all.classed('is-selected', d => d.id === selectedId.value)

  const isSel = d => d.id === selectedId.value

  all.select('polyline.vp-stem')
    .attr('stroke', d => (isSel(d) ? PALETTE.accent : PALETTE.borderStrong))
    .attr('stroke-width', d => (isSel(d) ? 2 : 1.5))
    .transition(t)
    .attr('points', d => {
      const mx = markerX(d)
      const ax = xScale(d.aa_pos)
      return `${mx},${headY(d)} ${mx},${backboneY.value - 14} ${ax},${backboneY.value - 4}`
    })

  all.select('circle.vp-halo')
    .attr('stroke', d => (isSel(d) ? PALETTE.accent : 'none'))
    .attr('stroke-width', 2.5)
    .transition(t)
    .attr('cx', d => markerX(d))
    .attr('cy', d => headY(d))
    .attr('r', props.radius + 4)

  all.select('circle.vp-head')
    .attr('fill', d => primaryColor(d))
    .transition(t)
    .attr('cx', d => markerX(d))
    .attr('cy', d => headY(d))
    .attr('r', props.radius)

  // ---- variant labels: density-aware thinning ----------------------------
  // At the default (un-zoomed) view dense regions would collide into an
  // unreadable mass. Rather than drawing every label, we sweep markers left
  // → right and keep a label only when its anchor clears a minimum pixel
  // spacing from the last kept label. The selected variant is always kept.
  // Hidden labels stay reachable via the hover tooltip and zoom — zooming in
  // spreads markers apart, so progressively more labels qualify.
  const LABEL_MIN_GAP = 30
  const sorted = data.value
    .map(d => ({ d, x: markerX(d) }))
    .sort((a, b) => a.x - b.x)
  const labelVisible = {}
  let lastLabelX = -Infinity
  for (const { d, x } of sorted) {
    const keep = d.id === selectedId.value || x - lastLabelX >= LABEL_MIN_GAP
    labelVisible[d.id] = keep
    if (keep) lastLabelX = x
  }

  all.select('text.vp-lolli-label')
    .text(d => aaChangeLabel(d))
    .attr('fill', d => (isSel(d) ? PALETTE.accent : PALETTE.ink3))
    .attr('font-weight', d => (isSel(d) ? 600 : 400))
    .attr('display', d => (labelVisible[d.id] ? null : 'none'))
    .transition(t)
    .attr('x', d => markerX(d) + 3)
    .attr('y', d => headY(d) - props.radius - 7)
    .attr('transform', d => {
      const lx = markerX(d) + 3
      const ly = headY(d) - props.radius - 7
      return `rotate(-42 ${lx} ${ly})`
    })
}

function drawDatabaseTracks (xScale, markerX, t) {
  let g = svg.value.selectAll('g.vp-dbtracks').data([null])
  g = g.enter().append('g').attr('class', 'vp-dbtracks').merge(g)

  const rows = g.selectAll('g.vp-dbrow').data(DATABASES, d => d.key)
  const rowEnter = rows.enter().append('g').attr('class', 'vp-dbrow')
  // Zebra background band — makes each track easy to scan across.
  rowEnter.append('rect')
    .attr('class', 'vp-dbrow-bg')
  rowEnter.append('line')
    .attr('class', 'vp-dbrow-base')
    .attr('stroke', PALETTE.border)
  rowEnter.append('text')
    .attr('class', 'vp-dbrow-label')
    .attr('fill', PALETTE.ink2)
    .attr('font-family', '"IBM Plex Mono", ui-monospace, monospace')
    .attr('font-size', 10.5)
    .attr('font-weight', 600)
    .attr('text-anchor', 'end')
  const rowAll = rowEnter.merge(rows)

  rowAll.each(function (db, rowIdx) {
    const rowG = d3.select(this)
    const rowTop = dbTop.value + rowIdx * DB_ROW_H
    const cy = rowTop + DB_ROW_H / 2

    rowG.select('rect.vp-dbrow-bg')
      .attr('x', 8)
      .attr('y', rowTop)
      .attr('width', Math.max(0, innerRight.value - 8))
      .attr('height', DB_ROW_H)
      .attr('rx', 7)
      .attr('fill', rowIdx % 2 === 0 ? PALETTE.surface : '#f5f7fa')

    rowG.select('line.vp-dbrow-base')
      .transition(t)
      .attr('x1', innerLeft.value).attr('x2', innerRight.value)
      .attr('y1', cy).attr('y2', cy)

    rowG.select('text.vp-dbrow-label')
      .attr('y', cy + 4)
      .attr('x', PAD_L - 14)
      .text(dbNameFormat(db.label))

    // Presence marks — clipped to the protein extent.
    let marksG = rowG.selectAll('g.vp-dbmarks').data([null])
    marksG = marksG.enter().append('g').attr('class', 'vp-dbmarks')
      .attr('clip-path', 'url(#vp-clip)').merge(marksG)

    const isPresent = d => d[`${db.key}_${main.getVersion}`] === true
    const isSel = d => d.id === selectedId.value

    const marks = marksG.selectAll('circle').data(data.value, d => d.id)
    marks.exit().transition(t).style('opacity', 0).remove()
    const mEnter = marks.enter().append('circle')
      .attr('class', 'vp-dbmark')
      .attr('stroke-width', 1.4)
      .style('opacity', 0)
      .on('mouseover', showVariantTip)
      .on('mousemove', moveTip)
      .on('mouseout', hideTip)
      .on('click', (event, d) => { event.stopPropagation(); main.setVariant(d) })

    mEnter.merge(marks)
      .classed('is-present', isPresent)
      .classed('is-selected', isSel)
      .attr('fill', d => (isPresent(d) ? PALETTE.pathogenic : PALETTE.surface))
      .attr('stroke', d => {
        if (isSel(d)) return PALETTE.accent
        return isPresent(d) ? PALETTE.pathogenic : PALETTE.borderStrong
      })
      .attr('stroke-width', d => (isSel(d) ? 2.2 : 1.4))
      .style('opacity', 1)
      .transition(t)
      .attr('cx', d => markerX(d))
      .attr('cy', cy)
      .attr('r', 5.5)
  })
}

// ------------------------------------------------------------------ zoom ----
function setupZoom () {
  zoomBehavior = d3.zoom()
    .scaleExtent([1, 24])
    .translateExtent([[innerLeft.value, 0], [innerRight.value, grouperHeight.value]])
    .extent([[innerLeft.value, 0], [innerRight.value, grouperHeight.value]])
    .filter(event => !event.button && (event.type !== 'wheel' || !event.ctrlKey))
    .on('zoom', (event) => {
      zoomTransform = event.transform
      draw()
    })
  svg.value
    .call(zoomBehavior)
    .on('dblclick.zoom', null)
    // Click on empty canvas (the svg itself or its background rect, i.e. no
    // variant / domain hit) clears the current selection.
    .on('click', (event) => {
      const tgt = event.target
      if (tgt === svgRef.value || (tgt.classList && tgt.classList.contains('vp-bg'))) {
        main.clearVariant()
      }
    })
}

function zoomBy (k) {
  if (!zoomBehavior) return
  svg.value.transition().duration(260).call(zoomBehavior.scaleBy, k)
}

function zoomReset () {
  if (!zoomBehavior) return
  svg.value.transition().duration(320).call(zoomBehavior.transform, d3.zoomIdentity)
}

// ---------------------------------------------------------- responsive ------
let resizeObserver = null

function measure () {
  const host = scrollRef.value
  if (!host) return
  const w = host.clientWidth
  if (w > 0) width.value = Math.max(420, w)
}

onMounted(() => {
  svg.value = markRaw(d3.select(svgRef.value))
  measure()
  setupZoom()
  recalculate()

  resizeObserver = new ResizeObserver(() => {
    const before = width.value
    measure()
    if (width.value !== before) {
      // Re-anchor zoom extents to the new width.
      zoomBehavior
        .translateExtent([[innerLeft.value, 0], [innerRight.value, grouperHeight.value]])
        .extent([[innerLeft.value, 0], [innerRight.value, grouperHeight.value]])
      recalculate()
    }
  })
  resizeObserver.observe(scrollRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  resizeObserver = null
})

// Recompute layout + redraw whenever the inputs change.
//
// A shallow (identity) watch is sufficient here — `deep: true` is deliberately
// NOT used. The pre-Vue3 (2019) code never deep-watched these either; the flag
// was added as a blanket default during the Vue3 migration and is pure cost on
// large variant arrays.
//
// `mutations`, `domains` and `consequences` are all supplied by MainCard as
// Pinia `.filter()` getters (getStatusVariants / getStatusDomains /
// getStatusConsequences). `Array.prototype.filter` returns a brand-new array on
// every getter evaluation, so ANY content change — adding a variant, toggling a
// domain/consequence status or recoloring one — yields a new array identity.
// There is no in-place same-identity mutation path a shallow watch could miss:
// HandleMutations builds fresh objects via Object.assign/map, and interval
// Partition only ever sorts a defensive `[...props.domains]` copy. `proteinAA
// Size` is a primitive. Watching identity therefore redraws on exactly the same
// triggers as before, without paying for deep traversal.
watch(
  [
    () => props.mutations,
    () => props.domains,
    () => props.consequences,
    () => props.proteinAASize
  ],
  () => nextTick(recalculate)
)

// Re-style on selection change without a full recompute.
watch(() => main.getVariant, () => { if (svg.value) draw() }, { deep: true })
</script>
