<template>
  <div class="week-selector-container">
    <div class="container">
      <div class="row">
        <div class="col-11">
          <input
            id="myweek"
            type="week"
            @change="changeWeek"
            class="form-control myweek"
          />
        </div>
        <div class="col-1" title="Скопировать расписание в буфер обмена" style="padding-left: 0;margin-top: 5px;">
          <svg @click="$emit('copy')"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-copy"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
function getDateOfISOWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

function getDateRangeOfWeek(w, y) {
  var date = getDateOfISOWeek(w, y);
  var start =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  date.setDate(date.getDate() + 6);
  var end =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  return { start, end };
}

export default {
  name: "myWeekSelector",
  methods: {
    changeWeek({ target }) {
      var d = target.value.split("-W");
      var week = getDateRangeOfWeek(d[1], d[0]);
      console.log(week);
      this.$emit("change-week", week);
    },
  },
};
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
  box-shadow: 0px -0.5rem 1rem rgb(0 0 0 / 5%),
    inset 1px 1px 0px rgb(0 0 0 / 15%);
  background-color: hsl(0deg 0% 100% / 50%);
  text-align: center;
}
.myweek {
  display: inline-block;
}
</style>
