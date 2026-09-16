import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RotateCcw, Trophy, Users, Eye, CircleHelp, CheckCircle2, XCircle } from "lucide-react";

const SUITS = [
  { id: "Blatt", symbol: "♠", cls: "black" },
  { id: "Herz", symbol: "♥", cls: "red" },
  { id: "Eichel", symbol: "♣", cls: "black" },
  { id: "Karo", symbol: "♦", cls: "red" },
];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const PLAYERS = ["Du","Links","Vorne","Rechts"];
const suitInfo = id => SUITS.find(s => s.id === id);
const cardId = c => `${c.suit}-${c.rank}`;

function shuffle(items) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function freshGame() {
  const deck=shuffle(SUITS.flatMap(s=>RANKS.map((rank,value)=>({suit:s.id,rank,value}))));
  const quizCount=Math.random()<.5?2:3;
  const possible=shuffle(Array.from({length:11},(_,i)=>i+3));
  return {hands:Array.from({length:4},(_,p)=>deck.slice(p*13,p*13+13)),leader:0,turn:0,trick:[],completedTricks:[],scores:[0,0,0,0],round:1,quizRounds:possible.slice(0,quizCount).sort((a,b)=>a-b),passed:0,status:"playing",message:"Du beginnst. Lege eine Karte aus deiner Hand."};
}
function Button({children,onClick,disabled,className=""}) { return <button className={`button ${className}`} onClick={onClick} disabled={disabled}>{children}</button>; }
function PlayingCard({card,small=false,playable=false,onClick}) {
  const s=suitInfo(card.suit);
  return <motion.button layout whileHover={playable?{y:-8,scale:1.03}:{}} whileTap={playable?{scale:.97}:{}} onClick={onClick} disabled={!playable} className={`playing-card ${small?"small":""} ${s.cls}`}>
    <span className="rank">{card.rank}</span><span className="symbol">{s.symbol}</span><span className="symbol bottom">{s.symbol}</span>
  </motion.button>;
}
function BackCards({count}) { return <div className="backs">{Array.from({length:Math.min(count,8)}).map((_,i)=><i key={i}/>)}<b>{count}</b></div>; }

