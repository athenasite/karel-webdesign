import os
import re

def update_vite_config(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the server block
    server_match = re.search(r'server\s*:\s*\{', content)
    
    if server_match:
        # Find the end of the server block
        start_index = server_match.end()
        depth = 1
        end_index = -1
        for i in range(start_index, len(content)):
            if content[i] == '{':
                depth += 1
            elif content[i] == '}':
                depth -= 1
                if depth == 0:
                    end_index = i
                    break
        
        if end_index == -1:
            print(f"Could not find end of server block in {file_path}")
            return

        server_content = content[start_index:end_index]
        
        # 1. Host: true
        if 'host:' not in server_content:
            server_content = "\n      host: true," + server_content
        else:
            server_content = re.sub(r'host\s*:\s*[^,}\n]+', 'host: true', server_content)

        # 2. Port: dynamic
        if 'parseInt(process.env.PORT)' not in server_content:
            port_match = re.search(r'port\s*:\s*(\d+)', server_content)
            current_port = port_match.group(1) if port_match else "5100"
            new_port_str = f'port: parseInt(process.env.PORT) || {current_port}'
            
            if port_match:
                server_content = re.sub(r'port\s*:\s*\d+', new_port_str, server_content)
            else:
                server_content = f"\n      {new_port_str}," + server_content

        # 3. allowedHosts: true
        if 'allowedHosts:' not in server_content:
            port_line_match = re.search(r'port\s*:[^,}\n]+', server_content)
            if port_line_match:
                port_line = port_line_match.group(0)
                server_content = server_content.replace(port_line, f"{port_line},\n      allowedHosts: true")
            else:
                server_content = "\n      allowedHosts: true," + server_content
        else:
            server_content = re.sub(r'allowedHosts\s*:\s*[^,}\n]+', 'allowedHosts: true', server_content)

        server_content = server_content.replace(',,', ',')
        new_content = content[:start_index] + server_content + content[end_index:]
        
    else:
        # Server block missing. Try to insert it.
        # Look for the beginning of the return object or the defineConfig object.
        # We'll look for 'plugins:' which is almost always present.
        plugins_match = re.search(r'plugins\s*:\s*\[', content)
        if plugins_match:
            # Insert server block BEFORE plugins or AFTER the closing ] of plugins.
            # Let's try to find the closing ] of plugins.
            start_index = plugins_match.end()
            depth = 1
            plugins_end_index = -1
            for i in range(start_index, len(content)):
                if content[i] == '[':
                    depth += 1
                elif content[i] == ']':
                    depth -= 1
                    if depth == 0:
                        plugins_end_index = i
                        break
            
            if plugins_end_index != -1:
                # Check for comma after ]
                next_comma = content.find(',', plugins_end_index)
                if next_comma != -1 and next_comma < plugins_end_index + 5:
                    insertion_point = next_comma + 1
                else:
                    insertion_point = plugins_end_index + 1
                
                server_block = "\n    server: {\n      host: true,\n      port: parseInt(process.env.PORT) || 5100,\n      allowedHosts: true\n    },"
                new_content = content[:insertion_point] + server_block + content[insertion_point:]
            else:
                print(f"Could not find end of plugins block in {file_path}")
                return
        else:
            # If no plugins, try to find the last { in defineConfig
            define_config_match = re.search(r'defineConfig\s*\(', content)
            if define_config_match:
                # Find the first { after defineConfig
                first_brace = content.find('{', define_config_match.end())
                if first_brace != -1:
                    insertion_point = first_brace + 1
                    server_block = "\n    server: {\n      host: true,\n      port: parseInt(process.env.PORT) || 5100,\n      allowedHosts: true\n    },"
                    new_content = content[:insertion_point] + server_block + content[insertion_point:]
                else:
                    print(f"Could not find opening brace in defineConfig for {file_path}")
                    return
            else:
                print(f"Could not find defineConfig in {file_path}")
                return

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {file_path}")

sites_dir = '/home/kareltestspecial/0-IT/3-DEV/myAgent/athena-y/sites'
for root, dirs, files in os.walk(sites_dir):
    if 'vite.config.js' in files:
        update_vite_config(os.path.join(root, 'vite.config.js'))
