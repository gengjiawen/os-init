import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'
import { unzip } from '@gengjiawen/unzip-url'
import { appendFishImportScript } from './fish-shell-utils'

/** Android SDK configuration */
const ANDROID_CONFIG = {
  sdkVersion: '11076708',
  platformVersion: 'android-36',
  buildToolsVersion: '36.1.0',
  cmakeVersion: '4.1.2',
  ndkVersion: '29.0.14206865',
} as const

/** Get default Android home directory */
function getDefaultAndroidHome(): string {
  const { ANDROID_SDK_ROOT, ANDROID_HOME, LOCALAPPDATA } = process.env

  if (ANDROID_SDK_ROOT && ANDROID_SDK_ROOT.trim()) return ANDROID_SDK_ROOT
  if (ANDROID_HOME && ANDROID_HOME.trim()) return ANDROID_HOME

  const home = os.homedir()
  switch (process.platform) {
    case 'darwin':
      return path.join(home, 'Library', 'Android', 'sdk')
    case 'linux':
      return path.join(home, 'Android', 'Sdk')
    case 'win32':
      return LOCALAPPDATA
        ? path.join(LOCALAPPDATA, 'Android', 'Sdk')
        : path.join(home, 'AppData', 'Local', 'Android', 'Sdk')
    default:
      // Reasonable fallback for other POSIX-like environments
      return path.join(home, 'Android', 'Sdk')
  }
}

/** Get SDK download URL based on platform */
function getSdkDownloadUrl(sdkVersion: string): string {
  const platform = os.platform()
  if (platform === 'darwin') {
    return `https://dl.google.com/android/repository/commandlinetools-mac-${sdkVersion}_latest.zip`
  } else if (platform === 'linux') {
    return `https://dl.google.com/android/repository/commandlinetools-linux-${sdkVersion}_latest.zip`
  } else {
    throw new Error(
      `Unsupported platform: ${platform}. Only macOS and Linux are supported.`
    )
  }
}

/** Get Android environment variables */
function getAndroidEnvVars(androidHome: string, ndkVersion: string): string {
  return `
# ===== Android development environment - START (2025-11-09) =====
export ANDROID_HOME=${androidHome}
export ANDROID_SDK_ROOT=\${ANDROID_HOME}
export ANDROID_NDK_HOME=\${ANDROID_HOME}/ndk/${ndkVersion}
export PATH=\${ANDROID_HOME}/cmdline-tools/bin:\${ANDROID_HOME}/cmdline-tools/latest/bin:\${ANDROID_HOME}/emulator:\${ANDROID_HOME}/platform-tools:\${ANDROID_HOME}/tools:\${ANDROID_HOME}/tools/bin:\${PATH}
# ===== Android development environment - END =====
`
}

/** Detect shell configuration file */
function getShellRcFile(): string {
  const shell = process.env.SHELL || ''
  const homeDir = os.homedir()

  if (shell.includes('zsh')) {
    return path.join(homeDir, '.zshrc')
  } else if (shell.includes('fish')) {
    return path.join(homeDir, '.config', 'fish', 'config.fish')
  } else {
    return path.join(homeDir, '.bashrc')
  }
}

/** Check if Android environment variables already exist in shell config */
function hasAndroidEnvVars(rcFile: string): boolean {
  if (!fs.existsSync(rcFile)) {
    return false
  }
  const content = fs.readFileSync(rcFile, 'utf-8')
  return content.includes('ANDROID_HOME')
}

/** Append Android environment variables to shell config */
function appendEnvVarsToShellConfig(rcFile: string, envVars: string): void {
  const shell = process.env.SHELL || ''
  const homeDir = os.homedir()
  const bashrcFile = path.join(homeDir, '.bashrc')

  // Write to bashrc
  if (
    !fs.existsSync(bashrcFile) ||
    !fs.readFileSync(bashrcFile, 'utf-8').includes('ANDROID_HOME')
  ) {
    fs.appendFileSync(bashrcFile, envVars)
    console.log(`Environment variables added to: ${bashrcFile}`)
  } else {
    console.log(`Environment variables already exist in: ${bashrcFile}`)
  }

  // For fish shell, always write to bashrc first, then add import script to fish config
  if (shell.includes('fish')) {
    appendFishImportScript()
  }
}

