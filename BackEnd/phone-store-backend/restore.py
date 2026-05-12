import sys

log_path = r'C:\Users\ACER\.gemini\antigravity\brain\00dd112d-5a75-440f-bd5b-9204e46473f7\.system_generated\logs\overview.txt'
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "File Path:" in line and "ProductAdminService.java" in line:
        start_idx = i
        break

if start_idx == -1:
    print("Not found target")
    sys.exit(1)

end_idx = -1
for i in range(start_idx, len(lines)):
    if "The above content shows the entire, complete file contents" in lines[i]:
        end_idx = i
        break

code_lines = []
for i in range(start_idx, end_idx):
    line = lines[i]
    if ": " in line:
        parts = line.split(": ", 1)
        if parts[0].strip().isdigit():
            code_lines.append(parts[1].rstrip('\n'))

with open(r'd:\WEB\TMDT\TMDT\BackEnd\phone-store-backend\src\main\java\com\tmdt\phone_store_backend\service\ProductAdminService.java', 'w', encoding='utf-8') as f:
    f.write('\n'.join(code_lines))
print("Restored {} lines".format(len(code_lines)))
