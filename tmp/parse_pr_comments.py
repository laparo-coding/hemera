import json

INPUT_FILE = "/Users/Andreas/Library/Application Support/Code/User/workspaceStorage/d2b6d8cbc92e4d3ccb125ffca764f428/GitHub.copilot-chat/chat-session-resources/266b143a-9f30-414a-8d1c-9197ac107934/toolu_bdrk_01DHwpRzAsAq33cccvA2dvJF__vscode-1771443235467/content.json"

with open(INPUT_FILE, "r") as f:
    data = json.load(f)

review_threads = data.get("reviewThreads", [])
total = data.get("totalCount", len(review_threads))

print("Total threads:", total)
print("Loaded threads:", len(review_threads))
print()

sep = "=" * 90

# Print ALL threads
print(sep)
print("ALL THREADS")
print(sep)

for i, t in enumerate(review_threads):
    tid = t.get("ID", "")
    resolved = t.get("IsResolved", False)
    outdated = t.get("IsOutdated", False)
    collapsed = t.get("IsCollapsed", False)
    nodes = t.get("Comments", {}).get("Nodes", [])
    root = nodes[0] if nodes else None

    status_str = "RESOLVED" if resolved else "UNRESOLVED"

    print()
    print(sep)
    idx = i + 1
    print("Thread " + str(idx) + " (ID: " + tid + ")")
    print("  Status: " + status_str + " | Outdated: " + str(outdated) + " | Collapsed: " + str(collapsed))

    if root:
        author = root.get("Author", {}).get("Login", "unknown")
        path = root.get("Path", "")
        line = root.get("Line")
        orig_line = root.get("OriginalLine")
        created = root.get("CreatedAt", "")
        body = root.get("Body", "")[:400]
        print("  Author: " + author)
        print("  File: " + str(path))
        print("  Line: " + str(line) + " | OrigLine: " + str(orig_line))
        print("  Created: " + created)
        print("  Body: " + body[:300])

    if len(nodes) > 1:
        print("  --- Replies (" + str(len(nodes) - 1) + ") ---")
        for r in nodes[1:]:
            ra = r.get("Author", {}).get("Login", "unknown")
            rd = r.get("CreatedAt", "")
            rb = r.get("Body", "")[:300]
            print("    [" + ra + "] @ " + rd + ": " + rb[:250])
    else:
        print("  --- NO REPLIES ---")

# Focus: UNRESOLVED threads only
print()
print()
print(sep)
print("UNRESOLVED THREADS ONLY")
print(sep)

for i, t in enumerate(review_threads):
    resolved = t.get("IsResolved", False)
    if resolved:
        continue

    tid = t.get("ID", "")
    outdated = t.get("IsOutdated", False)
    nodes = t.get("Comments", {}).get("Nodes", [])
    root = nodes[0] if nodes else None
    idx = i + 1

    print()
    print("--- UNRESOLVED Thread " + str(idx) + " (ID: " + tid + ") ---")
    print("  Outdated: " + str(outdated))
    if root:
        author = root.get("Author", {}).get("Login", "unknown")
        path = root.get("Path", "")
        line = root.get("Line")
        orig_line = root.get("OriginalLine")
        created = root.get("CreatedAt", "")
        body = root.get("Body", "")[:500]
        print("  Author: " + author)
        print("  File: " + str(path))
        print("  Line: " + str(line) + " | OrigLine: " + str(orig_line))
        print("  Created: " + created)
        print("  Body: " + body[:400])
    if len(nodes) > 1:
        print("  Replies:")
        for r in nodes[1:]:
            ra = r.get("Author", {}).get("Login", "unknown")
            rd = r.get("CreatedAt", "")
            rb = r.get("Body", "")[:300]
            print("    [" + ra + "] @ " + rd + ": " + rb[:250])

# Check for new comments after 2026-02-18T22:00
print()
print()
print(sep)
print("THREADS WITH COMMENTS AFTER 2026-02-18T22:00")
print(sep)

for i, t in enumerate(review_threads):
    tid = t.get("ID", "")
    nodes = t.get("Comments", {}).get("Nodes", [])
    late_comments = []
    for n in nodes:
        cat = n.get("CreatedAt", "")
        if cat > "2026-02-18T22:00":
            late_comments.append(n)
    if late_comments:
        root = nodes[0] if nodes else None
        path = root.get("Path", "") if root else ""
        print()
        idx = i + 1
        print("Thread " + str(idx) + " (" + tid + ") | File: " + str(path))
        print("  IsResolved: " + str(t.get("IsResolved", False)))
        for lc in late_comments:
            la = lc.get("Author", {}).get("Login", "unknown")
            ld = lc.get("CreatedAt", "")
            lb = lc.get("Body", "")[:300]
            print("  Late comment [" + la + "] @ " + ld + ": " + lb[:250])
