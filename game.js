/**
 * Rise of the Half Moon (떠오르는 반달)
 * 메인 게임 로직, AI 전략 및 인터랙션 엔진
 */

class MoonGame {
  constructor() {
    this.round = 1;
    this.maxRounds = 3;
    this.gridRows = 3;
    this.gridCols = 3;

    this.board = []; // 2D array of { card, owner }
    this.deck = [];
    this.playerHand = [];
    this.aiHand = [];
    this.selectedCardIndex = null;

    this.playerScore = 0;
    this.aiScore = 0;
    this.turn = 'player'; // 'player' | 'ai'
    this.isGameOver = false;
    this.isAnimating = false;

    // 선공 교대: 홀수 라운드 = 플레이어, 짝수 라운드 = AI
    // (라운드 번호는 startNewGame 호출 시점에 결정됨)
    this.firstTurnOwner = 'player';

    // AI 표정 상태
    this.aiMood = 'neutral'; // 'neutral' | 'thinking' | 'happy' | 'shocked'

    this.initDOM();
    this.initBackgroundEffects();
    this.startNewGame(1);
  }

  initDOM() {
    this.gridEl = document.getElementById('gameGrid');
    this.handCardsEl = document.getElementById('handCards');
    this.playerScoreEl = document.getElementById('playerScore');
    this.aiScoreEl = document.getElementById('aiScore');
    this.turnPillEl = document.getElementById('turnPill');
    this.roundBadgeEl = document.getElementById('roundBadge');
    this.deckCountEl = document.getElementById('deckCount');
    this.aiFaceEl = document.getElementById('aiMoonFace');
    this.instructionEl = document.getElementById('handInstruction');

    // 모달 DOM
    this.rulesModal = document.getElementById('rulesModal');
    this.resultModal = document.getElementById('resultModal');

    // 이벤트 리스너 바인딩
    document.getElementById('rulesBtn').addEventListener('click', () => this.showRules());
    document.getElementById('closeRulesBtn').addEventListener('click', () => this.hideRules());
    document.getElementById('rulesModal').addEventListener('click', (e) => {
      if (e.target === this.rulesModal) this.hideRules();
    });

    document.getElementById('restartBtn').addEventListener('click', () => this.restartCurrentRound());
    document.getElementById('soundBtn').addEventListener('click', (e) => this.toggleSound(e.currentTarget));
    document.getElementById('nextRoundBtn').addEventListener('click', () => this.handleNextRoundBtn());
  }

  // 새 라운드 시작
  startNewGame(roundNumber = 1) {
    this.round = roundNumber;

    // 라운드별 보드 크기 설정 (라운드 1: 3x3, 라운드 2: 4x4, 라운드 3: 5x5)
    if (this.round === 1) {
      this.gridRows = 3;
      this.gridCols = 3;
    } else if (this.round === 2) {
      this.gridRows = 4;
      this.gridCols = 4;
    } else {
      this.gridRows = 5;
      this.gridCols = 5;
    }

    // 선공 표시는 firstTurnOwner 결정 후 updateTurnUI에서 처리하므로
    // 여기선 라운드·보드 크기만 표시 (선공 정보는 updateTurnUI 시점에 배지 갱신)
    this.roundBadgeEl.textContent = `라운드 ${this.round} / ${this.maxRounds} (${this.gridRows}×${this.gridCols})`;

    // 그리드 스타일 및 크기 세팅
    this.gridEl.style.gridTemplateColumns = `repeat(${this.gridCols}, 1fr)`;
    const isMobile = window.innerWidth <= 600;
    if (this.gridCols === 3) {
      this.gridEl.style.setProperty('--cell-w', isMobile ? '82px' : '96px');
      this.gridEl.style.setProperty('--cell-h', isMobile ? '100px' : '112px');
      this.gridEl.style.setProperty('--grid-gap', isMobile ? '8px' : '14px');
    } else if (this.gridCols === 4) {
      this.gridEl.style.setProperty('--cell-w', isMobile ? '64px' : '80px');
      this.gridEl.style.setProperty('--cell-h', isMobile ? '80px' : '96px');
      this.gridEl.style.setProperty('--grid-gap', isMobile ? '6px' : '10px');
    } else {
      this.gridEl.style.setProperty('--cell-w', isMobile ? '52px' : '66px');
      this.gridEl.style.setProperty('--cell-h', isMobile ? '66px' : '80px');
      this.gridEl.style.setProperty('--grid-gap', isMobile ? '5px' : '8px');
    }

    // 보드 초기화
    this.board = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(null));

