Set-Location "d:\Project\FumoBOT\alterGolden - Backend"; Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue; npx tsc; node dist/index.js
