import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { speak } from './utils/speech';
import { playCorrectSound, playIncorrectSound, playPerfectSound } from './utils/audio';

type GameState = 'start' | 'playing' | 'result';
type QuestionPhase = 'read_all' | 'select_row' | 'select_col';
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
  const [maxRepeats, setMaxRepeats] = useState<number | 'unlimited'>('unlimited');
  const [isGuideEnabled, setIsGuideEnabled] = useState<boolean>(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  
  const [questionPhase, setQuestionPhase] = useState<QuestionPhase>('read_all');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [sliderCol, setSliderCol] = useState<number>(0); // 0 から gridSize-1 までの値
  
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [waitingNext, setWaitingNext] = useState<boolean>(false);
  const [repeatsLeft, setRepeatsLeft] = useState<number | 'unlimited'>('unlimited');

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
    setSelectedRow(null);
    setSliderCol(0);
    setQuestionPhase(isGuideEnabled ? 'select_row' : 'read_all');
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
          if (questionPhase === 'read_all') {
            speak(q.text);
          } else if (questionPhase === 'select_row') {
            const textY = q.dirY === 'top' ? '上' : '下';
            const displayRow = q.dirY === 'top' ? q.row + 1 : gridSize - q.row;
            speak(`${textY}から、${displayRow}番目。`);
          } else if (questionPhase === 'select_col') {
            const textX = q.dirX === 'left' ? '左' : '右';
            const displayCol = q.dirX === 'left' ? q.col + 1 : gridSize - q.col;
            speak(`${textX}から、${displayCol}番目。`);
          }
        }, 500);
      }
    }
  }, [gameState, currentIdx, questions, waitingNext, questionPhase, gridSize]);

  const handleCellClick = (r: number, c: number) => {
    if (waitingNext || gameState !== 'playing') return;
    
    if (questionPhase === 'select_row') {
      setSelectedRow(r);
      // Initialize slider near the center depending on gridSize
      setSliderCol(Math.floor(gridSize / 2));
      setQuestionPhase('select_col');
    } else if (questionPhase === 'read_all') {
      setSelectedCell({ r, c });
    }
  };

  const handleConfirm = () => {
    if (waitingNext || gameState !== 'playing') return;

    const q = questions[currentIdx];
    let selectedR = selectedCell?.r;
    let selectedC = selectedCell?.c;

    if (questionPhase === 'select_col' && selectedRow !== null) {
      selectedR = selectedRow;
      selectedC = sliderCol;
      setSelectedCell({ r: selectedRow, c: sliderCol }); // Update visual state for result
    }

    if (selectedR === undefined || selectedC === undefined) return;
    
    if (q.row === selectedR && q.col === selectedC) {
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
      setSelectedRow(null);
      setSliderCol(0);
      setQuestionPhase(isGuideEnabled ? 'select_row' : 'read_all');
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
        if (questionPhase === 'read_all') {
          speak(q.text);
        } else if (questionPhase === 'select_row') {
          const textY = q.dirY === 'top' ? '上' : '下';
          const displayRow = q.dirY === 'top' ? q.row + 1 : gridSize - q.row;
          speak(`${textY}から、${displayRow}番目。`);
        } else if (questionPhase === 'select_col') {
          const textX = q.dirX === 'left' ? '左' : '右';
          const displayCol = q.dirX === 'left' ? q.col + 1 : gridSize - q.col;
          speak(`${textX}から、${displayCol}番目。`);
        }
        
        if (typeof repeatsLeft === 'number') {
          setRepeatsLeft(r => (r as number) - 1);
        }
      }
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

          <div className="settings-group">
            <span className="settings-label">ガイド機能</span>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="guideEnabled" 
                  className="radio-input"
                  checked={!isGuideEnabled} 
                  onChange={() => setIsGuideEnabled(false)} 
                />
                <span className="radio-label">なし（本番用）</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="guideEnabled" 
                  className="radio-input"
                  checked={isGuideEnabled} 
                  onChange={() => setIsGuideEnabled(true)} 
                />
                <span className="radio-label">あり（練習用）</span>
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
            {waitingNext ? (isCorrect ? 'せいかい！' : 'ざんねん！') : 
              (questionPhase === 'read_all' ? 'きいて、タップしてね' : 
               questionPhase === 'select_row' ? 'どの行かな？（タップしてね）' : 
               'どのマスかな？（スライダーを動かして「けってい」してね）')}
          </div>

          <div 
            className={`grid-container ${questionPhase === 'select_row' ? 'row-selectable' : ''}`}
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              maxWidth: `${gridSize * 70}px`
            }}
          >
            {Array.from({ length: gridSize }).map((_, r) => 
              Array.from({ length: gridSize }).map((_, c) => {
                const q = questions[currentIdx];
                const isActualCorrect = q?.row === r && q?.col === c;
                
                let isSelected = false;
                if (questionPhase === 'read_all' || waitingNext) {
                  isSelected = selectedCell?.r === r && selectedCell?.c === c;
                } else if (questionPhase === 'select_col') {
                  isSelected = selectedRow === r && sliderCol === c;
                }

                let cellClass = 'grid-cell';
                
                if (isGuideEnabled && questionPhase === 'select_col' && selectedRow !== null && r !== selectedRow) {
                  cellClass += ' dimmed';
                }
                
                if (isSelected) {
                  if (isCorrect === null) {
                    cellClass += ' selected';
                  } else {
                    cellClass += isCorrect ? ' correct' : ' incorrect';
                  }
                }
                
                if (isCorrect === false && isActualCorrect) {
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
          
          {questionPhase === 'select_col' && !waitingNext && (
            <div className="slider-container" style={{ maxWidth: `${gridSize * 70}px` }}>
              <input 
                type="range" 
                min="0" 
                max={gridSize - 1} 
                value={sliderCol} 
                onChange={(e) => setSliderCol(parseInt(e.target.value))}
                className="col-slider"
              />
            </div>
          )}

          <div className="action-buttons">
            <button 
              className="btn confirm-btn" 
              onClick={handleConfirm} 
              disabled={waitingNext || (questionPhase === 'read_all' && !selectedCell) || questionPhase === 'select_row'}
            >
              けってい
            </button>
            <button 
              className="btn" 
              onClick={repeatQuestion} 
              disabled={waitingNext || repeatsLeft === 0}
            >
              もういちどきく 🔊 {repeatsLeft !== 'unlimited' && `(あと${repeatsLeft}回)`}
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
