<template>
  <center v-if="loading">
    <br /><br />
    <b-spinner label=""></b-spinner>
    <h3>Загрузка расписания...</h3>
    <a href="https://new.vyatsu.ru/account/obr/rasp/">new.vyatsu.ru</a>
    <span style="font-size: 80%; color: rgb(90, 90, 90);"> | </span>
    <a href="https://rasp.markovrv.ru/">rasp.markovrv.ru</a><br />
    <img
      class="adsdesktop"
      src="../../assets/qr-code.gif"
      width="148"
      height="148"
      border="0"
      title="Приложение для Андроид"
    />
    <a href="https://disk.yandex.ru/d/sN2Iaazo3XsBag">Приложение для Андроид</a>
  </center>
</template>

<script>
export default {
  name: 'raspLoadingShow',
  props: {
    loading: Boolean
  }
}
</script>

<style>
.adsdesktop {
  display: block;
}

@media (max-width: 768px) {
  .adsdesktop {
    display: none;
  }
}
</style>
