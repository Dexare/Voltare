# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [1.0.2] - 2022-02-21
### Changed:
- Updated command types ([#26](https://github.com/Dexare/Voltare/pull/26))
### Fixed:
- Fixed reloading commands ([`ed71d4e`](https://github.com/Dexare/Voltare/commit/ed71d4e))
## [1.0.1] - 2022-02-21
### Fixed:
- Fixed version in index ([#25](https://github.com/Dexare/Voltare/pull/25), [`bfa828f`](https://github.com/Dexare/Voltare/commit/bfa828f794f1fe163e84fd00e296a5ab3f6d217d))
## [1.0.0] - 2022-02-19
### Changed:
- **[BREAKING]** This package is now an [ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). Per [revolt.js's README](https://github.com/revoltchat/revolt.js#example-usage-javascript--es6), you must use the `--experimental-specifier-resolution=node` when running scripts.
- `VoltareCommand#reload` now returns a Promise.
## [0.3.4] - 2021-09-12
### Changed:
- Revolt errors are more descriptive
- Updated revolt.js authentication
### Added:
- `allowMalformedSpam` config option
## [0.3.3] - 2021-09-11
### Removed:
- Removed strict command run return types.
### Added:
- More client events, see [wiki](https://github.com/Dexare/Voltare/wiki/The-Event-System).
### Fixed:
- "MalformedData" error log spam
## [0.3.2] - 2021-09-03
### Fixed:
- Formatting in default `exec` and `eval` commands.
- Commands now only get handled in channels that it can send messages in.
## [0.3.1] - 2021-09-02
### Fixed:
- Fixed logging out from the client.
## [0.3.0] - 2021-09-02
### Changed:
- Added typing to the default `exec` command.
- Voltare now logs disconnects to "info".
### Added:
- `VoltareClient.logout()`
- Added channel/server permissions.
- Added channel/server permission checking in the commands module.
- `VoltareClient.permissions.getChannelPerms()`
- `VoltareClient.permissions.getServerPerms()`
### Fixed:
- Fixed bots logging out by only logging out of sessions.
## [0.2.0] - 2021-09-01
### Removed:
- **[BREAKING]** `CommandContext.fetchMember`
### Changed:
- **[BREAKING]** Changed libraries from `better-revolt-js` to `revolt.js`.
### Added:
- `autumnHost` prop to client config
## [0.1.0] - 2021-08-29
- Initial release.

[Unreleased]: https://github.com/Dexare/Voltare/compare/v1.0.2...HEAD
[0.1.0]: https://github.com/Dexare/Dexare/releases/tag/v0.1.0
[0.2.0]: https://github.com/Dexare/Voltare/compare/v0.1.0...v0.2.0
[0.3.0]: https://github.com/Dexare/Voltare/compare/v0.2.0...v0.3.0
[0.3.1]: https://github.com/Dexare/Voltare/compare/v0.3.0...v0.3.1
[0.3.2]: https://github.com/Dexare/Voltare/compare/v0.3.1...v0.3.2
[0.3.3]: https://github.com/Dexare/Voltare/compare/v0.3.2...v0.3.3
[0.3.4]: https://github.com/Dexare/Voltare/compare/v0.3.3...v0.3.4
[1.0.0]: https://github.com/Dexare/Voltare/compare/v0.3.4...v1.0.0
[1.0.1]: https://github.com/Dexare/Voltare/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/Dexare/Voltare/compare/v1.0.1...v1.0.2
