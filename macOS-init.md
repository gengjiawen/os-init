macOS init script

## For developer

```
sudo spctl --master-disable
sudo /usr/sbin/DevToolsSecurity -enable
```

## Basic software

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew install git
brew install node
brew install fish
brew install go
brew install rustup-init
brew install visual-studio-code
brew install google-chrome
brew install jetbrains-toolbox
brew install docker
brew install shadowsocksx-ng
brew install omnidisksweeper
brew install git-lfs
sudo git lfs install --system
brew tap AdoptOpenJDK/openjdk
brew install adoptopenjdk8
brew install android-studio
brew install charles
```

Fish config
```
egrep "^export " ~/.bash_profile | while read e
	set var (echo $e | sed -E "s/^export ([A-Z_]+)=(.*)\$/\1/")
	set value (echo $e | sed -E "s/^export ([A-Z_]+)=(.*)\$/\2/")

	# remove surrounding quotes if existing
	set value (echo $value | sed -E "s/^\"(.*)\"\$/\1/")

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
set -g fish_user_paths "/usr/local/opt/curl/bin" $fish_user_paths
set -g fish_user_paths "/usr/local/opt/sqlite/bin" $fish_user_paths
```
