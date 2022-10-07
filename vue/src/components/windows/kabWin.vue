<template>
    <b-modal id="kabraspwin" :title="'Занятость аудиторий ' + ((winKab.kabs[winKab.current.kab]?.split('-')[0])?(winKab.kabs[winKab.current.kab]?.split('-')[0] + ' корпуса'):'')" @click="winKabHide" :ok-only="true">
      <b-overlay :show="winKab.loading" rounded="sm">
        <div class="row" v-if="!winKab.loading">
          <b-dropdown
          class="btn-group col-6" 
          id="kablist" 
          :text="winKab.kabs[winKab.current.kab]" 
          variant="primary" 
          menu-class="w-100">
            <b-dropdown-item 
              :id="`kab_${idk}`" 
              @click="$emit('set-kab', idk)" 
              v-for="(kab, idk) in winKab.kabs" 
              :key="idk" 
              :active="winKab.current.kab == idk"
            >{{kab}}</b-dropdown-item>
          </b-dropdown>
          <b-dropdown
          class="btn-group col-6" 
          id="datlist"
          :text="winKab.dates[winKab.current.cDay]" 
          variant="primary"
          menu-class="w-100"
          right >
            <b-dropdown-item
            :id="`dat_${idd}`" 
            @click="$emit('set-day', idd)" 
            v-for="(date, idd) in winKab.dates" 
            :key="idd" 
            :active="winKab.current.cDay == idd"
            >{{date}}</b-dropdown-item>
          </b-dropdown>
          <div v-if="winKab.rasp.length * winKab.kabs.length * winKab.dates.length" style="margin-top:12px" class="col-12">
            <table class="b-table table table-bordered table-striped bv-docs-table">
              <tr v-for="(lsn, idl) in winKab.rasp[winKab.current.kab].data[winKab.current.cDay].lessons" :key="idl">
                <th scope="col" style="padding: 10px"><small>{{idl+1}}</small></th>
                <td><small>{{(lsn)?lsn:'Свободно'}}</small></td>
              </tr>
            </table>
          </div>
        </div>
        <div v-else><br><br><br><br><br><br><br><br><br></div>
      </b-overlay>
    </b-modal>
</template>

<script>
export default {
  name: 'kabWin',
  props: {
    winKab: Object
  },
  methods: {
    winKabHide(){
        this.$bvModal.hide('kabraspwin')
    },
  }
}
</script>

