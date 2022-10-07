<template>
    <b-modal id="logwin" title="Журнал нагрузки" @click="winLogHide" :ok-only="true">
      <table class="table">
        <tr>
          <th scope="col">Дата</th>
          <th scope="col">Кол-во</th>
          <th scope="col">Кабинет</th>
        </tr>
        <tr v-for="(item, id) in winLog.log" :key="id" class="small">
          <th scope="row">{{item[0]}}</th>
          <td>{{item[1]}} ч.</td>
          <td>{{item[2]}}</td>
        </tr>
      </table>
    </b-modal>
</template>

<script>
export default {
  name: 'logWin',
  props: {
    winLog: Object
  },
  methods: {
    winLogHide(){
        this.$bvModal.hide('logwin')
    },
  }
}
</script>

