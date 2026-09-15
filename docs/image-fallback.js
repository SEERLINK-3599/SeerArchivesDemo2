(() => {
  'use strict';
  const url='assets/unavailable-image.png',absolute=new URL(url,document.baseURI).href;
  const tracked=new WeakMap(),backgrounds=new Map();let pendingRefresh=false;
  const notify=()=>{if(pendingRefresh)return;pendingRefresh=true;requestAnimationFrame(()=>{pendingRefresh=false;window.dispatchEvent(new Event('seer:image-fallback'));});};
  function watchImages(){
    document.querySelectorAll('img').forEach(img=>{
      const source=img.getAttribute('src');if(!source)return;
      if(img.src!==absolute)tracked.set(img,{source,alt:img.alt,title:img.title});
      img.onerror=()=>{
        // 内置兜底图也不可用时停止重试，避免档案卡片进入无限循环。
        if(img.src===absolute){img.onerror=null;return;}
        const original=tracked.get(img)||{source:img.getAttribute('src'),alt:img.alt,title:img.title};tracked.set(img,original);
        img.classList.remove('unavailable');img.classList.add('fallback-image');
        img.alt=(original.alt||'图片')+'（原图片不可用，显示内置替代图）';img.title='原图片无法读取，当前显示网站内置替代图';img.src=url;
      };
      img.onload=()=>{if(img.src!==absolute){img.classList.remove('fallback-image','unavailable');const original=tracked.get(img);if(img.title==='原图片无法读取，当前显示网站内置替代图')img.title=original?.title||'';}};
      // 切换档案视图时，缓存中的失败记录可能早于处理器安装到达。
      if(img.complete&&img.naturalWidth===0)img.onerror();
    });
  }
  function css(source){
    if(!source)return 'none';
    if(!backgrounds.has(source)){
      backgrounds.set(source,'pending');const probe=new Image();
      probe.onload=()=>backgrounds.set(source,'ready');
      probe.onerror=()=>{backgrounds.set(source,'failed');notify();};probe.src=source;
    }
    const chosen=backgrounds.get(source)==='failed'?url:source;
    return 'url("'+chosen.replaceAll('"','%22')+'")';
  }
  window.SeerFallback={url,watchImages,css};
})();
