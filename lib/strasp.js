exports.pressButton = (page, name) => {
  return new Promise((resolve, reject) => {
    page.evaluate((text) => {
      var getRes = (elems, text) => Array.from(elems).find(v => v.textContent == text);
      var elems = document.querySelectorAll("button");
      var res = getRes(elems, text);
      var counter = 0;
      while (!res && counter < 10) {
        setTimeout(()=>{
            res = getRes(elems, text);
            counter++;
        }, 50);
      }
      var id = `mybtn_${(new Date()).getTime()}`
      res.setAttribute("id", id)
      return id;
    }, name).then(id => {
      page.click(`button[id="${id}"]`).then(()=>resolve());
    }).catch(e=>console.log(e))
  })
}

exports.getButtonsList = (page) => {
  return new Promise((resolve, reject) => {
    page.evaluate(() => {
      var elems = document.querySelectorAll('div[class="flexsearch--buttons-panel"] button');
      var names = [];
      Array.from(elems).forEach(btn => {
        names.push(btn.textContent)
      })
      return names;
    }).then(resolve)
    .catch(reject);
  })
}

exports.inputId = (page, id, text) => {
    return new Promise((resolve, reject) => {
      page.evaluate(val => document.querySelector(`input[id="${val.id}"]`).value = val.text, {id, text}).then(()=>{resolve()})
    })
}

exports.parse = (rasp, subgr) => {
  var content = []
  var days = rasp.split('—| ')
  if (days.length > 1) {
    days.shift()
    days.forEach(day=>{
      var lessons = day.split('<br>——/ ')
      var date = lessons.shift()
      date = ('_ ' + date.split(' | ')[1]?.slice(0, -4)).dateformat()
      var lsns = []
      lessons.forEach(lesson=>{
        var parts = lesson.split(' /——<br>')
        var time = parts.shift()
        var aparts = parts[0].split('<br>')
        if(aparts[0].indexOf('подгруппа')>0){
          if (subgr == 0) aparts.shift()
          else {
            var first = aparts.indexOf(subgr + ' подгруппа')
            aparts.splice(0, first+1)
          }
        }
        if (aparts.length >=4) lsns.push({time, kab: aparts[3]})
      })
      content.push({date, lessons: lsns})
    })
  }
  return content
}

exports.sortbtns = (a, b) => ((Number(a.slice(3,5)) > Number(b.slice(3,5)) || Number(a.slice(3,5)) == Number(b.slice(3,5)) && Number(a.slice(0,2)) > Number(b.slice(0,2)))?1:-1)