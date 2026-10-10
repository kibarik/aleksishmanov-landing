class WorkshopTimer extends HTMLElement {
  connectedCallback() {
    if(this.shadowRoot)return;
    const initial=Number(this.getAttribute('minutes')||10);
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML=`<style>
      :host{display:block;font-family:Inter,Arial,sans-serif;color:#080808}*{box-sizing:border-box}.box{padding:2px}.head{display:flex;align-items:center;justify-content:space-between;gap:8px}.label{font:800 11px/1 monospace;letter-spacing:.07em;text-transform:uppercase}.state{font:750 11px/1 monospace}.time{margin:10px 0 12px;font:850 48px/.95 "SFMono-Regular",Consolas,monospace;letter-spacing:-.06em}.controls{display:grid;grid-template-columns:1fr auto;gap:7px}select,button{border:2px solid #080808;background:#fff;color:#080808;font:750 13px/1 Arial;padding:9px}button{background:#3152e8;color:#fff;cursor:pointer}.box.warn{background:#ffd84d;padding:10px}.box.alert{background:#ff5b45;padding:10px;animation:pulse .7s infinite alternate}@keyframes pulse{to{box-shadow:0 0 0 5px rgba(255,91,69,.3)}}
    </style><div class="box"><div class="head"><span class="label">Таймер практикума</span><span aria-live="polite" class="state">готов</span></div><div class="time">${String(initial).padStart(2,'0')}:00</div><div class="controls"><select aria-label="Лимит времени"><option value="5">5 минут</option><option value="10">10 минут</option><option value="15">15 минут</option></select><button type="button">Запустить</button></div></div>`;
    const box=this.shadowRoot.querySelector('.box'),time=this.shadowRoot.querySelector('.time'),state=this.shadowRoot.querySelector('.state'),select=this.shadowRoot.querySelector('select'),button=this.shadowRoot.querySelector('button');
    select.value=String(initial);let left=initial*60,timer=null,running=false;
    const draw=()=>{
      const text=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;
      const level=left===0?'done':left<=60?'alert':left<=180?'warn':'normal';
      time.textContent=text;box.classList.toggle('warn',level==='warn');box.classList.toggle('alert',level==='alert');state.textContent=left===0?'время':running?'идёт':'готов';
      this.dispatchEvent(new CustomEvent('timer-change',{bubbles:true,composed:true,detail:{text,level,running}}));
    };
    const stop=()=>{clearInterval(timer);timer=null;running=false;button.textContent=left===0?'Сбросить':'Продолжить';draw()};
    button.addEventListener('click',()=>{if(left===0){left=Number(select.value)*60;button.textContent='Запустить';draw();return}if(running){stop();return}running=true;button.textContent='Пауза';draw();timer=setInterval(()=>{left=Math.max(0,left-1);draw();if(left===0)stop()},1000)});
    select.addEventListener('change',()=>{clearInterval(timer);timer=null;running=false;left=Number(select.value)*60;button.textContent='Запустить';draw()});draw();setTimeout(draw,0);
  }
}
customElements.define('workshop-timer',WorkshopTimer);
