import sys
from PIL import Image

input_image = sys.argv[1]

try:
    img = Image.open(input_image)
    img.resize((192, 192)).save('/Users/adarshsingh/Documents/MessTracker/public/icons/192.png', 'PNG')
    img.resize((512, 512)).save('/Users/adarshsingh/Documents/MessTracker/public/icons/512.png', 'PNG')
    print("Icons generated successfully.")
except Exception as e:
    print(f"Error generating icons: {e}")
