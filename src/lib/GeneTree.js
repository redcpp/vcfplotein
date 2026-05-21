import LazyIntervalTree from 'interval-tree-type'

// ---------------------------------------------------------------------------
// Gene reference data (~14 MB total) is intentionally NOT imported as a JS
// module. It lives as plain `.json` under `public/data/` and is fetched at
// runtime, so:
//   - only the genome build actually in use (37 OR 38) is downloaded,
//   - `genes_info.json` (shared by both builds) is fetched once and reused,
//   - the payload is `JSON.parse`d by the browser instead of being parsed and
//     evaluated as a JS module, keeping it off the GeneTree chunk and off the
//     critical path.
// `import.meta.env.BASE_URL` keeps the URLs correct under any deploy `base`.
// ---------------------------------------------------------------------------

const dataUrl = (file) => `${import.meta.env.BASE_URL}data/${file}`

// Per-build lazy state. `genes` and `tree` are populated on first use.
const versions = {
  37: { genes: null, tree: null, built: false, file: 'genes_37.json' },
  38: { genes: null, tree: null, built: false, file: 'genes_38.json' }
}

// Shared gene-info map, fetched once and reused for either build.
let genesInfo = null
// In-flight fetch promises, so concurrent calls share a single download.
const genesPromises = {}
let genesInfoPromise = null

const fetchJson = async (file) => {
  const res = await fetch(dataUrl(file))
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

const loadGenes = (obj) => {
  if (obj.genes) { return Promise.resolve(obj.genes) }
  if (!genesPromises[obj.file]) {
    genesPromises[obj.file] = fetchJson(obj.file).then((data) => {
      obj.genes = data
      return data
    })
  }
  return genesPromises[obj.file]
}

const loadGenesInfo = () => {
  if (genesInfo) { return Promise.resolve(genesInfo) }
  if (!genesInfoPromise) {
    genesInfoPromise = fetchJson('genes_info.json').then((data) => {
      genesInfo = data
      return data
    })
  }
  return genesInfoPromise
}

// Build the interval tree lazily on first use for a given build. The ~20k
// inserts run synchronously here, but only once per build per session.
const constructTree = (obj) => {
  if (obj.built) { return }
  obj.tree = new LazyIntervalTree()
  for (let i = 0; i < obj.genes.length; i++) {
    obj.tree.insert(
      obj.genes[i].start,
      obj.genes[i].end,
      Object.assign({
        treeId: i,
        id: obj.genes[i].id,
        start: obj.genes[i].start,
        end: obj.genes[i].end
      }, genesInfo[obj.genes[i].id])
    )
  }
  obj.built = true
}

export const positionToName = async ({ genes, version }) => {
  // There is no SSR — the reference data is fetched and the interval tree is
  // built lazily on first use, only for the requested genome build.
  const obj = versions[version] || versions[38]

  // Fetch the build-specific genes and the shared gene-info map in parallel.
  await Promise.all([loadGenes(obj), loadGenesInfo()])
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
