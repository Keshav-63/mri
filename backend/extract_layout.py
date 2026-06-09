path = r"c:\Users\Keshav suthar\Downloads\CT Analysis Sample - AI-Powered Radiology Report ｜ ReadYourLab (6_9_2026 7：42：22 PM).html"

with open(path, "r", encoding="utf-8") as f:
    html = f.read()

print(f"Total length: {len(html)} characters")

# Find where body starts
body_idx = html.lower().find("<body")
if body_idx != -1:
    print(f"Body found at index {body_idx}")
    print(html[body_idx:body_idx+4000])
else:
    print("Body not found with index search.")
    # Let's search for <div or any main element
    print("First 2000 chars of file:")
    print(html[:2000])
