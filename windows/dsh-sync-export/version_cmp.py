#!/usr/bin/env python3
# version_cmp.py — 语义化版本号比较（无第三方依赖）
# 用法: python version_cmp.py <v1> <v2>  -> 返回 0(v1<v2) / 1(v1==v2) / 2(v1>v2)
import re, sys

def parse(v):
    m = re.match(r'[vV]?(\d+)\.(\d+)\.(\d+)(?:[-.](\w+))?', v or '')
    if not m:
        return None
    core = tuple(int(x) for x in m.group(1, 2, 3))
    pre = m.group(4) or ''
    return (core, pre)

def cmp(a, b):
    ca, cb = parse(a), parse(b)
    if ca is None or cb is None:
        return 0
    if ca[0] != cb[0]:
        return 1 if ca[0] > cb[0] else -1
    # 预发布版本（rc/beta）视为低于正式版
    if ca[1] and not cb[1]:
        return -1
    if cb[1] and not ca[1]:
        return 1
    if ca[1] != cb[1]:
        return 1 if ca[1] > cb[1] else -1
    return 0

if __name__ == '__main__':
    a, b = sys.argv[1], sys.argv[2]
    r = cmp(a, b)
    print(0 if r < 0 else (1 if r == 0 else 2))
    sys.exit(0)
