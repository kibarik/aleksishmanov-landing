const id=document.body.dataset.guide;
const guide=window.GUIDES[id];
const root=document.querySelector('#app');

function command(value){
  return `<pre class="command"><code>${value}</code><button class="copy-command" type="button" data-copy="${encodeURIComponent(value)}">Копировать</button></pre>`;
}

function steps(items){
  return `<ol class="steps">${items.map(item=>`<li>${item.text}${item.code?command(item.code):''}</li>`).join('')}</ol>`;
}

function guideNavigation(){
  return `<span class="nav-kicker">Все инструкции</span><nav class="guide-nav">${Object.entries(GUIDES).map(([slug,item],index)=>`<a href="../${slug}/" class="${slug===id?'active':''}" ${slug===id?'aria-current="page"':''}><span class="nav-number">${String(index+1).padStart(2,'0')}</span><span>${item.title}</span></a>`).join('')}</nav>`;
}

function tableOfContents(items){
  return `<span class="toc-title">На этой странице</span><nav>${items.map(item=>`<a href="#${item.id}">${item.label}</a>`).join('')}</nav>`;
}

function figure(){
  return `<figure class="article-visual" id="screen"><img src="${guide.image}" alt="${guide.imageAlt}"><figcaption>${guide.imageAlt}. Интерфейс может измениться, поэтому перед практикумом сверяйте шаги с актуальной документацией.</figcaption></figure>`;
}

function sources(){
  return `<h2 id="sources">Актуальные ссылки</h2><ul class="source-list">${guide.sources.map(url=>`<li><a href="${url}">${url}</a></li>`).join('')}</ul>`;
}

function nextStep(){
  const keys=Object.keys(GUIDES),index=keys.indexOf(id),next=keys[index+1];
  return next?`<a class="next-step" href="../${next}/"><small>Следующий шаг</small><span>${GUIDES[next].title} →</span></a>`:'';
}

function longread(platform){
  const items=guide.platforms[platform];
  return {
    toc:[
      {id:'overview',label:'Что мы делаем'},
      {id:'screen',label:'Ориентир на экране'},
      {id:'before',label:'Перед началом'},
      {id:'install',label:`Установка на ${platform}`},
      {id:'check',label:'Проверка результата'},
      {id:'problems',label:'Частые ошибки'},
      {id:'sources',label:'Актуальные ссылки'}
    ],
    html:`<div class="lead-block" id="overview"><strong>Что мы делаем</strong>Проверяем Node.js, устанавливаем Claude Code и убеждаемся, что команда доступна в новом окне терминала.</div><nav class="platforms" aria-label="Операционная система">${Object.keys(guide.platforms).map(name=>`<button type="button" data-platform="${name}" class="${name===platform?'active':''}">${name}</button>`).join('')}</nav>${figure()}<h2 id="before">Перед началом</h2><p>Закройте старые окна терминала после установки Node.js и откройте новое. Система перечитает переменную PATH. Вводите команды по одной строке и нажимайте Enter.</p><div class="warning"><strong>Не вставляйте API-ключи на этом шаге.</strong> Здесь устанавливается только Claude Code.</div><h2 id="install">Установка на ${platform}</h2>${steps(items)}<h2 id="check">Проверка результата</h2><p>Откройте новое окно Terminal или PowerShell и выполните команду:</p>${command('claude --version')}<div class="check"><strong>Всё получилось</strong>${guide.result}</div><h2 id="problems">Если команда не работает</h2><div class="trouble"><strong><code>node</code> или <code>npm</code> не найдены</strong><p>Перезапустите терминал и снова выполните <code>node --version</code>. Если команда не появилась, переустановите Node.js.</p></div><div class="trouble"><strong>Windows не видит <code>winget</code></strong><p>Установите Node.js LTS с официального сайта nodejs.org, затем откройте новое окно PowerShell.</p></div><div class="trouble"><strong>macOS или Linux показывает EACCES</strong><p>Установите Node.js через nvm, чтобы избежать ошибок доступа при глобальной установке npm-пакетов.</p></div><div class="trouble"><strong><code>claude</code> не найден после npm install</strong><p>Откройте новый терминал. Если ошибка осталась, выполните <code>npm config get prefix</code> и проверьте, что этот путь добавлен в PATH.</p></div>${sources()}${nextStep()}`
  };
}

