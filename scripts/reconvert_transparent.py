import os
from PIL import Image

def process_image(src, dst):
    if not os.path.exists(src):
        print(f"[!] Source not found: {src}")
        return
    try:
        print(f"[*] Processing: {os.path.basename(src)} -> {os.path.basename(dst)}")
        with Image.open(src) as img:
            rgba_img = img.convert("RGBA")
            datas = rgba_img.getdata()
            
            newData = []
            for item in datas:
                # If pixel is pure white or very close (e.g. all R, G, B > 250), make it transparent
                if item[0] > 250 and item[1] > 250 and item[2] > 250:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            
            rgba_img.putdata(newData)
            rgba_img.save(dst, "WEBP", quality=80)
            print(f"    - Success!")
    except Exception as e:
        print(f"[!] Error processing {src}: {e}")

def main():
    mappings = [
        # Decor
        ("E:/项目/CET46/素材/decor/tree-top-left.png", "E:/项目/CET46/miniprogram/assets/decorations/tree-left.webp"),
        ("E:/项目/CET46/素材/decor/tree-top-right.png", "E:/项目/CET46/miniprogram/assets/decorations/tree-right.webp"),
        ("E:/项目/CET46/素材/decor/cloud-large.png", "E:/项目/CET46/miniprogram/assets/decorations/cloud-large.webp"),
        ("E:/项目/CET46/素材/decor/cloud-small.png", "E:/项目/CET46/miniprogram/assets/decorations/cloud-small.webp"),
        ("E:/项目/CET46/素材/decor/left-windmill.png", "E:/项目/CET46/miniprogram/assets/decorations/windmill.webp"),
        ("E:/项目/CET46/素材/decor/right-cottage.png", "E:/项目/CET46/miniprogram/assets/decorations/cottage.webp"),
        ("E:/项目/CET46/素材/decor/fence-strip.png", "E:/项目/CET46/miniprogram/assets/decorations/fence.webp"),
        ("E:/项目/CET46/素材/decor/books-coffee-corner.png", "E:/项目/CET46/miniprogram/assets/decorations/books-corner.webp"),
        # Textures
        ("E:/项目/CET46/素材/textures/paper-parchment.png", "E:/项目/CET46/miniprogram/assets/backgrounds/paper-parchment.webp"),
        # Split Icons
        ("E:/项目/CET46/assets/ui/icons/split/icon-engine.png", "E:/项目/CET46/miniprogram/assets/icons/engine.webp"),
        ("E:/项目/CET46/assets/ui/icons/split/icon-mastered.png", "E:/项目/CET46/miniprogram/assets/icons/mastered.webp"),
        ("E:/项目/CET46/assets/ui/icons/split/icon-new.png", "E:/项目/CET46/miniprogram/assets/icons/new.webp"),
        ("E:/项目/CET46/assets/ui/icons/split/icon-review-book.png", "E:/项目/CET46/miniprogram/assets/icons/review-book.webp"),
        ("E:/项目/CET46/assets/ui/icons/split/icon-total.png", "E:/项目/CET46/miniprogram/assets/icons/total.webp"),
    ]

    for src, dst in mappings:
        process_image(src, dst)

if __name__ == "__main__":
    main()
