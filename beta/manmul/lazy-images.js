'use strict';
// Unit and effect art loads on first use instead of all at startup (~45MB → a few MB before the title shows).
// Each group is a Map-like with get(id); the first get() starts the download, and drawing code already skips
// images that are not complete yet. After the title screen is up, warm() fills every group in the background,
// in registration order (normal → magic → … → upper effects), a few files at a time, so later fusions rarely wait.
const ManmulLazyImages=(()=>{
 const groups=[];let started=false,paused=false,active=0,queue=[],done=0,total=0,listeners=[],parallelism=4;
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
 // pause() stops new downloads (the ones in flight finish) so the stage intro gets the bandwidth; resume() continues.
 function next(){if(paused)return;let item=queue.shift();if(!item)return;let [g,id]=item,img=g.get(id);
  if(!img||img.complete){done++;notify();next();return}
  active++;let finish=()=>{img.removeEventListener?.('load',finish);img.removeEventListener?.('error',finish);active--;done++;notify();next()};
  img.addEventListener?img.addEventListener('load',finish):(img.onload=finish);img.addEventListener?.('error',finish)}
 function fill(){while(!paused&&active<parallelism&&queue.length)next()}
 function warm(parallel=4){if(started||typeof Image==='undefined')return;started=true;parallelism=parallel;
  queue=groups.flatMap(g=>g.ids().map(id=>[g,id]));fill()}
 function pause(){paused=true}
 function resume(){if(!paused)return;paused=false;fill()}
 function onProgress(f){listeners.push(f);f(done,total)}
 return {lazyImages,warm,pause,resume,onProgress,progress:()=>({done,total,started,paused})};
})();
if(typeof globalThis!=='undefined')globalThis.ManmulLazyImages=ManmulLazyImages;
