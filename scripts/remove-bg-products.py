"""
Batch background removal for product front images.
Outputs transparent PNGs to public/products/.
"""
from rembg import remove
from PIL import Image
import io, os

SRC = r"C:\Users\migue\OneDrive\Documents\FOODBASE\FB_images\FB_DOWNLOADS\GTIN_PRODUCTS"
DST = r"C:\Users\migue\IdeaProjects\master5\public\products"

PRODUCTS = [
    ("PANDY_CHERRY.jpeg",                                   "pandy-cherry.png"),
    ("PANDY_FUZZY_BOTTLES.jpeg",                            "pandy-fuzzy-bottles.png"),
    ("PANDY_WATERMELON.jpeg",                               "pandy-watermelon.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.14 (2).jpeg",     "pandy-fluffy-clouds.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.14 (4).jpeg",     "pandy-sour-skulls.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.15 (1).jpeg",     "pandy-peach-rings.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.21 (4).jpeg",     "pandy-strawberry-liquorice.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.16.jpeg",         "ahead-gummy-bears.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.16 (2).jpeg",     "ahead-sour-cherries.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.17 (1).jpeg",     "ahead-green-apples.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.17 (3).jpeg",     "ahead-sweet-peaches.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.18 (2).jpeg",     "ahead-cola-bottles.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.19 (3).jpeg",     "ahead-fluffy-hearts.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.18.jpeg",         "bear-fruit-rolls-strawberry.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.19 (1).jpeg",     "fruitfunk-spaghetti-forest-berry.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.22 (1).jpeg",     "fruitfunk-banana-bites.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.23.jpeg",         "fruitfunk-peach-bites.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.23 (2).jpeg",     "fruitfunk-spaghetti-mango.png"),
    ("WhatsApp Image 2026-05-19 at 22.20.14.jpeg",         "fruit-stick-xxl.png"),
]

os.makedirs(DST, exist_ok=True)

for src_name, dst_name in PRODUCTS:
    src_path = os.path.join(SRC, src_name)
    dst_path = os.path.join(DST, dst_name)
    if not os.path.exists(src_path):
        print(f"  MISSING  {src_name}")
        continue
    print(f"  Processing {dst_name} ...", end=" ", flush=True)
    with open(src_path, "rb") as f:
        data = f.read()
    result = remove(data)
    img = Image.open(io.BytesIO(result)).convert("RGBA")
    img.save(dst_path, "PNG")
    print("done")

print("\nAll done.")
