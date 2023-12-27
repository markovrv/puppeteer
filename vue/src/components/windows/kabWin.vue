<template>
    <b-modal id="kabraspwin" :title="kabName" @click="winKabHide" @hidden="accShow = 1" :ok-only="true">
      <b-overlay :show="winKab.loading" rounded="sm" @shown="onShown">
        <template #overlay>
          <div class="text-center">
            <b-icon icon="stopwatch" font-scale="3" animation="cylon"></b-icon>
            <p id="cancel-label">Пожалуйста, подождите...</p>
            <b-button ref="cancel" variant="outline-danger" size="sm" aria-describedby="cancel-label" @click="winKabHide">Отменить</b-button>
          </div>
        </template>
        <div class="row" v-if="!winKab.loading">
          <b-dropdown class="btn-group col-3" id="corplist" :text="winKab.corps.find(c=>(c==kabNameShort))" variant="primary" menu-class="w-100">
            <b-dropdown-item :id="`corp_${corp}`" @click="$emit('set-corp', corp)" v-for="corp in winKab.corps" :key="corp" :active="kabNameShort == corp">
              {{corp}}
            </b-dropdown-item>
          </b-dropdown>
          <b-dropdown class="btn-group col-4" id="kablist" :text="winKab.kabs[winKab.current.kab]" variant="primary" menu-class="w-100">
            <b-dropdown-item :id="`kab_${idk}`" @click="$emit('set-kab', idk)" v-for="(kab, idk) in winKab.kabs" :key="idk" :active="winKab.current.kab == idk">
              {{kab.split('-')[1]}} {{(getDate != winKab.dates[winKab.current.cDay].split(' ')[1])?'':((winKab?.rasp[idk]?.data[winKab.current.cDay]?.lessons[winKab.idl])?'🚫':'🆓')}}
              {{getInfo(kab)}}
            </b-dropdown-item>
          </b-dropdown>
          <b-dropdown class="btn-group col-4" id="datlist" :text="winKab.dates[winKab.current.cDay]" variant="primary" menu-class="w-100" right>
            <b-dropdown-item :id="`dat_${idd}`" @click="$emit('set-day', idd)" v-for="(date, idd) in winKab.dates" :key="idd" :active="winKab.current.cDay == idd">
              {{date}}
            </b-dropdown-item>
          </b-dropdown>
          <div class="accordion" role="tablist" style="padding-top: 16px;">          
            <p>Мест: {{kabInfo?.seats}}, доска: {{kabInfo?.board}}, {{kabInfo?.type}}, {{(kabInfo?.tv)?'ТВ':''}} {{(kabInfo?.projector)?'проектор':''}}</p>
            <b-card no-body class="mb-1">
              <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button @click="accShow = 3 - accShow" block variant="light">Расписание кабинета</b-button>
              </b-card-header>
              <b-collapse id="accordion-1" :visible="accShow == 1" accordion="my-accordion" role="tabpanel">
                <b-card-body style="padding: 0">
                  <div v-if="winKab.rasp.length * winKab.kabs.length * winKab.dates.length" class="col-12">
                    <table class="b-table table table-bordered table-striped bv-docs-table">
                      <tr v-for="(lsn, idl) in lessons" :key="idl" 
                        :class="(winKab.idl == idl && getDate == winKab.dates[winKab.current.cDay].split(' ')[1])?'currlesson':''"
                        @click="()=>{if(winKab.idl == idl && getDate == winKab.dates[winKab.current.cDay].split(' ')[1]){accShow = 2}}"
                        @dblclick="()=>{if(winKab.idl == idl && getDate == winKab.dates[winKab.current.cDay].split(' ')[1]){$emit('change-kab', winKab.kabs[winKab.current.kab]); winKabHide();}}">
                        <th scope="col" style="padding: 10px"><small>{{idl+1}}</small></th>
                        <td><small>{{(lsn)?lsn:'Свободно'}}</small></td>
                      </tr>
                    </table>
                  </div>
                </b-card-body>
              </b-collapse>
            </b-card>
            <b-card no-body class="mb-1" v-if="winKab.lesson?.oldkab">
              <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button block @click="accShow = 3 - accShow" variant="light">Отменить замену кабинета</b-button>
              </b-card-header>
              <b-collapse id="accordion-2" :visible="accShow == 2" accordion="my-accordion" role="tabpanel">
                <b-card-body>
                  <b-alert style="flex-shrink: inherit;" show>
                    <center>
                      Чтобы отменить замену кабинета <b>{{winKab.lesson?.oldkab}}</b> на <b>{{winKab.lesson?.kab}}</b><br> для занятия <b>{{winKab.lesson?.predm}}</b> от <b>{{getDate}}</b>, <b>{{winKab.lesson?.time && winKab.lesson?.time.split('-')[0]}}</b>, <br> нажмите кнопку<br>
                      <b-button variant="primary" @click="$emit('change-kab-cancel')">Отменить замену</b-button>
                    </center>
                  </b-alert>
                </b-card-body>
              </b-collapse>
            </b-card>
            <b-card no-body class="mb-1" v-else>
              <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button block @click="accShow = 3 - accShow" variant="light">{{(winKab.lesson?.kab && winKab.lesson?.kab.split('-')[1]=='___')?'Установка':'Замена'}} кабинета</b-button>
              </b-card-header>
              <b-collapse id="accordion-2" :visible="accShow == 2" accordion="my-accordion" role="tabpanel">
                <b-card-body>
                  <b-alert v-if="winKab.lesson?.kab != winKab.kabs[winKab.current.kab] && getDate == winKab.dates[winKab.current.cDay].split(' ')[1]" style="flex-shrink: inherit;" show>
                    <center>
                      Чтобы {{(winKab.lesson?.kab && winKab.lesson?.kab.split('-')[1]=='___')?'установить':'заменить'}} кабинет <span v-html="oldKabText"></span> <b>{{winKab.kabs[winKab.current.kab]}}</b><br> для занятия <b>{{winKab.lesson?.predm}}</b> от <b>{{getDate}}</b>, <b>{{winKab.lesson?.time && winKab.lesson?.time.split('-')[0]}}</b>, <br>нажмите кнопку<br>
                      <b-button variant="primary" @click="$emit('change-kab', winKab.kabs[winKab.current.kab])">{{(winKab.lesson?.kab && winKab.lesson?.kab.split('-')[1]=='___')?'Установить':'Заменить'}}</b-button>
                    </center>
                  </b-alert>
                  <b-alert v-if="winKab.lesson?.kab == winKab.kabs[winKab.current.kab] && getDate == winKab.dates[winKab.current.cDay].split(' ')[1]" style="flex-shrink: inherit;" variant="warning" show>
                    <center>
                      Чтобы заменить кабинет <b>{{winKab.lesson?.kab}}</b><br> для занятия <b>{{winKab.lesson?.predm}}</b> от <b>{{getDate}}</b>, <b>{{winKab.lesson?.time && winKab.lesson?.time.split('-')[0]}}</b>, выберите свободный из списка кабинетов.
                    </center>
                  </b-alert>
                  <b-alert v-if="getDate != winKab.dates[winKab.current.cDay].split(' ')[1]" style="flex-shrink: inherit;" variant="warning" show>
                    <center>
                      Чтобы заменить кабинет <b>{{winKab.lesson?.kab}}</b><br> для занятия <b>{{winKab.lesson?.predm}}</b> от <b>{{getDate}}</b>, <b>{{winKab.lesson?.time && winKab.lesson?.time.split('-')[0]}}</b>, выберите корректную дату из списка дат.
                    </center>
                  </b-alert>
                </b-card-body>
              </b-collapse>
            </b-card>
          </div>
        </div>
        <div v-else style="height: 300px"></div>
      </b-overlay>
    </b-modal>
