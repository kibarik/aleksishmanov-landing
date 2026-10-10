class WorkshopPollSidebar extends HTMLElement {
  connectedCallback(){
    if(this.shadowRoot)return;
    const guide=this.getAttribute('guide')||'default';
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML=`<style>
      :host{position:fixed;right:0;top:230px;z-index:69;display:block;width:0;height:0;pointer-events:none;font-family:Inter,"Helvetica Neue",Arial,sans-serif;color:#080808}:host([hidden]){display:none!important}*{box-sizing:border-box}.tab,.panel{pointer-events:auto}.tab{position:absolute;right:0;top:0;width:44px;height:142px;border:2px solid #080808;border-right:0;background:#080808;color:#fff;box-shadow:-4px 4px 0 rgba(8,8,8,.16);cursor:pointer;writing-mode:vertical-rl;transform:rotate(180deg);font:850 12px/1 monospace;letter-spacing:.03em}.counts{margin-top:6px}.done{color:#4bd48c}.question{color:#bdbdbd}.problem{color:#ff6b5a}.panel{display:none;position:fixed;right:12px;top:12px;bottom:12px;width:min(520px,calc(100vw - 24px));padding:14px;background:#ecebe6;border:2px solid #080808;box-shadow:-8px 8px 0 rgba(8,8,8,.14);overflow:hidden}.panel.open{display:flex;flex-direction:column}.head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex:0 0 auto}.head strong{font:850 13px/1 monospace;letter-spacing:.08em;text-transform:uppercase}.close{width:34px;height:34px;border:2px solid #080808;background:#fff;font-size:22px;line-height:1;cursor:pointer}.panel workshop-poll{min-height:0;flex:1}
      @media(max-width:700px),(orientation:portrait) and (max-width:900px){:host{top:230px}.tab{width:42px;height:132px}.panel{right:0;top:0;bottom:0;width:100vw;border-width:0 0 0 2px;box-shadow:none}}
      @media print{:host{display:none}}
    </style><button class="tab" type="button" aria-expanded="false" aria-label="Открыть статус">Статус <span class="counts"><span class="done">0</span>/<span class="question">0</span>/<span class="problem">0</span></span></button><aside class="panel" aria-label="Статус группы"><div class="head"><strong>Статус группы</strong><button class="close" type="button" aria-label="Закрыть">×</button></div><workshop-poll mode="presenter" guide="${guide}"></workshop-poll></aside>`;
    const tab=this.shadowRoot.querySelector('.tab'),panel=this.shadowRoot.querySelector('.panel'),close=this.shadowRoot.querySelector('.close');
    const closePanel=()=>{const wasOpen=panel.classList.contains('open');panel.classList.remove('open');tab.hidden=false;tab.setAttribute('aria-expanded','false');if(wasOpen)window.dispatchEvent(new CustomEvent('workshop-sidebar-close'))};
    const openPanel=()=>{window.dispatchEvent(new CustomEvent('workshop-sidebar-open',{detail:{source:this}}));panel.classList.add('open');tab.hidden=true;tab.setAttribute('aria-expanded','true')};
    tab.addEventListener('click',openPanel);close.addEventListener('click',closePanel);window.addEventListener('workshop-sidebar-open',event=>{if(event.detail.source!==this){panel.classList.remove('open');tab.hidden=true;tab.setAttribute('aria-expanded','false')}});window.addEventListener('workshop-sidebar-close',()=>{if(!panel.classList.contains('open'))tab.hidden=false});
    this.addEventListener('poll-change',event=>{tab.querySelector('.done').textContent=event.detail.done;tab.querySelector('.question').textContent=event.detail.question;tab.querySelector('.problem').textContent=event.detail.problem});
    this.open=openPanel;this.close=closePanel;
  }
}
customElements.define('workshop-poll-sidebar',WorkshopPollSidebar);
