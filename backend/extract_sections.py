import re

with open("clean_main.html", "r", encoding="utf-8") as f:
    html = f.read()

# Let's search for lines with class= or id= to see the outline of HTML components
lines = html.splitlines()
print("HTML TAG OUTLINE:")
outline = []
for line in lines:
    # Match headers, sections, divs with classes
    if re.search(r"<(main|section|div|h1|h2|h3|h4|figure|button|nav|ul|ol|li|p)\b", line, re.IGNORECASE):
        # Clean line to just the tag and its class for brief display
        line_clean = re.sub(r"\s+", " ", line.strip())
        # Truncate if too long
        if len(line_clean) > 120:
            line_clean = line_clean[:120] + "..."
        outline.append(line_clean)

# Print first 100 outline items
for item in outline[:100]:
    print(item)
