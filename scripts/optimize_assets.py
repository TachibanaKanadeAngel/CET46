import os
import shutil
from PIL import Image

def optimize_assets():
    base_dir = "E:/项目/CET46/miniprogram/assets"
    
    # 1. 删除未使用的 buttons 目录
    buttons_dir = os.path.join(base_dir, "buttons")
    if os.path.exists(buttons_dir):
        print(f"[*] Removing unused buttons directory: {buttons_dir}")
        shutil.rmtree(buttons_dir)
        
    # 2. 转换 backgrounds 和 decorations 目录下的图片为 WebP
    image_dirs = ["backgrounds", "decorations"]
    for sub_dir in image_dirs:
        target_path = os.path.join(base_dir, sub_dir)
        if not os.path.exists(target_path):
            continue
            
        print(f"[*] Processing directory: {target_path}")
        for file_name in os.listdir(target_path):
            if file_name.lower().endswith(".png"):
                full_path = os.path.join(target_path, file_name)
                # 跳过已经存在对应 webp 的情况或重新生成
                name_without_ext = os.path.splitext(file_name)[0]
                webp_path = os.path.join(target_path, f"{name_without_ext}.webp")
                
                try:
                    with Image.open(full_path) as img:
                        # 转换并以 quality=80 保存为 WebP
                        print(f"    - Converting {file_name} to WebP...")
                        img.save(webp_path, "WEBP", quality=80)
                    # 删除原 PNG
                    os.remove(full_path)
                    print(f"    - Removed original {file_name}")
                except Exception as e:
                    print(f"[!] Error processing {file_name}: {e}")

    # 3. 处理 icons 目录下的图片
    icons_dir = os.path.join(base_dir, "icons")
    if os.path.exists(icons_dir):
        print(f"[*] Processing icons directory: {icons_dir}")
        # TabBar 图标列表（必须保持 PNG 格式，但进行深度压缩）
        tab_icons = {
            "study.png", "study-active.png", 
            "review.png", "review-active.png", 
            "wrong.png", "wrong-active.png", 
            "stats.png", "stats-active.png", 
            "profile.png", "profile-active.png",
            "home.png", "home-active.png"
        }
        
        for file_name in os.listdir(icons_dir):
            if not file_name.lower().endswith(".png"):
                continue
                
            full_path = os.path.join(icons_dir, file_name)
            name_without_ext = os.path.splitext(file_name)[0]
            
            if file_name in tab_icons:
                # 是 TabBar 图标，用 PIL 重新保存为压缩后的 PNG
                try:
                    print(f"    - Compressing TabBar icon {file_name}...")
                    with Image.open(full_path) as img:
                        img.save(full_path, "PNG", optimize=True)
                except Exception as e:
                    print(f"[!] Error compressing icon {file_name}: {e}")
            else:
                # 其他页面内图标，转换为 WebP
                webp_path = os.path.join(icons_dir, f"{name_without_ext}.webp")
                try:
                    print(f"    - Converting icon {file_name} to WebP...")
                    with Image.open(full_path) as img:
                        img.save(webp_path, "WEBP", quality=80)
                    os.remove(full_path)
                    print(f"    - Removed original {file_name}")
                except Exception as e:
                    print(f"[!] Error processing icon {file_name}: {e}")

    print("[*] Asset optimization completed!")

if __name__ == "__main__":
    optimize_assets()
