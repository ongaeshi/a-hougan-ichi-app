import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { speak } from './utils/speech';
import { playCorrectSound, playIncorrectSound, playPerfectSound } from './utils/audio';

type GameState = 'start' | 'playing' | 'result';
type DirectionY = 'top' | 'bottom';
type DirectionX = 'left' | 'right';
type DifficultyMode = '1d-y' | '1d-x' | '2d';

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
  const [difficulty, setDifficulty] = useState<DifficultyMode>('2d');
  const [includeBottom, setIncludeBottom] = useState<boolean>(false);
  const [maxRepeats, setMaxRepeats] = useState<number | 'unlimited'>('unlimited');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [waitingNext, setWaitingNext] = useState<boolean>(false);
  const [repeatsLeft, setRepeatsLeft] = useState<number | 'unlimited'>('unlimited');

  // Generate questions when starting
  const startGame = () => {
    const newQuestions: Question[] = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const r = difficulty === '1d-x' ? 0 : Math.floor(Math.random() * gridSize);
      const c = difficulty === '1d-y' ? 0 : Math.floor(Math.random() * gridSize);
      
      const dirY: DirectionY = includeBottom && Math.random() > 0.5 ? 'bottom' : 'top';
      const dirX: DirectionX = Math.random() > 0.5 ? 'right' : 'left';
      
      const displayRow = dirY === 'top' ? r + 1 : gridSize - r;
      const displayCol = dirX === 'left' ? c + 1 : gridSize - c;
      
      const textY = dirY === 'top' ? '上' : '下';
      const textX = dirX === 'left' ? '左' : '右';
      
      let text = '';
      if (difficulty === '1d-y') {
        text = `${textY}から、${displayRow}番目`;
      } else if (difficulty === '1d-x') {
        text = `${textX}から、${displayCol}番目`;
      } else {
        text = `${textY}から、${displayRow}番目。${textX}から、${displayCol}番目`;
      }
      
      newQuestions.push({ row: r, col: c, dirY, dirX, text });
    }
    setQuestions(newQuestions);
    setCurrentIdx(0);
    setScore(0);
    setSelectedCell(null);
    setIsCorrect(null);
    setWaitingNext(false);
    setRepeatsLeft(maxRepeats);
    setGameState('playing');
  };

  // Play perfect sound when transitioning to result screen with a perfect score
  useEffect(() => {
    if (gameState === 'result' && score === TOTAL_QUESTIONS) {
      playPerfectSound();
    }
  }, [gameState, score]);

  useEffect(() => {
    if (gameState === 'playing' && !waitingNext) {
      const q = questions[currentIdx];
      if (q) {
        // Small delay before speaking so UI has time to render
        setTimeout(() => {
          speak(q.text);
        }, 500);
      }
    }
  }, [gameState, currentIdx, questions, waitingNext, gridSize]);

  const handleCellClick = (r: number, c: number) => {
    if (waitingNext || gameState !== 'playing') return;
    setSelectedCell({ r, c });
  };

  const handleConfirm = () => {
    if (waitingNext || gameState !== 'playing' || !selectedCell) return;
    
    const q = questions[currentIdx];
    
    if (q.row === selectedCell.r && q.col === selectedCell.c) {
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
        setRepeatsLeft(maxRepeats);
      } else {
        setGameState('result');
      }
    }, 1500); // Wait 1.5s before next question
  };

  const repeatQuestion = () => {
    if (gameState === 'playing' && !waitingNext) {
      if (repeatsLeft === 'unlimited' || repeatsLeft > 0) {
        const q = questions[currentIdx];
        speak(q.text);
        
        if (typeof repeatsLeft === 'number') {
          setRepeatsLeft(r => (r as number) - 1);
        }
      }
    }
  };

  const gridRows = difficulty === '1d-x' ? 1 : gridSize;
  const gridCols = difficulty === '1d-y' ? 1 : gridSize;

  return (
    <div className="app-container">
      {gameState === 'start' && (
        <div className="start-screen">
          <h1 className="title">方眼上の位置</h1>
          
          <div className="settings-group">
            <span className="settings-label">なんいど</span>
            <div className="radio-group" style={{ flexWrap: 'wrap' }}>
              <label>
                <input 
                  type="radio" 
                  name="difficulty" 
                  className="radio-input"
                  checked={difficulty === '1d-y'} 
                  onChange={() => setDifficulty('1d-y')} 
                />
                <span className="radio-label">1(たて)</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="difficulty" 
                  className="radio-input"
                  checked={difficulty === '1d-x'} 
                  onChange={() => setDifficulty('1d-x')} 
                />
                <span className="radio-label">2(よこ)</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="difficulty" 
                  className="radio-input"
                  checked={difficulty === '2d'} 
                  onChange={() => setDifficulty('2d')} 
                />
                <span className="radio-label">3(ほうがん)</span>
              </label>
            </div>
          </div>

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

          <div className="settings-group">
            <span className="settings-label">ききなおし</span>
            <div className="radio-group">
              {[0, 3, 5, 'unlimited'].map(limit => (
                <label key={limit}>
                  <input 
                    type="radio" 
                    name="maxRepeats" 
                    className="radio-input"
                    checked={maxRepeats === limit} 
                    onChange={() => setMaxRepeats(limit as number | 'unlimited')} 
                  />
                  <span className="radio-label">{limit === 'unlimited' ? 'むげん' : `${limit}回`}</span>
                </label>
              ))}
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
            {waitingNext ? (isCorrect ? 'せいかい！' : 'ざんねん！') : 'きいて、えらんで「けってい」をおしてね'}
          </div>

          <div 
            className={`grid-container mode-${difficulty}`}
            style={{ 
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              maxWidth: `${gridSize * 70}px`,
              '--full-size': `${gridSize * 60 + (gridSize - 1) * 8}px`
            } as React.CSSProperties}
          >
            {Array.from({ length: gridRows }).map((_, r) => 
              Array.from({ length: gridCols }).map((_, c) => {
                const q = questions[currentIdx];
                const isActualCorrect = q?.row === r && q?.col === c;
                
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;

                let cellClass = 'grid-cell';
                
                if (isSelected) {
                  if (isCorrect === null) {
                    cellClass += ' selected';
                  } else {
                    cellClass += isCorrect ? ' correct' : ' incorrect';
                  }
                }
                
                if (waitingNext && isCorrect === false && isActualCorrect) {
                  cellClass += ' hint-correct';
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
          
          <div className="action-buttons">
            <button 
              className="btn" 
              onClick={repeatQuestion} 
              disabled={waitingNext || repeatsLeft === 0}
            >
              もういちどきく 🔊 {repeatsLeft !== 'unlimited' && `(あと${repeatsLeft}回)`}
            </button>
            <button
              className="btn"
              onClick={handleConfirm}
              disabled={waitingNext || !selectedCell}
            >
              けってい
            </button>
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="result-container">
          {score === TOTAL_QUESTIONS && <Confetti recycle={false} numberOfPieces={500} />}
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
