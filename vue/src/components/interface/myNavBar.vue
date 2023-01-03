<template>
    <b-navbar :toggleable="false" type="white" variant="light">
      <div class="container">
        <b-navbar-brand href="/">Расписание</b-navbar-brand>
        <b-collapse id="nav-collapse" is-nav style="justify-content: right;">
          <b-navbar-nav class="ml-auto">
            <b-nav-item left @click="$emit('iss-click')" v-if="iss"><small>Обмен данными с ISS</small></b-nav-item>
            <b-nav-item-dropdown right v-if="!login" id="loginmenu">
              <template #button-content>Войти</template>
              <b-dropdown-form style="min-width: 280px">
                <b-dropdown-header id="dropdown-header-label">
                  <b-alert show variant="danger" v-if="loginErrorMessage" style="margin-bottom: 0; padding: 10px;"><center>{{loginErrorMessage}}</center></b-alert>
                  <center v-else>Введите Ваши логин и пароль<br>от личного кабинета</center>
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
              <!-- <b-dropdown-item  href="javascript://" v-if="showCopies" @click="$emit('show-copies-click', false)">Скрыть переносы занятий</b-dropdown-item>
              <b-dropdown-item  href="javascript://" v-else @click="$emit('show-copies-click', true)">Показать переносы занятий</b-dropdown-item> -->
              <b-dropdown-item  href="javascript://" @click="$emit('get-iss-works')">Выполнение нагрузки</b-dropdown-item>
              <b-dropdown-item  href="javascript://" @click="$emit('add-self-lesson')">Добавить занятия</b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider>
              <b-dropdown-item href="https://iss.vyatsu.ru/kaf">Кабинет кафедры</b-dropdown-item>
              <b-dropdown-item href="https://new.vyatsu.ru/account/obr/rasp/?login=yes">Расписание преподавателя</b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider>
              <b-dropdown-item href="mailto:usr11935@vyatsu.ru">Связь с разработчиком</b-dropdown-item>
              <b-dropdown-item href="/Timetable.apk">Android приложение</b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider>
              <b-dropdown-item href="javascript://" @click="$emit('logout')">Выйти</b-dropdown-item>
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
    iss: Boolean,
    showCopies: Boolean,
    loginErrorMessage: String,
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
