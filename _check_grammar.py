import json, re

d = json.load(open('src/data/guides.json'))

for i, g in enumerate(d):
    content = g.get('content', '') + (g.get('summary') or '')
    # Check for 'this mission tasks you with go' type issues
    issues = re.findall(r'tasks you with (?:go|find|make|head|travel|pull|check|search)', content)
    if issues:
        print(f'Guide {i} ({g["title"]}): awkward phrase: {issues}')
    # Check for 'centered on heading' type issues
    issues2 = re.findall(r'centered on (?:heading|finding|going)', content)
    if issues2:
        print(f'Guide {i} ({g["title"]}): awkward centered: {issues2}')
    # Check 'you have to engage with' or other odd combos
    issues3 = re.findall(r"you have to engage with|must go through the|must find the|must make", content, re.IGNORECASE)
    if issues3:
        pass  # these are fine actually

print("Done checking")
