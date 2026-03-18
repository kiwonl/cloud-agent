import re

with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Make sure checklist parsing covers pass/fail/needs_review explicitly
old_logic = r"status: \(item.status\?\.toLowerCase\(\) === 'warning' \|\| item.status\?\.toLowerCase\(\) === 'error'\) \? 'warning' :"
new_logic = """status: (item.status?.toLowerCase() === 'warning' || item.status?.toLowerCase() === 'error' || item.status?.toLowerCase() === 'fail') ? 'warning' :"""

content = content.replace(old_logic, new_logic)

# Same for the flat list mapping part
old_logic_flat = r"status: \(node.status\?\.toLowerCase\(\) === 'warning' \|\| node.status\?\.toLowerCase\(\) === 'error'\) \? 'warning' :"
new_logic_flat = """status: (node.status?.toLowerCase() === 'warning' || node.status?.toLowerCase() === 'error' || node.status?.toLowerCase() === 'fail') ? 'warning' :"""

content = content.replace(old_logic_flat, new_logic_flat)

# Ensure 'pass' translates to 'complete' for UI
content = content.replace("node.status?.toLowerCase() === 'passed'", "node.status?.toLowerCase() === 'passed' || node.status?.toLowerCase() === 'pass'")
content = content.replace("item.status?.toLowerCase() === 'passed'", "item.status?.toLowerCase() === 'passed' || item.status?.toLowerCase() === 'pass'")

with open('frontend/src/App.tsx', 'w') as f:
    f.write(content)
