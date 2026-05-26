content = open(r'D:\TMDT\FrontEnd\src\pages\admin\AdminProducts.jsx', 'r', encoding='utf-8').read()
lines = content.split('\n')

in_pfp = False
running = 0
for i, line in enumerate(lines, 1):
    if 'const ProductFormPage' in line:
        in_pfp = True
    if in_pfp and 'const AdminProducts' in line:
        break
    opens = line.count('<div') - line.count('</div>')
    if opens != 0:
        running += opens
        if running > 0:
            print(f"Line {i}: +{opens} -> running={running} | {line.strip()[:80]}")
        elif running <= 0:
            print(f"Line {i}: {opens} -> running={running} | {line.strip()[:80]}")
