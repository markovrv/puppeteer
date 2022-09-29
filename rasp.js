const axios = require('axios');
const jsdom = require("jsdom");

const { JSDOM } = jsdom;



var getGroupList = new Promise((response, reject) => {
  var groups = []
  axios.get("https://www.vyatsu.ru/studentu-1/spravochnaya-informatsiya/raspisanie-zanyatiy-dlya-studentov.html")
    .then(resp => {
      var table = new JSDOM(resp.data).window.document.querySelector("table");
      table.querySelectorAll('div[class="grpPeriod"]').forEach(el=>{
        groups.push({
          id: el.getAttribute("data-grp_period_id").slice(0, -1), 
          period: el.getAttribute("data-grp_period_id").slice(-1),
          name: el.textContent.trim(), 
        })
      })
      table.querySelectorAll("a").forEach(el=>{
        var link = el.href.split('/')[4].split('.')[0].split('_')
        var group = groups.find(g=>(g.id == link[0] && g.period == link[1]))
        if(!group.links) group.links = []
        group.links.push({
          start: link[2],
          end: link[3],
        })
      })
      response(groups)
    }).catch(reject)
});

var getLink = (groups, name, period, start) => {
  var gr = groups.find(g=>(g.name == name && g.period == period))
  var time = gr.links.find(t=>(t.start == start))
  return `https://www.vyatsu.ru/reports/schedule/Group/${gr.id}_${gr.period}_${time.start}_${time.end}.pdf`
};


(async () => {

 var link = getLink(await getGroupList, "УТб-2301-02-00", "1", "26092022")


})();