    // 덱 생성 및 셔플 (와일드카드 없음, 보드 크기에 맞게 충분한 카드 매수 확보)
    const copiesPerPhase = this.gridRows === 5 ? 5 : 4;
    this.deck = this.createDeck(copiesPerPhase);
    this.shuffle(this.deck);

    // 선공 결정: 라운드 번호가 홀수면 플레이어, 짝수면 AI
    this.firstTurnOwner = (this.round % 2 === 1) ? 'player' : 'ai';

    // 점수 및 상태 초기화
    this.playerScore = 0;
    this.aiScore = 0;
    this.selectedCardIndex = null;
    this.isGameOver = false;
    this.isAnimating = false;
    this.turn = this.firstTurnOwner;
    this.setAiMood('neutral');

    // 패 배분 (각각 3장씩)
    this.playerHand = [];
    this.aiHand = [];
    for (let i = 0; i < 3; i++) {
      if (this.deck.length > 0) this.playerHand.push(this.deck.pop());
      if (this.deck.length > 0) this.aiHand.push(this.deck.pop());
    }

    this.updateScoresUI();
    this.initBoardGrid();
    this.renderHand();
    this.updateTurnUI();
    this.updateDeckCount();

    if (this.firstTurnOwner === 'player') {
      // 플레이어 선공: 첫 번째 카드 자동 선택
      if (this.playerHand.length > 0) {
        this.selectCard(0);
      }
    } else {
      // AI 선공: 자동으로 AI 턴 시작
      this.triggerAITurn();
    }
  }

  createDeck(copiesPerPhase = 4) {
    const deck = [];
    for (let i = 0; i < copiesPerPhase; i++) {
      MOON_PHASES.forEach(phase => {
        deck.push({ ...phase, uid: `card_${phase.id}_${i}_${Math.random()}` });
      });
    }
    return deck;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // 보드 그리드 초기화
  initBoardGrid() {
    this.gridEl.innerHTML = '';
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell empty';
        cell.dataset.row = r;
        cell.dataset.col = c;

        cell.addEventListener('click', () => this.handleCellClick(r, c));
        cell.addEventListener('mouseenter', () => this.handleCellHover(r, c, cell));
        cell.addEventListener('mouseleave', () => this.handleCellLeave(cell));

        this.gridEl.appendChild(cell);
      }
    }
  }

  // 특정 셀에 카드 배치 애니메이션
  placeCardInCell(r, c, card, owner) {
    const cell = this.getCellElement(r, c);
    if (!cell) return;

    cell.classList.remove('empty', 'highlight-target');
    const ownerClass = owner === 'player' ? 'owned-player' : 'owned-ai';
    const moonSize = this.gridCols === 3 ? 56 : (this.gridCols === 4 ? 46 : 38);
    cell.innerHTML = `
      <div class="board-card ${ownerClass}">
        ${renderMoonSVG(card.id, moonSize)}
      </div>
    `;
  }

  // 플레이어 손패 렌더링
  renderHand() {
    this.handCardsEl.innerHTML = '';
    this.playerHand.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'hand-card';
      if (this.selectedCardIndex === idx) {
        cardEl.classList.add('selected');
      }

      cardEl.innerHTML = `
        ${renderMoonSVG(card.id, 76)}
      `;

      cardEl.addEventListener('click', () => this.selectCard(idx));
      this.handCardsEl.appendChild(cardEl);
    });
  }

  selectCard(index) {
    if (this.turn !== 'player' || this.isAnimating) return;
    this.selectedCardIndex = index;
    soundManager.playSelect();
    this.renderHand();
    this.highlightPossibleCells();
  }

  // 카드 선택 시 놓을 수 있는 빈 셀 하이라이트
  highlightPossibleCells() {
    const emptyCells = this.gridEl.querySelectorAll('.grid-cell.empty');
    emptyCells.forEach(cell => {
      cell.classList.add('highlight-target');
    });
  }

  clearCellHighlights() {
    const cells = this.gridEl.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      cell.classList.remove('highlight-target');
    });
  }

  // 셀 호버 시 예상 점수 힌트
  handleCellHover(r, c, cellEl) {
    if (this.turn !== 'player' || this.selectedCardIndex === null || this.isAnimating) return;
    const card = this.playerHand[this.selectedCardIndex];
    if (!card) return;

    // 가상으로 놓았을 때 획득할 점수 시뮬레이션
    const evaluation = this.evaluateMoveScore(r, c, card, 'player');
    if (evaluation.totalScore > 0) {
      let hintText = `+${evaluation.totalScore}`;
      if (evaluation.fullMoonPairs > 0) hintText += ` 보름달 쌍!`;
      else if (evaluation.cycleScore > 0) hintText += ` 사이클!`;
      else if (evaluation.phasePairs > 0) hintText += ` 위상 쌍!`;

      let badge = cellEl.querySelector('.preview-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'preview-badge';
        badge.style.position = 'absolute';
        badge.style.top = '6px';
        badge.style.background = 'rgba(0, 229, 255, 0.9)';
        badge.style.color = '#000';
        badge.style.fontSize = '0.62rem';
        badge.style.fontWeight = '800';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '8px';
        badge.style.zIndex = '5';
        cellEl.appendChild(badge);
      }
      badge.textContent = hintText;
    }
  }

  handleCellLeave(cellEl) {
    const badge = cellEl.querySelector('.preview-badge');
    if (badge) badge.remove();
  }

  // 플레이어가 보드 빈 셀을 클릭했을 때
  handleCellClick(r, c) {
    if (this.turn !== 'player' || this.isAnimating || this.isGameOver) return;
    if (this.selectedCardIndex === null) {
      alert('먼저 아래에서 낼 카드를 선택해주세요!');
      return;
    }
    if (this.board[r][c] !== null) return;

    const card = this.playerHand.splice(this.selectedCardIndex, 1)[0];
    this.selectedCardIndex = null;
    this.clearCellHighlights();

    this.executeMove(r, c, card, 'player');
  }

  // 수 실행 (카드 배치 및 점수/소유권 결산)
  executeMove(r, c, card, owner) {
    this.isAnimating = true;
    soundManager.playPlace();

    // 보드에 카드 배치
    this.board[r][c] = { card, owner };
    this.placeCardInCell(r, c, card, owner);

    // 점수 및 콤보 검사
    const evaluation = this.evaluateMoveScore(r, c, card, owner);
    const cellEl = this.getCellElement(r, c);

    // 점수 부여
    if (owner === 'player') {
      this.playerScore += evaluation.totalScore;
    } else {
      this.aiScore += evaluation.totalScore;
    }
    this.updateScoresUI();

    // 소유권 전환 적용
    evaluation.cardsToClaim.forEach(([cr, cc]) => {
      if (this.board[cr][cc] && this.board[cr][cc].owner !== owner) {
        this.board[cr][cc].owner = owner;
        const targetCell = this.getCellElement(cr, cc);
        if (targetCell) {
          const cardDiv = targetCell.querySelector('.board-card');
          if (cardDiv) {
            cardDiv.classList.add('flipping');
            setTimeout(() => {
              cardDiv.className = `board-card ${owner === 'player' ? 'owned-player' : 'owned-ai'}`;
              soundManager.playFlip();
            }, 250);
          }
        }
      }
    });

    // 매칭 효과 연출
    if (evaluation.totalScore > 0) {
      this.triggerMatchEffects(evaluation, cellEl, owner);
    }

    // 카드 1장 드로우
    if (this.deck.length > 0) {
      const drawnCard = this.deck.pop();
      if (owner === 'player') {
        this.playerHand.push(drawnCard);
      } else {
        this.aiHand.push(drawnCard);
      }
      this.updateDeckCount();
    }

    // 연출 후 다음 턴으로 전환
    setTimeout(() => {
      this.renderHand();
      this.isAnimating = false;

      // 게임 종료 검사 (보드가 다 채워졌는가?)
      if (this.isBoardFull()) {
        this.endGame();
      } else {
        // 턴 전환
        this.turn = (owner === 'player') ? 'ai' : 'player';
        this.updateTurnUI();

        if (this.turn === 'player') {
          if (this.playerHand.length > 0) this.selectCard(0);
        } else {
          this.triggerAITurn();
        }
      }
    }, evaluation.totalScore > 0 ? 800 : 350);
  }

  // 특정 수의 점수 및 소유권 탈취 목록 계산
  evaluateMoveScore(r, c, card, owner) {
    let phasePairs = 0;
    let fullMoonPairs = 0;
    let cycleScore = 0;
    const cardsToClaim = []; // [[r, c], ...]

    // 1. 인접 상하좌우 검사
    const neighbors = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1]
    ];

    neighbors.forEach(([nr, nc]) => {
      if (nr >= 0 && nr < this.gridRows && nc >= 0 && nc < this.gridCols) {
        const neighbor = this.board[nr][nc];
        if (neighbor && neighbor.card) {
          // 보름달 쌍 검사 (2점)
          if (isFullMoonPair(card, neighbor.card)) {
            fullMoonPairs++;
            cardsToClaim.push([nr, nc]);
          }
          // 동일 위상 쌍 검사 (1점)
          else if (isPhasePair(card, neighbor.card)) {
            phasePairs++;
            cardsToClaim.push([nr, nc]);
          }
        }
      }
    });

    // 2. 가로 행(Row) 및 세로 열(Column) 달의 주기 사이클 검사
    const checkLineCycle = (cardsWithCoords) => {
      const targetIdx = cardsWithCoords.findIndex(item => item.r === r && item.c === c);
      if (targetIdx === -1 || !cardsWithCoords[targetIdx].card) return { score: 0, coords: [] };

      let start = targetIdx;
      while (start > 0 && cardsWithCoords[start - 1].card) {
        start--;
      }
      let end = targetIdx;
      while (end < cardsWithCoords.length - 1 && cardsWithCoords[end + 1].card) {
        end++;
      }

      let bestLen = 0;
      let bestCoords = [];
      for (let i = start; i <= targetIdx; i++) {
        for (let j = targetIdx; j <= end; j++) {
          const len = j - i + 1;
          if (len >= 3 && len > bestLen) {
            const subCards = cardsWithCoords.slice(i, j + 1).map(item => item.card);
            if (isLunarCycle(subCards)) {
              bestLen = len;
              bestCoords = cardsWithCoords.slice(i, j + 1).map(item => [item.r, item.c]);
            }
          }
        }
      }
      return { score: bestLen, coords: bestCoords };
    };

    // 가로 행 검사
    const rowCardsWithCoords = [];
    for (let colIdx = 0; colIdx < this.gridCols; colIdx++) {
      if (colIdx === c) {
        rowCardsWithCoords.push({ card, r, c });
      } else {
        const existing = this.board[r][colIdx];
        rowCardsWithCoords.push({ card: existing ? existing.card : null, r, c: colIdx });
      }
    }
    const rowResult = checkLineCycle(rowCardsWithCoords);
    if (rowResult.score > 0) {
      cycleScore += rowResult.score;
      rowResult.coords.forEach(coord => cardsToClaim.push(coord));
    }

    // 세로 열 검사
    const colCardsWithCoords = [];
    for (let rowIdx = 0; rowIdx < this.gridRows; rowIdx++) {
      if (rowIdx === r) {
        colCardsWithCoords.push({ card, r, c });
      } else {
        const existing = this.board[rowIdx][c];
        colCardsWithCoords.push({ card: existing ? existing.card : null, r: rowIdx, c });
      }
    }
    const colResult = checkLineCycle(colCardsWithCoords);
    if (colResult.score > 0) {
      cycleScore += colResult.score;
      colResult.coords.forEach(coord => cardsToClaim.push(coord));
    }

    const totalScore = (phasePairs * 1) + (fullMoonPairs * 2) + cycleScore;
    return {
      totalScore,
      phasePairs,
      fullMoonPairs,
      cycleScore,
      cardsToClaim
    };
  }

  // 매칭 효과 연출 (오디오, 텍스트 팝업, 파티클)
  triggerMatchEffects(evalResult, cellEl, owner) {
    const rect = cellEl ? cellEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    let message = '';
    if (evalResult.fullMoonPairs > 0 && evalResult.cycleScore > 0) {
      message = `✨ 메가 콤보! +${evalResult.totalScore}`;
      soundManager.playCycle();
    } else if (evalResult.cycleScore > 0) {
      message = `🌕 달의 주기 완성! +${evalResult.totalScore}`;
      soundManager.playCycle();
    } else if (evalResult.fullMoonPairs > 0) {
      message = `🌟 보름달 쌍! +${evalResult.totalScore}`;
      soundManager.playFullMoon();
    } else if (evalResult.phasePairs > 0) {
      message = `🌙 위상 쌍! +${evalResult.totalScore}`;
      soundManager.playPair();
    }

    this.showFloatingScore(message, x, y, owner);
    this.createParticles(x, y + 40, owner === 'player' ? '#00e5ff' : '#ffd54f');

    // 매칭된 셀 광선 하이라이트
    if (cellEl) cellEl.classList.add('match-highlight');
    evalResult.cardsToClaim.forEach(([cr, cc]) => {
      const target = this.getCellElement(cr, cc);
      if (target) target.classList.add('match-highlight');
    });
    setTimeout(() => {
      if (cellEl) cellEl.classList.remove('match-highlight');
      evalResult.cardsToClaim.forEach(([cr, cc]) => {
        const target = this.getCellElement(cr, cc);
        if (target) target.classList.remove('match-highlight');
      });
    }, 800);

    // AI 감정 반응
    if (owner === 'player') {
      if (evalResult.totalScore >= 3) {
        this.setAiMood('shocked');
      }
    } else {
      this.setAiMood('happy');
    }
  }

  // 플로팅 스코어 텍스트 표시
  showFloatingScore(text, x, y, owner) {
    const el = document.createElement('div');
    el.className = `floating-score score-${owner}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 1200);
  }

  // AI 턴 지능 알고리즘
  triggerAITurn() {
    this.setAiMood('thinking');
    this.instructionEl.textContent = '반달 AI가 최적의 수를 계산하고 있습니다...';

    setTimeout(() => {
      if (this.isGameOver) return;

      const bestMove = this.calculateBestAIMove();
      if (bestMove) {
        const card = this.aiHand.splice(bestMove.cardIndex, 1)[0];
        this.executeMove(bestMove.row, bestMove.col, card, 'ai');
      } else {
        // 놓을 곳이 없으면 턴 넘김
        this.turn = 'player';
        this.updateTurnUI();
      }
    }, 850);
  }

  // AI 의사 결정 (전략 평가 함수)
  calculateBestAIMove() {
    let bestScore = -999;
    let bestMoves = [];

    this.aiHand.forEach((card, cardIndex) => {
      for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.gridCols; c++) {
          if (this.board[r][c] === null) {
            const evalResult = this.evaluateMoveScore(r, c, card, 'ai');

            // 1. 직접 획득 점수
            let moveValue = evalResult.totalScore * 4;

            // 2. 플레이어의 카드를 뺏는 가치 (소유권 탈취)
            let stolenCount = 0;
            evalResult.cardsToClaim.forEach(([cr, cc]) => {
              if (this.board[cr][cc] && this.board[cr][cc].owner === 'player') {
                stolenCount++;
              }
            });
            moveValue += stolenCount * 3.5;

            // 3. 중앙 및 핵심 위치 가중치
            const centerR = (this.gridRows - 1) / 2;
            const centerC = (this.gridCols - 1) / 2;
            const distFromCenter = Math.abs(r - centerR) + Math.abs(c - centerC);
            moveValue += Math.max(0, (this.gridRows - distFromCenter)) * 0.4;

            // 4. 인간적인 가벼운 무작위 편차 (0 ~ 0.5)
            moveValue += Math.random() * 0.5;

            if (moveValue > bestScore) {
              bestScore = moveValue;
              bestMoves = [{ row: r, col: c, cardIndex }];
            } else if (Math.abs(moveValue - bestScore) < 0.1) {
              bestMoves.push({ row: r, col: c, cardIndex });
            }
          }
        }
      }
    });

    if (bestMoves.length === 0) return null;
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  // 보드가 가득 찼는지 검사
  isBoardFull() {
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.board[r][c] === null) return false;
      }
    }
    return true;
  }

  // 게임 종료 및 최종 결산
  endGame() {
    this.isGameOver = true;

    // 보드 점유 보너스 (영토 점수) 계산
    let playerTerritory = 0;
    let aiTerritory = 0;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.board[r][c];
        if (cell) {
          if (cell.owner === 'player') playerTerritory++;
          else if (cell.owner === 'ai') aiTerritory++;
        }
      }
    }

    const finalPlayerScore = this.playerScore + playerTerritory;
    const finalAiScore = this.aiScore + aiTerritory;

    const isWin = finalPlayerScore > finalAiScore;
    const isTie = finalPlayerScore === finalAiScore;
    this.lastRoundWon = isWin;

    if (isWin) {
      soundManager.playVictory();
      this.setAiMood('shocked');
    } else {
      soundManager.playDefeat();
      this.setAiMood('happy');
    }

    setTimeout(() => {
      this.showResultModal({
        isWin,
        isTie,
        playerMatchPts: this.playerScore,
        aiMatchPts: this.aiScore,
        playerTerritory,
        aiTerritory,
        finalPlayerScore,
        finalAiScore
      });
    }, 600);
  }

  // 결과 모달 창 띄우기
  showResultModal(data) {
    const iconEl = document.getElementById('resultIcon');
    const titleEl = document.getElementById('resultTitle');
    const descEl = document.getElementById('resultDesc');
    const playerCardEl = document.getElementById('summaryPlayerCard');
    const aiCardEl = document.getElementById('summaryAiCard');
    const nextBtn = document.getElementById('nextRoundBtn');

    if (data.isWin) {
      iconEl.textContent = '🏆';
      titleEl.className = 'result-title win';
      titleEl.textContent = '당신의 승리!';
      descEl.textContent = `축하합니다! 반달 AI를 상대로 달의 주기를 멋지게 수놓았습니다!`;
      playerCardEl.classList.add('winner-card');
      aiCardEl.classList.remove('winner-card');
      if (this.round < this.maxRounds) {
        nextBtn.textContent = `라운드 ${this.round + 1} 도전!`;
      } else {
        nextBtn.textContent = '처음부터 다시하기';
      }
    } else if (data.isTie) {
      iconEl.textContent = '🤝';
      titleEl.className = 'result-title tie';
      titleEl.textContent = '무승부!';
      descEl.textContent = '두 지혜로운 천체 전략가의 치열한 무승부입니다!';
      playerCardEl.classList.remove('winner-card');
      aiCardEl.classList.remove('winner-card');
      nextBtn.textContent = '이번 라운드 재도전';
    } else {
      iconEl.textContent = '🌙';
      titleEl.className = 'result-title lose';
      titleEl.textContent = '반달 AI의 승리!';
      descEl.textContent = '반달 AI가 달의 조화를 더 깊이 꿰뚫어 보았습니다. 다시 도전해보세요!';
      playerCardEl.classList.remove('winner-card');
      aiCardEl.classList.add('winner-card');
      nextBtn.textContent = '이번 라운드 재도전';
    }

    document.getElementById('summaryPlayerPts').textContent = data.finalPlayerScore;
    document.getElementById('summaryAiPts').textContent = data.finalAiScore;
    document.getElementById('summaryPlayerDetail').textContent = `매칭 ${data.playerMatchPts}점 + 보드 점유 ${data.playerTerritory}점`;
    document.getElementById('summaryAiDetail').textContent = `매칭 ${data.aiMatchPts}점 + 보드 점유 ${data.aiTerritory}점`;

    this.resultModal.classList.add('active');
  }

  handleNextRoundBtn() {
    this.resultModal.classList.remove('active');

    if (this.lastRoundWon) {
      if (this.round < this.maxRounds) {
        this.startNewGame(this.round + 1);
      } else {
        this.startNewGame(1);
      }
    } else {
      this.startNewGame(this.round);
    }
  }

  restartCurrentRound() {
    if (confirm('현재 라운드를 다시 시작하시겠습니까?')) {
      this.startNewGame(this.round);
    }
  }

  toggleSound(btnEl) {
    const isMuted = soundManager.toggleMute();
    btnEl.innerHTML = isMuted ? '🔇 음소거' : '🔊 사운드';
  }

  showRules() {
    soundManager.playSelect();
    this.rulesModal.classList.add('active');
  }

  hideRules() {
    this.rulesModal.classList.remove('active');
  }

  // AI 달님 얼굴 표정 변경
  setAiMood(mood) {
    this.aiMood = mood;
    let eyeLeft = 'M 22 28 Q 26 24 30 28';
    let eyeRight = 'M 36 28 Q 40 24 44 28';
    let mouth = 'M 26 38 Q 33 43 40 38';
    let glow = 'none';

    if (mood === 'thinking') {
      eyeLeft = 'M 22 26 Q 26 21 30 26';
      eyeRight = 'M 36 29 Q 40 24 44 29';
      mouth = 'M 28 39 Q 33 39 38 39';
      glow = '0 0 16px rgba(255, 215, 0, 0.7)';
    } else if (mood === 'happy') {
      eyeLeft = 'M 22 29 Q 26 23 30 29';
      eyeRight = 'M 36 29 Q 40 23 44 29';
      mouth = 'M 24 36 Q 33 46 42 36';
      glow = '0 0 20px rgba(255, 171, 0, 0.8)';
    } else if (mood === 'shocked') {
      eyeLeft = 'M 24 24 A 3 3 0 1 1 24 30 A 3 3 0 1 1 24 24';
      eyeRight = 'M 38 24 A 3 3 0 1 1 38 30 A 3 3 0 1 1 38 24';
      mouth = 'M 29 38 A 4 4 0 1 1 29 44 A 4 4 0 1 1 29 38';
    }

    this.aiFaceEl.style.filter = glow !== 'none' ? `drop-shadow(${glow})` : '';
    this.aiFaceEl.innerHTML = `
      <svg width="58" height="58" viewBox="0 0 64 64">
        <defs>
          <linearGradient id="aiFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff8e1" />
            <stop offset="100%" stop-color="#ffb300" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill="url(#aiFaceGrad)" stroke="#ffd54f" stroke-width="2" />
        <!-- 눈썹 & 눈 -->
        <path d="${eyeLeft}" stroke="#3e2723" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="${eyeRight}" stroke="#3e2723" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <!-- 입 -->
        <path d="${mouth}" stroke="#3e2723" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <!-- 볼터치 -->
        <circle cx="21" cy="36" r="3.5" fill="#ff8a80" opacity="0.6" />
        <circle cx="43" cy="36" r="3.5" fill="#ff8a80" opacity="0.6" />
      </svg>
    `;
  }

  // UI 상태 갱신
  updateScoresUI() {
    this.playerScoreEl.textContent = this.playerScore;
    this.aiScoreEl.textContent = this.aiScore;
  }

  updateTurnUI() {
    const isPlayer = this.turn === 'player';
    this.turnPillEl.className = `turn-pill ${isPlayer ? 'player-turn' : 'ai-turn'}`;
    this.turnPillEl.textContent = isPlayer ? '✨ 당신의 턴' : '🌙 반달 AI 생각 중...';

    document.querySelector('.player-card.is-player').classList.toggle('active-turn', isPlayer);
    document.querySelector('.player-card.is-ai').classList.toggle('active-turn', !isPlayer);

    // 라운드 배지에 선공 정보 함께 표시
    const firstLabel = this.firstTurnOwner === 'player' ? '🧑‍🚀 선공' : '🌙 AI 선공';
    this.roundBadgeEl.textContent =
      `라운드 ${this.round} / ${this.maxRounds} (${this.gridRows}×${this.gridCols}) · ${firstLabel}`;

    if (isPlayer) {
      this.instructionEl.textContent = '카드를 선택한 후 보드의 빈 칸을 클릭하세요';
      if (this.aiMood === 'thinking') this.setAiMood('neutral');
    }
  }

  updateDeckCount() {
    this.deckCountEl.textContent = `남은 달 카드: ${this.deck.length}장`;
  }

  getCellElement(r, c) {
    return this.gridEl.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
  }

  // ============================================================
  // 배경 우주 별빛 캔버스 & 파티클 시스템
  // ============================================================
  initBackgroundEffects() {
    const canvas = document.getElementById('starsCanvas');
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 은은한 성운 그라디언트
      const nebula = ctx.createRadialGradient(width * 0.2, height * 0.3, 50, width * 0.2, height * 0.3, 400);
      nebula.addColorStop(0, 'rgba(124, 77, 255, 0.08)');
      nebula.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 50, width * 0.8, height * 0.7, 450);
      nebula2.addColorStop(0, 'rgba(0, 229, 255, 0.06)');
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // 별빛 렌더링
      stars.forEach(star => {
        star.alpha += star.speed;
        const currentAlpha = Math.abs(Math.sin(star.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(render);
    };
    render();

    // 파티클 캔버스 초기화
    this.particleCanvas = document.getElementById('particleCanvas');
    this.particleCtx = this.particleCanvas.getContext('2d');
    this.particleCanvas.width = window.innerWidth;
    this.particleCanvas.height = window.innerHeight;
    this.particles = [];

    const updateParticles = () => {
      this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 0.98;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        } else {
          this.particleCtx.fillStyle = p.color;
          this.particleCtx.globalAlpha = p.alpha;
          this.particleCtx.beginPath();
          this.particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.particleCtx.fill();
        }
      }
      this.particleCtx.globalAlpha = 1.0;
      requestAnimationFrame(updateParticles);
    };
    updateParticles();
  }

  createParticles(x, y, color = '#ffd700', count = 28) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  }
}

// 게임 인스턴스 자동 시작
window.addEventListener('DOMContentLoaded', () => {
  window.game = new MoonGame();
});
