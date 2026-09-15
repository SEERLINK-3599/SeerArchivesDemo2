(() => {
  'use strict';
  const root=document.documentElement,screen=document.querySelector('#opening'),video=document.querySelector('#opening-video'),shell=document.querySelector('.shell');
  const status=document.querySelector('#opening-status'),skip=document.querySelector('#opening-skip'),sound=document.querySelector('#opening-sound'),play=document.querySelector('#opening-play');
  const frame=document.querySelector('#opening-frame'),flash=document.querySelector('#opening-flash');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let phase='loading',ending=false,entered=false,entranceCount=0,autoCount=0,pausedForVisibility=false,lastProgress=performance.now(),lastTime=0,hasFadedIn=false;
  let siteReadyResolve;const siteReady=new Promise(resolve=>{siteReadyResolve=resolve});
  const readyTimer=setTimeout(()=>siteReadyResolve(),9500);
  window.addEventListener('seer:ready',()=>{clearTimeout(readyTimer);siteReadyResolve();},{once:true});
  const setPhase=value=>{phase=value;screen.dataset.phase=value;root.dataset.openingPhase=value;window.dispatchEvent(new CustomEvent('seer:opening-phase',{detail:value}));};
  const animate=(el,keyframes,options)=>el.animate(keyframes,{fill:'both',...options});
  function entrance(manual=false){
    if(!entered||(!manual&&autoCount))return;
    if(!manual)autoCount++;entranceCount++;
    if(reduced.matches||document.body.classList.contains('motion-off'))return;
    const hero=document.querySelector('#hero');const nodes=[document.querySelector('.sidebar'),document.querySelector('.topbar')];
    if(!hero.hidden)nodes.push(document.querySelector('.hero-content'));
    const visibleView=document.querySelector('.view:not([hidden])');if(visibleView)nodes.push(visibleView.querySelector('.filter-layout')||visibleView.querySelector('.section-title'));
    for(const [i,el]of nodes.filter(Boolean).entries())animate(el,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:580,delay:i*60,easing:'cubic-bezier(.2,.7,.25,1)'}).finished.then(()=>el.getAnimations().filter(a=>a.playState==='finished').forEach(a=>a.cancel()));
    if(visibleView)for(const [i,el]of [...visibleView.querySelectorAll('.card,.folder-card')].entries()){
      // Animate only tiles currently in the viewport; never leave a delayed offscreen tile hidden.
      if(el.getBoundingClientRect().top>=innerHeight)continue;
      const animation=animate(el,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:180+Math.min(i,9)*45,easing:'cubic-bezier(.2,.7,.25,1)'});animation.finished.then(()=>animation.cancel());
    }
    window.dispatchEvent(new CustomEvent('seer:entrance',{detail:{manual,count:entranceCount}}));
  }
  // Dense square tiles travel from the centre outwards, with soft opacity envelopes.
  async function transition(){
    const duration=1500,columns=innerWidth<=700?12:30,size=innerWidth/columns,rows=Math.ceil(innerHeight/size);
    frame.replaceChildren();frame.style.setProperty('--tile-size',size+'px');frame.style.gridTemplateColumns='repeat('+columns+',1fr)';frame.dataset.tileCount=String(columns*rows);frame.hidden=false;flash.hidden=false;
    const animations=[],fragment=document.createDocumentFragment(),tiles=[];
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      const seed=(x*37+y*71)%101,tile=document.createElement('i');tile.className='opening-tile'+(seed%29===0?' tile-yellow':seed%7===0?' tile-blue':'');
      const distance=Math.max(Math.abs(x-(columns-1)/2)/(columns/2),Math.abs(y-(rows-1)/2)/(rows/2));
      fragment.append(tile);tiles.push({tile,delay:distance*430+(seed%11)*5});
    }
    frame.append(fragment);
    for(const {tile,delay}of tiles)animations.push(animate(tile,[
      {opacity:0,transform:'scale(.8)'},{opacity:.96,transform:'scale(1)',offset:.32},
      {opacity:.94,transform:'scale(1)',offset:.55},{opacity:0,transform:'scale(1.05)'}
    ],{duration:1000,delay,easing:'cubic-bezier(.4,0,.2,1)'}));
    animations.push(animate(screen,[{opacity:1},{opacity:.92,offset:.25},{opacity:0,offset:.82},{opacity:0}],{duration,easing:'ease-in-out'}));
    const label=flash.querySelector('span');label.textContent=document.querySelector('.brand small')?.textContent||'SEER ARCHIVE';
    animations.push(animate(label,[{opacity:0,transform:'translateY(7px)'},{opacity:.85,transform:'translateY(0)',offset:.35},{opacity:.85,offset:.55},{opacity:0,transform:'translateY(-5px)'}],{duration:1100,delay:150,easing:'ease-in-out'}));
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
    frame.hidden=true;flash.hidden=true;screen.hidden=true;animations.forEach(a=>a.cancel());frame.replaceChildren();
  }
  async function finish(reason='ended',instant=false){
    if(root.classList.contains('link-locked')||ending||entered)return;ending=true;clearInterval(watchdog);video.pause();status.textContent='正在打开档案馆';await siteReady;
    setPhase('transition');if(!instant&&!reduced.matches)await transition();
    entered=true;screen.hidden=true;frame.hidden=true;flash.hidden=true;video.removeAttribute('src');video.load();shell.inert=false;
    root.classList.remove('intro-pending');setPhase('entered');if(!instant&&!reduced.matches){const reveal=animate(shell,[{opacity:0},{opacity:1}],{duration:480,easing:'ease-out'});reveal.finished.then(()=>reveal.cancel()).catch(()=>{});}entrance();
    if(reason==='skip'||reason==='keyboard'){const main=document.querySelector('#main');main.focus({preventScroll:true});}
  }
  async function startPlayback(){try{await video.play();play.hidden=true;}catch{if(ending)return;play.hidden=false;status.textContent='点按播放，或跳过开场';}}
  root.classList.add('opening-managed','intro-pending');shell.inert=true;setPhase('loading');
  video.muted=true;video.playsInline=true;
  skip.onclick=()=>finish('skip');play.onclick=startPlayback;
  sound.onclick=()=>{video.muted=!video.muted;sound.textContent=video.muted?'开启声音':'静音';sound.setAttribute('aria-pressed',String(!video.muted));};
  video.addEventListener('playing',()=>{if(ending)return;lastProgress=performance.now();setPhase('playing');if(!hasFadedIn){hasFadedIn=true;const fade=animate(video,[{opacity:0},{opacity:1}],{duration:320,easing:'ease-out'});fade.finished.then(()=>fade.cancel()).catch(()=>{});}status.textContent='星海档案 / OPENING';});
  video.addEventListener('timeupdate',()=>{if(video.currentTime>lastTime){lastTime=video.currentTime;lastProgress=performance.now();}document.querySelector('.opening-progress i').style.transform='scaleX('+Math.min(1,video.currentTime/(video.duration||2))+')';});
  video.addEventListener('ended',()=>finish());video.addEventListener('error',()=>finish('error',true));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!entered){event.preventDefault();finish('keyboard');}});
  document.addEventListener('visibilitychange',()=>{if(ending||entered)return;if(document.hidden){pausedForVisibility=!video.paused;video.pause();}else{lastProgress=performance.now();if(pausedForVisibility){pausedForVisibility=false;startPlayback();}}});
  reduced.addEventListener('change',()=>{if(reduced.matches)finish('reduced-motion',true);});
  const watchdog=setInterval(()=>{if(!root.classList.contains('link-locked')&&!document.hidden&&!ending&&play.hidden&&performance.now()-lastProgress>10000)finish('timeout',true);},500);
  window.SeerOpening={replayEntrance:()=>entrance(true),get state(){return{phase,entered,entranceCount,autoCount}}};
  let begun=false;function begin(){if(begun)return;begun=true;lastProgress=performance.now();if(reduced.matches)finish('reduced-motion',true);else{video.src='intro/opening.mp4';startPlayback();}}
  if(root.classList.contains('link-locked'))window.addEventListener('seer:link-unlocked',begin,{once:true});else begin();
})();
