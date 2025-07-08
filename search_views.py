#!/usr/bin/env python3
import os
import re
from pathlib import Path

def find_text_in_views(directory):
    """Find instances where text is directly inside View components"""
    issues = []
    
    # Pattern to match View components with content
    view_pattern = re.compile(r'<View[^>]*>(.*?)</View>', re.DOTALL)
    # Pattern to check if content has non-whitespace text outside of JSX elements and expressions
    text_pattern = re.compile(r'^[^{<]*[a-zA-Z0-9]+[^}<]*$|[^{<]+[a-zA-Z0-9]+[^}<]+')
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and other build directories
        if 'node_modules' in root or '.git' in root or 'build' in root:
            continue
            
        for file in files:
            if file.endswith(('.tsx', '.jsx', '.ts', '.js')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Find all View components
                    for match in view_pattern.finditer(content):
                        view_content = match.group(1).strip()
                        
                        # Skip empty views or self-closing
                        if not view_content:
                            continue
                            
                        # Check if the content looks like plain text
                        # Remove JSX expressions {...} and elements <...>
                        cleaned = re.sub(r'\{[^}]*\}', '', view_content)
                        cleaned = re.sub(r'<[^>]*>', '', cleaned)
                        cleaned = cleaned.strip()
                        
                        # If there's still text after cleaning, it might be an issue
                        if cleaned and re.search(r'[a-zA-Z0-9]+', cleaned):
                            # Get line number
                            line_num = content[:match.start()].count('\n') + 1
                            issues.append({
                                'file': filepath,
                                'line': line_num,
                                'content': match.group(0)[:100] + '...' if len(match.group(0)) > 100 else match.group(0)
                            })
                            
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")
    
    return issues

# Search in the src directory
src_dir = '/home/runner/workspace/clarity-tech-app/src'
issues = find_text_in_views(src_dir)

if issues:
    print(f"Found {len(issues)} potential issues where text is directly inside View components:\n")
    for issue in issues:
        print(f"File: {issue['file']}")
        print(f"Line: {issue['line']}")
        print(f"Content: {issue['content']}")
        print("-" * 80)
else:
    print("No instances found where text is directly inside View components.")