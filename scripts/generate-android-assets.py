#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw

def generate_assets():
    logo_path = 'assets/vocabflow-logo.png'
    if not os.path.exists(logo_path):
        logo_path = 'assets/vocabflow-logo-256.png'
    
    src_logo = Image.open(logo_path).convert('RGBA')
    res_dir = 'apps/student/android/app/src/main/res'
    
    # 1. Launcher icon dimensions
    # Format: (folder, icon_size, fg_size)
    densities = [
        ('mipmap-mdpi', 48, 108),
        ('mipmap-hdpi', 72, 162),
        ('mipmap-xhdpi', 96, 216),
        ('mipmap-xxhdpi', 144, 324),
        ('mipmap-xxxhdpi', 192, 432),
    ]

    bg_color = (9, 13, 22, 255) # #090D16 VocabFlow brand dark navy

    for folder, icon_size, fg_size in densities:
        out_folder = os.path.join(res_dir, folder)
        os.makedirs(out_folder, exist_ok=True)

        # A. Adaptive Foreground (fg_size x fg_size, logo in center ~65% safe zone)
        fg_img = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        target_logo_size = int(fg_size * 0.64)
        scaled_logo = src_logo.resize((target_logo_size, target_logo_size), Image.Resampling.LANCZOS)
        offset = (fg_size - target_logo_size) // 2
        fg_img.paste(scaled_logo, (offset, offset), scaled_logo)
        fg_path = os.path.join(out_folder, 'ic_launcher_foreground.png')
        fg_img.save(fg_path, 'PNG')
        print(f"Generated: {fg_path}")

        # B. Legacy ic_launcher.png (icon_size x icon_size, with rounded background)
        legacy_icon = Image.new('RGBA', (icon_size, icon_size), bg_color)
        target_legacy_logo = int(icon_size * 0.78)
        scaled_legacy = src_logo.resize((target_legacy_logo, target_legacy_logo), Image.Resampling.LANCZOS)
        l_offset = (icon_size - target_legacy_logo) // 2
        legacy_icon.paste(scaled_legacy, (l_offset, l_offset), scaled_legacy)

        # Apply squircle mask for standard ic_launcher
        mask = Image.new('L', (icon_size, icon_size), 0)
        draw = ImageDraw.Draw(mask)
        corner_radius = int(icon_size * 0.22)
        draw.rounded_rectangle([(0, 0), (icon_size - 1, icon_size - 1)], radius=corner_radius, fill=255)
        legacy_icon.putalpha(mask)
        
        legacy_path = os.path.join(out_folder, 'ic_launcher.png')
        legacy_icon.save(legacy_path, 'PNG')
        print(f"Generated: {legacy_path}")

        # C. Legacy ic_launcher_round.png (circular mask)
        round_icon = Image.new('RGBA', (icon_size, icon_size), bg_color)
        round_icon.paste(scaled_legacy, (l_offset, l_offset), scaled_legacy)
        round_mask = Image.new('L', (icon_size, icon_size), 0)
        round_draw = ImageDraw.Draw(round_mask)
        round_draw.ellipse([(0, 0), (icon_size - 1, icon_size - 1)], fill=255)
        round_icon.putalpha(round_mask)
        
        round_path = os.path.join(out_folder, 'ic_launcher_round.png')
        round_icon.save(round_path, 'PNG')
        print(f"Generated: {round_path}")

    # 2. Update ic_launcher_background.xml
    bg_xml_path = os.path.join(res_dir, 'values', 'ic_launcher_background.xml')
    with open(bg_xml_path, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#090D16</color>\n</resources>\n')
    print(f"Updated: {bg_xml_path}")

    # 3. Remove buggy vector bugdroid in drawable-v24 so Android uses the high-res ic_launcher_foreground.png
    bugdroid_path = os.path.join(res_dir, 'drawable-v24', 'ic_launcher_foreground.xml')
    if os.path.exists(bugdroid_path):
        os.remove(bugdroid_path)
        print(f"Removed bugdroid vector: {bugdroid_path}")

    # 4. Splash Screens
    splash_targets = [
        ('drawable', (480, 320)),
        ('drawable-land-mdpi', (480, 320)),
        ('drawable-land-hdpi', (800, 480)),
        ('drawable-land-xhdpi', (1280, 720)),
        ('drawable-land-xxhdpi', (1600, 960)),
        ('drawable-land-xxxhdpi', (1920, 1280)),
        ('drawable-port-mdpi', (320, 480)),
        ('drawable-port-hdpi', (480, 800)),
        ('drawable-port-xhdpi', (720, 1280)),
        ('drawable-port-xxhdpi', (960, 1600)),
        ('drawable-port-xxxhdpi', (1280, 1920)),
    ]

    for folder, (width, height) in splash_targets:
        out_folder = os.path.join(res_dir, folder)
        os.makedirs(out_folder, exist_ok=True)
        splash_img = Image.new('RGBA', (width, height), bg_color)
        
        # Center logo: ~25% of the shortest side
        min_dim = min(width, height)
        logo_splash_size = int(min_dim * 0.35)
        scaled_splash_logo = src_logo.resize((logo_splash_size, logo_splash_size), Image.Resampling.LANCZOS)
        
        sp_x = (width - logo_splash_size) // 2
        sp_y = (height - logo_splash_size) // 2
        splash_img.paste(scaled_splash_logo, (sp_x, sp_y), scaled_splash_logo)
        
        splash_path = os.path.join(out_folder, 'splash.png')
        splash_img.save(splash_path, 'PNG')
        print(f"Generated splash: {splash_path} ({width}x{height})")

    # 5. Also ensure apps/student/public/vocabflow-logo-64.png is high-res RGBA
    student_64 = src_logo.resize((64, 64), Image.Resampling.LANCZOS)
    student_64.save('apps/student/public/vocabflow-logo-64.png', 'PNG')
    print("Updated apps/student/public/vocabflow-logo-64.png (RGBA)")

if __name__ == '__main__':
    generate_assets()
