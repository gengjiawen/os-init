import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'
import { unzip } from '@compilets/unzip-url'

/** Android SDK configuration */
const ANDROID_CONFIG = {
  sdkVersion: '11076708',
  platformVersion: 'android-36',
  buildToolsVersion: '36.0.0',
  cmakeVersion: '3.30.5',
  ndkVersion: '29.0.14206865',
} as const

/** Get default Android home directory */
function getDefaultAndroidHome(): string {
  return path.join(os.homedir(), 'Android')
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
# Android development environment
export ANDROID_HOME=${androidHome}
export ANDROID_SDK_ROOT=\${ANDROID_HOME}
export ANDROID_NDK_HOME=\${ANDROID_HOME}/ndk/${ndkVersion}
export PATH=\${ANDROID_HOME}/cmdline-tools/latest/bin:\${ANDROID_HOME}/cmdline-tools/cmdline-tools/bin:\${ANDROID_HOME}/emulator:\${ANDROID_HOME}/platform-tools:\${ANDROID_HOME}/tools:\${ANDROID_HOME}/tools/bin:\${PATH}
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
  const dir = path.dirname(rcFile)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.appendFileSync(rcFile, envVars)
  console.log(`Environment variables added to: ${rcFile}`)
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

  try {
    // Download and extract SDK using unzip-url
    console.log(`Downloading and extracting from: ${sdkUrl} to ${androidHome}`)
    await unzip(sdkUrl, androidHome)
    console.log('Android SDK extracted successfully')
  } catch (error) {
    throw new Error(
      `Failed to download/extract Android SDK: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  const cmdlineToolsPath = path.join(androidHome, 'cmdline-tools')
  const latestBin = path.join(cmdlineToolsPath, 'bin')
  const nestedBin = path.join(cmdlineToolsPath, 'cmdline-tools', 'bin')
  const sdkmanagerBinDir = fs.existsSync(latestBin) ? latestBin : nestedBin
  const sdkmanagerBinary = path.join(sdkmanagerBinDir, 'sdkmanager')
  const sdkmanagerEnv = {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    PATH: `${sdkmanagerBinDir}:${process.env.PATH}`,
  }

  // Accept licenses
  console.log('\nAccepting Android SDK licenses...')
  try {
    await execa('bash', ['-c', `yes | "${sdkmanagerBinary}" --licenses`], {
      env: sdkmanagerEnv,
      stdio: 'inherit',
    })
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
    await execa(sdkmanagerBinary, components, {
      env: sdkmanagerEnv,
      stdio: 'inherit',
    })
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
