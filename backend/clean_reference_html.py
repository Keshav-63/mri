import re

path = r"c:\Users\Keshav suthar\Downloads\CT Analysis Sample - AI-Powered Radiology Report ｜ ReadYourLab (6_9_2026 7：42：22 PM).html"

with open(path, "r", encoding="utf-8") as f:
    html = f.read()

print(f"Original length: {len(html)}")

# Strip base64 image data URLs (e.g., data:image/...;base64,...)
# Replace them with a short placeholder like "data:image/png;base64,PLACEholder"
clean_html = re.sub(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', 'data:image/png;base64,PLACEHOLDER', html)

# Also strip large inline style variables (--sf-img-...)
clean_html = re.sub(r'--sf-img-\d+:\s*url\([^)]+\)', '--sf-img: url("data:image/png;base64,PLACEHOLDER")', clean_html)

print(f"Cleaned length: {len(clean_html)}")

# Write to a clean file
with open("readable_reference.html", "w", encoding="utf-8") as f:
    f.write(clean_html)

print("Saved clean version to readable_reference.html")

# Let's count how many lines it has
lines = clean_html.splitlines()
print(f"Total lines in cleaned file: {len(lines)}")
