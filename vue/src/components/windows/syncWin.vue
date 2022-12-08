<template>
    <b-modal id="syncwin" size="xl" title="Выполнение нагрузки" @click="winSyncHide" :ok-only="true">
      <table class="b-table table table-bordered table-striped bv-docs-table">
        <tr>
          <th scope="col">Предмет</th>
          <th scope="col">Проведено (ч.)</th>
        </tr>
        <tr @click="$emit('lesson-select', item)" v-for="(item, id) in winSync.data" :key="id" class="small lesson">
          <td><b>{{item.name}}</b><br><i>{{lesType(item.cat)}}</i><br><small>{{ item.groups }}</small></td>
          <td style="padding-right: 10px;">
            <b-progress :max="100" style="padding: 0px; background-color: rgb(153 153 153 / 40%)">
              <b-progress-bar :value="item.percent" :label="`${item.info}`"></b-progress-bar>
            </b-progress>
          </td>
        </tr>
      </table>
    </b-modal>
</template>

<script>
export default {
  name: 'syncWin',
  props: {
    winSync: Object
  },
  methods: {
    winSyncHide(){
        this.$bvModal.hide('syncwin')
    },
    lesType(type) {
      if (type == 0) return 'Лекции'
      if (type == 1) return 'Семинары'
      if (type == 2) return 'Лабораторные'
    }
  }
}
</script>

