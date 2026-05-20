<script>
// Renderless D3 component. The OLD Vue-2 file used `render: (h) => h()`, which
// is invalid in Vue 3. Re-architected as a proper SFC whose `setup()` returns a
// render function `() => null`.
//
// `d3-tip` has been removed from the project. The domain tooltip is now a
// hand-rolled plain DOM `<div class="d3-tip">` element appended to <body> and
// positioned on hover/focus. The `.d3-tip` styling lives in
// `src/assets/css/viz.css` (plain CSS, outside Tailwind's preflight).
//
// NOTE: d3 itself is not imported here — the d3 selection of the root <svg>
// arrives via the `container` prop, and the tooltip is plain DOM.
import { watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'DomainsExpanded',
  props: {
    data: { type: Array, required: true },
    domains: { type: Array, required: true },
    groups: { type: Object, required: true },
    mainvar: { type: Object, required: true },
    container: { type: Object, required: true },
    domainScale: { type: Function, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    spacing: { type: Number, required: true },
    leftMargin: { type: Number, required: true }
  },
  setup (props) {
    // --- Native tooltip replacement for d3-tip ---
    let tipEl = null

    function ensureTip () {
      if (!tipEl) {
        tipEl = document.createElement('div')
        tipEl.className = 'd3-tip'
        tipEl.style.position = 'absolute'
        tipEl.style.pointerEvents = 'none'
        tipEl.style.display = 'none'
        tipEl.style.zIndex = '1000'
        document.body.appendChild(tipEl)
      }
      return tipEl
    }

    function tipHtml (d) {
      return `<p class="my-1"><strong>Name:</strong> <span style='color:black'>${d.name}</span></p>`
        + `<p class="my-1"><strong>Family:</strong> <span style='color:${d.color}'>${d.family}</span></p>`
        + `<p class="my-1"><strong>Start:</strong> <span style='color:black'>${d.start}</span></p>`
        + `<p class="my-1"><strong>End:</strong> <span style='color:black'>${d.end}</span></p>`
    }

    function showTip (event, d) {
      const el = ensureTip()
      el.innerHTML = tipHtml(d)
      el.style.display = 'block'
      // Position above the hovered element.
      const rect = event.target.getBoundingClientRect()
      const top = rect.top + window.scrollY - el.offsetHeight - 8
      const left = rect.left + window.scrollX + rect.width / 2 - el.offsetWidth / 2
      el.style.top = `${top}px`
      el.style.left = `${left}px`
    }

    function hideTip () {
      if (tipEl) tipEl.style.display = 'none'
    }

    function createResponsiveComponent () {
      if (!props.container || typeof props.container.selectAll !== 'function') {
        return
      }

      const { width, data, leftMargin, domains, domainScale, container, groups, spacing, mainvar } = props
      const svgHeight = groups.num * spacing

      let svg = container.selectAll('svg.domainsexpanded').data([null])
      svg = svg
        .enter()
        .append('svg')
        .attr('class', 'domainsexpanded')
        .merge(svg)
        .attr('y', props.y)
        .attr('width', width)
        .attr('height', svgHeight)

      const domainSvg = svg.selectAll('rect').data(domains)
      domainSvg.exit().remove()
      domainSvg
        .enter()
        .append('rect')
        .attr('fill', (d) => d.color)
        .attr('height', () => (spacing - 3))
        .attr('class', 'pointer')
        .attr('role', 'button')
        .attr('tabindex', '0')
        .attr('focusable', 'true')
        // D3 v6+: event is the FIRST argument.
        .on('focus', (event, d) => showTip(event, d))
        .on('mouseover', (event, d) => showTip(event, d))
        .on('focusout', hideTip)
        .on('mouseout', hideTip)
        .on('keypress', (event) => {
          if (event.key === 'ArrowUp' || event.keyCode === 38) {
            if (event.target.previousElementSibling) {
              event.target.previousElementSibling.focus()
            }
          } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
            if (event.target.nextElementSibling) {
              event.target.nextElementSibling.focus()
            }
          }
        })
        .merge(domainSvg)
        .attr('x', (d) => domainScale(d.start))
        .attr('y', (d) => spacing * (groups.schedule[d.id] - 1))
        .attr('width', (d) => (domainScale(d.end) - domainScale(d.start)))
        .attr('fill', (d) => d.color)

      const stickSvg = svg.selectAll('polyline').data(data)
      stickSvg.exit().remove()
      stickSvg
        .enter()
        .append('polyline')
        .attr('stroke-width', 1)
        .style('fill', 'none')
        .style('stroke-linejoin', 'round')
        .merge(stickSvg)
        .attr('stroke', (d) => (mainvar && d.id === mainvar.id ? 'red' : '#777'))
        .attr('points', (d) => {
          return `
            ${leftMargin + d.protein_position}, 0,
            ${leftMargin + d.protein_position}, ${svgHeight}
          `
        })
    }

    onMounted(createResponsiveComponent)

    watch(
      [
        () => props.mainvar,
        () => props.width,
        () => props.data,
        () => props.domains
      ],
      createResponsiveComponent,
      { deep: true }
    )

    onUnmounted(() => {
      hideTip()
      if (tipEl && tipEl.parentNode) {
        tipEl.parentNode.removeChild(tipEl)
      }
      tipEl = null
    })

    // Renderless: produce no DOM of its own.
    return () => null
  }
}
</script>
