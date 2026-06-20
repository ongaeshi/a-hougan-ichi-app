import { useState, useEffect, useRef } from 'react';
import { speak } from './utils/speech';
import { playCorrectSound, playIncorrectSound } from './utils/audio';

type GameState = 'start' | 'playing' | 'result';
type DirectionY = 'top' | 'bottom';
type DirectionX = 'left' | 'right';

interface Question {
  row: number;
  col: number;
  dirY: DirectionY;
  dirX: DirectionX;
  text: string;
}

const TOTAL_QUESTIONS = 10;

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [gridSize, setGridSize] = useState<number>(5);
  const [includeBottom, setIncludeBottom] = useState<boolean>(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [waitingNext, setWaitingNext] = useState<boolean>(false);

  // Generate questions when starting
  const startGame = () => {
    const newQuestions: Question[] = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const r = Math.floor(Math.random() * gridSize);
      const c = Math.floor(Math.random() * gridSize);
      
      const dirY: DirectionY = includeBottom && Math.random() > 0.5 ? 'bottom' : 'top';
      const dirX: DirectionX = Math.random() > 0.5 ? 'right' : 'left';
      
      const displayRow = dirY === 'top' ? r + 1 : gridSize - r;
      const displayCol = dirX === 'left' ? c + 1 : gridSize - c;
      
      const textY = dirY === 'top' ? '上' : '下';
      const textX = dirX === 'left' ? '左' : '右';
      const text = `${textY}から、${displayRow}番目。${textX}から、${displayCol}番目`;
      
      newQuestions.push({ row: r, col: c, dirY, dirX, text });
    }
    setQuestions(newQuestions);
    setCurrentIdx(0);
    setScore(0);
    setSelectedCell(null);
    setIsCorrect(null);
    setWaitingNext(false);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing' && !waitingNext) {
      const q = questions[currentIdx];
      if (q) {
        // Small delay before speaking so UI has time to render
        setTimeout(() => speak(q.text), 500);
      }
    }
  }, [gameState, currentIdx, questions, waitingNext]);

  const handleCellClick = (r: number, c: number) => {
    if (waitingNext || gameState !== 'playing') return;
    
    const q = questions[currentIdx];
    setSelectedCell({ r, c });
    
    if (q.row === r && q.col === c) {
      // Correct
      setIsCorrect(true);
      setScore(s => s + 1);
      playCorrectSound();
    } else {
      // Incorrect
      setIsCorrect(false);
      playIncorrectSound();
    }
    
    setWaitingNext(true);
    
    setTimeout(() => {
      setSelectedCell(null);
      setIsCorrect(null);
      setWaitingNext(false);
      if (currentIdx + 1 < TOTAL_QUESTIONS) {
        setCurrentIdx(i => i + 1);
      } else {
        setGameState('result');
      }
    }, 1500); // Wait 1.5s before next question
  };

  const repeatQuestion = () => {
    if (gameState === 'playing' && !waitingNext) {
      speak(questions[currentIdx].text);
    }
  };

  return (
    <div className="app-container">
      {gameState === 'start' && (
        <div className="start-screen">
          <h1 className="title">方眼上の位置</h1>
          
          <div className="settings-group">
            <span className="settings-label">マスの数</span>
            <div className="radio-group">
              {[3, 4, 5].map(size => (
                <label key={size}>
                  <input 
                    type="radio" 
                    name="gridSize" 
                    className="radio-input"
                    checked={gridSize === size} 
                    onChange={() => setGridSize(size)} 
                  />
                  <span className="radio-label">{size} × {size}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-label">バリエーション</span>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="includeBottom" 
                  className="radio-input"
                  checked={!includeBottom} 
                  onChange={() => setIncludeBottom(false)} 
                />
                <span className="radio-label">基本（上・左・右）</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="includeBottom" 
                  className="radio-input"
                  checked={includeBottom} 
                  onChange={() => setIncludeBottom(true)} 
                />
                <span className="radio-label">応用（下も含める）</span>
              </label>
            </div>
          </div>

          <button className="btn" onClick={startGame}>スタート！</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="playing-screen">
          <div className="game-header">
            <span>問題 {currentIdx + 1} / {TOTAL_QUESTIONS}</span>
            <span>スコア: {score}</span>
          </div>
          
          <div className="question-text">
            {waitingNext ? (isCorrect ? 'せいかい！' : 'ざんねん！') : 'きいて、タップしてね'}
          </div>

          <div 
            className="grid-container" 
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              maxWidth: `${gridSize * 70}px`
            }}
          >
            {Array.from({ length: gridSize }).map((_, r) => 
              Array.from({ length: gridSize }).map((_, c) => {
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                let cellClass = 'grid-cell';
                if (isSelected) {
                  cellClass += isCorrect ? ' correct' : ' incorrect';
                }
                
                return (
                  <div 
                    key={`${r}-${c}`} 
                    className={cellClass}
                    onClick={() => handleCellClick(r, c)}
                  />
                );
              })
            )}
          </div>
          
          <button className="btn" onClick={repeatQuestion} disabled={waitingNext}>
            もういちどきく 🔊
          </button>
        </div>
      )}

      {gameState === 'result' && (
        <div className="result-container">
          <h1 className="title">けっか</h1>
          <div className="score">{score} / {TOTAL_QUESTIONS}</div>
          <div className="score-text">
            {score === TOTAL_QUESTIONS ? 'まんてん！すばらしい！🎉' : 
             score >= 7 ? 'よくできました！😊' : 'がんばったね！👍'}
          </div>
          <button className="btn" onClick={() => setGameState('start')}>
            もういちどあそぶ
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
