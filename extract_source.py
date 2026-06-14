import json
import os

map_paths = [
    r'C:\Users\DELL\.gemini\antigravity-ide\scratch\CampusNest\frontend\.next\server\chunks\ssr\app_dashboard_student_page_tsx_1bqejg3._.js.map',
    r'C:\Users\DELL\.gemini\antigravity-ide\scratch\CampusNest\frontend\.next\dev\static\chunks\_1jmo9ie._.js.map',
    r'C:\Users\DELL\.gemini\antigravity-ide\scratch\CampusNest\frontend\.next\dev\static\chunks\_0gs6w5x._.js.map'
]

for path in map_paths:
    if os.path.exists(path):
        print('Checking map file:', path)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                sources = data.get('sources', [])
                contents = data.get('sourcesContent', [])
                for src, content in zip(sources, contents):
                    if 'student/page.tsx' in src or 'student\\page.tsx' in src or src.endswith('page.tsx'):
                        print(f'Found file in map: {src}')
                        print(f'Content length: {len(content)}')
                        # Save it
                        out_path = 'extracted_student_page.tsx'
                        with open(out_path, 'w', encoding='utf-8') as out:
                            out.write(content)
                        print(f'Saved original code to {out_path}!')
                        # We only need one
                        break
        except Exception as e:
            print('Error:', e)
