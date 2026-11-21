'use strict';
// Unit and effect art loads on first use instead of all at startup (~45MB → a few MB before the title shows).
// Each group is a Map-like with get(id); the first get() starts the download, and drawing code already skips
// images that are not complete yet. After the title screen is up, warm() fills every group in the background,
// in registration order (normal → magic → … → upper effects), a few files at a time, so later fusions rarely wait.
const ManmulLazyImages=(()=>{
 const groups=[];let started=false,done=0,total=0,listeners=[];
 function lazyImages(ids,path){
  const known=new Set(ids),images=new Map();
  const group={
   get(id){let img=images.get(id);if(!img&&known.has(id)&&typeof Image!=='undefined'){img=new Image();img.decoding='async';img.src=path(id);images.set(id,img)}return img},
   has(id){return known.has(id)},
   loaded(id){let img=images.get(id);return !!(img&&img.complete&&img.naturalWidth)},
   ids:()=>[...known],
   get size(){return known.size}
  };
  groups.push(group);total+=known.size;return group}
 function notify(){for(const f of listeners)try{f(done,total)}catch(e){}}
 // Background fill: `parallel` downloads at once; requests already started by get() count as they finish.
 function warm(parallel=4){if(started||typeof Image==='undefined')return;started=true;
  const queue=groups.flatMap(g=>g.ids().map(id=>[g,id]));
  const next=()=>{let item=queue.shift();if(!item)return;let [g,id]=item,img=g.get(id);
   if(!img){done++;notify();next();return}
   if(img.complete){done++;notify();next();return}
   let finish=()=>{img.removeEventListener?.('load',finish);img.removeEventListener?.('error',finish);done++;notify();next()};
   img.addEventListener?img.addEventListener('load',finish):(img.onload=finish);img.addEventListener?.('error',finish)};
  for(let i=0;i<parallel;i++)next()}
 function onProgress(f){listeners.push(f);f(done,total)}
 return {lazyImages,warm,onProgress,progress:()=>({done,total,started})};
})();
if(typeof globalThis!=='undefined')globalThis.ManmulLazyImages=ManmulLazyImages;
