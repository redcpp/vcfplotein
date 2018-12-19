<template>
  <base-titled-section title="Open VCF or Bookmark">
    <b-file v-model="file"
      :state="Boolean(file)"
      accept=".vcf, .vcf.gz, .json"
      placeholder="Browse files..."
      class="drag-drop d-flex align-items-stretch">
      <p>Drag your files here or click in this area.</p>
    </b-file>
    <small class="text-muted">
      Compressed files (.vcf.gz) work when their size is less than ~500MB.<br/>
      Otherwise, please upload an uncompressed file (.vcf)
    </small>
    <div class="mt-3">
      Selected file:<br>
      <span class="font-weight-bold">
        {{(file && file.name) || "None"}}
      </span>
    </div>
    <p class="mt-3" v-if="myFile">
      Reference genome: ({{myVersion}})
      <br>
      <span class="font-weight-bold">
        Human assembly {{myVersion === 37 ? 'GRCh37 (hg 19)' : 'GRCh38'}}
      </span>
    </p>
  </base-titled-section>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'

  export default {
    computed: {
      ...mapGetters({
        myFile: 'getFile',
        myVersion: 'getVersion',
      }),
      file: {
        get () {
          return this.myFile
        },
        set (newFile) {
          this.mySetFile(newFile)
        }
      }
    },
    methods: {
      ...mapActions({
        mySetFile: 'setFile'
      })
    }
  }
</script>
