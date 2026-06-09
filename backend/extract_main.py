path = r"c:\Users\Keshav suthar\Downloads\CT Analysis Sample - AI-Powered Radiology Report ｜ ReadYourLab (6_9_2026 7：42：22 PM).html"

with open(path, "r", encoding="utf-8") as f:
    html = f.read()

# Let's search for the `<main>` element or container elements inside body
main_start = html.lower().find("<main")
if main_start != -1:
    print(f"Main found at index {main_start}")
    print(html[main_start:main_start+15000])
    
    with open("clean_main.html", "w", encoding="utf-8") as out:
        out.write(html[main_start:main_start+150000])
    print("\nSaved clean main to clean_main.html")
else:
    print("Main not found. Let's list some headers or class names.")
