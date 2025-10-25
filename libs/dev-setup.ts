import * as fs from 'fs'
import * as path from 'path'
import { execa } from 'execa'
import * as ip from 'ip'

/** Ensure directory exists */
function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

/** Copy directory recursively */
function copyDirSync(src: string, dest: string): void {
  ensureDir(dest)
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/** Check if a command exists */
async function commandExists(command: string): Promise<boolean> {
  try {
    const { failed } = await execa(command, ['--version'], {
      stdio: 'ignore',
      reject: false,
    })
    return !failed
  } catch (error) {
    return false
  }
}

/** Setup dev environment by copying dev-setup directory and replacing SSH public key */
export async function setupDevEnvironment(
  sshPublicKey: string,
  targetDir?: string
): Promise<{ targetPath: string }> {
  // Determine source and target paths
  const sourceDir = path.join(__dirname, '..', 'dev-setup')
  const defaultTargetDir = path.join(process.cwd(), 'dev-setup')
  const targetPath = targetDir || defaultTargetDir

  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`)
  }

  // Copy dev-setup directory
  console.log(`Copying dev-setup to: ${targetPath}`)
  copyDirSync(sourceDir, targetPath)

  // Replace SSH_PUBLIC_KEY placeholder in Dockerfile
  const dockerfilePath = path.join(targetPath, 'Dockerfile')
  if (fs.existsSync(dockerfilePath)) {
    let content = fs.readFileSync(dockerfilePath, 'utf-8')
    content = content.replace('ssh-public-key-placeholder', sshPublicKey)
    fs.writeFileSync(dockerfilePath, content)
    console.log('SSH public key has been configured in Dockerfile')
  } else {
    throw new Error(`Dockerfile not found in ${targetPath}`)
  }

  // Check if docker-compose is available
  const hasDockerCompose = await commandExists('docker-compose')

  if (hasDockerCompose) {
    console.log(
      '\n🐳 Docker Compose detected. Building and starting containers...'
    )

    try {
      // Run docker-compose build
      console.log('Running: docker-compose build')
      await execa('docker-compose', ['build'], {
        cwd: targetPath,
        stdio: 'inherit',
      })

      // Run docker-compose up -d
      console.log('Running: docker-compose up -d')
      await execa('docker-compose', ['up', '-d'], {
        cwd: targetPath,
        stdio: 'inherit',
      })

      console.log('\n✅ Dev environment is up and running!')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error('\n⚠️  Failed to start containers:', errorMessage)
      console.log('\nYou can manually start the containers with:')
      console.log(`  cd ${targetPath}`)
      console.log('  docker-compose build && docker-compose up -d')
    }
  } else {
    console.log('\n⚠️  Docker Compose not found.')
    console.log('\nTo start the dev environment, run:')
    console.log(`  cd ${targetPath}`)
    console.log('  docker-compose build && docker-compose up -d')
  }

  // Display SSH connection instructions
  const localIp = ip.address()
  console.log('\n SSH Connection:')
  console.log(`  ssh gitpod@${localIp} -p 2222`)
  console.log('\nOr use localhost if connecting from the same machine:')
  console.log('  ssh gitpod@localhost -p 2222')

  return { targetPath }
}
