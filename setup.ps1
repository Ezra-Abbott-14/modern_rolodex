$ErrorActionPreference = 'Stop'
$venvPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $venvPython)) {
    $pythonCommand = Get-Command python,python3 -ErrorAction SilentlyContinue | Select-Object -First 1
    $pythonPath = if ($pythonCommand) { $pythonCommand.Source } else { $null }
    if (-not $pythonPath) {
        $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeCommand) {
            $runtimeRoot = Split-Path (Split-Path (Split-Path $nodeCommand.Source -Parent) -Parent) -Parent
            $candidate = Join-Path $runtimeRoot 'python\python.exe'
            if (Test-Path -LiteralPath $candidate) { $pythonPath = $candidate }
        }
    }
    if (-not $pythonPath) { throw 'Install Python 3.10 or newer, then retry setup.ps1.' }
    & $pythonPath -m venv (Join-Path $PSScriptRoot '.venv')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
& $venvPython -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output 'Dependencies installed. Run .\start.ps1 to start Rolodexi, or .\start.ps1 -Test to test.'
