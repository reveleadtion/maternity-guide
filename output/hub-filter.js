(function(){
  var q='',f='all';
  var cards=Array.from(document.querySelectorAll('#tws-grid .tws-card'));
  var btns=Array.from(document.querySelectorAll('#tws-hub .fbtn'));
  var ct=document.getElementById('tws-ct');
  var nr=document.getElementById('tws-nr');
  function run(){
    var v=0;
    cards.forEach(function(c){
      var ok=(f==='all'||c.dataset.cluster===f)&&(q===''||c.textContent.toLowerCase().includes(q.toLowerCase()));
      c.classList.toggle('hidden',!ok);
      if(ok)v++;
    });
    ct.textContent=v+' topic'+(v!==1?'s':'');
    nr.style.display=v===0?'block':'none';
  }
  btns.forEach(function(b){
    b.addEventListener('click',function(){
      btns.forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');f=b.dataset.f;run();
    });
  });
  var inp=document.getElementById('tws-q');
  if(inp)inp.addEventListener('input',function(e){q=e.target.value;run();});
})();
