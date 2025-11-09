/** Get Fish shell script to import bash exports */
export function getFishImportBashExports(): string {
  return `
# Import environment variables from .bashrc
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
`
}
