"""把志莽行书切成两份 woff2，给 .brush 和印章用。

- site：官网源码里出现过的字，首屏只下这一份
- common：GB2312 里剩下的字，页面真用到生僻字才会下

改了官网文案后跑 `just font-subset`。忘了跑也不会缺字，只是新字落到 common 那份里多下一点。
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[3]
WEB = ROOT / 'apps' / 'jianlai-web'
SOURCE = ROOT / 'assets' / 'fonts' / 'ZhiMangXing-Regular.ttf'
OUT_DIR = WEB / 'public' / 'fonts'
CSS_OUT = WEB / 'src' / 'brush-font.css'
FAMILY = 'Zhi Mang Xing'


def site_codepoints() -> set[int]:
    files = [WEB / 'index.html', *(WEB / 'src').rglob('*.ts'), *(WEB / 'src').rglob('*.tsx')]
    chars: set[int] = set(range(0x20, 0x7F))
    for f in files:
        chars.update(ord(ch) for ch in f.read_text(encoding='utf-8'))
    return chars


def gb2312_codepoints() -> set[int]:
    chars: set[int] = set()
    for hi in range(0xA1, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(ord(bytes([hi, lo]).decode('gb2312')))
            except UnicodeDecodeError:
                pass
    return chars


def ranges(cps: set[int]) -> str:
    out: list[str] = []
    items = sorted(cps)
    start = prev = items[0]
    for cp in items[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        out.append(f'U+{start:X}' if start == prev else f'U+{start:X}-{prev:X}')
        start = prev = cp
    out.append(f'U+{start:X}' if start == prev else f'U+{start:X}-{prev:X}')
    return ', '.join(out)


def write_subset(cps: set[int], name: str) -> int:
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = ['*']
    font = TTFont(SOURCE)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=sorted(cps))
    subsetter.subset(font)
    path = OUT_DIR / name
    font.flavor = 'woff2'
    font.save(path)
    return path.stat().st_size


def main() -> None:
    cmap = set(TTFont(SOURCE).getBestCmap())
    site = site_codepoints() & cmap
    common = (gb2312_codepoints() & cmap) - site
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    site_size = write_subset(site, 'zhimangxing-site.woff2')
    common_size = write_subset(common, 'zhimangxing-common.woff2')

    face = """@font-face {{
  font-family: '{family}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/{file}') format('woff2');
  unicode-range: {ranges};
}}
"""
    CSS_OUT.write_text(
        '/* 由 scripts/subset-brush-font.py 生成，别手改；改了官网文案跑 just font-subset */\n'
        + face.format(family=FAMILY, file='zhimangxing-site.woff2', ranges=ranges(site))
        + face.format(family=FAMILY, file='zhimangxing-common.woff2', ranges=ranges(common)),
        encoding='utf-8',
    )
    print(f'site: {len(site)} 字 {site_size // 1024}K · common: {len(common)} 字 {common_size // 1024}K')


if __name__ == '__main__':
    main()
