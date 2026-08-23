#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI AllInOne 部署运维技能 一键打包脚本
生成 3 个市场发布包（技能更新后重跑本脚本即可）：
  dist/ai-all-in-one-deploy-ops-zh.zip       中文版（腾讯 SkillHub / Gitee 生态 / 国内市场）
  dist/ai-all-in-one-deploy-ops-en.zip       英文版（Anthropic Marketplace / LobeHub / Agensi / Vercel 等）
  dist/ai-all-in-one-deploy-ops-clawhub.zip  ClawHub 版（OpenClaw 市场，英文，含 license: MIT-0 与 PUBLISH.md）

用法：python package_all.py   （在 AIOperation/ 目录下运行）
"""
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
TOP = "ai-all-in-one-deploy-ops"  # zip 顶层目录名

PACKAGES = [
    # (源目录, 输出文件名, 说明)
    ("agent",    "ai-all-in-one-deploy-ops-zh.zip",       "中文版（SkillHub/国内市场）"),
    ("agent.en", "ai-all-in-one-deploy-ops-en.zip",       "英文版（海外市场）"),
    ("clawhub",  "ai-all-in-one-deploy-ops-clawhub.zip",  "ClawHub 版（OpenClaw 市场）"),
]


def pack(src_dir, out_zip):
    src = os.path.join(ROOT, src_dir)
    if not os.path.isdir(src):
        print(f"[SKIP] 源目录不存在: {src}")
        return False
    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, out_zip)
    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(src):
            dirs.sort()
            for f in sorted(files):
                p = os.path.join(root, f)
                arc = os.path.join(TOP, os.path.relpath(p, src))
                z.write(p, arc)
                count += 1
    size = os.path.getsize(out)
    print(f"[OK] {out_zip}  ({count} files, {size:,} bytes)")
    return True


def main():
    print("== 打包 AI AllInOne 部署运维技能（3 个市场包）==\n")
    ok = 0
    for src_dir, out_zip, note in PACKAGES:
        if pack(src_dir, out_zip):
            ok += 1
            print(f"     └─ {note}")
    print(f"\n完成：{ok}/{len(PACKAGES)} 个包生成，输出目录 {DIST}")
    if ok < len(PACKAGES):
        sys.exit(1)


if __name__ == "__main__":
    main()
