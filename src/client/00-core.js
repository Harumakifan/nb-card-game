// v1.84 安全加固：统一 HTML 转义，根治联机房间/观战/聊天 XSS 注入
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =========================================================================
   【游戏更新备注 · 对战计数与UI显示规范】
   1. 每次新增对战级计数（如：本次受伤次数大于X、被破坏的谢幕曲随从X、
      被破坏的守护随从X、本次消耗能量X等）时，必须同步写入战斗状态统计
      （battle.leaders[side]）与存档恢复逻辑。
   2. 开局检测显示规则：开局时扫描己方（及敌方）卡组/手牌/墓场/战场，
      只有当卡组中携带了需要查看该计数的卡牌时，才在对战界面顶部/底部
      动态计数栏显示对应计数UI；若未携带相关卡牌，则不显示该计数UI。
   3. 手牌实时进度：手牌中带有对战计数条件的卡牌，必须在手牌上实时显示
      当前计数进度徽章（例如 `🛡️破坏守护 3/10`、`⚡耗能 12/30`、
      `🩸自残 4/7`、`💀谢幕 5/7`）。
   4. 【新增卡牌画图规范】每次在 INITIAL_CCG_DATA 新增卡牌或调整卡牌名称/形态
      （含衍生物、结晶、纹章）时，必须同步在 artEngine.js 中为该卡牌绘制专属
      矢量卡面插画，避免出现空白或通用默认卡图。
   5. 【新增卡牌文本规范化与AI防误判规范】每次从外部卡组编辑器导入或新增卡牌时，
      若原始文本描述不够规范，必须先按 CardForge 标准术语（如【入场曲】【谢幕曲】
      【倒计时_X】、己方/敌方战场、X以上/以下、明确随机/选择等）优化规范后
      再加入 INITIAL_CCG_DATA；同时必须核查新卡的“若/如果”等附加收益或被动触发
      描述，确保不会触发 AI 前置条件误判而锁死出牌。
   ========================================================================= */




if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rad = typeof r === 'number' ? r : (Array.isArray(r) ? (r[0] || 0) : 6);
    const rr = Math.min(rad, w / 2, h / 2);
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
    return this;
  };
}