export default function App(){
  const [game,setGame]=useState(freshGame); const [quiz,setQuiz]=useState(null); const [answerCount,setAnswerCount]=useState(""); const [answerRanks,setAnswerRanks]=useState([]); const [quizResult,setQuizResult]=useState(null);
  const leadSuit=game.trick[0]?.card.suit, currentHand=game.hands[0];
  const playableIds=useMemo(()=>{if(game.turn!==0||game.status!=="playing"||quiz)return new Set();if(!leadSuit)return new Set(currentHand.map(cardId));const matching=currentHand.filter(c=>c.suit===leadSuit);return new Set((matching.length?matching:currentHand).map(cardId));},[currentHand,leadSuit,game.turn,game.status,quiz]);
  const sortedHand=[...currentHand].sort((a,b)=>SUITS.findIndex(s=>s.id===a.suit)-SUITS.findIndex(s=>s.id===b.suit)||b.value-a.value);

  function startQuiz(next){const played=next.completedTricks.flatMap(t=>t.cards.map(x=>x.card));const suit=SUITS[Math.floor(Math.random()*4)].id;setAnswerCount("");setAnswerRanks([]);setQuizResult(null);setQuiz({suit,correctCards:played.filter(c=>c.suit===suit)});setGame(next);}
  function finishTrick(g){const lead=g.trick[0].card.suit;const winner=g.trick.filter(p=>p.card.suit===lead).reduce((best,p)=>p.card.value>best.card.value?p:best).player;setGame({...g,pendingWinner:winner,status:"waitingForOk",message:`${PLAYERS[winner]} gewinnt den Stich. Sieh dir alle vier Karten an und klicke dann auf „OK“. `});}
  function collectTrick(){if(game.status!=="waitingForOk"||game.trick.length!==4)return;const winner=game.pendingWinner,scores=[...game.scores];scores[winner]++;const completedTricks=[...game.completedTricks,{cards:[...game.trick],winner}],finishedRound=completedTricks.length,isEnd=finishedRound===13;const next={...game,scores,completedTricks,trick:[],leader:winner,turn:winner,pendingWinner:null,round:isEnd?13:finishedRound+1,status:isEnd?"won":"playing",message:isEnd?`${PLAYERS[winner]} sammelt den letzten Stich ein. Das Training ist beendet!`:`${PLAYERS[winner]} sammelt den Stich ein und spielt als Nächstes aus.`};if(game.quizRounds.includes(finishedRound))startQuiz(next);else{setGame(next);if(!isEnd&&winner!==0)setTimeout(()=>aiPlay(next),650);}}
  function playCard(player,card,base=game){if(base.trick.some(p=>p.player===player))return;const hands=base.hands.map((h,i)=>i===player?h.filter(c=>cardId(c)!==cardId(card)):h),trick=[...base.trick,{player,card}],nextTurn=(player+3)%4,next={...base,hands,trick,turn:nextTurn,message:`${PLAYERS[player]} legt ${card.rank} ${card.suit}.`};setGame(next);if(trick.length===4)finishTrick(next);else if(nextTurn!==0)setTimeout(()=>aiPlay(next),620);else setGame({...next,message:"Du bist dran. Bediene die ausgespielte Sorte, wenn möglich."});}
  function aiPlay(base){if(base.status!=="playing"||base.turn===0)return;const p=base.turn,hand=base.hands[p],lead=base.trick[0]?.card.suit,legal=lead&&hand.some(c=>c.suit===lead)?hand.filter(c=>c.suit===lead):hand;playCard(p,legal[Math.floor(Math.random()*legal.length)],base);}
  function reset(){setQuiz(null);setQuizResult(null);setGame(freshGame());}
  function checkQuiz(){const correct=quiz.correctCards.map(c=>c.rank).sort((a,b)=>RANKS.indexOf(a)-RANKS.indexOf(b)),chosen=[...answerRanks].sort((a,b)=>RANKS.indexOf(a)-RANKS.indexOf(b)),ok=Number(answerCount)===quiz.correctCards.length&&JSON.stringify(correct)===JSON.stringify(chosen);setQuizResult(ok);if(ok)setTimeout(()=>{const next={...game,passed:game.passed+1,message:"Richtig! Das Spiel geht weiter."};setQuiz(null);setQuizResult(null);setGame(next);if(next.status==="playing"&&next.turn!==0)setTimeout(()=>aiPlay(next),600);},900);else setTimeout(reset,2200);}

  const positions={0:"bottom",1:"left",2:"top",3:"right"};
  return <main>
    <div className="wrap">
      <header><div><div className="eyebrow"><Brain/> Gedächtnistraining</div><h1>Karten mitzählen</h1><p>52 Karten, 4 Spieler, 13 Stiche. Merke dir Sorte und Wert.</p></div><Button onClick={reset}><RotateCcw/> Neu mischen</Button></header>
      <section className="scores">{PLAYERS.map((p,i)=><div className={game.leader===i?"active":""} key={p}><span>{p}{game.leader===i?" · Führt":""}</span><strong>{game.scores[i]} Stiche</strong>{i===0?<Eye/>:<Users/>}</div>)}</section>
      <section className="table">
        <div className="op front"><label>VORNE</label><BackCards count={game.hands[2].length}/></div><div className="op left-op"><label>LINKS</label><BackCards count={game.hands[1].length}/></div><div className="op right-op"><label>RECHTS</label><BackCards count={game.hands[3].length}/></div>
        <div className="trick">{game.trick.length===0?<div className="empty"><CircleHelp/><span>Stich {game.round} von 13</span></div>:game.trick.map(p=><div key={p.player} className={`thrown ${positions[p.player]}`}><PlayingCard card={p.card} small/></div>)}</div>
        <div className="message">{game.message}{game.status==="waitingForOk"&&<Button className="ok" onClick={collectTrick}>OK</Button>}</div>
      </section>
      <section className="hand"><div className="hand-head"><h2>Deine Hand · {currentHand.length} Karten</h2><span>Spielbare Karten sind hervorgehoben</span></div><div className="hand-scroll">{sortedHand.map(card=><PlayingCard key={cardId(card)} card={card} playable={playableIds.has(cardId(card))} onClick={()=>playCard(0,card)}/>)}{!currentHand.length&&<div className="done"><Trophy/>Alle Karten gespielt!</div>}</div></section>
    </div>
    <AnimatePresence>{quiz&&<motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className="quiz" initial={{scale:.9}} animate={{scale:1}}><h2><Brain/> Was wurde gespielt?</h2><p>Beantworte beide Fragen für <b className={suitInfo(quiz.suit).cls}>{suitInfo(quiz.suit).symbol} {quiz.suit}</b>.</p><label>Wie viele Karten dieser Sorte wurden gespielt?</label><input type="number" min="0" max="13" value={answerCount} onChange={e=>setAnswerCount(e.target.value)}/><label>Welche Werte waren dabei?</label><div className="rank-grid">{RANKS.map(r=><button key={r} className={answerRanks.includes(r)?"selected":""} onClick={()=>setAnswerRanks(answerRanks.includes(r)?answerRanks.filter(x=>x!==r):[...answerRanks,r])}>{r}</button>)}</div>{quizResult===false&&<div className="bad"><XCircle/>Nicht ganz. Es wird neu gemischt.</div>}{quizResult===true&&<div className="good"><CheckCircle2/>Richtig!</div>}<Button disabled={quizResult!==null} onClick={checkQuiz}>Antwort prüfen</Button></motion.div></motion.div>}</AnimatePresence>
  </main>;
}