/** Setup Android development environment */
export async function setupAndroidEnvironment(options?: {
  androidHome?: string
  skipEnvVars?: boolean
}): Promise<{
  androidHome: string
  envVarsAdded: boolean
  shellRcFile?: string
}> {
  const androidHome = options?.androidHome || getDefaultAndroidHome()
  const {
    sdkVersion,
    platformVersion,
    buildToolsVersion,
    cmakeVersion,
    ndkVersion,
  } = ANDROID_CONFIG

  console.log('Starting Android development environment setup...\n')

  // Check if running on supported platform
  const platform = os.platform()
  if (platform !== 'linux' && platform !== 'darwin') {
    throw new Error(
      `Unsupported platform: ${platform}. Only macOS and Linux are supported.`
    )
  }

  console.log(`Platform: ${platform === 'darwin' ? 'macOS' : 'Linux'}`)

  // Create Android directory
  console.log(`Creating Android SDK directory at: ${androidHome}`)
  try {
    if (!fs.existsSync(androidHome)) {
      fs.mkdirSync(androidHome, { recursive: true })
    }
  } catch (error) {
    throw new Error(
      `Failed to create Android directory: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Download and setup Android SDK
  console.log('\nDownloading and setting up Android SDK...')
  const sdkUrl = getSdkDownloadUrl(sdkVersion)

  const cmdlineToolsPath = path.join(androidHome, 'cmdline-tools')
  const latestPath = path.join(cmdlineToolsPath, 'latest')
  const latestBin = path.join(latestPath, 'bin')

  try {
    // Download and extract SDK using unzip-url
    if (!fs.existsSync(latestBin)) {
      console.log(
        `Downloading and extracting from: ${sdkUrl} to ${androidHome}`
      )
      await unzip(sdkUrl, cmdlineToolsPath)
      const tmp_toolchain = path.join(cmdlineToolsPath, 'cmdline-tools')
      fs.renameSync(tmp_toolchain, latestPath)
      console.log('Android SDK extracted successfully')
    }
  } catch (error) {
    throw new Error(
      `Failed to download/extract Android SDK: ${error instanceof Error ? error.message : String(error)}`
    )
  }
  const sdkmanagerBinary = path.join(latestBin, 'sdkmanager')

  const sdkmanagerEnv = {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    PATH: `${latestBin}:${process.env.PATH}`,
  }

  // Accept licenses
  console.log('\nAccepting Android SDK licenses...')
  try {
    await execa(
      'bash',
      [
        '-c',
        `yes | "${sdkmanagerBinary}" --sdk_root=${androidHome} --licenses`,
      ],
      {
        env: sdkmanagerEnv,
        stdio: 'inherit',
      }
    )
  } catch (error) {
    console.warn(
      'Warning: License acceptance may have failed, but continuing...'
    )
  }

  // Install SDK components
  console.log('\nInstalling Android SDK components...')
  const components = [
    'platform-tools',
    `platforms;${platformVersion}`,
    `build-tools;${buildToolsVersion}`,
    `cmake;${cmakeVersion}`,
    `ndk;${ndkVersion}`,
  ]

  try {
    await execa(
      sdkmanagerBinary,
      [`--sdk_root=${androidHome}`, ...components],
      {
        env: sdkmanagerEnv,
        stdio: 'inherit',
      }
    )
    console.log('Android SDK components installed successfully')
  } catch (error) {
    throw new Error(
      `Failed to install SDK components: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Clean up .android directory
  const androidConfigDir = path.join(androidHome, '.android')
  if (fs.existsSync(androidConfigDir)) {
    fs.rmSync(androidConfigDir, { recursive: true, force: true })
  }

  // Set permissions (only needed on Linux for system-wide installs)
  if (platform === 'linux' && androidHome.startsWith('/opt')) {
    try {
      await execa('chmod', ['-R', '777', androidHome], { stdio: 'inherit' })
    } catch (error) {
      console.warn('Warning: Failed to set permissions, but continuing...')
    }
  }

  console.log('\n✅ Android SDK installation completed!')

  // Handle environment variables
  let envVarsAdded = false
  let shellRcFile: string | undefined

  if (!options?.skipEnvVars) {
    shellRcFile = getShellRcFile()
    console.log(`\nConfiguring shell environment in: ${shellRcFile}`)

    if (hasAndroidEnvVars(shellRcFile)) {
      console.log(
        'Android environment variables already exist in shell config, skipping...'
      )
    } else {
      const envVars = getAndroidEnvVars(androidHome, ndkVersion)
      appendEnvVarsToShellConfig(shellRcFile, envVars)
      envVarsAdded = true
    }

    console.log('\n📋 To activate the environment in your current shell, run:')
    console.log(`  source ${shellRcFile}`)
  }

  console.log(
    '\n✅ Android development environment setup completed successfully!'
  )

  return {
    androidHome,
    envVarsAdded,
    shellRcFile,
  }
}
