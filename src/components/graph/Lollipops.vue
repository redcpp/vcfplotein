<script>
// Renderless D3 component. The OLD Vue-2 file used `render: (h) => h()`, which
// is invalid in Vue 3. Re-architected as a proper SFC whose `setup()` returns a
// render function `() => null` so it renders nothing of its own but still
// participates in the component lifecycle and reacts to prop/store changes.
import * as d3 from 'd3'
import { watch, onMounted } from 'vue'
import { useMainStore } from '@/stores/main'

const HEIGHT = 100

const SCALE = d3.scaleLinear()
  .domain([0, 3])
  .range([0, 50])

export default {
  name: 'Lollipops',
  props: {
    data: { type: Array, required: true },
    cons: { type: Array, required: true },
    // d3 selection of the root <svg>, markRaw'd by SvgGrouper.
    container: { type: Object, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    radius: { type: Number, required: true },
    leftMargin: { type: Number, required: true }
  },
  setup (props) {
    const main = useMainStore()

    const consequenceNames = () => props.cons.map((c) => c.name)

    const colorcons = () => {
      const dict = {}
      for (const con of props.cons) {
        dict[con.name] = con.color
      }
      return dict
    }

    const validConsequences = (d) => {
      const names = consequenceNames()
      return d.consequences.filter((dc) => names.includes(dc))
    }

    const level = (d) => SCALE(Math.floor(Math.log10(Math.max(d.samples.length, 1))))

    function createSemaforo ({ d, group }) {
      const x = d.position + props.leftMargin
      const colors = colorcons()
      const semaforo = group.selectAll('circle').data(validConsequences(d))
      semaforo.exit().remove()
      semaforo
        .enter()
        .append('circle')
        .attr('r', props.radius)
        .merge(semaforo)
        .attr('fill', (c) => colors[c])
        .attr('cy', (c, i) => (HEIGHT - level(d) - props.radius * 2 * i))
        .attr('cx', () => x)
    }

    function createTriangulo ({ d, group }) {
      const triangle = d3.symbol()
        .type(d3.symbolTriangle)
        .size(75)

      const triangulo = group.selectAll('path').data([d])
      triangulo.exit().remove()
      triangulo
        .enter()
        .append('path')
        .attr('fill', 'white')
        .attr('stroke', (dd) => (dd.type === 'insertion' ? 'green' : 'red'))
        .attr('stroke-width', 2)
        .attr('d', triangle)
        .merge(triangulo)
        .attr('transform', (dd) => {
          return 'translate('
            + (dd.position + props.leftMargin)
            + ','
            + HEIGHT
            + ') rotate('
            + (dd.type === 'insertion' ? '-180' : '0')
            + ')'
        })
    }

    function createResponsiveComponent () {
      if (!props.container || typeof props.container.selectAll !== 'function') {
        return
      }

      const { width, data, radius, leftMargin, container } = props
      const mainvar = main.getVariant
      const svgHeight = 130

      let svg = container.selectAll('svg.lollipops').data([null])
      svg = svg
        .enter()
        .append('svg')
        .attr('class', 'lollipops')
        .merge(svg)
        .attr('width', width)
        .attr('height', svgHeight)

      const lollipopText = svg.selectAll('text').data(data)
      lollipopText.exit().remove()
      lollipopText
        .enter()
        .append('text')
        .attr('font-size', '0.75em')
        .attr('style', 'letter-spacing: 3px;')
        .attr('y', () => HEIGHT + radius - 12)
        .merge(lollipopText)
        .attr('fill', (d) => (mainvar && d.id === mainvar.id ? 'red' : '#000'))
        .attr('transform', (d) => `rotate(-90 ${d.position + leftMargin}, 90)`)
        .attr('x', (d) => {
          return d.position
            + leftMargin
            + level(d)
            + Math.max(0, validConsequences(d).length - 1) * radius * 2
        })
        .text((d) => {
          const letters = d.aa_change.split('/')
          return `${letters[0]}${d.aa_pos}${(letters[1] || '')}`
        })

      const lollipopStick = svg.selectAll('polyline').data(data)
      lollipopStick.exit().remove()
      lollipopStick
        .enter()
        .append('polyline')
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .style('stroke-line-join', 'round')
        .merge(lollipopStick)
        .attr('stroke', (d) => (mainvar && d.id === mainvar.id ? 'red' : '#777'))
        .attr('points', (d) => {
          return `
            ${leftMargin + d.position}, ${HEIGHT + radius - level(d)},
            ${leftMargin + d.position}, ${HEIGHT + radius + 10},
            ${leftMargin + d.protein_position}, ${svgHeight - 10},
            ${leftMargin + d.protein_position}, ${svgHeight}
          `
        })

      const groups = svg.selectAll('g').data(data, (d) => d.id)
      groups.exit().remove()
      groups
        .enter()
        .append('g')
        .attr('class', 'pointer')
        .attr('role', 'button')
        .attr('tabindex', '0')
        .attr('focusable', 'true')
        // D3 v6+: the event is the FIRST argument. Leaving `(d) => ...` here
        // would silently store the DOM Event into the store instead of the
        // datum, corrupting `main.variant`.
        .on('focus', (event, d) => main.setVariant(d))
        .on('focusout', () => main.clearVariant())
        .on('keypress', (event) => {
          if (event.key === 'ArrowLeft' || event.keyCode === 37) {
            if (event.target.previousElementSibling) {
              event.target.previousElementSibling.focus()
            }
          } else if (event.key === 'ArrowRight' || event.keyCode === 39) {
            if (event.target.nextElementSibling) {
              event.target.nextElementSibling.focus()
            }
          }
        })
        .merge(groups)
        // .each() callbacks are NOT affected by the v6 event change.
        .each(function (d) {
          if (d.type === 'variant') {
            createSemaforo({ d, group: d3.select(this) })
          } else {
            createTriangulo({ d, group: d3.select(this) })
          }
        })
    }

    onMounted(createResponsiveComponent)

    watch(
      [
        () => main.getVariant,
        () => props.width,
        () => props.data,
        () => props.cons
      ],
      createResponsiveComponent,
      { deep: true }
    )

    // Renderless: produce no DOM of its own.
    return () => null
  }
}
</script>
