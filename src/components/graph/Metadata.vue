<script>
// Renderless D3 component. The OLD Vue-2 file used `render: (h) => h()`, which
// is invalid in Vue 3. Re-architected as a proper SFC whose `setup()` returns a
// render function `() => null`.
//
// NOTE: the OLD file built a `d3.path()` via `createStick` that was never
// attached to the DOM — that dead code is dropped (so `d3.path` is unused).
import * as d3 from 'd3'
import { watch, onMounted } from 'vue'
import dbNameFormat from '@/lib/dbNameFormat'
import { useMainStore } from '@/stores/main'

export default {
  // `Metadata` is a reserved name (SVG <metadata> element) — use a
  // non-reserved component name; the file/import is still `Metadata.vue`.
  name: 'GraphMetadata',
  props: {
    data: { type: Array, required: true },
    mainvar: { type: Object, required: true },
    container: { type: Object, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    radius: { type: Number, required: true },
    version: { type: Number, required: true },
    leftMargin: { type: Number, required: true }
  },
  setup (props) {
    const main = useMainStore()

    const presentDB = (d, db) => {
      const name = db.name + '_' + props.version
      return (d[name] === true ? 'red' : 'white')
    }

    function createLeftDBTitle ({ db, data, group }) {
      const { leftMargin, radius, mainvar } = props

      const metaText = group.selectAll('text').data([null])
      metaText
        .enter()
        .append('text')
        .attr('x', 5)
        .attr('font-size', '1em')
        .attr('fill', '#000')
        .merge(metaText)
        .text(dbNameFormat(db.name))
        .attr('y', db.y + 5)

      const metaStick = group.selectAll('polyline').data(data)
      metaStick.exit().remove()
      metaStick
        .enter()
        .append('polyline')
        .attr('stroke-width', 1)
        .attr('stroke-linejoin', 'round')
        .style('fill', 'none')
        .merge(metaStick)
        .attr('stroke', (d) => (mainvar && d.id === mainvar.id ? 'red' : '#777'))
        .attr('points', (d) => {
          return `
            ${leftMargin + (db.name === 'gnomad' ? d.protein_position : d.position)},
            ${db.name === 'gnomad' ? 0 : db.y - 30 + radius},

            ${leftMargin + (db.name === 'gnomad' ? d.protein_position : d.position)},
            ${db.name === 'gnomad' ? 10 : db.y - 30 + radius},

            ${leftMargin + d.position},
            ${db.name === 'gnomad' ? 15 : db.y - radius},

            ${leftMargin + d.position}, ${db.y - radius}
          `
        })

      const side = 2 * radius - 2
      const metaSquare = group.selectAll('rect').data(data)
      metaSquare.exit().remove()
      metaSquare
        .enter()
        .append('rect')
        .attr('width', side)
        .attr('height', side)
        .attr('stroke-width', 1)
        .attr('stroke-linejoin', 'round')
        .attr('class', 'pointer')
        .attr('role', 'button')
        .attr('tabindex', '0')
        .attr('focusable', 'true')
        // D3 v6+: the event is the FIRST argument. Leaving `(d) => ...` here
        // would silently store the DOM Event into the store instead of the
        // datum, corrupting `main.variant`.
        .on('focus', (event, d) => main.setVariant(d))
        .on('focusout', () => main.clearVariant())
        .merge(metaSquare)
        .attr('y', () => (db.y - side / 2))
        .attr('x', (d) => (d.position + leftMargin - side / 2))
        .attr('fill', (d) => presentDB(d, db))
        .attr('stroke', (d) => (mainvar && d.id === mainvar.id ? 'red' : '#777'))
    }

    function createResponsiveComponent () {
      if (!props.container || typeof props.container.selectAll !== 'function') {
        return
      }

      const { width, data, container } = props
      const height = 180

      let svg = container.selectAll('svg.metadata').data([null])
      svg = svg
        .enter()
        .append('svg')
        .attr('class', 'metadata')
        .merge(svg)
        .attr('y', props.y)
        .attr('width', width)
        .attr('height', height)

      const databases = [
        { name: 'gnomad', y: 35 },
        { name: 'dbSnp', y: 65 },
        { name: 'clinvar', y: 95 },
        { name: 'cosmic', y: 125 }
      ]

      const groups = svg.selectAll('g').data(databases)
      groups.exit().remove()
      groups
        .enter()
        .append('g')
        .merge(groups)
        // .each() callbacks are NOT affected by the v6 event change.
        .each(function (db) {
          createLeftDBTitle({ db, data, group: d3.select(this) })
        })
    }

    onMounted(createResponsiveComponent)

    watch(
      [
        () => props.mainvar,
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