</template>

<script>

export default {
  name: 'kabWin',
  props: {
    winKab: Object
  },
  data: () => ({
    accShow: 1 
  }),
  computed: {
    kabName() {
      var current = this.winKab.current.kab
      var name = (current > -1)?(this.winKab.kabs[current]?.split('-')[0]): ''
      name = (name)?(`${name} корпуса`):''
      return `Кабинеты ${name}`
    },
    kabNameShort() {
      var current = this.winKab.current.kab
      var name = (current > -1)?(this.winKab.kabs[current]?.split('-')[0]): ''
      return name
    },
    lessons() {
      var kab = (this.winKab.current.kab>-1)?this.winKab.current.kab:0
      var day = (this.winKab.current.cDay>-1)?this.winKab.current.cDay:0
      return this.winKab.rasp[kab].data[day].lessons
    },
    getDate() {
      return new Date(this.winKab.day).toLocaleDateString().replace('.20', '.')
    },
    oldKabText() {
      return (this.winKab.lesson?.kab && this.winKab.lesson?.kab.split('-')[1]=='___')?'':('<b>' + this.winKab.lesson?.kab + '</b> на')
    },
    kabInfo() {
      return this.winKab.types.find(k=>k.kab == this.winKab.kabs[this.winKab.current.kab])
    }
  },
  methods: {      
    onShown() {
        this.$refs.cancel.focus()
      },
    winKabHide(){
        this.$bvModal.hide('kabraspwin')
    },
    getInfo(kab){
      var data = this.winKab.types.find(k=>k.kab == kab)
      if(!data) return ''
      return ((data.type[0] == 'к')?'💻':'')+((data.projector)?'🎥 ':'')+((data.tv)?'📺':'')
    }
  }
}
</script>

<style scoped>
  .currlesson {
    background-color: #dcebff;
  }
</style>

