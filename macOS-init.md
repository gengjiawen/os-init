macOS init script

## For developer

```
sudo spctl --master-disable
sudo /usr/sbin/DevToolsSecurity -enable
```

## Basic software

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
brew install git
brew install fish
brew install go
brew install n
brew install rustup-init
brew install cursor
brew install google-chrome
brew install jetbrains-toolbox
brew install omnidisksweeper
brew install git-lfs
brew install jordanbaird-ice
brew install raycast
sudo n lts
rustup-init -y
sudo git lfs install --system
npm i -g pnpm yarn && pnpm setup && SHELL=fish pnpm setup && source ~/.bashrc
pnpx @gengjiawen/os-init set-fish
pnpx @gengjiawen/os-init disable-ts-extension
pnpm i -g vite 7zip-bin-full
sudo ln -s "$(NODE_PATH="$(pnpm root -g)" node -p "require('7zip-bin-full').path7z")" /usr/local/bin/7z
```

make homebrew path first

```bash
fish_add_path /opt/homebrew/opt
```
