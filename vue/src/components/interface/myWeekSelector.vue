<template>
      <div class="week-selector-container">
        <input id="myweek" type="week" @change="changeWeek" class="form-control myweek container" style="margin: 0 10px; width: calc(100% - 20px);">
      </div>
</template>

<script>
function getDateOfISOWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7)
  var dow = simple.getDay()
  var ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

function getDateRangeOfWeek(w, y) {
  var date = getDateOfISOWeek(w, y);
  var start = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  date.setDate(date.getDate() + 6);
  var end = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  return {start, end};
}

export default {
  name: 'myWeekSelector',
  methods: {
    changeWeek({ target }) {
      var d = target.value.split('-W')
      var week = getDateRangeOfWeek(d[1],d[0])
      console.log(week)
      this.$emit('change-week', week)
    }
  }
}
</script>

<style>
  .week-selector-container {
    padding: 10px 0 10px;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    -webkit-backdrop-filter: blur(1rem);
    backdrop-filter: blur(1rem);
    box-shadow: 0px -0.5rem 1rem rgb(0 0 0 / 5%), inset 1px 1px 0px rgb(0 0 0 / 15%);
    background-color: hsl(0deg 0% 100% / 50%);
    text-align: center;
  }
  .myweek {
    display: inline-block;
  }
</style>
