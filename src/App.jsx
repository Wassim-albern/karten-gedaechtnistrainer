import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RotateCcw, Trophy, Users, Eye, CircleHelp, CheckCircle2, XCircle } from "lucide-react";

const SUITS = [
  { id: "Blatt", symbol: "♠", cls: "black" },
  { id: "Herz", symbol: "♥", cls: "red" },
  { id: "Eichel", symbol: "♣", cls: "black" },
  { id: "Karo", symbol: "♦", cls: "red" },
];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const FACE_EMOJIS = {
J: "🤴",
Q: "👸",
K: "🎅",
};
const GAME_MODES = {PLAY: "play", TRAINING: "training",};
const PLAYERS = ["Du", "Links", "Vorne", "Rechts"];
const suitInfo = id => SUITS.find(s => s.id === id);
const cardId = c => `${c.suit}-${c.rank}`;
const TABLE_COLORS = [
{id: "matte-green",name: "Grün",},
{id: "matte-yellow",name: "Gelb",},
{id: "matte-brown",name: "Braun",},
{id: "matte-dark-red",name: "Rot",},
{id: "matte-dark-blue",name: "Blau",},
{id: "matte-dark-gray",name: "Grau",},
];
function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function freshGame() {
const deck = shuffle(
SUITS.flatMap((suit) =>
RANKS.map((rank, value) => ({
suit: suit.id,
rank,
value,
}))
)
);
const quizCount = Math.random() < 0.5 ? 2 : 3;
const possibleQuizRounds = shuffle(
Array.from({ length: 11 }, (_, index) => index + 3)
);
const hands = Array.from({ length: 4 }, (_, player) =>
deck.slice(player * 13, player * 13 + 13)
);
return {
initialHands: hands.map((hand) => [...hand]),
hands,
leader: 0,
initialLeader: 0,
turn: 0,
trick: [],
completedTricks: [],
scores: [0, 0, 0, 0],
round: 1,
quizRounds: possibleQuizRounds
.slice(0, quizCount)
.sort((a, b) => a - b),
passed: 0,
status: "playing",
message: "Du beginnst. Lege eine Karte aus deiner Hand.",
};
}
function Button({ children, onClick, disabled, className = "" }) { return <button className={`button ${className}`} onClick={onClick} disabled={disabled}>{children}</button>; }
function getSymbolCount(rank) {
const number = Number(rank);
if (Number.isInteger(number) && number >= 2 && number <= 10) {
return number;
}
return 1;
}
function PlayingCard({
card,
small = false,
playable = false,
onClick
}) {
const suit = suitInfo(card.suit);
const symbolCount = getSymbolCount(card.rank);
const isNumberCard = !Number.isNaN(Number(card.rank));
return (
<motion.button
layout
whileHover={playable ? { y: -8, scale: 1.03 } : {}}
whileTap={playable ? { scale: 0.97 } : {}}
onClick={onClick}
disabled={!playable}
className={`playing-card ${small ? "small" : ""} ${suit.cls}`}
>
<div className="card-corner card-corner-top">
<span className="rank">{card.rank}</span>
</div>
{isNumberCard ? (
<div
className={`card-pips pip-count-${symbolCount}`}
>
{Array.from({ length: symbolCount }).map((_, index) => (
<span
key={index}
className={`pip pip-${index + 1}`}
>
{suit.symbol}
</span>
))}
</div>
) : card.rank === "A" ? (
  <div className="ace-symbol">
{suit.symbol}
</div>)
:(
<div className="face-card">
<span className="face-suit face-suit-top">
{suit.symbol}
</span>
 
<span className="face-emoji">
{FACE_EMOJIS[card.rank]}
</span>
 
<span className="face-suit face-suit-bottom">
{suit.symbol}
</span>
</div>
)}
<div className="card-corner card-corner-bottom">
<span className="rank">{card.rank}</span>
</div>
</motion.button>
);
}
function BackCards({ count }) { return <div className="backs">{Array.from({ length: Math.min(count, 8) }).map((_, i) => <i key={i} />)}<b>{count}</b></div>; }

