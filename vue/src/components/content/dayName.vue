<template>
  <div>
    <a :name="id" class="a-name">.</a>
    <b style="font-size: 120%;">{{ dayName }}</b>
    <a class="btn btn-link btn-sm day-btn" :id="'daytoissid_' + id" href="javascript://" @click="$emit('btn-click', id)">День в журнал</a>
  </div>
</template>

<script>
export default {
  name: 'dayName',
  props: {
    id: Number,
    name: String
  },
  computed: {
    dayName() {
      var days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']
      var d = new Date(this.name)
      var dat = this.name.split('-')
      return `${days[d.getDay()]} ${dat[2]}.${dat[1]}.${dat[0].slice(2)}`
    }
  }
}
</script>

<style scoped>
.a-name {
  width: 0px;
  height: 0px;
  overflow: hidden;
  display: block;
  position: relative;
  top: -70px;
}
.day-btn {
  display: block;
  float: right;
}
</style>
