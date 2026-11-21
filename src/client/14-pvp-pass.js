let pvpCurrentPlayerNum = 1;
async function triggerPvpPassAndPlayHandover() {
  const nextPlayerNum = pvpCurrentPlayerNum === 1 ? 2 : 1;
  if (nextPlayerNum === 1) {
    battle.turn += 1;
  }
  pvpCurrentPlayerNum = nextPlayerNum;

  const tmpBoard = battle.board[0];
  battle.board[0] = battle.board[1];
  battle.board[1] = tmpBoard;

  const tmpLeader = battle.leaders[0];
  battle.leaders[0] = battle.leaders[1];
  battle.leaders[1] = tmpLeader;

  for (let s = 0; s < 2; s++) {
    battle.leaders[s].hand.forEach(c => { c.owner = s; });
    battle.leaders[s].deck.forEach(c => { c.owner = s; });
    battle.board[s].forEach(c => { if (c) c.owner = s; });
  }

  const modal = document.getElementById('pvpHandoverModal');
  const titleEl = document.getElementById('pvpHandoverTitle');
  const descEl = document.getElementById('pvpHandoverDesc');
  if (titleEl) titleEl.textContent = `👥 轮到【玩家 ${pvpCurrentPlayerNum}】行动`;
  if (descEl) descEl.textContent = `当前为第 ${battle.turn} 回合。为保护双方手牌隐私，已自动遮蔽牌面，请将设备交给【玩家 ${pvpCurrentPlayerNum}】后点击下方按钮开始回合。`;

  setHandCollapsed(true);
  renderAllBattleUI();
  if (modal) { modal.classList.remove('hidden'); modal.style.display = 'flex'; }
}

// ============================================================================

