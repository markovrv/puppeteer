<template>
    <b-modal id="loaderwin" title="Лог загрузки" @click="winLoaderHide" :ok-only="true">
      <div id="my-event" class="modal-body console-log">
          <div v-for="(item, id) in messages" :key="id" class="small">
            > <span :style="'color: ' + item.color">{{item.message}}</span>
          </div>
          <br><br>
      </div>
    </b-modal>
</template>

<script>
export default {
  name: 'loaderWin',
  props: {
    messages: Array
  },
  methods: {
    winLoaderHide(){
        this.$bvModal.hide('loaderwin')
    },
  }
}
</script>

<style scoped>
  .console-log {
    height: 300px; 
    overflow-y: scroll;
    background: black;
    color: white;
    font-family: monospace;
    font-weight: bold; 
    margin: -16px;
  }
</style>

