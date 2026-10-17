#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw, ImageFont

# Define paths
PUBLIC_DIR = "public"
RES_DIR = "android/app/src/main/res"

SVG_CONTENT = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a62f4"/>
      <stop offset="60%" stop-color="#0050df"/>
      <stop offset="100%" stop-color="#003dbd"/>
    </linearGradient>

    <!-- Nest Layer Gradients -->
    <linearGradient id="nestDeep" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0b40a8"/>
      <stop offset="100%" stop-color="#042670"/>
    </linearGradient>
    <linearGradient id="nestMid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#007dfa"/>
      <stop offset="100%" stop-color="#005cd6"/>
    </linearGradient>
    <linearGradient id="nestLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <!-- Leaf Gradient -->
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34f5d8"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>

    <!-- Red PDF Badge Gradient -->
    <linearGradient id="pdfBadge" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff334b"/>
      <stop offset="100%" stop-color="#dc143c"/>
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="nestGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#001850" flood-opacity="0.35"/>
    </filter>
    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#022166" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background App Squircle -->
  <rect x="0" y="0" width="512" height="512" rx="118" fill="url(#bgGrad)"/>

  <!-- Subtle Inner Border Highlight -->
  <rect x="2" y="2" width="508" height="508" rx="116" fill="none" stroke="#60a5fa" stroke-width="2" stroke-opacity="0.3"/>

  <!-- Outer Cover / Wings of the Book (Dark Blue Wings) -->
  <g filter="url(#nestGlow)">
    <!-- Left outer cover flap -->
    <path d="M142,106 C140,88 178,82 220,110 L216,236 C182,216 150,214 142,216 Z" fill="#1d4ed8"/>
    <!-- Right outer cover flap -->
    <path d="M370,106 C372,88 334,82 292,110 L296,236 C330,216 362,214 370,216 Z" fill="#1e40af"/>

    <!-- Left Book Page (White with subtle fold curve) -->
    <path d="M158,110 C156,96 186,88 238,112 C246,116 252,122 254,130 L248,244 C244,236 238,232 230,228 C188,206 164,210 158,212 Z" fill="#f8fafc"/>
    <path d="M236,112 C244,116 250,122 252,128 L246,242 C242,236 236,232 228,228 C206,216 188,214 176,216 L180,108 C198,102 218,106 236,112 Z" fill="#ffffff"/>

    <!-- Right Book Page (White with soft curve) -->
    <path d="M354,110 C356,96 326,88 274,112 C266,116 260,122 258,130 L264,244 C268,236 274,232 282,228 C324,206 348,210 354,212 Z" fill="#f1f5f9"/>
    <path d="M276,112 C268,116 262,122 260,128 L266,242 C270,236 276,232 284,228 C306,216 324,214 336,216 L332,108 C314,102 294,106 276,112 Z" fill="#ffffff"/>

    <!-- Center Book Spine Crease -->
    <path d="M256,126 L256,244" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
  </g>

  <!-- PDF Document Icon (Nestled on top of book) -->
  <g filter="url(#badgeShadow)">
    <!-- Red Document Base with folded corner -->
    <path d="M208,124 L276,124 C282,124 288,128 294,134 L308,148 C312,152 314,158 314,164 L314,216 C314,226 306,234 296,234 L226,234 C216,234 208,226 208,216 Z" fill="url(#pdfBadge)"/>

    <!-- Top Right Corner Fold Flap -->
    <path d="M276,124 L276,146 C276,152 282,158 288,158 L314,158 Z" fill="#b91c1c" opacity="0.85"/>
    <path d="M276,124 L314,158 L288,158 C282,158 276,152 276,146 Z" fill="#fca5a5" opacity="0.6"/>

    <!-- "PDF" Text on Badge -->
    <text x="259" y="198" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="33" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">PDF</text>
  </g>

  <!-- Left Green Leaf -->
  <g filter="url(#nestGlow)">
    <path d="M128,162 C106,170 82,204 100,234 C120,240 148,222 152,194 C154,180 144,166 128,162 Z" fill="url(#leafGrad)"/>
    <path d="M100,234 C116,216 130,198 142,176" stroke="#0f766e" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
  </g>

  <!-- Right Green Leaf -->
  <g filter="url(#nestGlow)">
    <path d="M384,162 C406,170 430,204 412,234 C392,240 364,222 360,194 C358,180 368,166 384,162 Z" fill="url(#leafGrad)"/>
    <path d="M412,234 C396,216 382,198 370,176" stroke="#0f766e" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
  </g>

  <!-- Layered Nest Bowls (Blue Swoops) -->
  <g filter="url(#nestGlow)">
    <!-- Base Deep Blue Swoop -->
    <path d="M110,250 C146,334 366,334 402,250 C382,346 130,346 110,250 Z" fill="url(#nestDeep)"/>

    <!-- Lower Mid Blue Layer (Branch Curves) -->
    <path d="M96,220 C120,300 240,332 300,320 C364,308 410,248 418,214 C406,270 354,320 286,326 C214,332 120,296 96,220 Z" fill="#0056cc"/>

    <!-- Main Front Twig Twists (Layer 1) -->
    <path d="M84,186 C98,248 184,310 278,298 C354,288 412,232 428,188 C416,244 346,298 266,306 C176,314 96,248 84,186 Z" fill="url(#nestMid)"/>

    <!-- Main Front Twig Twists (Layer 2 Highlight) -->
    <path d="M102,234 C140,286 230,304 316,288 C380,276 414,236 422,216 C406,256 360,288 296,296 C216,306 138,284 102,234 Z" fill="#0284c7"/>

    <!-- Front Cyan Accent Twigs -->
    <path d="M136,258 C180,290 274,300 348,278 C324,292 254,300 196,294 C162,290 144,278 136,258 Z" fill="url(#nestLight)"/>
    <path d="M162,284 C210,308 296,308 344,286 C314,300 244,304 192,298 C176,296 166,292 162,284 Z" fill="#38bdf8" opacity="0.8"/>
  </g>

  <!-- "PageNest" Typography -->
  <g filter="url(#nestGlow)">
    <text x="256" y="434" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Montserrat', 'Inter', sans-serif" font-weight="900" font-size="70" letter-spacing="-0.5">
      <tspan fill="#ffffff">Page</tspan><tspan fill="#22d3ee">Nest</tspan>
    </text>
  </g>
