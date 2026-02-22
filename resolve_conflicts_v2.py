import os

def resolve_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception:
        return

    new_lines = []
    state = 'normal' # normal, head, incoming
    changed = False
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            state = 'head'
            changed = True
        elif line.startswith('======='):
            state = 'incoming'
        elif line.startswith('>>>>>>>'):
            state = 'normal'
        else:
            if state == 'normal' or state == 'head':
                new_lines.append(line)

    if changed:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print(f"Resolved {filepath}")
        except Exception as e:
            print(f"Failed to write {filepath}: {e}")

count = 0
for root, dirs, files in os.walk('client/src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.css', '.d.ts', '.js', '.jsx')):
            filepath = os.path.join(root, file)
            resolve_file(filepath)
            count += 1
