from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]
source = PROJECT_ROOT / 'gentsconcerts-app' / 'assets' / 'images' / 'logo.png'
target = PROJECT_ROOT / 'gentsconcerts-app' / 'assets' / 'images' / 'app-icon.png'

with Image.open(source) as opened:
    logo = opened.convert('RGBA')

canvas_size = 1024
padding = 112
available_width = canvas_size - (padding * 2)
available_height = canvas_size - (padding * 2)
scale = min(available_width / logo.width, available_height / logo.height)
resized = logo.resize((round(logo.width * scale), round(logo.height * scale)), Image.Resampling.LANCZOS)

canvas = Image.new('RGBA', (canvas_size, canvas_size), '#06132E')
x = (canvas_size - resized.width) // 2
y = (canvas_size - resized.height) // 2
canvas.alpha_composite(resized, (x, y))
canvas.convert('RGB').save(target, 'PNG', optimize=True)
print(target)