</svg>
'''

# Official Android Adaptive Icon Vector Drawables
IC_LAUNCHER_BACKGROUND_XML = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0963F6"
        android:pathData="M0,0h108v108h-108z" />
    <!-- Gradient accent circle for depth -->
    <path
        android:fillColor="#0047C6"
        android:pathData="M0,54 C0,84 24,108 54,108 C84,108 108,84 108,54 L108,108 L0,108 Z" />
</vector>
'''

IC_LAUNCHER_FOREGROUND_XML = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group
        android:scaleX="0.75"
        android:scaleY="0.75"
        android:pivotX="54"
        android:pivotY="54">

        <!-- Outer Book Backing / Wings -->
        <path
            android:fillColor="#1D4ED8"
            android:pathData="M30,22 C29,18 37,17 46,23 L45,50 C38,46 31,45 30,46 Z" />
        <path
            android:fillColor="#1E40AF"
            android:pathData="M78,22 C79,18 71,17 62,23 L63,50 C70,46 77,45 78,46 Z" />

        <!-- Left Book Page -->
        <path
            android:fillColor="#FFFFFF"
            android:pathData="M34,23 C33,20 40,18 50,23 C52,24 53,26 54,28 L52,52 C51,50 50,49 48,48 C39,43 35,44 34,45 Z" />

        <!-- Right Book Page -->
        <path
            android:fillColor="#F8FAFC"
            android:pathData="M74,23 C75,20 68,18 58,23 C56,24 55,26 54,28 L56,52 C57,50 58,49 60,48 C69,43 73,44 74,45 Z" />

        <!-- PDF Document Badge -->
        <path
            android:fillColor="#EF233C"
            android:pathData="M44,26 L58,26 C59,26 61,27 62,28 L65,31 C66,32 66,33 66,35 L66,45 C66,47 64,49 62,49 L48,49 C46,49 44,47 44,45 Z" />
        <!-- Fold triangle -->
        <path
            android:fillColor="#B91C1C"
            android:pathData="M58,26 L58,31 L65,31 Z" />

        <!-- Left Turquoise Leaf -->
        <path
            android:fillColor="#26E5CD"
            android:pathData="M27,34 C22,36 17,43 21,49 C25,50 31,46 32,41 C32,38 30,35 27,34 Z" />

        <!-- Right Turquoise Leaf -->
        <path
            android:fillColor="#26E5CD"
            android:pathData="M81,34 C86,36 91,43 87,49 C83,50 77,46 76,41 C76,38 78,35 81,34 Z" />

        <!-- Nest Bottom Curved Bowl -->
        <path
            android:fillColor="#0B40A8"
            android:pathData="M23,53 C31,70 77,70 85,53 C81,73 27,73 23,53 Z" />
        <!-- Nest Mid Twig Sweep -->
        <path
            android:fillColor="#007DFA"
            android:pathData="M18,40 C21,53 39,66 59,63 C75,61 87,49 90,40 C87,52 73,63 56,65 C37,67 20,53 18,40 Z" />
        <!-- Nest Highlight Sweep -->
        <path
            android:fillColor="#38BDF8"
            android:pathData="M29,55 C38,62 58,64 74,59 C69,62 54,64 42,63 C35,62 31,59 29,55 Z" />

        <!-- "Page" Text -->
        <path
            android:fillColor="#FFFFFF"
            android:pathData="M31,81 L33,81 L33,85 L35,85 C37,85 38,84 38,83 C38,82 37,81 35,81 L31,81 Z M33,83 L33,82 L35,82 C36,82 36,82 36,83 C36,83 36,83 35,83 L33,83 Z" />
    </group>
