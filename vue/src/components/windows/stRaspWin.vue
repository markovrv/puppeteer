<template>
    <b-modal id="straspwin" title="Расписание студентов" @ok="winStudHide" :ok-only="true">
      <b-overlay :show="winStud.loading" rounded="sm" @shown="onShown">
        <p v-html="winStud.rasp"></p>
        <div class="row">
          <button v-for="(date, idd) in winStud.dates" :key="idd" type="button" class="btn btn-light col-6 col-md-4" @click="$emit('get-st-rasp',{group: winStud.group, date: date})">{{ date }}</button>
        </div>
        <template #overlay>
          <div class="text-center">
            <b-icon icon="stopwatch" font-scale="3" animation="cylon"></b-icon>
            <p id="cancel-label">{{winStud.message}}</p>
            <b-button
              ref="cancel"
              variant="outline-danger"
              size="sm"
              aria-describedby="cancel-label"
              @click="winStudCancel"
            >
              Отменить
            </b-button>
          </div>
        </template>
      </b-overlay>
    </b-modal>
</template>

<script>
const PATH = process.env.VUE_APP_PATH;
export default {
  name: 'stRaspWin',
  props: {
    winStud: Object,
    login: String
  },
  methods: {
    winStudHide(){
        this.$bvModal.hide('straspwin')
    },
    winStudCancel(){
      this.axios.post(PATH + '/api/iss/closebrowser/', {
          username: this.login,
        })
        .then(()=>{
          this.$bvModal.hide('straspwin')
        }).catch(console.log)
    },
    onShown() {
        this.$refs.cancel.focus()
      },
  }
}
</script>

