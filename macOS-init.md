macOS init script

## For developer
```
sudo spctl --master-disable
sudo /usr/sbin/DevToolsSecurity -enable
```

## Basic software
```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew update
brew tap caskroom/versions
brew install node
brew install fish
brew install go
brew install rustup-init
brew cask install visual-studio-code
brew cask install google-chrome
brew tap AdoptOpenJDK/openjdk
brew cask install adoptopenjdk8
brew cask install android-studio
brew cask install jetbrains-toolbox
brew cask install docker
brew cask install charles
brew cask install shadowsocksx-ng
brew cask install omnidisksweeper
brew install git-lfs
sudo git lfs install --system
```
