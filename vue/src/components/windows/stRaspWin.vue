<template>
    <b-modal id="straspwin" title="Расписание студентов" @ok="winStudHide" :ok-only="true">
      <b-overlay :show="winStud.loading" rounded="sm">
        <p v-html="winStud.rasp"></p>
        <div>
          <button v-for="(date, idd) in winStud.dates" :key="idd" type="button" class="btn btn-link" @click="$emit('get-st-rasp',{group: winStud.group, date: date})">{{ date }}</button>
        </div>
      </b-overlay>
    </b-modal>
</template>

<script>
export default {
  name: 'stRaspWin',
  props: {
    winStud: Object
  },
  methods: {
    winStudHide(){
        this.$bvModal.hide('straspwin')
    },
  }
}
</script>

