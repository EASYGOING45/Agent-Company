#!/usr/bin/env python3
"""
从Wuthering Waves Fandom Wiki下载角色素材
"""

import urllib.request
import os
import ssl

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# 角色列表 (名字, Wiki页面名)
characters = [
    ("phoebe", "Phoebe"),
    ("jinhsi", "Jinhsi"),
    ("changli", "Changli"),
    ("jiyan", "Jiyan"),
    ("xiangliyao", "Xiangli_Yao"),
    ("carlotta", "Carlotta"),
    ("roccia", "Roccia"),
    ("zani", "Zani"),
    ("brant", "Brant"),
]

# 输出目录
output_dir = "public/assets/fandom"
os.makedirs(output_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

base_url = "https://static.wikia.nocookie.net/wutheringwaves/images"

def download_file(url, output_path):
    """下载文件"""
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
            if response.status == 200:
                data = response.read()
                if len(data) > 1000:  # 确保不是错误页面
                    with open(output_path, 'wb') as f:
                        f.write(data)
                    return len(data)
    except Exception as e:
        print(f"    Error: {e}")
    return 0

print("=" * 60)
print("从Fandom Wiki下载鸣潮角色素材")
print("=" * 60)

# 下载每个角色的素材
for char_id, wiki_name in characters:
    print(f"\n📥 下载 {char_id} ({wiki_name})...")
    
    # 尝试下载Splash Art
    splash_url = f"{base_url}/latest/?path-prefix=en&file={wiki_name}_Splash_Art.png"
    output_path = f"{output_dir}/{char_id}_splash.png"
    size = download_file(splash_url, output_path)
    if size > 0:
        print(f"  ✅ Splash Art: {size/1024:.1f} KB")
    else:
        print(f"  ❌ Splash Art")
    
    # 尝试下载Full Sprite
    sprite_url = f"{base_url}/latest/?path-prefix=en&file={wiki_name}_Full_Sprite.png"
    output_path = f"{output_dir}/{char_id}_sprite.png"
    size = download_file(sprite_url, output_path)
    if size > 0:
        print(f"  ✅ Full Sprite: {size/1024:.1f} KB")
    else:
        print(f"  ❌ Full Sprite")
    
    # 尝试下载Character Icon
    icon_url = f"{base_url}/latest/?path-prefix=en&file=Resonator_{wiki_name}.png"
    output_path = f"{output_dir}/{char_id}_icon.png"
    size = download_file(icon_url, output_path)
    if size > 0:
        print(f"  ✅ Icon: {size/1024:.1f} KB")
    else:
        print(f"  ❌ Icon")

print("\n" + "=" * 60)
print("下载完成！")
print(f"素材保存在: {output_dir}/")
print("=" * 60)
