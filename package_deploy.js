const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;
const staging = path.join(root, 'hostinger_package');
const zipFile = path.join(root, 'safarsathi_hostinger_deploy.zip');

console.log('Preparing Hostinger deployment package...');

// Remove existing staging and zip
if (fs.existsSync(staging)) {
    fs.rmSync(staging, { recursive: true, force: true });
}
if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
}

fs.mkdirSync(staging, { recursive: true });
fs.mkdirSync(path.join(staging, 'assets'), { recursive: true });
fs.mkdirSync(path.join(staging, 'api'), { recursive: true });
fs.mkdirSync(path.join(staging, 'backend'), { recursive: true });

// Copy frontend dist assets
fs.copyFileSync(path.join(root, 'frontend', 'dist', 'index.html'), path.join(staging, 'index.html'));

const assetsDir = path.join(root, 'frontend', 'dist', 'assets');
for (const file of fs.readdirSync(assetsDir)) {
    fs.copyFileSync(path.join(assetsDir, file), path.join(staging, 'assets', file));
}

// Copy root configuration
fs.copyFileSync(path.join(root, '.htaccess'), path.join(staging, '.htaccess'));
fs.copyFileSync(path.join(root, 'index.php'), path.join(staging, 'index.php'));

// Copy api directory
fs.copyFileSync(path.join(root, 'api', 'index.php'), path.join(staging, 'api', 'index.php'));
fs.copyFileSync(path.join(root, 'api', '.htaccess'), path.join(staging, 'api', '.htaccess'));

// Copy backend directory
function copyFolderRecursive(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    const files = fs.readdirSync(source);
    for (const file of files) {
        // Skip sqlite local testing database
        if (file.endsWith('.sqlite')) continue;
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);
        if (fs.lstatSync(curSource).isDirectory()) {
            copyFolderRecursive(curSource, curTarget);
        } else {
            fs.copyFileSync(curSource, curTarget);
        }
    }
}

copyFolderRecursive(path.join(root, 'backend', 'api'), path.join(staging, 'backend', 'api'));
copyFolderRecursive(path.join(root, 'backend', 'config'), path.join(staging, 'backend', 'config'));
copyFolderRecursive(path.join(root, 'backend', 'utils'), path.join(staging, 'backend', 'utils'));
fs.copyFileSync(path.join(root, 'backend', 'index.php'), path.join(staging, 'backend', 'index.php'));
fs.copyFileSync(path.join(root, 'backend', 'schema.sql'), path.join(staging, 'backend', 'schema.sql'));
fs.copyFileSync(path.join(root, 'backend', '.env.example'), path.join(staging, 'backend', '.env.example'));
if (fs.existsSync(path.join(root, 'backend', '.env'))) {
    fs.copyFileSync(path.join(root, 'backend', '.env'), path.join(staging, 'backend', '.env'));
}
fs.copyFileSync(path.join(root, 'backend', '.htaccess'), path.join(staging, 'backend', '.htaccess'));

// Create clear deployment guide file
const guideText = `========================================================================
 SAFARSATHI BUS TICKET BOOKING SYSTEM - HOSTINGER DEPLOYMENT GUIDE
========================================================================

STEP 1: DATABASE SETUP IN HOSTINGER hPANEL
------------------------------------------------------------------------
1. Login to your Hostinger hPanel (https://hpanel.hostinger.com).
2. Go to "Databases" -> "Management" -> "Create MySQL Database".
3. Note down the following details:
   - MySQL Database Name (e.g. u123456789_safarsathi)
   - MySQL Username      (e.g. u123456789_admin)
   - Password            (The password you set)
4. Click on "Enter phpMyAdmin" next to your newly created database.
5. In phpMyAdmin, click the "Import" tab at the top.
6. Choose the file: backend/schema.sql and click "Import" / "Go".
   -> All tables, indexes, and default Admin account will be created.

DEFAULT ADMIN LOGIN:
- Email:    admin@safarsathi.com
- Password: amir2010khan
- Portal:   https://yourdomain.com/admin

STEP 2: UPLOAD & EXTRACT FILES
------------------------------------------------------------------------
1. In Hostinger hPanel, go to "Files" -> "File Manager" -> Click "Access files of your domain".
2. Open the "public_html" directory.
3. Upload "safarsathi_hostinger_deploy.zip" into "public_html".
4. Right-click "safarsathi_hostinger_deploy.zip" and choose "Extract".
   (Extract directly into public_html so that index.html, assets, api, backend are in public_html).
5. Delete the zip file after extraction.

STEP 3: CONFIGURE DATABASE CREDENTIALS (.env)
------------------------------------------------------------------------
1. In File Manager, navigate inside the "backend" folder.
2. Locate the file named ".env.example".
3. Rename ".env.example" to ".env".
4. Right-click ".env" and select "Edit".
5. Fill in your actual Hostinger database credentials:

   DB_DRIVER=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=u123456789_safarsathi
   DB_USER=u123456789_admin
   DB_PASSWORD=YourActualDatabasePasswordHere

6. Save and close the file.

STEP 4: VERIFY AND START USING
------------------------------------------------------------------------
1. Open your domain in any browser:
   https://yourdomain.com/
   -> SafarSathi bus booking home page will load!
2. Go to the Admin Panel:
   https://yourdomain.com/admin
   -> Login with admin@safarsathi.com / amir2010khan
   -> Add buses with routes, timings, fares, and boarding points.
3. Search and book tickets as a customer:
   -> Customer logs in / registers
   -> Selects seats
   -> Skips payment or uses Instant Booking to get a confirmed PNR & ticket!

SUPPORT & ASSISTANCE:
All APIs are routed through /api/* using .htaccess.
Ensure PHP version is 8.0 or 8.1 / 8.2 in Hostinger PHP Configuration.
========================================================================
`;

fs.writeFileSync(path.join(staging, 'HOSTINGER_DEPLOYMENT_GUIDE.txt'), guideText);

console.log('Staging files created.');

// Compress staging directory into safarsathi_hostinger_deploy.zip using tar.exe
try {
    process.chdir(staging);
    execSync('tar -a -c -f "../safarsathi_hostinger_deploy.zip" * .htaccess');
    console.log('Archive safarsathi_hostinger_deploy.zip created successfully!');
} catch (e) {
    console.error('Error creating zip archive:', e.message);
}

