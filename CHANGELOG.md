# Changelog

## [1.18.1](https://github.com/gengjiawen/os-init/compare/v1.18.0...v1.18.1) (2026-03-16)


### Bug Fixes

* set codex compact threshold to 128k ([634e5c2](https://github.com/gengjiawen/os-init/commit/634e5c2fef634aeca50f882108857be3f1298219))

## [1.18.0](https://github.com/gengjiawen/os-init/compare/v1.17.0...v1.18.0) (2026-03-13)


### Features

* add clash config generator ([b9f46b4](https://github.com/gengjiawen/os-init/commit/b9f46b4366955a0cfb8c6337a9956d3461d673f6))
* add optional mihomo downloader ([632d502](https://github.com/gengjiawen/os-init/commit/632d50234c2a6119f989dd39feb89b3d4d542514))
* print pm2 command for clash setup ([c4a3a81](https://github.com/gengjiawen/os-init/commit/c4a3a81eaa992816d1d54fdd019e7479bccbc2fb))


### Bug Fixes

* stabilize mihomo download test across platforms ([#28](https://github.com/gengjiawen/os-init/issues/28)) ([006b748](https://github.com/gengjiawen/os-init/commit/006b7481fe5c0e60628547bb22bfa357c8502bea))

## [1.17.0](https://github.com/gengjiawen/os-init/compare/v1.16.0...v1.17.0) (2026-03-07)


### Features

* add plan_mode_reasoning_effort to Codex config template ([e2b8192](https://github.com/gengjiawen/os-init/commit/e2b8192fe88b64dcd0b43a7026befe6ffd87ca52))

## [1.16.0](https://github.com/gengjiawen/os-init/compare/v1.15.0...v1.16.0) (2026-03-06)


### Features

* update Codex default model to gpt-5.4 ([e9a17c2](https://github.com/gengjiawen/os-init/commit/e9a17c27883782fa85495fa14f0df7b90cf4c04d))

## [1.15.0](https://github.com/gengjiawen/os-init/compare/v1.14.1...v1.15.0) (2026-03-04)


### Features

* add glm and kimi models to opencode template ([597379d](https://github.com/gengjiawen/os-init/commit/597379db82169f068b4732e71ccba4631e58c951))
* add opencode setup and update agents installer ([b62d83d](https://github.com/gengjiawen/os-init/commit/b62d83d925cb11bd2fff1465a3936c17706b1267))

## [1.14.1](https://github.com/gengjiawen/os-init/compare/v1.14.0...v1.14.1) (2026-02-28)


### Bug Fixes

* stabilize claude config tests on windows ([49e72ac](https://github.com/gengjiawen/os-init/commit/49e72ac4750629df0b915fff04ea481d8787ffa9))
* update Codex reasoning effort from high to xhigh ([459659f](https://github.com/gengjiawen/os-init/commit/459659f455b99de5f6b662a19a9b2dccdc482ec2))

## [1.14.0](https://github.com/gengjiawen/os-init/compare/v1.13.1...v1.14.0) (2026-02-26)


### Features

* configure vscode claude plugin during set-cc ([f3a6743](https://github.com/gengjiawen/os-init/commit/f3a67431ada64a806960f7727d227937386fb02d))

## [1.13.1](https://github.com/gengjiawen/os-init/compare/v1.13.0...v1.13.1) (2026-02-12)


### Bug Fixes

* update Codex model version in config template from gpt-5.2 to gpt-5.3-codex ([e5fca74](https://github.com/gengjiawen/os-init/commit/e5fca74bf8e18d97f1d70eb75b07c964804816e5))

## [1.13.0](https://github.com/gengjiawen/os-init/compare/v1.12.0...v1.13.0) (2026-01-26)


### Features

* add --full to include gemini in set-agents ([defdaca](https://github.com/gengjiawen/os-init/commit/defdaca67c0cea3d2d449a68b69080f68cf6f771))

## [1.12.0](https://github.com/gengjiawen/os-init/compare/v1.11.0...v1.12.0) (2026-01-05)


### Features

* add command to setup all AI agents with configuration and dependency installation ([122973e](https://github.com/gengjiawen/os-init/commit/122973e87767713ac6f9a36d0197e53f98f0b323))
* add Gemini CLI setup command and configuration management ([9d8400a](https://github.com/gengjiawen/os-init/commit/9d8400acb48a4da3e0688b60d69f9ed1b1353b8d))

## [1.11.0](https://github.com/gengjiawen/os-init/compare/v1.10.0...v1.11.0) (2025-12-31)


### Features

* update model version in Codex config template from gpt-5.1 to gpt-5.2 ([56c36d3](https://github.com/gengjiawen/os-init/commit/56c36d3da5c3732100c090c4df3318b5cdd003cf))

## [1.10.0](https://github.com/gengjiawen/os-init/compare/v1.9.1...v1.10.0) (2025-12-06)


### Features

* add command to set up Fish shell import script ([8418406](https://github.com/gengjiawen/os-init/commit/841840694783a1264733b7b8415cdb12d2bb21fa))
* add dev tun to setup ([a373417](https://github.com/gengjiawen/os-init/commit/a373417ca60f0f1554c85c06d73c017bc722fdf3))
* add ownership fix for gitpod user config and cache in init script ([dd3720c](https://github.com/gengjiawen/os-init/commit/dd3720cd0a57b603d1cc74179187669e3659ae82))
* persist ssh host keys via init script and mount gitconfig ([dbaabe9](https://github.com/gengjiawen/os-init/commit/dbaabe98ca44aa3e1cdb29deb12f700a4b559fb5))

## [1.9.1](https://github.com/gengjiawen/os-init/compare/v1.9.0...v1.9.1) (2025-11-26)


### Bug Fixes

* update unzip-url package version to 1.1.0 in package.json and pnpm-lock.yaml ([e800522](https://github.com/gengjiawen/os-init/commit/e8005229e0a4d28a91e0c82aceec4e41150ec8dc))

## [1.9.0](https://github.com/gengjiawen/os-init/compare/v1.8.0...v1.9.0) (2025-11-21)


### Features

* bump codex base model ([498bcc3](https://github.com/gengjiawen/os-init/commit/498bcc3b1e8a787ee61531b314c792127cd6c80b))

## [1.8.0](https://github.com/gengjiawen/os-init/compare/v1.7.1...v1.8.0) (2025-11-10)


### Features

* bump andoid tool version ([e54ef83](https://github.com/gengjiawen/os-init/commit/e54ef835b9a4baa03f89cfca651b0d032364734b))
* refine default sdk home ([690d4ef](https://github.com/gengjiawen/os-init/commit/690d4efdeec1b96da2296e1275cfa2898382fea2))

## [1.7.1](https://github.com/gengjiawen/os-init/compare/v1.7.0...v1.7.1) (2025-11-09)


### Bug Fixes

* android CI ([#12](https://github.com/gengjiawen/os-init/issues/12)) ([535b011](https://github.com/gengjiawen/os-init/commit/535b0115b513902ceb6fd9ef98bcb8338ac9972e))

## [1.7.0](https://github.com/gengjiawen/os-init/compare/v1.6.0...v1.7.0) (2025-11-09)


### Features

* add setup android sdk ([cb18d40](https://github.com/gengjiawen/os-init/commit/cb18d40e53e312b0aedc66a9cde6738bc2f4f1ba))

## [1.6.0](https://github.com/gengjiawen/os-init/compare/v1.5.1...v1.6.0) (2025-10-25)


### Features

* update Docker configuration to expose additional ports for development ([c1f0be1](https://github.com/gengjiawen/os-init/commit/c1f0be1f5f7559a32cbb2e5f1a829fd79f85d910))


### Bug Fixes

* set-dev build issues ([728c0e9](https://github.com/gengjiawen/os-init/commit/728c0e9964d19cdd7624a7e9c5f2e68efaf4858f))

## [1.5.1](https://github.com/gengjiawen/os-init/compare/v1.5.0...v1.5.1) (2025-10-25)


### Bug Fixes

* add 'ip' dependency to package.json ([195b0d0](https://github.com/gengjiawen/os-init/commit/195b0d06b158962d57060336629e0666b726b9d9))
* add repository information to package.json ([441f752](https://github.com/gengjiawen/os-init/commit/441f7525a44af7a96b0f2916e2228439e89bb1d7))

## [1.5.0](https://github.com/gengjiawen/os-init/compare/v1.4.0...v1.5.0) (2025-10-25)


### Features

* add dev environment setup command and update dependencies ([3bd05ae](https://github.com/gengjiawen/os-init/commit/3bd05aec3ba20c55e0b2323fb0da390eb4de539d))

## [1.4.0](https://github.com/gengjiawen/os-init/compare/v1.3.2...v1.4.0) (2025-10-25)


### Features

* add Raycast AI configuration setup and command ([b5d64d4](https://github.com/gengjiawen/os-init/commit/b5d64d4fa65dddf739b7b3b6e50ce3f94346538a))


### Bug Fixes

* format ([ad7cc79](https://github.com/gengjiawen/os-init/commit/ad7cc791efb1437c2eaae916fe3ba43bc545b355))

## [1.3.2](https://github.com/gengjiawen/os-init/compare/v1.3.1...v1.3.2) (2025-10-19)


### Bug Fixes

* release process  again ([d436b08](https://github.com/gengjiawen/os-init/commit/d436b0891c4ce2262339b2b36107a5c65abdbf83))

## [1.3.1](https://github.com/gengjiawen/os-init/compare/v1.3.0...v1.3.1) (2025-10-19)


### Bug Fixes

* release process ([a833c10](https://github.com/gengjiawen/os-init/commit/a833c1046247bb033a286d6173f493c1984f1150))

## 1.3.0 (2025-10-19)


### Features

* add cc support ([6bf77d8](https://github.com/gengjiawen/os-init/commit/6bf77d8d01b24babfa8c61e14cb1600b5efea309))
* bump deps and updatete cchoco scritp ([f47c982](https://github.com/gengjiawen/os-init/commit/f47c982e163c8396ef579becd869ae0ae0124c2c))
* support codex ([1b95737](https://github.com/gengjiawen/os-init/commit/1b957378dbfce4945aea74f3d84326dc5e657cc6))
* update configuration handling for Claude integration and enhance .gitignore ([5c59ed8](https://github.com/gengjiawen/os-init/commit/5c59ed85125e3247c97dd6d339584fe6d9aa63a2))
* update macOS commands ([b1d80cf](https://github.com/gengjiawen/os-init/commit/b1d80cf8fa06360fff2be1e188b7d09cfb2d8479))


### Bug Fixes

* choco install ([9af90d2](https://github.com/gengjiawen/os-init/commit/9af90d299b5865d54b7b3eff467f086dacdd175d))
* correct format-check command to format:check in CI workflow ([3befc98](https://github.com/gengjiawen/os-init/commit/3befc989086cc04da5306b42159bcd2b751451b6))
* publish ([3ea009e](https://github.com/gengjiawen/os-init/commit/3ea009e1634e94e7b8c1801ff6754cb7a5012ccf))


### Miscellaneous Chores

* release 1.3.0 ([588992a](https://github.com/gengjiawen/os-init/commit/588992ab4565e792900e1efa50ebdedca9fca91d))
