import os
import zipfile
import shutil

root_dir = os.path.dirname(os.path.abspath(__file__))
staging_dir = os.path.join(root_dir, 'hostinger_staging')
zip_path = os.path.join(root_dir, 'safarsathi_hostinger_deploy.zip')

print("Starting clean build for Hostinger zip...")

# Clean previous staging and zip
if os.path.exists(staging_dir):
    shutil.rmtree(staging_dir)
if os.path.exists(zip_path):
    os.remove(zip_path)

os.makedirs(staging_dir, exist_ok=True)
os.makedirs(os.path.join(staging_dir, 'assets'), exist_ok=True)
os.makedirs(os.path.join(staging_dir, 'api'), exist_ok=True)
os.makedirs(os.path.join(staging_dir, 'backend'), exist_ok=True)

# 1. Copy Frontend dist files
shutil.copy2(os.path.join(root_dir, 'frontend', 'dist', 'index.html'), os.path.join(staging_dir, 'index.html'))
assets_src = os.path.join(root_dir, 'frontend', 'dist', 'assets')
assets_dst = os.path.join(staging_dir, 'assets')
for item in os.listdir(assets_src):
    shutil.copy2(os.path.join(assets_src, item), os.path.join(assets_dst, item))

# 2. Copy root control files
shutil.copy2(os.path.join(root_dir, '.htaccess'), os.path.join(staging_dir, '.htaccess'))
shutil.copy2(os.path.join(root_dir, 'index.php'), os.path.join(staging_dir, 'index.php'))

# 3. Copy api delegation
shutil.copy2(os.path.join(root_dir, 'api', 'index.php'), os.path.join(staging_dir, 'api', 'index.php'))
shutil.copy2(os.path.join(root_dir, 'api', '.htaccess'), os.path.join(staging_dir, 'api', '.htaccess'))

# 4. Copy backend
def copy_tree_filtered(src, dst):
    os.makedirs(dst, exist_ok=True)
    for item in os.listdir(src):
        if item.endswith('.sqlite'):
            continue
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            copy_tree_filtered(s, d)
        else:
            shutil.copy2(s, d)

copy_tree_filtered(os.path.join(root_dir, 'backend', 'api'), os.path.join(staging_dir, 'backend', 'api'))
copy_tree_filtered(os.path.join(root_dir, 'backend', 'config'), os.path.join(staging_dir, 'backend', 'config'))
copy_tree_filtered(os.path.join(root_dir, 'backend', 'utils'), os.path.join(staging_dir, 'backend', 'utils'))
shutil.copy2(os.path.join(root_dir, 'backend', 'index.php'), os.path.join(staging_dir, 'backend', 'index.php'))
shutil.copy2(os.path.join(root_dir, 'backend', 'schema.sql'), os.path.join(staging_dir, 'backend', 'schema.sql'))
shutil.copy2(os.path.join(root_dir, 'backend', '.env.example'), os.path.join(staging_dir, 'backend', '.env.example'))
shutil.copy2(os.path.join(root_dir, 'backend', '.htaccess'), os.path.join(staging_dir, 'backend', '.htaccess'))

# Ensure backend/.env with user credentials is included
env_content = """# SafarSathi Database & Server Configuration
# Hostinger Production Settings for u798858760

APP_ENV=production
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u798858760_safarsathi123
DB_USER=u798858760_user
DB_PASSWORD=DeepAk@2031

JWT_SECRET=safarsathi_secure_jwt_key_prod_2026_xyz
"""
with open(os.path.join(staging_dir, 'backend', '.env'), 'w', encoding='utf-8') as f:
    f.write(env_content)

# Add readme
guide = """SafarSathi Bus Ticket Booking System - Production Package
Extract all files into public_html/.
Database is pre-configured with u798858760_safarsathi123.
Admin Portal: https://yourdomain.com/admin (admin@safarsathi.com / amir2010khan)
"""
with open(os.path.join(staging_dir, 'README.txt'), 'w', encoding='utf-8') as f:
    f.write(guide)

# 5. Create zip file using Python's zipfile module (guarantees NO duplicates)
written_entries = set()

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(staging_dir):
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, staging_dir).replace('\\', '/')
            if arcname in written_entries:
                print(f"Warning: duplicate skipped: {arcname}")
                continue
            written_entries.add(arcname)
            zipf.write(full_path, arcname)

# Cleanup staging
shutil.rmtree(staging_dir)

print(f"Zip created successfully: {zip_path}")
print(f"Total entries: {len(written_entries)}")

