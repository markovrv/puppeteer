<template>
  <center v-if="loading">
    <br><br>
    <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="stopwatch" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi-stopwatch b-icon bi b-icon-animation-cylon" style="font-size: 300%;"><g><path d="M8.5 5.6a.5.5 0 1 0-1 0v2.9h-3a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5V5.6z"></path><path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z"></path></g></svg>
    <div>{{message}}</div>
    <br>
    <br>
  </center>
</template>

<script>
export default {
  name: 'raspLoadingShow',
  props: {
    loading: Boolean,
    message: String
  }
}
</script>

<style scoped>
img {
  display: block;
  width: 148px;
  height: 148px;
  border: 0;
}

@media (max-width: 768px) {
  img {
    display: none;
  }
}
</style>