export default function App() {
  const [game, setGame] = useState(freshGame);
  const [quiz, setQuiz] = useState(null);
  const [answerCount, setAnswerCount] = useState("");
  const [answerRanks, setAnswerRanks] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [tableColor, setTableColor] = useState("matte-green");
  const [gameMode, setGameMode] = useState(GAME_MODES.TRAINING);

  const leadSuit = game.trick[0]?.card.suit;
  const currentHand = game.hands[0];
  const playableIds = useMemo(() => { if (game.turn !== 0 || game.status !== "playing" || quiz) return new Set(); if (!leadSuit) return new Set(currentHand.map(cardId)); const matching = currentHand.filter(c => c.suit === leadSuit); return new Set((matching.length ? matching : currentHand).map(cardId)); }, [currentHand, leadSuit, game.turn, game.status, quiz]);
  const sortedHand = [...currentHand].sort((a, b) => SUITS.findIndex(s => s.id === a.suit) - SUITS.findIndex(s => s.id === b.suit) || b.value - a.value);

  function startQuiz(next) { const played = next.completedTricks.flatMap(t => t.cards.map(x => x.card)); const suit = SUITS[Math.floor(Math.random() * 4)].id; setAnswerCount(""); setAnswerRanks([]); setQuizResult(null); setQuiz({ suit, correctCards: played.filter(c => c.suit === suit) }); setGame(next); }
 function finishTrick(gameAfterFourthCard) {
const leadSuit = gameAfterFourthCard.trick[0].card.suit;
 
const winningPlay = gameAfterFourthCard.trick
.filter((play) => play.card.suit === leadSuit)
.reduce((bestPlay, currentPlay) =>
currentPlay.card.value > bestPlay.card.value
? currentPlay
: bestPlay
);
 
const winner = winningPlay.player;
 
const waitingGame = {
...gameAfterFourthCard,
pendingWinner: winner,
status: "waitingForCollection",
message: `${PLAYERS[winner]} gewinnt den Stich. Der Stich wird gleich eingesammelt.`,
};
 
setGame(waitingGame);
 
setTimeout(() => {
collectTrick(waitingGame, winner);
}, 2000);
}
  function collectTrick(gameWithFinishedTrick, winner) {
const newScores = [...gameWithFinishedTrick.scores];
newScores[winner] += 1;
 
const completedTricks = [
...gameWithFinishedTrick.completedTricks,
{
cards: [...gameWithFinishedTrick.trick],
winner,
},
];
 
const finishedRound = completedTricks.length;
const isEnd = finishedRound === 13;
 
const nextGame = {
...gameWithFinishedTrick,
scores: newScores,
completedTricks,
trick: [],
leader: winner,
turn: winner,
pendingWinner: null,
round: isEnd ? 13 : finishedRound + 1,
status: isEnd ? "won" : "playing",
message: isEnd
? `${PLAYERS[winner]} sammelt den letzten Stich ein. Das Spiel ist beendet.`
: `${PLAYERS[winner]} sammelt den Stich ein und spielt als Nächstes aus.`,
};
 
const shouldStartQuiz =
!isEnd &&
gameMode === GAME_MODES.TRAINING &&
gameWithFinishedTrick.quizRounds.includes(finishedRound);
 
if (shouldStartQuiz) {
startQuiz(nextGame);
return;
}
 
setGame(nextGame);
 
if (!isEnd && winner !== 0) {
setTimeout(() => {
aiPlay(nextGame);
}, 650);
}
}
  function playCard(player, card, base = game) { if (base.trick.some(p => p.player === player)) return; const hands = base.hands.map((h, i) => i === player ? h.filter(c => cardId(c) !== cardId(card)) : h), trick = [...base.trick, { player, card }], nextTurn = (player + 3) % 4, next = { ...base, hands, trick, turn: nextTurn, message: `${PLAYERS[player]} legt ${card.rank} ${card.suit}.` }; setGame(next); if (trick.length === 4) finishTrick(next); else if (nextTurn !== 0) setTimeout(() => aiPlay(next), 620); else setGame({ ...next, message: "Du bist dran. Bediene die ausgespielte Sorte, wenn möglich." }); }
  function aiPlay(base) { if (base.status !== "playing" || base.turn === 0) return; const p = base.turn, hand = base.hands[p], lead = base.trick[0]?.card.suit, legal = lead && hand.some(c => c.suit === lead) ? hand.filter(c => c.suit === lead) : hand; playCard(p, legal[Math.floor(Math.random() * legal.length)], base); }
  function reset() { setQuiz(null); setQuizResult(null); setGame(freshGame()); }
  function checkQuiz() {
    if (!quiz) {
      return;
    }
const correctRanks = quiz.correctCards
.map((card) => card.rank)
.sort(
(firstRank, secondRank) =>
RANKS.indexOf(firstRank) -
RANKS.indexOf(secondRank)
);
const selectedRanks = [...answerRanks].sort(
(firstRank, secondRank) =>
RANKS.indexOf(firstRank) -
RANKS.indexOf(secondRank)
);
const countCorrect =
Number(answerCount) === quiz.correctCards.length;
const ranksCorrect =
JSON.stringify(correctRanks) ===
JSON.stringify(selectedRanks);
setQuizResult({
countCorrect,
ranksCorrect,
correctCount: quiz.correctCards.length,
correctRanks,
});
}
function continueAfterQuiz() {
const nextGame = {
...game,
passed:
game.passed +
(quizResult?.countCorrect ? 1 : 0),
message: quizResult?.countCorrect
? "Die Anzahl war richtig. Das Spiel geht weiter."
: "Das Spiel geht weiter. Merke dir die nächste Runde.",
};
setQuiz(null);
setQuizResult(null);
setAnswerCount("");
setAnswerRanks([]);
setGame(nextGame);
if (
nextGame.status === "playing" &&
nextGame.turn !== 0
) {
setTimeout(() => aiPlay(nextGame), 600);
}
}
function repeatSameGame() {
const repeatedGame = {
...game,
hands: game.initialHands.map((hand) => [...hand]),
leader: game.initialLeader,
turn: game.initialLeader,
trick: [],
completedTricks: [],
scores: [0, 0, 0, 0],
round: 1,
passed: 0,
pendingWinner: null,
status: "playing",
message: "Die gleiche Kartenverteilung wird wiederholt.",
};
setQuiz(null);
setQuizResult(null);
setAnswerCount("");
setAnswerRanks([]);
setGame(repeatedGame);
if (repeatedGame.turn !== 0) {
setTimeout(() => aiPlay(repeatedGame), 600);
}
}
function dealNewGame() {
setQuiz(null);
setQuizResult(null);
setAnswerCount("");
setAnswerRanks([]);
setGame(freshGame());
}

  const positions = { 0: "bottom", 1: "left", 2: "top", 3: "right" };
  return <main>
    <div className="wrap">
<header>
<div className="header-title">
<div className="eyebrow">
<Brain />
Gedächtnistraining
</div>
<h1>Karten mitzählen</h1>
</div>
<div className="header-controls">
  <div className="game-mode-control">
<label
className={
gameMode === GAME_MODES.PLAY
? "mode-option active"
: "mode-option"
}
>
<input
type="radio"
name="game-mode"
value={GAME_MODES.PLAY}
checked={gameMode === GAME_MODES.PLAY}
onChange={() => {
setGameMode(GAME_MODES.PLAY);
setQuiz(null);
setQuizResult(null);
}}
/>

<span>Spielen</span>
</label>

<label
className={
gameMode === GAME_MODES.TRAINING
? "mode-option active"
: "mode-option"
}
>
<input
type="radio"
name="game-mode"
value={GAME_MODES.TRAINING}
checked={gameMode === GAME_MODES.TRAINING}
onChange={() => setGameMode(GAME_MODES.TRAINING)}
/>

<span>Training</span>
</label>
</div>
<div className="table-color-control">
<select
id="table-color"
aria-label="Tischfarbe auswählen"
value={tableColor}
onChange={(event) => setTableColor(event.target.value)}
>
{TABLE_COLORS.map((color) => (
<option key={color.id} value={color.id}>
{color.name}
</option>
))}
</select>
<span className="select-arrow" aria-hidden="true">
▼
</span>
</div>
<Button className="header-button" onClick={reset}>
<RotateCcw />
Neu mischen
</Button>
</div>
</header>
      <section className="scores">{PLAYERS.map((p, i) => <div className={game.leader === i ? "active" : ""} key={p}><span>{p}{game.leader === i ? " · Führt" : ""}</span><strong>{game.scores[i]} Stiche</strong>{i === 0 ? <Eye /> : <Users />}</div>)}</section>
      <section className={`table ${tableColor}`}>
        <div className="op front"><label>VORNE</label><BackCards count={game.hands[2].length} /></div><div className="op left-op"><label>LINKS</label><BackCards count={game.hands[1].length} /></div><div className="op right-op"><label>RECHTS</label><BackCards count={game.hands[3].length} /></div>
        <div className="trick">{game.trick.length === 0 ? <div className="empty"><CircleHelp /></div> : game.trick.map(p => <div key={p.player} className={`thrown ${positions[p.player]}`}><PlayingCard card={p.card} small /></div>)}</div>
        <div className="message">{game.message}{game.status === "waitingForOk" && <Button className="ok" onClick={collectTrick}>OK</Button>}</div>
      </section>
      <section className="hand"><div className="hand-head"><h2>Deine Hand · {currentHand.length} Karten</h2><span>Spielbare Karten sind hervorgehoben</span></div><div className="hand-scroll">{sortedHand.map(card => <PlayingCard key={cardId(card)} card={card} playable={playableIds.has(cardId(card))} onClick={() => playCard(0, card)} />)}{!currentHand.length && <div className="done"><Trophy />Alle Karten gespielt!</div>}</div></section>
    </div>
    <AnimatePresence>
{quiz && gameMode === GAME_MODES.TRAINING && (
<motion.div
className="overlay"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
>
<motion.div
className="quiz"
initial={{ scale: 0.9 }}
animate={{ scale: 1 }}
>
<h2>
<Brain />
Was wurde gespielt?
</h2>
 
<p>
Beantworte die Fragen für{" "}
<b className={suitInfo(quiz.suit).cls}>
{suitInfo(quiz.suit).symbol} {quiz.suit}
</b>
.
</p>
 
<label>
Wie viele Karten dieser Sorte wurden gespielt?
</label>
 
<input
type="number"
min="0"
max="13"
value={answerCount}
disabled={quizResult !== null}
onChange={(event) =>
setAnswerCount(event.target.value)
}
/>
 
<label>
Welche Werte waren dabei? Diese Angabe ist freiwillig.
</label>
 
<div className="rank-grid">
{RANKS.map((rank) => (
<button
key={rank}
disabled={quizResult !== null}
className={
answerRanks.includes(rank)
? "selected"
: ""
}
onClick={() =>
setAnswerRanks(
answerRanks.includes(rank)
? answerRanks.filter(
(selectedRank) =>
selectedRank !== rank
)
: [...answerRanks, rank]
)
}
>
{rank}
</button>
))}
</div>
 
{quizResult === null ? (
<Button
disabled={answerCount === ""}
onClick={checkQuiz}
>
Antwort prüfen
</Button>
) : (
<>
<div
className={
quizResult.countCorrect
? "quiz-feedback good"
: "quiz-feedback bad"
}
>
{quizResult.countCorrect ? (
<CheckCircle2 />
) : (
<XCircle />
)}
 
<div>
<strong>
{quizResult.countCorrect
? "Die Anzahl ist richtig."
: "Die Anzahl ist nicht richtig."}
</strong>
 
<p>
Richtig gespielt wurden{" "}
<b>{quizResult.correctCount}</b> Karten
der Sorte {quiz.suit}.
</p>
</div>
</div>
 
<div
className={
quizResult.ranksCorrect
? "quiz-feedback good"
: "quiz-feedback info"
}
>
{quizResult.ranksCorrect ? (
<CheckCircle2 />
) : (
<CircleHelp />
)}
 
<div>
<strong>
{quizResult.ranksCorrect
? "Auch die Kartenwerte sind richtig."
: "Die Kartenwerte waren nicht vollständig richtig."}
</strong>
 
<p>
Richtige Werte:{" "}
{quizResult.correctRanks.length > 0
? quizResult.correctRanks.join(", ")
: "Keine Karten dieser Sorte"}
</p>
 
{!quizResult.ranksCorrect && (
<p>
Das ist nur eine Zusatzübung. Du darfst
trotzdem weiterspielen.
</p>
)}
</div>
</div>
 
<div className="quiz-actions">
<Button
className="continue-button"
onClick={continueAfterQuiz}
>
Weiter
</Button>
 
<Button
className="repeat-button"
onClick={repeatSameGame}
>
Wiederholen
</Button>
 
<Button
className="new-game-button"
onClick={dealNewGame}
>
Neu austeilen
</Button>
</div>
</>
)}
</motion.div>
</motion.div>
)}
</AnimatePresence>
  </main>;
}
