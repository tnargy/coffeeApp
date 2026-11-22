# Copy this into a repo as flake.nix (coffeeApp, kittyApp, etc.)
# and add a file named `.envrc` next to it containing exactly:
#   use flake
# Then run `direnv allow` once in that repo.
#
# Result: `node`, `pnpm`, `tsc` are the pinned versions below,
# everywhere you clone the repo - this VM, your desktop, CI.
{
  description = "React / TypeScript / Vite dev shell";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [
          pkgs.nodejs_22
          pkgs.pnpm
          pkgs.typescript
        ];

        shellHook = ''
          echo "node $(node --version) / pnpm $(pnpm --version)"
        '';
      };
    };
}
