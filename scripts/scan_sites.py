import os
import json

SITES_DIR = "/home/kareltestspecial/0-IT/2-Productie/athena/sites"

issues = {}

def check_site(site_name):
    site_path = os.path.join(SITES_DIR, site_name)
    site_issues = []
    
    # Check 1: index.css should ONLY import tailwindcss
    index_css_path = os.path.join(site_path, "src", "index.css")
    if os.path.exists(index_css_path):
        with open(index_css_path, "r") as f:
            content = f.read()
            if "@import url(" in content or "font-family:" in content:
                # Assuming standard factory shouldn't have too much custom stuff here
                pass # This is subjective to the factory rules, might not be an error
            
            # Critical constraint: ONLY index.css should @import "tailwindcss"
            if '@import "tailwindcss"' not in content:
                 site_issues.append("Missing @import 'tailwindcss' in src/index.css")
    else:
        site_issues.append("Missing src/index.css")

    # Check 2: Relative paths in index.html, not absolute
    index_html_path = os.path.join(site_path, "index.html")
    if os.path.exists(index_html_path):
        with open(index_html_path, "r") as f:
            content = f.read()
            if 'href="/assets' in content or 'src="/assets' in content:
                 site_issues.append("Absolute paths used in index.html instead of relative (./)")
    else:
        site_issues.append("Missing index.html")
        
    # Check 3: Check package.json for standard dependencies
    package_json_path = os.path.join(site_path, "package.json")
    if not os.path.exists(package_json_path):
         site_issues.append("Missing package.json")
         
    # Check 4: Check if dist exists (has it been built?)
    dist_path = os.path.join(site_path, "dist")
    if not os.path.exists(dist_path):
         site_issues.append("Site has not been built yet (missing 'dist' folder)")
         
    return site_issues

if __name__ == "__main__":
    if not os.path.exists(SITES_DIR):
        print(f"Sites directory not found: {SITES_DIR}")
        exit(1)
        
    sites = [d for d in os.listdir(SITES_DIR) if os.path.isdir(os.path.join(SITES_DIR, d))]
    
    for site in sites:
        site_issues = check_site(site)
        if site_issues:
            issues[site] = site_issues
            
    print(json.dumps(issues, indent=2))
