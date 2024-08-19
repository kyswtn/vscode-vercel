{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = { nixpkgs, ... }:
    let
      mkInputs = system: {
        pkgs = nixpkgs.legacyPackages.${system};
      };
      forAllSupportedSystems = fn:
        with nixpkgs.lib; genAttrs systems.flakeExposed (system: fn (mkInputs system));
    in
    {
      devShells = forAllSupportedSystems (inputs: with inputs; {
        default = pkgs.mkShellNoCC {
          packages = with pkgs; [
            bun
            biome
            nodePackages.vercel
            vscode-langservers-extracted
            nodePackages.typescript-language-server
          ];
        };
      });
    };
}
