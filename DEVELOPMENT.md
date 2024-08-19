The project uses [Nix](https://nixos.org). In case you don't want to it, install the dependencies and language servers listed in `flake.nix` manually. The followings are essential.

- [biome](https://biomejs.dev) &mdash; linter & formatter
- [bun](https://bun.sh) &mdash; script runner & package manager

## How to run the extension

1. Install all dependencies with `bun i`.
2. `cd` into `extension/` and run `build:extension` or `watch:extension` script
3. `Run Extension` from debug panel or F5 to run the extension.

## How to setup Nix for this project

1. [Install nix](https://nix.dev/manual/nix/2.18/installation/installation). Enable [`flakes`](https://nix.dev/manual/nix/2.18/command-ref/new-cli/nix3-flake) and [`nix-command`](https://nix.dev/manual/nix/2.18/command-ref/new-cli/nix) features.
3. `nix develop` will bring you into [`nix-shell`](https://nix.dev/manual/nix/2.18/command-ref/nix-shell) with all the dependencies installed on the first time.
4. Install [direnv](https://direnv.net) and `direnv allow` in case you don't want to run `nix develop` everytime.
