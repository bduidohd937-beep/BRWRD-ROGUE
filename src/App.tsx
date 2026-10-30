import { useRef, useState } from 'react'
import { Heart, Shield, Zap, Coins, Swords, RotateCcw, Crown, Map, Flame } from 'lucide-react'

type HeroId = 'rang' | 'bel' | 'arc'
type Card = { id: string; name: string; cost: number; kind: 'attack' | 'skill'; description: string; damage?: number; block?: number; draw?: number }
type Enemy = { id: number; name: string; hp: number; maxHp: number; block: number; turn: number; intent: string; damage: number; hits: number }
type Game = { hero: HeroId; hp: number; maxHp: number; block: number; energy: number; turn: number; room: number; gold: number; deck: Card[]; draw: Card[]; discard: Card[]; hand: Card[]; enemies: Enemy[]; status: 'fight'|'reward'|'choice'|'won'|'lost'; log: string[] }
type CombatFx = { kind: 'card'|'attack'|'enemy-hit'|'hero-hit'|'shield'; target?: number; damage?: number; key: number }

const attack: Card = { id:'strike', name:'일격', cost:1, kind:'attack', damage:6, description:'선택한 적에게 피해 6' }
const defend: Card = { id:'guard', name:'방어', cost:1, kind:'skill', block:5, description:'방어도 5 획득' }
const special: Record<HeroId, Card> = {
  rang: { id:'claw', name:'월하의 발톱', cost:1, kind:'attack', damage:9, description:'적에게 피해 9' },
  bel: { id:'rose', name:'철장미의 수호', cost:1, kind:'skill', block:8, description:'방어도 8 획득' },
  arc: { id:'seal', name:'차원 타격', cost:2, kind:'attack', damage:13, description:'적에게 피해 13' }
}
const heroes = {
  rang: { name:'이랑', title:'월하의 포식자', icon:'🐺' },
  bel: { name:'벨카리스', title:'철극의 여왕', icon:'🌹' },
  arc: { name:'아르시온', title:'봉쇄의 거신', icon:'🛡️' }
}

/** Game assets are provided separately under public/assets/characters. */
const characterAssets: Partial<Record<HeroId, string>> = {
  rang: '/assets/characters/irang.webp',
  bel: '/assets/characters/belcaris.webp',
}
function CharacterArtwork({ hero, variant }: { hero: HeroId; variant: 'selection' | 'battle' }) {
  const [failed, setFailed] = useState(false)
  const src = characterAssets[hero]
  return <div className={'character-art character-art--' + variant}>
    {src && !failed
      ? <img src={src} alt={heroes[hero].name + ' 전신 캐릭터'} loading={variant === 'selection' ? 'lazy' : 'eager'} draggable={false} onError={() => setFailed(true)} />
      : <span className="character-art__placeholder" aria-hidden="true">{heroes[hero].icon}</span>}
  </div>
}

