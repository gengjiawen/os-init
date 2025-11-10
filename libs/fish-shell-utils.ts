import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/** Get Fish shell script to import bash exports */
export function getFishImportBashExports(): string {
  return `
# ===== Import environment variables from .bashrc - START (2025-11-09) =====
egrep "^export " ~/.bashrc | while read e
	set var (echo $e | sed -E "s/^export ([A-Za-z_0-9]+)=(.*)\\$/\\1/")
	set value (echo $e | sed -E "s/^export ([A-Za-z_0-9]+)=(.*)\\$/\\2/")

	# remove surrounding quotes if existing
	set value (echo $value | sed -E "s/^\\"(.*)\\"\\$/\\1/")

	# convert Bash \${VAR} to fish {\$VAR} before eval
	set value (printf '%s' "$value" | sed -E 's/\\$\\{([A-Za-z_][A-Za-z0-9_]*)\\}/{$\\1}/g')

	if test $var = "PATH"
		# replace ":" by spaces. this is how PATH looks for Fish
		set value (echo $value | sed -E "s/:/ /g")

		# use eval because we need to expand the value
		eval set -xg $var $value

		continue
	end

	# evaluate variables. we can use eval because we most likely just used "$var"
	set value (eval echo $value)

	#echo "set -xg '$var' '$value' (via '$e')"
	set -xg $var $value
end
# ===== Import environment variables from .bashrc - END =====
`
}

/**
 * Append bash import script to Fish shell config file
 * This function adds the import script to fish config.fish to automatically
 * source environment variables from .bashrc
 * It detects fish shell by checking if ~/.config/fish/config.fish exists
 */
export function appendFishImportScript(): void {
  const homeDir = os.homedir()
  const fishConfigPath = path.join(homeDir, '.config', 'fish', 'config.fish')

  // Detect if fish shell exists by checking config file
  if (!fs.existsSync(fishConfigPath)) {
    console.log('Fish shell config not found, skipping fish setup')
    return
  }

  // Ensure fish config directory exists
  const configDir = path.dirname(fishConfigPath)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  // Check if import script already exists
  const fishContent = fs.existsSync(fishConfigPath)
    ? fs.readFileSync(fishConfigPath, 'utf-8')
    : ''

  if (
    !fishContent.includes('Import environment variables from .bashrc - START')
  ) {
    const fishScript = getFishImportBashExports()
    fs.appendFileSync(fishConfigPath, fishScript)
    console.log(`Fish import script added to: ${fishConfigPath}`)
  } else {
    console.log(`Fish import script already exists in: ${fishConfigPath}`)
  }
}
