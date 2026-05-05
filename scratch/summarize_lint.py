import json
import os

lint_file = 'gorentals-frontend/lint_errors.json'
if os.path.exists(lint_file):
    with open(lint_file, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        for item in data:
            if item['errorCount'] > 0:
                print(f"{item['filePath']}: {item['errorCount']} errors")
                for msg in item['messages']:
                    if msg['severity'] == 2:
                        print(f"  Line {msg['line']}: {msg['ruleId']} - {msg['message']}")
else:
    print("Lint file not found")
