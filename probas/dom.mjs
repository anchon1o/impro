// Mínimo para react-test-renderer + hooks que len window/localStorage.
globalThis.window = globalThis;
window.innerWidth = 1280; window.innerHeight = 900;
window.addEventListener = window.addEventListener || (()=>{});
window.removeEventListener = window.removeEventListener || (()=>{});
window.matchMedia = window.matchMedia || (()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
window.location = window.location || { search:'', href:'http://localhost/' };
window.dispatchEvent = window.dispatchEvent || (()=>true);
const mem = new Map();
globalThis.localStorage = window.localStorage = {
  getItem:k=>mem.has(k)?mem.get(k):null, setItem:(k,v)=>mem.set(k,String(v)),
  removeItem:k=>mem.delete(k), clear:()=>mem.clear(), key:i=>[...mem.keys()][i],
  get length(){return mem.size;},
};
const _ouv = {};
globalThis.document = globalThis.document || {
  hidden:false, visibilityState:'visible',
  createElement:()=>({style:{},setAttribute(){},appendChild(){},click(){}}),
  body:{appendChild(){},removeChild(){}}, documentElement:{style:{}},
  addEventListener(t,f){(_ouv[t]=_ouv[t]||[]).push(f);},
  removeEventListener(t,f){if(_ouv[t])_ouv[t]=_ouv[t].filter(x=>x!==f);},
  dispatchEvent(e){(_ouv[e&&e.type]||[]).forEach(f=>f(e));return true;},
  disparar(t){(_ouv[t]||[]).forEach(f=>f({type:t}));},
};
try{ if(!globalThis.navigator) globalThis.navigator={userAgent:'node',language:'gl'}; }catch(e){}
globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || (cb=>setTimeout(()=>cb(Date.now()),16));
globalThis.cancelAnimationFrame = globalThis.cancelAnimationFrame || (id=>clearTimeout(id));
globalThis.confirm = globalThis.confirm || (()=>true);
globalThis.alert = globalThis.alert || (()=>{});

// ── AudioContext / Audio falsos, para as probas que renderizan Sonido ──
let _reloxo = 0;
function _param(v){return{value:v,setTargetAtTime(x){this.value=x;},setValueAtTime(x){this.value=x;},linearRampToValueAtTime(x){this.value=x;},exponentialRampToValueAtTime(){},cancelScheduledValues(){}};}
function _gain(){return{gain:_param(1),connect(){},disconnect(){}};}
class FakeCtx{
  constructor(){this.state='running';this.sampleRate=48000;this.onstatechange=null;}
  get currentTime(){return _reloxo;}
  createGain(){return _gain();}
  createBufferSource(){return{buffer:null,connect(){},start(){},stop(){},onended:null};}
  createBuffer(){return{duration:1,numberOfChannels:1,getChannelData:()=>new Float32Array(16)};}
  createMediaElementSource(){return{connect(){},disconnect(){}};}
  createDynamicsCompressor(){return{connect(){},disconnect(){},threshold:_param(-24),knee:_param(30),ratio:_param(12),attack:_param(0),release:_param(0.25)};}
  createOscillator(){return{type:'sine',frequency:_param(440),connect(){},disconnect(){},start(){},stop(){},onended:null};}
  createAnalyser(){return{connect(){},disconnect(){},fftSize:2048,getByteTimeDomainData(){}};}
  decodeAudioData(){return Promise.resolve(this.createBuffer());}
  resume(){this.state='running';if(this.onstatechange)this.onstatechange();return Promise.resolve();}
  suspend(){this.state='suspended';return Promise.resolve();}
  suspender(){this.state='suspended';if(this.onstatechange)this.onstatechange();}
  close(){this.state='closed';return Promise.resolve();}
}
class FakeAudio{
  constructor(){this.src='';this.paused=true;this.loop=false;this.volume=1;this.currentTime=0;this.crossOrigin=null;}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  load(){}
  addEventListener(){} removeEventListener(){}
}
window.AudioContext = FakeCtx;
window.webkitAudioContext = FakeCtx;
globalThis.AudioContext = FakeCtx;
globalThis.Audio = FakeAudio;
window.Audio = FakeAudio;

// fetch falso: devolve un buffer baleiro, abonda para as descargas de efectos.
globalThis.fetch = globalThis.fetch && globalThis.__realFetch ? globalThis.fetch : (async () => ({
  ok:true, status:200,
  arrayBuffer: async () => new ArrayBuffer(64),
  blob: async () => ({ size:64, type:'audio/wav' }),
  json: async () => ({}), text: async () => '',
}));
