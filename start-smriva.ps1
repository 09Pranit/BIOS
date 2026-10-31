param([switch]$Dev, [switch]$Lan)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) { $nodePath = $nodeCommand.Source } else {
  $cachedNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (Test-Path -LiteralPath $cachedNode) { $nodePath = $cachedNode } else { throw 'Install Node.js 24 or later, then run this script again.' }
}
$env:PATH = (Split-Path -Parent $nodePath) + ';' + $env:PATH
$nodeMajor = & $nodePath -p "Number(process.versions.node.split('.')[0])"
if ($LASTEXITCODE -ne 0 -or [int]$nodeMajor -lt 24) { throw 'Install Node.js 24 or later before starting Smriva.' }
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$localNpm = Join-Path $PSScriptRoot '.tools\package\bin\npm-cli.js'
function Invoke-SmrivaNpm([string[]]$Arguments) {
  if ($npmCommand) { & $npmCommand.Source @Arguments } elseif (Test-Path -LiteralPath $localNpm) { & $nodePath $localNpm @Arguments } else { throw 'npm was not found. Install the standard Node.js distribution, which includes npm.' }
  if ($LASTEXITCODE -ne 0) { throw "npm command failed with code $LASTEXITCODE" }
}
if (-not (Test-Path -LiteralPath 'node_modules')) { Invoke-SmrivaNpm @('ci') }
if ($Dev) { Invoke-SmrivaNpm @('run','dev') } else {
  if (-not (Test-Path -LiteralPath 'dist\index.html')) { Invoke-SmrivaNpm @('run','build') }
  Write-Host 'Starting Smriva. The hub will print its actual access addresses. Press Ctrl+C to stop.'
  if ($Lan) { Invoke-SmrivaNpm @('run','start:lan') } else { Invoke-SmrivaNpm @('start') }
}
