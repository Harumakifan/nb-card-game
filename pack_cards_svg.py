#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CardForge · 冥刻之诗 cards_svg 超清全貌一键打包脚本 (v1.37)
用法：
  python3 pack_cards_svg.py ./cards_svg
作用：
  1) 完整保留每张 SVG 内嵌原画的真实比例（零裁切、不放大截断），按最长边 1080px（如 720x1080）以 WebP 94% 超清质量压缩，
     生成同级目录的 `cards_art_pack.js`，替换游戏目录同名文件即可让全部 216 张卡在手牌与战场上呈现超清全貌！
  2) 可选参数 `--fix-svg-gems`：同步将原始 SVG 卡图底部的稀有度宝石按「普通=铜、稀有=银、史诗=金、传说=彩虹」批量更新。
"""
import os, sys, re, io, json, base64
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("请先安装 Pillow: pip install pillow")
    sys.exit(1)

GEM_GRADIENTS = {
    "普通": '<radialGradient id="centerGemGrad" cx="32%" cy="28%" r="70%"><stop offset="0%" stop-color="#ffe6cc"/><stop offset="35%" stop-color="#d98a4e"/><stop offset="75%" stop-color="#9a4e1c"/><stop offset="100%" stop-color="#4a1f08"/></radialGradient>',
    "稀有": '<radialGradient id="centerGemGrad" cx="32%" cy="28%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="38%" stop-color="#dbe4ee"/><stop offset="75%" stop-color="#8a9bb0"/><stop offset="100%" stop-color="#334155"/></radialGradient>',
    "史诗": '<radialGradient id="centerGemGrad" cx="32%" cy="28%" r="70%"><stop offset="0%" stop-color="#fffde7"/><stop offset="35%" stop-color="#facc15"/><stop offset="75%" stop-color="#ca8a04"/><stop offset="100%" stop-color="#713f12"/></radialGradient>',
    "传说": '<linearGradient id="centerGemGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6b9d"/><stop offset="22%" stop-color="#ffd93d"/><stop offset="45%" stop-color="#6ee7b7"/><stop offset="68%" stop-color="#38bdf8"/><stop offset="88%" stop-color="#a855f7"/><stop offset="100%" stop-color="#f472b6"/></linearGradient>',
}

def extract_name(filename: str) -> str:
    stem = Path(filename).stem.strip()
    m = re.match(r'^\d+[_\-\s]+(.+)$', stem)
    return m.group(1).strip() if m else stem

def process_image_uhd_full(img_bytes: bytes, max_side=1080, quality=94) -> str:
    im = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=quality, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

def main():
    if len(sys.argv) < 2:
        print("用法: python3 pack_cards_svg.py <cards_svg目录路径> [--fix-svg-gems]")
        sys.exit(1)
    folder = Path(sys.argv[1])
    fix_gems = "--fix-svg-gems" in sys.argv
    if not folder.is_dir():
        print(f"目录不存在: {folder}")
        sys.exit(1)

    out_fixed = folder.parent / "cards_svg_gem_fixed"
    if fix_gems:
        out_fixed.mkdir(exist_ok=True)

    pack = {}
    for fp in sorted(folder.iterdir()):
        if not fp.is_file(): continue
        ext = fp.suffix.lower()
        name = extract_name(fp.name)
        if ext == ".svg":
            raw = fp.read_text(encoding="utf-8", errors="ignore")
            m = re.search(r'data:image/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)', raw)
            if m:
                pack[name] = process_image_uhd_full(base64.b64decode(m.group(2)))
                print(f"  [OK] {name} <- {fp.name}")
            if fix_gems:
                rm = re.search(r'data-rarity=["\']([^"\']+)["\']', raw)
                rarity = rm.group(1) if rm else "普通"
                grad = GEM_GRADIENTS.get(rarity, GEM_GRADIENTS["普通"])
                fixed = re.sub(r'<radialGradient id="centerGemGrad"[\s\S]*?</radialGradient>', grad, raw, count=1)
                (out_fixed / fp.name).write_text(fixed, encoding="utf-8")
        elif ext in (".png", ".jpg", ".jpeg", ".webp"):
            pack[name] = process_image_uhd_full(fp.read_bytes())
            print(f"  [OK] {name} <- {fp.name}")

    out_js = Path("cards_art_pack.js")
    out_js.write_text(
        f"// CardForge · 冥刻之诗 高清卡图资源包 (共 {len(pack)} 张)\nwindow.CF_SVG_ART_PACK = Object.assign(window.CF_SVG_ART_PACK || {{}}, {json.dumps(pack, ensure_ascii=False)});\n",
        encoding="utf-8"
    )
    print(f"\n完成！共打包 {len(pack)} 张超清全貌卡图，已输出单文件 {out_js.name} ({out_js.stat().st_size/1024/1024:.2f} MB)。")

if __name__ == "__main__":
    main()
