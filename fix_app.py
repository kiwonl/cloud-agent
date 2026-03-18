import re

with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Remove any lingering references to APPROVE_CHECKLIST
content = content.replace("handleRunAgent(\"APPROVE_CHECKLIST\")", "handleRunAgent(\"APPROVE_ANALYSIS\")")

# Ensure AnalysisPage props don't have broken types (we updated them to VerificationItem earlier)
# And make sure it calls APPROVE_ANALYSIS instead of APPROVE_CHECKLIST (if it was doing so)
content = re.sub(r'onConfirm=\{\(\) => handleRunAgent\("APPROVE_CHECKLIST"\)\}', r'onConfirm={() => handleRunAgent("APPROVE_ANALYSIS")}', content)

with open('frontend/src/App.tsx', 'w') as f:
    f.write(content)
