$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$extensionRoot = Join-Path $projectRoot 'extension'
$manifest = Get-Content -LiteralPath (Join-Path $extensionRoot 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.version -notmatch '^\d+\.\d+\.\d+(\.\d+)?$') {
  throw 'Unexpected extension version.'
}
$releaseRoot = Join-Path $projectRoot 'release'
$name = 'diver-' + $manifest.version + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
$stage = Join-Path $releaseRoot $name
$archive = Join-Path $releaseRoot ($name + '.zip')
$files = @(
  'manifest.json', 'automatic-warning.js', 'automatic-watch.js', 'privacy.html',
  'engine/analyzer.js', 'engine/rules/url-structure.js', 'engine/site-identity.js',
  'engine/form-collector.js', 'engine/form-analyzer.js', 'engine/frame-inspection.js',
  'engine/warning-policy.js', 'engine/reputation.js', 'engine/general-reputation.js', 'engine/hybrid-reputation.js',
  'popup/popup.html', 'popup/popup.css', 'popup/popup.js', 'popup/ocean-motion.js',
  'icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png',
  'vendor/tldts-7.4.16.js', 'vendor/tldts-LICENSE', 'vendor/tldts-core-LICENSE',
  'vendor/eth-phishing-detect-LICENSE', 'vendor/phishing-filter-NOTICE', 'vendor/phishing-filter-CC-BY-SA-4.0.txt'
)
foreach ($relative in $files) {
  if (-not (Test-Path -LiteralPath (Join-Path $extensionRoot $relative) -PathType Leaf)) {
    throw ('Missing runtime file: ' + $relative)
  }
}
New-Item -ItemType Directory -Path $stage -Force | Out-Null
foreach ($relative in $files) {
  $target = Join-Path $stage $relative
  New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $extensionRoot $relative) -Destination $target
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($archive, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($relative in $files) {
    $entryName = $relative.Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, (Join-Path $stage $relative), $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
} finally {
  $zip.Dispose()
}
Write-Output ('Release candidate package: ' + $archive)
Write-Output 'Publication still requires support/privacy URLs, listing details and Store review.'
