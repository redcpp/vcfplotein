/**
 * Synthetic VCF generator — performance fixtures for vcfplotein.
 *
 * Produces a structurally valid VCF (VCFv4.2) with realistic line lengths so
 * the parser is stressed the way a real top-5%-by-size upload would stress it.
 *
 * Usage:
 *   node tools/gen-vcf.js --out tmp/big.vcf --variants 6500000 --samples 1 --version 37
 *   node tools/gen-vcf.js --out tmp/cohort.vcf --variants 120000 --samples 250 --version 37
 *
 * Then gzip for the compressed-path fixture:
 *   gzip -k tmp/big.vcf            # plain single-member gzip (pako-decodable)
 *
 * Notes
 * -----
 * - CHROM cycles 1..22,X,Y. POS strictly increases per chromosome so the file
 *   resembles a sorted, GATK-style single-sample WGS callset.
 * - INFO / FORMAT fields carry realistic content and length (~190 B/line for a
 *   single sample) — the file size is dominated by genuine payload, not padding.
 * - Deterministic via a small LCG so runs are reproducible.
 * - Streams output with backpressure handling; constant memory regardless of N.
 */

import fs from 'node:fs'
import path from 'node:path'

// ----------------------------------------------------------------- args -----
function parseArgs (argv) {
  const args = { out: 'tmp/big.vcf', variants: 6500000, samples: 1, version: 37 }
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '')
    const val = argv[i + 1]
    if (key === 'out') args.out = val
    else if (key === 'variants') args.variants = parseInt(val, 10)
    else if (key === 'samples') args.samples = parseInt(val, 10)
    else if (key === 'version') args.version = parseInt(val, 10)
    else throw new Error(`Unknown arg: --${key}`)
  }
  return args
}

// --------------------------------------------------------- deterministic ----
// Tiny LCG (numerical recipes constants) — fast, reproducible, good enough.
let seed = 0x2545f4914f6cdd1dn
function rand () {
  seed = (seed * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn
  return Number((seed >> 11n) & 0x1fffffffffffffn) / 9007199254740992
}
function pick (arr) { return arr[Math.floor(rand() * arr.length)] }

// ------------------------------------------------------------- content ------
const CHROMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', 'X', 'Y']
const BASES = ['A', 'C', 'G', 'T']
const GENOTYPES = ['0/1', '1/1', '0/1', '0/1', '1/1', './.']
const FILTERS = ['PASS', 'PASS', 'PASS', 'LowQual']

function snvOrIndel () {
  const r = rand()
  if (r < 0.88) {
    // SNV
    const ref = pick(BASES)
    let alt = pick(BASES)
    while (alt === ref) alt = pick(BASES)
    return { ref, alt }
  } else if (r < 0.94) {
    // insertion
    const ref = pick(BASES)
    return { ref, alt: ref + pick(BASES) + pick(BASES) }
  } else {
    // deletion
    const a = pick(BASES)
    return { ref: a + pick(BASES) + pick(BASES), alt: a }
  }
}

function infoField () {
  const dp = 20 + Math.floor(rand() * 80)
  const af = (rand() * 0.5 + 0.25).toFixed(3)
  const qd = (rand() * 25 + 2).toFixed(2)
  const fs = (rand() * 8).toFixed(3)
  const mq = (rand() * 5 + 56).toFixed(2)
  const sor = (rand() * 2).toFixed(3)
  return `AC=1;AF=${af};AN=2;BaseQRankSum=0.358;DP=${dp};ExcessHet=3.0103;` +
    `FS=${fs};MLEAC=1;MLEAF=${af};MQ=${mq};MQRankSum=0.00;QD=${qd};` +
    `ReadPosRankSum=0.431;SOR=${sor}`
}

function sampleField () {
  const gt = pick(GENOTYPES)
  if (gt === './.') return './.:0,0:0:.:0,0,0'
  const a = 8 + Math.floor(rand() * 30)
  const b = 8 + Math.floor(rand() * 30)
  const dp = a + b
  const gq = 20 + Math.floor(rand() * 79)
  return `${gt}:${a},${b}:${dp}:${gq}:${dp * 20},0,${dp * 19}`
}

// -------------------------------------------------------------- header ------
function header (samples, version) {
  const ref = version === 38
    ? '##reference=file:///ref/GRCh38/GRCh38_full_analysis_set.fasta'
    : '##reference=file:///ref/b37/human_g1k_v37.fasta'
  const lines = [
    '##fileformat=VCFv4.2',
    '##FILTER=<ID=LowQual,Description="Low quality">',
    '##FILTER=<ID=PASS,Description="All filters passed">',
    '##INFO=<ID=AC,Number=A,Type=Integer,Description="Allele count">',
    '##INFO=<ID=AF,Number=A,Type=Float,Description="Allele frequency">',
    '##INFO=<ID=DP,Number=1,Type=Integer,Description="Depth">',
    '##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">',
    '##FORMAT=<ID=AD,Number=R,Type=Integer,Description="Allelic depths">',
    '##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read depth">',
    '##FORMAT=<ID=GQ,Number=1,Type=Integer,Description="Genotype quality">',
    '##FORMAT=<ID=PL,Number=G,Type=Integer,Description="Phred likelihoods">',
    ref
  ]
  const sampleCols = []
  for (let i = 0; i < samples; i++) sampleCols.push(`SAMPLE_${i + 1}`)
  lines.push(['#CHROM', 'POS', 'ID', 'REF', 'ALT', 'QUAL', 'FILTER', 'INFO',
    'FORMAT', ...sampleCols].join('\t'))
  return lines.join('\n') + '\n'
}

// --------------------------------------------------------------- main -------
async function main () {
  const args = parseArgs(process.argv)
  const outPath = path.resolve(args.out)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })

  const ws = fs.createWriteStream(outPath)
  const write = (chunk) => new Promise((resolve) => {
    if (ws.write(chunk)) resolve()
    else ws.once('drain', resolve)
  })

  await write(header(args.samples, args.version))

  const perChrom = Math.ceil(args.variants / CHROMS.length)
  let buf = ''
  let written = 0
  const t0 = Date.now()

  for (let c = 0; c < CHROMS.length; c++) {
    const chrom = CHROMS[c]
    let pos = 10000 + Math.floor(rand() * 50000)
    for (let i = 0; i < perChrom && written < args.variants; i++) {
      pos += 1 + Math.floor(rand() * 600)
      const { ref, alt } = snvOrIndel()
      const qual = (rand() * 2000).toFixed(2)
      let line = `${chrom}\t${pos}\trs${chrom}_${pos}\t${ref}\t${alt}\t` +
        `${qual}\t${pick(FILTERS)}\t${infoField()}\tGT:AD:DP:GQ:PL`
      for (let s = 0; s < args.samples; s++) line += '\t' + sampleField()
      buf += line + '\n'
      written++
      if (buf.length >= (1 << 20)) { await write(buf); buf = '' }
    }
  }
  if (buf) await write(buf)
  await new Promise((resolve) => ws.end(resolve))

  const { size } = fs.statSync(outPath)
  const gb = (size / 1e9).toFixed(2)
  const secs = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`Wrote ${written.toLocaleString()} variants × ${args.samples} ` +
    `sample(s) -> ${outPath}`)
  console.log(`Size: ${gb} GB  |  ${secs}s`)
}

main().catch((err) => { console.error(err); process.exit(1) })
