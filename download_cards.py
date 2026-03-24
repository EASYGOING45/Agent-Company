#!/usr/bin/env python3
"""
下载鸣潮角色 Card 立绘 from Fandom Wiki
"""

import urllib.request
import os
import ssl

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# 角色立绘 URL 映射 (使用 Fandom Wiki 的 latest API 格式)
CHARACTER_CARDS = {
    "phoebe": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Phoebe_Card.png",
    "jinxi": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Jinhsi_Card.png",
    "changli": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Changli_Card.png",
    "jiyan": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Jiyan_Card.png",
    "xiangliyao": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Xiangli_Yao_Card.png",
    "colletta": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Carlotta_Card.png",
    "roccia": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Roccia_Card.png",
    "zani": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Zani_Card.png",
    "brant": "https://static.wikia.nocookie.net/wutheringwaves/images/latest/?path-prefix=en&file=Brant_Card.png",
}

OUTPUT_DIR = "/Users/golden-tenet/claw-spaces/Phoebe/Projects/Agent-Company/public/assets/cards"

def download_card(name: str, url: str):
    """下载单个角色立绘"""
    output_path = os.path.join(OUTPUT_DIR, f"{name}-card.png")
    
    if os.path.exists(output_path):
        print(f"✓ {name} 已存在，跳过")
        return
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())
        
        size = os.path.getsize(output_path)
        print(f"✓ {name} 下载成功 ({size/1024:.1f} KB)")
        
    except Exception as e:
        print(f"✗ {name} 下载失败: {e}")

def main():
    print("🎨 开始下载鸣潮角色 Card 立绘...\n")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for name, url in CHARACTER_CARDS.items():
        download_card(name, url)
    
    print("\n✨ 下载完成！")
    print(f"📁 保存位置: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
