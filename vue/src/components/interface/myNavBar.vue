<template>
    <b-navbar :toggleable="false" type="white" variant="light">
      <div class="container">
        <b-navbar-brand href="/">Расписание ВятГУ</b-navbar-brand>
        <b-collapse id="nav-collapse" is-nav style="justify-content: right;">
          <b-navbar-nav class="ml-auto">
            <b-nav-item left @click="$emit('iss-click')" v-if="iss"><small>Обмен данными с ISS</small></b-nav-item>
            <b-nav-item-dropdown right v-if="!login" id="loginmenu">
              <template #button-content>Войти</template>
              <b-dropdown-form style="min-width: 200px">
                <b-dropdown-header id="dropdown-header-label">
                  <center>Введите Ваши логин и пароль<br>от личного кабинета ВятГУ</center>
                </b-dropdown-header>
                <b-form-group label="Логин" label-for="dropdown-form-login" @submit.stop.prevent>
                  <b-form-input id="dropdown-form-login" size="sm" placeholder="usrxxxxx"></b-form-input>
                </b-form-group>
                <b-form-group label="Пароль" label-for="dropdown-form-password">
                  <b-form-input id="dropdown-form-password" type="password" size="sm"></b-form-input>
                </b-form-group>
                <b-form-checkbox class="mb-3" :checked="remember" @input="val=>{$emit('input', val)}"> - запомнить меня</b-form-checkbox>
                <b-button variant="primary" size="sm" @click="$emit('save-settings')" block style="width: 100%">Войти</b-button>
              </b-dropdown-form>
            </b-nav-item-dropdown>
            <b-nav-item-dropdown right v-else>
              <template #button-content>{{login}}</template>
              <!-- <b-dropdown-item disabled href="#">Замены кабинетов</b-dropdown-item>
              <b-dropdown-item disabled href="#">Переносы занятий</b-dropdown-item>
              <b-dropdown-item disabled href="#">Снятые занятия</b-dropdown-item>
              <b-dropdown-item disabled href="#">Выполнение нагрузки</b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider> -->
              <b-dropdown-item href="#" @click="$emit('logout')">Выйти</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
        </b-collapse>
      </div>
    </b-navbar>
</template>

<script>
export default {
  name: 'myNavBar',
  props: {
    login: String,
    remember: Boolean,
    iss: Boolean
  }
}
</script>

<style>
  .navbar {
    margin: 0px 0px 16px!important;
    position: fixed!important;
    top: 0px!important;
    left: 0px!important;
    width: 100%!important;
    z-index: 1000!important;
    backdrop-filter: blur(1rem)!important;
    box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 5%), inset 0 -1px 0 rgb(0 0 0 / 15%)!important;
    background-color: rgba(255,255,255,0.75)!important;
  }
  .dropdown-menu-right {
    right: 0;
  }
</style>
