import Genes37 from '@/lib/data/genes_37.json'
import Genes38 from '@/lib/data/genes_38.json'
import GenesInfo from '@/lib/data/genes_info.json'

import LazyIntervalTree from 'interval-tree-type'

const version37 = { genes: Genes37, tree: new LazyIntervalTree(), built: false }
const version38 = { genes: Genes38, tree: new LazyIntervalTree(), built: false }

const constructTree = (obj) => {
  if (obj.built) { return }
  for (let i = 0; i < obj.genes.length; i++) {
    obj.tree.insert(
      obj.genes[i].start,
      obj.genes[i].end,
      Object.assign({
        treeId: i,
        id: obj.genes[i].id,
        start: obj.genes[i].start,
        end: obj.genes[i].end
      }, GenesInfo[obj.genes[i].id])
    )
  }
  obj.built = true
}

export const positionToName = ({ genes, version }) => {
  // There is no SSR — the interval tree is built lazily on first use.
  let obj = (version === 37 ? version37 : version38)
  constructTree(obj)

  let items = []
  let set = new Set()

  for (let i = 0; i < genes.length; i++) {
    for (const interval of obj.tree.queryPoint(genes[i].pos)) {
      if (interval.value.chr === genes[i].chrom && !set.has(interval.value.treeId)) {
        set.add(interval.value.treeId)
        items.push(interval.value)
      }
    }
  }

  return items
}
