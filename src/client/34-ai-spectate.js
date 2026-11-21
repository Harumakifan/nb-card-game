// ============================================================================
// v1.78 AI 观战模式：使用玩家当前构筑卡组对战所选 AI，支持实时一键接管与干净退出
// ============================================================================
;(function initSpectateMode() {
  window.CF_SPECTATE_ACTIVE = false;
  let spectateLoopRunning = false;

  function setSpectateActive(on) {
    window.CF_SPECTATE_ACTIVE = Boolean(on);
    const badge = document.getElementById('cfSpectateBadge');
    if (badge) badge.classList.toggle('hidden', !window.CF_SPECTATE_ACTIVE);
  }
  window.setCfSpectateActive = setSpectateActive;

  async function runPlayerSideSpectateAI() {
    if (!window.CF_SPECTATE_ACTIVE || typeof battle === 'undefined' || !battle || battle.gameOver) return;
    if (battle.animating || spectateLoopRunning) return;
    const _sid = _battleSessionSeq;

    // 1. 开局换牌阶段：自动换掉高费卡（费用>4或祭品>=2）并确认起手
    const mOverlay = document.getElementById('mulliganModal');
    if (mOverlay && !mOverlay.classList.contains('hidden')) {
      spectateLoopRunning = true;
      try {
        await sleep(420);
        if (!window.CF_SPECTATE_ACTIVE || _sid !== _battleSessionSeq || battle.gameOver) return;
        const pHand = (battle.leaders[0] && battle.leaders[0].hand) || [];
        if (Array.isArray(battle.mulliganSwapped)) {
          for (let i = 0; i < Math.min(4, pHand.length); i++) {
            const c = pHand[i];
            const e = (c && c.data && c.data.energy) || 0;
            const s = (c && c.data && c.data.sacrifice) || 0;
            battle.mulliganSwapped[i] = (e >= 5 || s >= 2);
          }
          if (typeof renderMulliganDualBox === 'function') renderMulliganDualBox();
          await sleep(260);
        }
        if (!window.CF_SPECTATE_ACTIVE || _sid !== _battleSessionSeq || battle.gameOver) return;
        const confirmBtn = document.getElementById('btnConfirmMulligan');
        if (confirmBtn) confirmBtn.click();
        await sleep(520);
      } finally {
        spectateLoopRunning = false;
      }
      return;
    }

    // 2. 仅在我方回合 (activeSide === 0) 自动操作
    if (battle.activeSide !== 0) return;
    spectateLoopRunning = true;
    try {
      await sleep(340);
      let guard = 0;
      while (window.CF_SPECTATE_ACTIVE && _sid === _battleSessionSeq && !battle.gameOver && battle.activeSide === 0 && guard < 18) {
        guard++;
        if (battle.animating) {
          await sleep(180);
          continue;
        }
        const st = battle.leaders[0];
        if (!st || !Array.isArray(st.hand)) break;

        let bestAction = null;
        let bestScore = -9999;

        for (let i = 0; i < st.hand.length; i++) {
          const c = st.hand[i];
          if (!c || !c.data) continue;
          const playEval = typeof evaluateCardPlayState === 'function' ? evaluateCardPlayState(0, c) : null;
          if (!playEval || !playEval.ok) continue;

          const isEnh = playEval.mode === 'enhance';
          const isSpell = c.data.type === 'spell';
          const needSac = c.data.sacrifice || 0;

          // 选择献祭祭品（优先低价值随从，避免亏本献祭大哥）
          let sacLanes = [];
          if (needSac > 0) {
            const validSac = getValidSacrificeLanes(0, c.data.sacrificeCond || '');
            if (validSac.length < needSac) continue;
            validSac.sort((la, lb) => compareTributeCandidatesForAI(battle.board[0][la], battle.board[0][lb]));
            sacLanes = validSac.slice(0, needSac);
            let tributeVal = 0;
            sacLanes.forEach(sl => {
              const sm = battle.board[0][sl];
              if (sm) tributeVal += (typeof getBoardMinionEffectiveValueForAI === 'function' ? getBoardMinionEffectiveValueForAI(sm) : (getCardCostValue(sm.data) || 1));
            });
            const selfVal = (typeof getCardCostValue === 'function' ? getCardCostValue(c.data) : (c.data.energy || 1)) + 1.2;
            if (tributeVal > selfVal + 0.6) continue;
          }

          // 选择放置列（随从/护符）
          let placeLane = -1;
          if (!isSpell) {
            const availLanes = [0, 1, 2, 3, 4].filter(l => !battle.board[0][l] || sacLanes.includes(l));
            if (availLanes.length === 0) continue;
            let bestLaneScore = -9999;
            for (const l of availLanes) {
              const em = battle.board[1][l];
              let ls = 0;
              if (c.data.type === 'amulet') {
                ls = em ? -20 : 15;
              } else if (em && em.data.type === 'minion') {
                const threat = (typeof analyzeMinionKillValueForAI === 'function' ? analyzeMinionKillValueForAI(em, false) : ((em.currentAtk || 0) * 18)) + (em.activeKw && em.activeKw['飞行'] ? 25 : 0);
                const effDmg = typeof estimateCardEffectDmgToLaneForAI === 'function'
                  ? estimateCardEffectDmgToLaneForAI(c, st, battle.board[1], l, 0, isEnh, -1, 1, 1)
                  : 0;
                const comb = typeof evaluateCombinedKillForAI === 'function'
                  ? evaluateCombinedKillForAI(em, (c.currentAtk || c.data.atk || 0), effDmg, Boolean(c.activeKw && c.activeKw['毁灭']), Math.max(1, Number((c.activeKw && c.activeKw['多重攻击']) || 1)))
                  : { canKill: (c.currentAtk || c.data.atk || 0) >= (em.currentHp || 1) };
                ls = threat + (comb.canKill ? 140 : 15);
              } else {
                ls = (c.currentAtk || c.data.atk || 0) * 14 + 10;
              }
              if (ls > bestLaneScore) { bestLaneScore = ls; placeLane = l; }
            }
          }

          // 抉择选项
          const choices = typeof getCardChoices === 'function' ? getCardChoices(c) : [];
          const choiceIdx = choices.length > 0 ? 0 : -1;

          // 目标指定
          const req = typeof getCardTargetRequirement === 'function'
            ? getCardTargetRequirement(c, isEnh, choiceIdx, playEval.mode || 'normal')
            : '';
          let effTarget = -1;
          let effTargetSide = 1;
          let handTargetUid = -1;

          if (req === 'hand_card') {
            const others = st.hand.filter(h => h && h.uid !== c.uid);
            if (others.length === 0) {
              if (isSpell) continue;
            } else {
              others.sort((a, b) => (a.data.energy || 0) - (b.data.energy || 0));
              handTargetUid = others[0].uid;
            }
          } else if (req) {
            const locs = typeof getValidTargetLocations === 'function'
              ? getValidTargetLocations(0, req, isSpell, sacLanes)
              : [];
            if (locs.length === 0) {
              if (isSpell) continue;
            } else {
              locs.sort((a, b) => {
                const ma = battle.board[a.side][a.lane];
                const mb = battle.board[b.side][b.lane];
                const va = ma ? ((ma.currentAtk || 0) * 20 + (ma.currentHp || 0) * 8) : 0;
                const vb = mb ? ((mb.currentAtk || 0) * 20 + (mb.currentHp || 0) * 8) : 0;
                return vb - va;
              });
              effTarget = locs[0].lane;
              effTargetSide = locs[0].side;
            }
          }

          const cardVal = (typeof getCardCostValue === 'function' ? getCardCostValue(c.data) : (c.data.energy || 1)) * 18
            + (isEnh ? 28 : 0)
            + (isSpell ? 16 : ((c.currentAtk || c.data.atk || 0) * 4 + (c.currentHp || c.data.hp || 0) * 2))
            - needSac * 6;
          if (cardVal > bestScore) {
            bestScore = cardVal;
            bestAction = { card: c, playEval, placeLane, sacLanes, effTarget, choiceIdx, handTargetUid, effTargetSide };
          }
        }

        if (!bestAction) break;
        if (!window.CF_SPECTATE_ACTIVE || _sid !== _battleSessionSeq || battle.gameOver || battle.activeSide !== 0) break;

        await commitCardPlayWithAnimations(
          0,
          bestAction.card,
          bestAction.playEval,
          bestAction.placeLane,
          bestAction.sacLanes,
          bestAction.effTarget,
          bestAction.choiceIdx,
          bestAction.handTargetUid,
          bestAction.effTargetSide
        );
        await sleep(340);
      }

      if (window.CF_SPECTATE_ACTIVE && _sid === _battleSessionSeq && !battle.gameOver && battle.activeSide === 0) {
        await sleep(360);
        if (window.CF_SPECTATE_ACTIVE && _sid === _battleSessionSeq && !battle.gameOver && battle.activeSide === 0) {
          await executeEndTurnSequence(0);
        }
      }
    } catch (e) {
      battle.animating = false;
      console.warn('[SpectateAI]', e);
    } finally {
      spectateLoopRunning = false;
      if (!window.CF_SPECTATE_ACTIVE && !battle.gameOver) {
        battle.animating = false;
        if (typeof renderAllBattleUI === 'function') renderAllBattleUI();
      }
    }
  }

  document.getElementById('btnMenuSpectate')?.addEventListener('click', () => {
    const arch = document.getElementById('menuAiArch')?.value || 'dragon';
    const diff = document.getElementById('menuAiDiff')?.value || 'normal';
    aiDeckArchetype = arch;
    aiDifficulty = diff;
    battleMode = 'pve';
    const selM = document.getElementById('selectBattleMode'); if (selM) selM.value = 'pve';
    const selA = document.getElementById('selectAiDeckArchetype'); if (selA) selA.value = arch;
    const selD = document.getElementById('selectAiDifficulty'); if (selD) selD.value = diff;

    const menu = document.getElementById('mainMenuOverlay');
    if (menu) menu.classList.add('hidden');
    if (typeof window.enterBattleFullscreenLandscape === 'function') window.enterBattleFullscreenLandscape();
    if (typeof switchScreen === 'function') switchScreen('battle');

    setSpectateActive(true);
    if (typeof initNewBattle === 'function') initNewBattle({ spectate: true });

    const curDeck = (typeof PRESET_DECKS !== 'undefined' && PRESET_DECKS[currentDeckIndex]) ? PRESET_DECKS[currentDeckIndex].name : '当前卡组';
    const diffCfg = (typeof AI_DIFFICULTY_CONFIG !== 'undefined' && AI_DIFFICULTY_CONFIG[aiDifficulty]) ? AI_DIFFICULTY_CONFIG[aiDifficulty].label : 'AI';
    if (typeof showToast === 'function') {
      showToast(`🤖 AI 观战开始：我方 AI 使用「${curDeck}」对战 ${diffCfg}，点击右上角可随时接管`, 'info');
    }
  });

  // 任何退出观战或切回其他模式的操作都彻底关闭观战状态与接管按钮
  [
    'btnTopBackMenu', 'btnNavMainMenu', 'btnExitSpectate', 'btnVicGoDeck',
    'btnMenuStartPve', 'btnMenuPassPlay', 'btnMenuStartOnline', 'btnMenuDeckEditor', 'btnMenuDesigner'
  ].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => setSpectateActive(false));
  });

  setInterval(() => {
    if (!window.CF_SPECTATE_ACTIVE) return;
    if (typeof battle === 'undefined' || !battle || battle.gameOver) {
      if (battle && battle.gameOver) setSpectateActive(false);
      return;
    }
    const menu = document.getElementById('mainMenuOverlay');
    const battleScreen = document.getElementById('screenBattle');
    if ((menu && !menu.classList.contains('hidden')) || (battleScreen && battleScreen.classList.contains('hidden'))) {
      setSpectateActive(false);
      return;
    }
    const mOverlay = document.getElementById('mulliganModal');
    const inMulligan = mOverlay && !mOverlay.classList.contains('hidden');
    if ((inMulligan || battle.activeSide === 0) && !battle.animating && !spectateLoopRunning) {
      runPlayerSideSpectateAI();
    }
  }, 550);
})();