function standardGuide(platform){
  const items=guide.platforms?guide.platforms[platform]:guide.steps;
  return {
    toc:[
      {id:'steps',label:'Краткая инструкция'},
      {id:'screen',label:'Ориентир на экране'},
      {id:'result',label:'Проверка результата'},
      {id:'sources',label:'Актуальные ссылки'}
    ],
    html:`${guide.platforms?`<nav class="platforms" aria-label="Операционная система">${Object.keys(guide.platforms).map(name=>`<button type="button" data-platform="${name}" class="${name===platform?'active':''}">${name}</button>`).join('')}</nav>`:''}${guide.warning?`<div class="warning">${guide.warning}</div>`:''}<h2 id="steps">Краткая инструкция</h2>${steps(items)}${figure()}<h2 id="result">Проверка результата</h2><div class="check"><strong>Готово, когда</strong>${guide.result}</div>${sources()}${nextStep()}`
  };
}

function bind(platform){
  document.querySelectorAll('[data-platform]').forEach(button=>button.addEventListener('click',()=>{
    localStorage.setItem('guide-platform',button.dataset.platform);
    render(button.dataset.platform);
  }));
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const value=decodeURIComponent(button.dataset.copy);
    try{await navigator.clipboard.writeText(value)}catch{const area=document.createElement('textarea');area.value=value;document.body.append(area);area.select();document.execCommand('copy');area.remove()}
    button.textContent='Скопировано';
    setTimeout(()=>button.textContent='Копировать',1400);
  }));
  const dialog=document.querySelector('.vote-dialog');
  document.querySelector('.vote-open').addEventListener('click',()=>{if(!dialog.open)dialog.showModal()});
  document.querySelector('.vote-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  const closeNav=()=>document.body.classList.remove('nav-open');
  document.querySelector('.nav-toggle').addEventListener('click',()=>document.body.classList.toggle('nav-open'));
  document.querySelector('.nav-scrim').addEventListener('click',closeNav);
  document.querySelectorAll('.guide-nav a').forEach(link=>link.addEventListener('click',closeNav));
  const tocLinks=[...document.querySelectorAll('.toc a')];
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){tocLinks.forEach(link=>link.classList.toggle('current',link.hash===`#${entry.target.id}`))}}),{rootMargin:'-18% 0px -72%'});
  tocLinks.forEach(link=>{const section=document.querySelector(link.hash);if(section)observer.observe(section)});
}

function render(platform){
  const content=id==='claude-code'?longread(platform):standardGuide(platform);
  root.innerHTML=`<header class="docs-header"><a class="brand" href="../">slides.aleksishmanov.ru/instructions</a><div class="header-actions"><button class="nav-toggle" type="button" aria-label="Открыть список инструкций">Все шаги</button><span class="step">${guide.number}</span><span class="result-prompt">Отметьте результат</span><button class="vote-open" type="button">Проголосовать</button></div></header><button class="nav-scrim" type="button" aria-label="Закрыть меню"></button><div class="docs-grid"><aside class="docs-nav" aria-label="Все инструкции">${guideNavigation()}</aside><main class="docs-main"><section class="doc-hero"><p class="eyebrow">${guide.number}</p><h1>${guide.title}</h1><p>${guide.lead}</p><div class="meta-row"><span>${guide.duration} минут</span><span>${platform||'все устройства'}</span><span>пошагово</span></div></section><article class="article">${content.html}</article></main><aside class="toc" aria-label="На этой странице">${tableOfContents(content.toc)}</aside></div><dialog class="vote-dialog"><div class="vote-dialog-head"><strong>Отметьте результат</strong><button class="vote-close" type="button" aria-label="Закрыть">×</button></div><div class="vote-dialog-body"><workshop-poll guide="${id}"></workshop-poll></div></dialog>`;
  bind(platform);
}

if(!guide){
  root.innerHTML='<main class="catalog-page"><h1>Инструкция не найдена</h1><a href="../">Вернуться к списку</a></main>';
}else{
  const saved=localStorage.getItem('guide-platform');
  const platform=guide.platforms&&guide.platforms[saved]?saved:guide.platforms?Object.keys(guide.platforms)[0]:'';
  render(platform);
}
