(function(){
  var slider = document.getElementById('slider');
  var list = slider.querySelector('.list');
  var items = Array.prototype.slice.call(slider.querySelectorAll('.item'));
  var modalOverlay = document.getElementById('modalOverlay');
  var modalContent = document.getElementById('modalContent');

  var durationSec = 18; //para alexandra, este tiempo es la velocidad en la que pasan las tarjetas
  var direction = 'normal';
  var running = true;

  function setup(){
    items = Array.prototype.slice.call(slider.querySelectorAll('.item'));
    var qty = items.length || 1;
    slider.style.setProperty('--quantity', qty);
    slider.style.setProperty('--duration', durationSec + 's');

    var sample = items[0];
    var widthPx = 320;
    if(sample){
      var rect = sample.getBoundingClientRect();
      if(rect && rect.width && rect.width > 10) widthPx = Math.round(rect.width);
    }
    slider.style.setProperty('--width', widthPx + 'px');

    for(var i=0;i<items.length;i++){
      var pos = parseInt(items[i].getAttribute('data-pos') || (i+1), 10);
      var delay = (durationSec / qty) * (pos - 1) - durationSec;
      items[i].style.animationDuration = durationSec + 's';
      items[i].style.animationDelay = delay + 's';
      items[i].style.animationDirection = direction;
    }
  }

  window.addEventListener('load', function(){

    setTimeout(function(){
      setup();
    }, 50);
  });

  window.addEventListener('resize', function(){
    setTimeout(setup, 60);
  });

  slider.addEventListener('click', function(ev){
    var t = ev.target;
    while(t && !t.classList.contains('item')) t = t.parentNode;
    if(!t) return;
    var card = t.querySelector('.card');
    if(!card) return;
    openModal(card);
  });

  function openModal(card){
    slider.classList.add('paused');
    slider.classList.add('dimmed');
    running = false;

    var clone = card.cloneNode(true);
    clone.style.position = '';
    clone.style.left = '';
    clone.style.top = '';
    clone.classList.add('modal-card');

    modalContent.innerHTML = '';
    modalContent.appendChild(clone);
    modalOverlay.classList.add('visible');
    modalOverlay.setAttribute('aria-hidden','false');
  }

  function closeModal(){
    modalOverlay.classList.remove('visible');
    modalOverlay.setAttribute('aria-hidden','true');
    modalContent.innerHTML = '';
    slider.classList.remove('paused');
    slider.classList.remove('dimmed');
    running = true;
  }

  modalOverlay.addEventListener('click', function(e){
    if(e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeModal();
  });

})();