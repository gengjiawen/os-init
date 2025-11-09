# Android Development Environment Setup

This command sets up a complete Android development environment on macOS and Linux systems.

## Usage

```bash
os-init set-android [options]
```

## What It Does

The `set-android` command:

1. **Creates Android SDK directory** at `~/Android` (or custom path)
2. **Downloads and installs Android SDK** command-line tools (automatically detects macOS or Linux)
3. **Accepts Android SDK licenses** automatically
4. **Installs essential components**:
   - Platform tools (adb, fastboot, etc.)
   - Android 36 platform
   - Build tools 36.0.0
   - CMake 3.30.5
   - NDK 29.0.14206865
5. **Configures environment variables** in your shell configuration file (~/.bashrc, ~/.zshrc, or ~/.config/fish/config.fish)

## Options

- `--android-home <path>` - Custom Android SDK installation path (default: `~/Android`)
- `--skip-env-vars` - Skip adding environment variables to shell config

## Examples

### Basic Installation

```bash
os-init set-android
```

This installs the Android SDK to `~/Android` and adds environment variables to your shell config.

### Custom Installation Path

```bash
os-init set-android --android-home /home/user/android-sdk
```

### Skip Environment Variables

If you prefer to manage environment variables manually:

```bash
os-init set-android --skip-env-vars
```

## Requirements

- **macOS or Linux operating system**
- Internet connection to download Android SDK
- Node.js 22.12.0 or higher

The script uses `@compilets/unzip-url` package to download and extract the Android SDK, so no external `curl` or `unzip` tools are required. No sudo access is needed as the SDK is installed in your home directory.

## Environment Variables

After installation, the following environment variables will be set:

```bash
export ANDROID_HOME=~/Android
export ANDROID_SDK_ROOT=${ANDROID_HOME}
export ANDROID_NDK_HOME=${ANDROID_HOME}/ndk/29.0.14206865
export PATH=${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/emulator:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${PATH}
```

## Activating the Environment

After installation, activate the environment in your current shell:

```bash
source ~/.bashrc  # or ~/.zshrc, or ~/.config/fish/config.fish
```

Or simply open a new terminal session.

## Verifying Installation

Check that the Android SDK is properly installed:

```bash
adb --version
sdkmanager --list
```

## Platform-Specific Notes

### macOS
- The SDK is downloaded from Google's macOS-specific distribution
- Works on both Intel and Apple Silicon Macs
- No sudo permissions required

### Linux
- The SDK is downloaded from Google's Linux-specific distribution
- Tested on Ubuntu and Debian-based systems
- No sudo permissions required when installing to home directory

## Troubleshooting

### Command Not Found After Installation

Make sure you've sourced your shell configuration file or opened a new terminal:

```bash
source ~/.bashrc  # or your shell's config file
```

### Download Failures

If the Android SDK download fails, check your internet connection and try again. The script will show detailed error messages.

## What Gets Installed

- **Android SDK Command-line Tools** (version 11076708)
- **Platform Tools** - adb, fastboot, etc.
- **Android Platform 36** - Latest Android API level
- **Build Tools 36.0.0** - Tools for building Android apps
- **CMake 3.30.5** - For native code compilation
- **NDK 29.0.14206865** - Native Development Kit for C/C++ code


