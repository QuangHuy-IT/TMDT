import re
content = open(r'D:\TMDT\FrontEnd\src\pages\admin\AdminProducts.jsx', 'r', encoding='utf-8').read()
opens = content.count('<div')
closes = content.count('</div>')
print(f'Opens: {opens}, Closes: {closes}, Diff: {opens - closes}')

# Also check for the ProductFormPage return - find line with return (
in_func = False
brace_count = 0
start_line = None
for i, line in enumerate(content.split('\n'), 1):
    if 'return (' in line and 'div' in content.split('\n')[i]:
        print(f"Possible return at line {i}: {line.strip()[:60]}")
    if 'const ProductFormPage' in line:
        in_func = True
    if in_func and 'const AdminProducts' in line:
        break
