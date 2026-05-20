<script>
// Renderless D3 component. The OLD Vue-2 file used `render: (h) => h()`, which
// is invalid in Vue 3. Re-architected as a proper SFC whose `setup()` returns a
// render function `() => null`.
//
// NOTE: the OLD file had a dead `import * as d3 from 'd3'` — d3 is never used
// here (the selection comes in via the `container` prop), so the import is
// dropped.
import { watch, onMounted } from 'vue'

export default {
  name: 'ProteinBar',
  props: {
    data: { type: Array, required: true },
    container: { type: Object, required: true },
    domainScale: { type: Function, required: true },
    proteinAASize: { type: Number, required: true },
    rightMargin: { type: Number, required: true },
    leftMargin: { type: Number, required: true },
    width: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  setup (props) {
    function createResponsiveComponent () {
      if (!props.container || typeof props.container.selectAll !== 'function') {
        return
      }

      const { width, container } = props
      const height = 15

      let svg = container.selectAll('svg.proteinbar').data([null])
      svg = svg
        .enter()
        .append('svg')
        .attr('class', 'proteinbar')
        .merge(svg)
        .attr('y', props.y)
        .attr('width', width)
        .attr('height', height)

      const proteinTrack = svg.selectAll('rect').data([null])
      proteinTrack
        .enter()
        .append('rect')
        .attr('y', 1) // allows border
        .attr('x', props.leftMargin)
        .attr('stroke', 'black')
        .attr('fill', '#eee')
        .merge(proteinTrack)
        .attr('height', height - 2)
        .attr('width', width - props.leftMargin - props.rightMargin)
    }

    onMounted(createResponsiveComponent)

    watch(
      [
        () => props.width,
        () => props.data
      ],
      createResponsiveComponent,
      { deep: true }
    )

    // Renderless: produce no DOM of its own.
    return () => null
  }
}
</script>