const rewards: Card[] = [
  {id:'heavy',name:'강타',cost:2,kind:'attack',damage:14,description:'피해 14'},
  {id:'parry',name:'철벽',cost:1,kind:'skill',block:9,description:'방어도 9'},
  {id:'quick',name:'속공',cost:0,kind:'attack',damage:4,description:'피해 4'},
  {id:'study',name:'전술 정비',cost:1,kind:'skill',draw:2,description:'카드 2장 뽑기'},
  {id:'pierce',name:'암석 파쇄',cost:2,kind:'attack',damage:18,description:'피해 18'}
]
const rooms = ['대지의 균열','갈라진 진로','암석 사격지','버려진 야영지','굳어가는 길','지맥의 제단','떠돌이 상인','암석 포위망','깊은 지맥','거룡의 수문장','무너진 성소','대지룡의 둥지']
const floorType = (room: number) => [4,11].includes(room) ? 'rest' : [6].includes(room) ? 'event' : room===7?'shop' : room===12?'boss' : 'battle'
const shuffle = <T,>(list: T[]): T[] => {
  const a = [...list]
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] }
  return a
}
const makeEnemy = (name: string, id: number): Enemy => {
  const hp = name==='바위 정령'?28:name==='바위 궁수'?22:name==='바위 골렘'?75:130
  return {id,name,hp,maxHp:hp,block:0,turn:0,intent:'',damage:0,hits:0}
}
function intent(e: Enemy): Enemy {
  const n=e.turn
  if(e.name==='바위 정령') return {...e,intent:n%3===1?'방어 +6':n%3===2?'돌진 8':'공격 6',damage:n%3===1?0:n%3===2?8:6,hits:n%3===1?0:1}
  if(e.name==='바위 궁수') return {...e,intent:n%4===2?'조준':n%4===3?'관통 10':n%4===1?'연사 3×2':'공격 5',damage:n%4===2?0:n%4===3?10:n%4===1?3:5,hits:n%4===1?2:n%4===2?0:1}
  if(e.name==='바위 골렘') return {...e,intent:n%4===1?'방어 +12':n%4===2?'지진 예고':n%4===3?'대지 충격 17':'강타 9',damage:n%4===0?9:n%4===3?17:0,hits:n%4===0||n%4===3?1:0}
  const second=e.hp<=65
  const p=n%5
  return {...e,intent:p===1?'바위벽':p===2?'지진 예고':p===3?'지진 '+(second?21:16):p===4?'대지의 피부':'앞발 '+(second?13:10),damage:p===3?(second?21:16):p===0?(second?13:10):0,hits:p===0||p===3?1:0}
}
const encounter = (room: number): Enemy[] => {
  const names=room===1?['바위 정령']:room===2?['바위 정령','바위 정령']:room===3?['바위 정령','바위 궁수']:room===5?['바위 골렘']:room===8?['바위 정령','바위 궁수','바위 궁수']:room===9?['바위 골렘']:room===10?['바위 정령','바위 정령','바위 궁수']:room===12?['대지룡 기간토스']:['바위 궁수','바위 정령']
  return names.map((name,id)=>intent(makeEnemy(name,id)))
}
function takeCards(draw: Card[], discard: Card[], count: number) {
  let d=[...draw], used=[...discard], hand:Card[]=[]
  for(let i=0;i<count;i++){ if(!d.length){d=shuffle(used);used=[]} const c=d.shift();if(c)hand.push(c) }
  return {draw:d,discard:used,hand}
}
function start(hero: HeroId): Game {
  const deck=[...Array(5).fill(attack),...Array(4).fill(defend),special[hero]] as Card[]
  const initial=takeCards(shuffle(deck),[],5)
  return {hero,hp:60,maxHp:60,block:0,energy:3,turn:1,room:1,gold:0,deck,draw:initial.draw,discard:[],hand:initial.hand,enemies:encounter(1),status:'fight',log:['대지 전선에 진입했다.']}
}
function resolveEnemyTurn(g:Game):Game {
  let hp=g.hp, block=g.block, enemies=g.enemies.map(e=>({...e})), messages:string[]=[]
  for(const e of enemies){
    if(e.name==='바위 정령'&&e.turn%3===1) {e.block+=6;messages.push('바위 정령이 단단해졌다.')}
    else if(e.name==='바위 골렘'&&e.turn%4===1){e.block+=12;messages.push('골렘이 암석을 경화했다.')}
    else if(e.name==='대지룡 기간토스'&&e.turn%5===1){e.block+=14;messages.push('기간토스가 바위벽을 세웠다.')}
    else if(e.name==='대지룡 기간토스'&&e.turn%5===4){e.block+=8;messages.push('기간토스가 대지를 두른다.')}
    for(let i=0;i<e.hits;i++){const hit=e.damage;const absorbed=Math.min(block,hit);block-=absorbed;hp-=hit-absorbed}
    if(e.hits)messages.push(e.name+'의 공격: '+(e.damage*e.hits)+' 피해 (방어 적용)')
    e.turn+=1
  }
  if(hp<=0)return {...g,hp:0,status:'lost',log:[...messages,...g.log].slice(0,7)}
  const next=takeCards(g.draw,[...g.discard,...g.hand],5)
  enemies=enemies.map(e=>intent({...e,block:0}))
  return {...g,hp,block:0,enemies,hand:next.hand,draw:next.draw,discard:next.discard,energy:3,turn:g.turn+1,log:[...messages,...g.log].slice(0,7)}
}
function moveRoom(g:Game):Game {
  const room=g.room+1
  if(room>12)return {...g,status:'won'}
  if(floorType(room)!=='battle'&&floorType(room)!=='boss')return {...g,room,status:'choice',block:0}
  const cards=takeCards(shuffle(g.deck),[],5)
  return {...g,room,turn:1,energy:3,block:0,enemies:encounter(room),draw:cards.draw,discard:[],hand:cards.hand,status:'fight'}
}
function App(){
  const [hero,setHero]=useState<HeroId>('rang')
  const [game,setGame]=useState<Game|null>(null)
  const [target,setTarget]=useState<number>(0)
  const [notice,setNotice]=useState('')
  const [combatFx,setCombatFx]=useState<CombatFx|null>(null)
  const fxTimer=useRef<number|undefined>(undefined)
  const triggerFx=(fx: Omit<CombatFx,'key'>) => {
    if (fxTimer.current) window.clearTimeout(fxTimer.current)
    const key=Date.now()+Math.random()
    setCombatFx({...fx,key})
    fxTimer.current=window.setTimeout(()=>setCombatFx(null), fx.kind==='attack'?560:430)
  }
  const say=(s:string)=>{setNotice(s);window.setTimeout(()=>setNotice(''),1800)}
  const play=(index:number)=>{
    if(!game||game.status!=='fight')return
    const card=game.hand[index]
    if(card.cost>game.energy){say('에너지가 부족해!');return}
    triggerFx({kind:'card'})
    const enemies=game.enemies.map(e=>({...e}))
    if(card.damage){
      const e=enemies.find(x=>x.id===target&&x.hp>0)||enemies.find(x=>x.hp>0)
      if(!e)return
      const absorbed=Math.min(e.block,card.damage);e.block-=absorbed;e.hp-=card.damage-absorbed
      triggerFx({kind:'attack',target:e.id,damage:card.damage-absorbed})
    } else if(card.block) {
      triggerFx({kind:'shield'})
    }
    const newHand=game.hand.filter((_,i)=>i!==index)
    const extra=takeCards(game.draw,game.discard,card.draw||0)
    let g:Game={...game,energy:game.energy-card.cost,block:game.block+(card.block||0),enemies,hand:[...newHand,...extra.hand],draw:extra.draw,discard:[...extra.discard,card],log:[card.name+' 사용',...game.log].slice(0,7)}
    if(enemies.every(e=>e.hp<=0)){g={...g,status:game.room===12?'won':'reward',gold:game.gold+(game.room===5||game.room===9?45:25),log:['전투 승리!',...g.log]}}
    setGame(g)
  }
  const reward=(card:Card|null)=>{if(!game)return;const g=card?{...game,deck:[...game.deck,card]}:game;setGame(moveRoom(g));setTarget(0);setCombatFx(null)}
  const choice=(action:'heal'|'upgrade'|'shop'|'leave')=>{
    if(!game)return
    let g={...game}
    if(action==='heal')g.hp=Math.min(g.maxHp,g.hp+18)
    if(action==='shop'){if(g.gold<50){say('골드 50이 필요해');return}g.gold-=50;g.deck=[...g.deck,rewards[Math.floor(Math.random()*rewards.length)]]}
    if(action==='upgrade') {g.maxHp+=4;g.hp+=4}
    if(action==='leave'){setGame(moveRoom(g));setCombatFx(null);return}
    setGame(moveRoom(g));setCombatFx(null)
  }
  if(!game)return <main className="shell"><header className="mast"><div className="kicker">BREAK THE WALLS, ROLL THE DICE</div><h1>BTWRD <span>ROGUE</span></h1><p>퓨어월드 · 대지 전선 · 첫 번째 원정</p></header><section className="panel"><h2>영웅 선택</h2><div className="heroes">{(Object.keys(heroes) as HeroId[]).map(id=><button key={id} className={'hero '+(id===hero?'active':'')} onClick={()=>setHero(id)}><CharacterArtwork key={id} hero={id} variant="selection" /><b>{heroes[id].name}</b><small>{heroes[id].title}</small></button>)}</div><p className="muted">공통 시작 능력: HP 60 · 에너지 3 · 드로우 5 · 시작 덱 10장</p><button className="primary wide" onClick={()=>{setGame(start(hero));setTarget(0)}}>대지 전선 출정 →</button></section><p className="foot">V0.1 전투 프로토타입 · 영웅 고유 자원 및 정식 카드 세트는 후속 패치 예정</p></main>
  const current=rooms[game.room-1]
  return <main className="shell"><header className="game-head"><div><div className="kicker">PURE WORLD / EARTH FRONT</div><h1>BTWRD <span>ROGUE</span></h1></div><button className="plain" onClick={()=>{setGame(null);setNotice('');setCombatFx(null)}}><RotateCcw size={15}/> 새 원정</button></header>
    <section className="hud"><span><Heart size={16}/> {game.hp}/{game.maxHp}</span><span><Shield size={16}/> {game.block}</span><span><Zap size={16}/> {game.energy}/3</span><span><Coins size={16}/> {game.gold} G</span></section>
    <section className="map-strip"><Map size={16}/><strong>{game.room}/12 · {current}</strong><span> {game.status==='fight'?'턴 '+game.turn:''}</span></section>
    {game.status==='fight'&&<><section className={'arena '+(combatFx?.kind==='hero-hit'?'arena--hero-hit':'')}><div className="enemy-line">{game.enemies.filter(e=>e.hp>0).map(e=><button key={e.id} className={'enemy '+(e.id===target?'target ':'')+(combatFx?.target===e.id?'enemy--'+combatFx.kind:'')} onClick={()=>setTarget(e.id)}><div className="enemy-art">{e.name==='대지룡 기간토스'?'🐉':e.name==='바위 골렘'?'🗿':e.name==='바위 궁수'?'🏹':'🪨'}</div><b>{e.name}</b><div className="life"><div style={{width:Math.max(0,e.hp/e.maxHp*100)+'%'}}/></div><small>HP {Math.max(0,e.hp)}/{e.maxHp} · 방어 {e.block}</small><div className="intent">{e.intent}</div>{combatFx?.target===e.id&&combatFx.damage!==undefined&&<span className="damage-float" key={combatFx.key}>-{combatFx.damage}</span>}</button>)}</div><div className={'fighter '+(combatFx?.kind==='attack'?'fighter--attack ':'')+(combatFx?.kind==='hero-hit'?'fighter--hit ':'')+(combatFx?.kind==='shield'?'fighter--shield':'')}><CharacterArtwork key={game.hero} hero={game.hero} variant="battle" /><div className="fighter-label"><b>{heroes[game.hero].name}</b><small>공격 대상을 선택하세요</small></div>{combatFx?.kind==='shield'&&<span className="shield-burst" aria-label="방어막 활성화"><Shield/></span>}</div></section><section className="hand-area"><div className="hand-head"><h2>내 손패 <span>{game.hand.length}</span></h2><button className="primary" onClick={()=>{const next=resolveEnemyTurn(game);if(next.hp<game.hp)triggerFx({kind:'hero-hit'});setGame(next)}}>턴 종료 →</button></div><div className="hand">{game.hand.map((c,i)=><button className={'card '+(c.kind==='attack'?'attack':'skill')+(combatFx?.kind==='card'?' card--played':'')} key={i} onClick={()=>play(i)} disabled={c.cost>game.energy}><span className="cost">{c.cost}</span><div className="card-symbol">{c.kind==='attack'?<Swords/>:<Shield/>}</div><b>{c.name}</b><small>{c.description}</small></button>)}</div><div className="muted small">뽑을 카드 {game.draw.length} · 버린 카드 {game.discard.length}</div></section></>}
    {game.status==='reward'&&<section className="panel centre"><h2>⚔️ 전투 승리!</h2><p>골드를 획득했어. 덱에 추가할 카드를 하나 선택하거나 건너뛰자.</p><div className="rewards">{rewards.slice((game.room-1)%3,(game.room-1)%3+3).map(c=><button key={c.id} className="card reward-card" onClick={()=>reward(c)}><span className="cost">{c.cost}</span><b>{c.name}</b><small>{c.description}</small></button>)}</div><button className="plain" onClick={()=>reward(null)}>보상 건너뛰기 →</button></section>}
    {game.status==='choice'&&<section className="panel centre"><h2>{[4,11].includes(game.room)?'🔥 휴식 지점':game.room===7?'🛒 떠돌이 상인':'✨ 대지의 발견'}</h2><p>{current}에 도착했다. 다음 행동을 선택하자.</p><div className="choices">{[4,11].includes(game.room)?<><button onClick={()=>choice('heal')}>HP 18 회복</button><button onClick={()=>choice('upgrade')}>최대 HP +4 (임시 강화)</button></>:game.room===7?<><button onClick={()=>choice('shop')}>무작위 카드 구매 · 50G</button><button onClick={()=>choice('leave')}>상점을 떠난다</button></>:<><button onClick={()=>choice('heal')}>지맥의 기운으로 HP 18 회복</button><button onClick={()=>choice('upgrade')}>지맥 축복 · 최대 HP +4</button></>}</div></section>}
    {game.status==='won'&&<section className="panel centre"><Crown size={45}/><h2>대지 전선 돌파!</h2><p>기간토스를 처치했어! 물의 전선은 다음 개발 단계에서 열릴 예정이야.</p><button className="primary" onClick={()=>setGame(null)}>다시 시작</button></section>}
    {game.status==='lost'&&<section className="panel centre"><h2>원정 실패</h2><p>바위에 굴복했지만, 새로운 덱으로 다시 도전할 수 있어.</p><button className="primary" onClick={()=>setGame(null)}>재도전</button></section>}
    {!!notice&&<div className="toast">{notice}</div>}<footer className="foot">전투 로그: {game.log.slice(0,2).join(' · ')}</footer>
  </main>
}
export default App
