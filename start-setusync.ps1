# Compatibility launcher. The application is now Smriva.
param([switch]$Dev)
& (Join-Path $PSScriptRoot 'start-smriva.ps1') -Dev:$Dev