</vector>
'''

def draw_icon_image(size, is_round=False):
    """Render the PageNest icon using PIL at given dimensions."""
    scale = size / 512.0
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background shape
    if is_round:
        draw.ellipse([0, 0, size - 1, size - 1], fill=(10, 98, 244, 255))
    else:
        # Rounded squircle
        r = int(115 * scale)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(10, 98, 244, 255))

    # Darker blue depth glow on bottom half
    bottom_box = [0, int(size * 0.45), size, size]
    # Draw simple gradient effect
    for y in range(int(size * 0.4), size):
        alpha = int(120 * ((y - size * 0.4) / (size * 0.6)))
        if is_round:
            # clip to circle
            continue
        draw.line([(0, y), (size, y)], fill=(0, 60, 190, alpha))

    # Re-mask with squircle or circle if needed
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    if is_round:
        mask_draw.ellipse([0, 0, size - 1, size - 1], fill=255)
    else:
        mask_draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(115 * scale), fill=255)

    content = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(content)

    # Background squircle inside content
    if is_round:
        cdraw.ellipse([0, 0, size - 1, size - 1], fill=(10, 98, 244, 255))
    else:
        cdraw.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(115 * scale), fill=(10, 98, 244, 255))

    # Outer cover (navy wings)
    cdraw.polygon([
        (int(142 * scale), int(106 * scale)),
        (int(220 * scale), int(110 * scale)),
        (int(216 * scale), int(236 * scale)),
        (int(142 * scale), int(216 * scale))
    ], fill=(29, 78, 216, 255))
    cdraw.polygon([
        (int(370 * scale), int(106 * scale)),
        (int(292 * scale), int(110 * scale)),
        (int(296 * scale), int(236 * scale)),
        (int(370 * scale), int(216 * scale))
    ], fill=(30, 64, 175, 255))

    # Book pages (white)
    cdraw.polygon([
        (int(158 * scale), int(110 * scale)),
        (int(254 * scale), int(128 * scale)),
        (int(248 * scale), int(244 * scale)),
        (int(158 * scale), int(212 * scale))
    ], fill=(255, 255, 255, 255))
    cdraw.polygon([
        (int(354 * scale), int(110 * scale)),
        (int(258 * scale), int(128 * scale)),
        (int(264 * scale), int(244 * scale)),
        (int(354 * scale), int(212 * scale))
    ], fill=(245, 248, 252, 255))

    # PDF Red badge
    badge_poly = [
        (int(208 * scale), int(124 * scale)),
        (int(280 * scale), int(124 * scale)),
        (int(314 * scale), int(158 * scale)),
        (int(314 * scale), int(228 * scale)),
        (int(208 * scale), int(228 * scale))
    ]
    cdraw.rounded_rectangle([
        int(208 * scale), int(124 * scale),
        int(314 * scale), int(230 * scale)
    ], radius=int(16 * scale), fill=(239, 35, 60, 255))

    # Top right corner dog-ear fold
    cdraw.polygon([
        (int(280 * scale), int(124 * scale)),
        (int(280 * scale), int(158 * scale)),
        (int(314 * scale), int(158 * scale))
    ], fill=(185, 28, 28, 255))

    # Leaves (turquoise)
    # Left leaf
    cdraw.ellipse([
        int(88 * scale), int(172 * scale),
        int(148 * scale), int(236 * scale)
    ], fill=(38, 229, 205, 255))
    # Right leaf
    cdraw.ellipse([
        int(364 * scale), int(172 * scale),
        int(424 * scale), int(236 * scale)
    ], fill=(38, 229, 205, 255))

    # Nest bottom curves
    # Deep blue bottom arc
    cdraw.chord([
        int(100 * scale), int(220 * scale),
        int(412 * scale), int(346 * scale)
    ], start=0, end=180, fill=(11, 64, 168, 255))
    # Vibrant blue front swoop
    cdraw.chord([
        int(80 * scale), int(180 * scale),
        int(432 * scale), int(320 * scale)
    ], start=0, end=180, fill=(0, 125, 250, 255))
    # Cyan highlight twig
    cdraw.arc([
        int(120 * scale), int(240 * scale),
        int(392 * scale), int(304 * scale)
    ], start=0, end=180, fill=(56, 189, 248, 255), width=max(2, int(6 * scale)))

    # Try to load font for PDF and PageNest text
    try:
        font_pdf = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(32 * scale))
        font_brand = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(60 * scale))
    except Exception:
        font_pdf = ImageFont.load_default()
        font_brand = ImageFont.load_default()

    # Draw "PDF" in white on the badge
    cdraw.text((int(261 * scale), int(190 * scale)), "PDF", fill=(255, 255, 255, 255), font=font_pdf, anchor="mm")

    # Draw "Page" in white, "Nest" in cyan
    cdraw.text((int(215 * scale), int(420 * scale)), "Page", fill=(255, 255, 255, 255), font=font_brand, anchor="rm")
    cdraw.text((int(215 * scale), int(420 * scale)), "Nest", fill=(34, 211, 238, 255), font=font_brand, anchor="lm")

    # Apply mask
    final_img = Image.composite(content, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask)
    return final_img

def main():
    print("1. Writing SVG files...")
    with open("public/icon.svg", "w", encoding="utf-8") as f:
        f.write(SVG_CONTENT)
    with open("public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(SVG_CONTENT)
    print("   -> public/icon.svg and public/favicon.svg written.")

    print("2. Writing Android Vector Drawables...")
    os.makedirs(f"{RES_DIR}/drawable", exist_ok=True)
    with open(f"{RES_DIR}/drawable/ic_launcher_background.xml", "w", encoding="utf-8") as f:
        f.write(IC_LAUNCHER_BACKGROUND_XML)
    with open(f"{RES_DIR}/drawable/ic_launcher_foreground.xml", "w", encoding="utf-8") as f:
        f.write(IC_LAUNCHER_FOREGROUND_XML)
    with open(f"{RES_DIR}/drawable/ic_pagenest_logo.xml", "w", encoding="utf-8") as f:
        f.write(IC_LAUNCHER_FOREGROUND_XML)
    print("   -> ic_launcher_background.xml and ic_launcher_foreground.xml written.")

    print("3. Generating Android Mipmap PNGs...")
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }

    for folder, dim in densities.items():
        path = os.path.join(RES_DIR, folder)
        os.makedirs(path, exist_ok=True)
        # Regular squircle icon
        img = draw_icon_image(dim, is_round=False)
        img.save(os.path.join(path, "ic_launcher.png"), "PNG")
        # Round icon
        round_img = draw_icon_image(dim, is_round=True)
        round_img.save(os.path.join(path, "ic_launcher_round.png"), "PNG")
        print(f"   -> {folder}: {dim}x{dim} ic_launcher.png and ic_launcher_round.png")

    print("4. Generating High-Res Web / Play Store PNG (512x512)...")
    store_img = draw_icon_image(512, is_round=False)
    store_img.save(f"{RES_DIR}/drawable/ic_launcher_web.png", "PNG")
    store_img.save("public/icon.png", "PNG")
    store_img.save("public/pwa-512x512.png", "PNG")
    print("   -> ic_launcher_web.png and public/icon.png generated.")

    print("All icons successfully generated!")

if __name__ == "__main__":
    main()
