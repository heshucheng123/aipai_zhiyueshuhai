param(
  [Parameter(Mandatory = $true)]
  [int]$Port
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
& pnpm.cmd run dev --port $Port
exit $LASTEXITCODE
