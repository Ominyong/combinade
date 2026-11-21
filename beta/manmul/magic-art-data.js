'use strict';
// Shared 48px canvas and 25px reference extent for the magic pixel sprites.
const magicMotionSpecs=Object.fromEntries(Array.from({length:27},(_,i)=>['M'+String(i+1).padStart(3,'0'),{cx:24,cy:24,size:25}]));
