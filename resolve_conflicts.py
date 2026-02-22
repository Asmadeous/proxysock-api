import os
import re

def resolve_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        return

    if '<<<<<<< HEAD' not in content:
        return

    # Non-greedy match for HEAD content, ignore the incoming branch content.
    new_content = re.sub(
        r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> [^\n]*\n',
        r'\1\n',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w') as f:
        f.write(new_content)
    print(f"Resolved {filepath}")

count = 0
for root, dirs, files in os.walk('client/src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.css', '.d.ts', '.tsx')):
            filepath = os.path.join(root, file)
            resolve_file(filepath)
            count += 1
