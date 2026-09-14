[CmdletBinding()]
param(
  [ValidateSet('home', 'admin')]
  [string]$Page = 'home',
  [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$portFile = Join-Path $projectRoot '.dev-port'
$runner = Join-Path $PSScriptRoot 'run-dev-server.ps1'
$candidatePorts = 3000..3020
$mutex = [System.Threading.Mutex]::new($false, 'Local\ZhiyueSiteLauncherV2')
$hasLock = $false

function Test-ZhiyueSite([int]$Port) {
  try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/api/content" -TimeoutSec 2
    return (($null -ne $response.content.siteIdentity) -and ($null -ne $response.content.homeStories))
  } catch {
    return $false
  }
}

function Test-PortFree([int]$Port) {
  $listeners = @()
  try {
    foreach ($address in @([System.Net.IPAddress]::Loopback, [System.Net.IPAddress]::IPv6Loopback)) {
      $listener = [System.Net.Sockets.TcpListener]::new($address, $Port)
      $listener.Start()
      $listeners += $listener
    }
    return $true
  } catch {
    return $false
  } finally {
    foreach ($listener in $listeners) { $listener.Stop() }
  }
}

try {
  Write-Verbose 'Waiting for launcher lock.'
  $hasLock = $mutex.WaitOne([TimeSpan]::FromSeconds(40))
  if (-not $hasLock) { throw 'The site launcher is busy. Please try again.' }
  Write-Verbose 'Launcher lock acquired.'

  $port = 0
  if (Test-Path -LiteralPath $portFile) {
    $savedPort = 0
    if (
      [int]::TryParse((Get-Content -LiteralPath $portFile -Raw).Trim(), [ref]$savedPort) -and
      -not (Test-PortFree $savedPort) -and
      (Test-ZhiyueSite $savedPort)
    ) {
      $port = $savedPort
    }
  }

  if ($port -eq 0) {
    Write-Verbose 'Looking for an existing site instance.'
    foreach ($candidate in $candidatePorts) {
      if (-not (Test-PortFree $candidate) -and (Test-ZhiyueSite $candidate)) {
        $port = $candidate
        break
      }
    }
  }

  if ($port -eq 0) {
    Write-Verbose 'Selecting a free port.'
    foreach ($candidate in $candidatePorts) {
      if (Test-PortFree $candidate) {
        $port = $candidate
        break
      }
    }
    if ($port -eq 0) { throw 'All ports from 3000 through 3020 are in use.' }

    Set-Content -LiteralPath $portFile -Value $port -Encoding ascii
    Write-Verbose "Starting the site on port $port."
    Start-Process -FilePath 'powershell.exe' `
      -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $runner, '-Port', $port) `
      -WorkingDirectory $projectRoot `
      -WindowStyle Hidden

    $ready = $false
    foreach ($attempt in 1..60) {
      Start-Sleep -Milliseconds 500
      if (-not (Test-PortFree $port) -and (Test-ZhiyueSite $port)) {
        $ready = $true
        break
      }
    }
    if (-not $ready) { throw "The site did not start successfully on port $port." }
  } else {
    Set-Content -LiteralPath $portFile -Value $port -Encoding ascii
  }

  $pagePath = if ($Page -eq 'admin') { '/admin' } else { '/' }
  $url = "http://localhost:$port$pagePath"
  Write-Verbose "Launcher resolved $url."
} catch {
  if ($NoOpen) {
    Write-Error $_.Exception.Message
  } else {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($_.Exception.Message, 'Site launcher error', 'OK', 'Error') | Out-Null
  }
  exit 1
} finally {
  if ($hasLock) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}

if ($NoOpen) {
  Write-Output $url
} else {
  Start-Process $url
}
