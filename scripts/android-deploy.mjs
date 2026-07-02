#!/usr/bin/env node
/**
 * One-command Android deploy to a USB-connected phone.
 *
 * Runs: cap sync -> gradlew assembleDebug -> adb install -> launch app.
 *
 * Why this exists instead of `npx cap run android`:
 *  - On this Windows setup `cap run` invokes `gradlew` without the `.bat`
 *    extension and fails ("'gradlew' is not recognized"). We call
 *    android/gradlew.bat directly instead.
 *  - It also needs JAVA_HOME; we auto-detect Android Studio's bundled JDK
 *    (jbr) and the SDK's adb, so it works even in a shell where those env
 *    vars aren't set.
 *
 * Usage:
 *   npm run android              # deploy to the only/first connected device
 *   npm run android -- <serial>  # deploy to a specific device (adb serial)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const isWin = process.platform === 'win32';
const APP_ID = 'com.foodbase.app';

function firstExisting(paths) {
  return paths.find((p) => p && existsSync(p));
}

// --- Locate JDK (JAVA_HOME) ---
const javaHome =
  (process.env.JAVA_HOME && existsSync(join(process.env.JAVA_HOME, 'bin', isWin ? 'java.exe' : 'java'))
    ? process.env.JAVA_HOME
    : null) ||
  firstExisting([
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs', 'Android Studio', 'jbr'),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'jbr'),
  ]);

if (!javaHome) {
  console.error('❌ Could not find a JDK. Install Android Studio or set JAVA_HOME.');
  process.exit(1);
}

// --- Locate adb ---
const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
const adb = firstExisting([
  sdk && join(sdk, 'platform-tools', isWin ? 'adb.exe' : 'adb'),
]);
if (!adb) {
  console.error('❌ Could not find adb. Set ANDROID_HOME to your Android SDK path.');
  process.exit(1);
}

const env = { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk };

function run(cmd, args, opts = {}) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit', env, cwd: root, ...opts });
}

// --- Resolve target device ---
function pickDevice() {
  const requested = process.argv[2];
  const out = execFileSync(adb, ['devices'], { encoding: 'utf8', env });
  const devices = out
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.endsWith('\tdevice'))
    .map((l) => l.split('\t')[0]);

  if (devices.length === 0) {
    console.error('❌ No authorized device found. Plug in the phone, unlock it, enable USB debugging, and tap "Allow".');
    process.exit(1);
  }
  if (requested) {
    if (!devices.includes(requested)) {
      console.error(`❌ Device "${requested}" not found. Connected: ${devices.join(', ') || '(none)'}`);
      process.exit(1);
    }
    return requested;
  }
  if (devices.length > 1) {
    console.error(`❌ Multiple devices connected: ${devices.join(', ')}\n   Run: npm run android -- <serial>`);
    process.exit(1);
  }
  return devices[0];
}

const serial = pickDevice();
console.log(`📱 Target device: ${serial}`);
console.log(`☕ JAVA_HOME: ${javaHome}`);

// 1) Sync web assets + plugins into the android project
run('npx', ['cap', 'sync', 'android'], { shell: isWin });

// 2) Build the debug APK via the Gradle wrapper (.bat on Windows)
// Node won't spawn a .bat directly (EINVAL); run it through the shell on Windows.
const gradlew = join(root, 'android', isWin ? 'gradlew.bat' : 'gradlew');
run(gradlew, ['assembleDebug', '--console=plain'], { cwd: join(root, 'android'), shell: isWin });

// 3) Install (replace) on the device
const apk = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (!existsSync(apk)) {
  console.error(`❌ Build succeeded but APK not found at ${apk}`);
  process.exit(1);
}
run(adb, ['-s', serial, 'install', '-r', apk]);

// 4) Launch the app
const launch = spawnSync(
  adb,
  ['-s', serial, 'shell', 'monkey', '-p', APP_ID, '-c', 'android.intent.category.LAUNCHER', '1'],
  { encoding: 'utf8', env }
);
if (launch.status !== 0) {
  console.error('⚠ App installed but could not be auto-launched. Open it manually on the phone.');
} else {
  console.log(`\n✅ Done — ${APP_ID} installed and launched on ${serial}.`);
}
