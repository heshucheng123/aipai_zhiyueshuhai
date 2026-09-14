[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$launcher = Join-Path $PSScriptRoot 'open-site.ps1'
$desktop = [Environment]::GetFolderPath('Desktop')
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$shell = New-Object -ComObject WScript.Shell

function ConvertFrom-CodePoints([int[]]$CodePoints) {
  return -join ($CodePoints | ForEach-Object { [char]$_ })
}

$siteName = ConvertFrom-CodePoints @(0x667A, 0x8DC3, 0x4E66, 0x6D77)
$homeName = ConvertFrom-CodePoints @(0x9996, 0x9875)
$adminName = ConvertFrom-CodePoints @(0x540E, 0x53F0)

$definitions = @(
  @{
    Name = "$siteName-$homeName.lnk"
    Page = 'home'
    Description = 'Open the Zhiyue Shuhai website'
    Icon = "$env:SystemRoot\System32\shell32.dll,220"
  },
  @{
    Name = "$siteName-$adminName.lnk"
    Page = 'admin'
    Description = 'Open the Zhiyue Shuhai content editor'
    Icon = "$env:SystemRoot\System32\imageres.dll,109"
  }
)

foreach ($definition in $definitions) {
  $shortcutPath = Join-Path $desktop $definition.Name
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $powershell
  $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launcher`" -Page $($definition.Page)"
  $shortcut.WorkingDirectory = $projectRoot
  $shortcut.WindowStyle = 7
  $shortcut.Description = $definition.Description
  $shortcut.IconLocation = $definition.Icon
  $shortcut.Save()
  Write-Output $shortcutPath
}
