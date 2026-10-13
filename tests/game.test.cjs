'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const engine=html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const scope={};vm.createContext(scope);vm.runInContext(engine,scope);
const {RiverGame,PLAY,PY,SECTOR}=scope.RiverRaid;
const tick=(g,seconds,input={})=>{for(let i=0;i<Math.round(seconds*60);i++)g.step(1/60,input);};
const empty=(mode='b')=>{const g=new RiverGame();g.reset(mode);g.entities=[];g.generated=9999;g.start();return g;};
const entity=(g,type,y,extra={})=>{const e={type,x:g.x,y,w:12,h:8,dead:false,points:30,...extra};g.entities.push(e);return e;};

test('starts with three reserve jets and waits for player input',()=>{
 const g=new RiverGame();g.reset();assert.equal(g.reserves,3);assert.equal(g.mode,'ready');tick(g,1);assert.equal(g.distance,0);
 tick(g,1,{fire:true});assert.equal(g.mode,'playing');assert.ok(g.distance>0);
});
test('fuel use is independent of speed; slowing over fuel gives more fuel',()=>{
 const slow=empty(),fast=empty();tick(slow,2,{throttle:-1});tick(fast,2,{throttle:1});
 assert.ok(fast.distance>slow.distance);assert.ok(Math.abs(slow.fuel-fast.fuel)<1e-9);
 function run(throttle){const g=empty();g.fuel=25;entity(g,'fuel',g.playerY+40,{h:34,points:80});tick(g,3,{throttle});return g.fuel;}
 assert.ok(run(-1)>run(1));
});
test('scoring for every classic target and single-hit bridges',()=>{
 for(const [type,points] of [['boat',30],['heli',60],['fuel',80],['jet',100],['bridge',500]]){
  const g=empty();const e=entity(g,type,g.playerY+14,{points,stage:1});g.bullets.push({x:g.x,y:g.playerY+9});tick(g,.05);
  assert.equal(g.score,points,type);assert.equal(e.dead,true,type);
 }
});
test('only one missile, steerable in B and straight in A',()=>{
 const a=empty('a'),b=empty('b');tick(a,.2,{fire:true,move:1});tick(b,.2,{fire:true,move:1});
 assert.equal(a.bullets.length,1);assert.equal(b.bullets.length,1);assert.ok(Math.abs(a.bullets[0].x-b.bullets[0].x)>5);
 tick(b,.1,{fire:true});assert.ok(b.bullets.length<=1);
});
test('a missile hits the closest target first and cannot score twice',()=>{
 const g=empty(),near=entity(g,'boat',g.playerY+12),far=entity(g,'heli',g.playerY+16,{points:60});
 g.bullets.push({x:g.x,y:g.playerY+7});g.step(1/30);
 assert.equal(near.dead,true);assert.equal(far.dead,false);assert.equal(g.score,30);
 g.destroy(near);assert.equal(g.score,30);
});
test('shooting a fuel depot removes refueling',()=>{
 const g=empty();g.fuel=25;const fuel=entity(g,'fuel',g.playerY,{h:34,points:80});g.destroy(fuel);
 tick(g,.4);assert.ok(g.fuel<25);assert.equal(g.refueling,false);assert.equal(g.score,80);
});
test('every 10000 points gives a reserve, capped at nine',()=>{
 const g=empty();g.addScore(10000);assert.equal(g.reserves,4);g.addScore(100000);assert.equal(g.reserves,9);
});
test('destroying the bridge checkpoints the next sector immediately',()=>{
 const g=empty();const bridge=entity(g,'bridge',690,{points:500,stage:1});g.destroy(bridge);
 assert.equal(g.checkpointLevel,2);g.crash('boat');tick(g,1.3);
 assert.equal(g.mode,'ready');assert.equal(g.reserves,2);assert.equal(g.playerY,720);assert.equal(g.fuel,100);
});
test('four losses exhaust the active jet and three reserves',()=>{
 const g=empty();for(let i=0;i<4;i++){g.start();g.crash('boat');tick(g,1.3);}
 assert.equal(g.mode,'gameover');assert.equal(g.reserves,0);
});
test('pause freezes fuel, world position and death countdown',()=>{
 const g=empty();g.pause();const snapshot=[g.fuel,g.distance];tick(g,2,{fire:true});assert.deepEqual([g.fuel,g.distance],snapshot);
 g.resume();g.crash('boat');g.pause();const timer=g.deathTimer;tick(g,2);assert.equal(g.deathTimer,timer);g.resume();assert.equal(g.mode,'dying');
});
test('bank, obstacle, island and fuel exhaustion all lose a jet',()=>{
 const bank=empty();bank.x=4;tick(bank,.02);assert.equal(bank.mode,'dying');
 const enemy=empty();entity(enemy,'boat',enemy.playerY);tick(enemy,.02);assert.equal(enemy.mode,'dying');
 const island=empty();entity(island,'island',island.playerY,{w:30,h:100});tick(island,.02);assert.equal(island.mode,'dying');
 const dry=empty();dry.fuel=.001;tick(dry,.02);assert.equal(dry.mode,'dying');
});
test('map repeats across games and generated objects stay in playable water',()=>{
 const a=new RiverGame(),b=new RiverGame();
 for(let y=0;y<SECTOR*50;y+=7){const p=a.river(y);assert.deepEqual(p,b.river(y));assert.ok(p.left>=0&&p.right<=160);assert.ok(p.width>=32);}
 for(let stage=0;stage<24;stage++){
  const g=empty();g.generated=9999;g.generate(stage);
  for(const e of g.entities.filter(e=>!['bridge','island'].includes(e.type))){assert.equal(g.landAt(e.x,e.y,e.w/2),false,stage+': '+e.type+' @ '+e.y);}
 }
});
test('respawn restores sector objects without retaining old bullets',()=>{
 const g=new RiverGame();g.reset();const boat=g.entities.find(e=>e.type==='boat');g.destroy(boat);g.bullets.push({x:80,y:80});
 g.start();g.crash('bank');tick(g,1.3);assert.equal(g.entities.find(e=>e.id===boat.id).dead,false);assert.equal(g.bullets.length,0);
});
test('all scripts parse, HTML is self-contained, essential controls exist',()=>{
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 assert.ok(!/<script[^>]+src=/.test(html));assert.ok(!/<link[^>]+href="https?:/.test(html));
 for(const id of ['screen','reset','pause','sound','fullscreen','difficulty','players','helpDialog'])assert.ok(html.includes('id="'+id+'"'));
});

test('destroying a distant bridge does not despawn on-screen obstacles',()=>{
 const g=empty();g.distance=520;g.x=80;const boat=entity(g,'boat',575);const bridge=entity(g,'bridge',690,{points:500,stage:1});
 g.destroy(bridge);g.step(1/60);assert.ok(g.entities.includes(boat));
});

test('application starts, transfers keyboard focus, pauses, alternates players and releases touch input',()=>{
 const elements=new Map(),listeners={},frames=[],instances=[];
 const draw={fillRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){}};
 let doc;
 class Element{
  constructor(id){this.id=id;this.listeners={};this.value='';this.dataset={};this.classList={add(){},remove(){}};this.open=false;}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  trigger(name,extra={}){for(const fn of this.listeners[name]??[])fn({target:this,preventDefault(){},...extra});}
  setAttribute(){} setPointerCapture(){} focus(){doc.activeElement=this;} getContext(){return draw;}
  showModal(){this.open=true;} close(){this.open=false;}
 }
 class Select extends Element{}class Button extends Element{}class Input extends Element{}
 for(const match of html.matchAll(/id="([^"]+)"/g)){
  const id=match[1],Ctor=['difficulty','players'].includes(id)?Select:['reset','pause','sound','fullscreen','continue','help','closeHelp'].includes(id)?Button:Element;
  elements.set(id,new Ctor(id));
 }
 elements.get('players').value='2';elements.get('difficulty').value='b';
 const buttons=['left','right','up','down','fire'].map(control=>{const b=new Button(control);b.dataset.control=control;return b;});
 doc={getElementById:id=>elements.get(id),querySelectorAll:()=>buttons,addEventListener:(n,fn)=>{listeners[n]=fn;},hidden:false};
 const windowListeners={};
 const context={document:doc,window:{addEventListener:(n,fn)=>{windowListeners[n]=fn;}},navigator:{getGamepads:()=>[]},
  HTMLSelectElement:Select,HTMLButtonElement:Button,HTMLInputElement:Input,requestAnimationFrame:fn=>frames.push(fn),
  localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}};
 vm.createContext(context);
 vm.runInContext(engine,context);
 const Base=context.RiverRaid.RiverGame;
 context.RiverRaid.RiverGame=class extends Base{constructor(){super();instances.push(this);}};
 for(const name of ['renderer','app'])vm.runInContext(html.match(new RegExp('<script id="'+name+'">([\\s\\S]*?)<\\/script>'))[1],context);
 let now=100;const run=n=>{for(let i=0;i<n;i++){now+=1000/60;frames.shift()(now);}};
 elements.get('reset').trigger('click');assert.equal(doc.activeElement.id,'screen');
 const p1=instances.at(-2),p2=instances.at(-1);
 listeners.keydown({target:doc.activeElement,code:'ArrowRight',preventDefault(){}});run(4);
 listeners.keyup({code:'ArrowRight'});assert.equal(p1.mode,'playing');assert.ok(p1.x>80);
 elements.get('pause').trigger('click');const distance=p1.distance;run(10);assert.equal(p1.distance,distance);assert.equal(p1.mode,'paused');
 elements.get('pause').trigger('click');assert.equal(p1.mode,'playing');
 p1.crash('boat');run(75);assert.equal(elements.get('turn').textContent,'JOGADOR 2');assert.equal(p2.mode,'ready');
 buttons.find(b=>b.dataset.control==='left').trigger('pointerdown',{pointerId:1});
 buttons.find(b=>b.dataset.control==='fire').trigger('pointerdown',{pointerId:2});run(5);assert.ok(p2.x<80);assert.equal(p2.bullets.length,1);
 buttons.find(b=>b.dataset.control==='left').trigger('lostpointercapture',{pointerId:1});const x=p2.x;run(2);assert.equal(p2.x,x);
 windowListeners.blur();assert.equal(p2.mode,'paused');
});
