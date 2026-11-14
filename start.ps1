param([switch]$Test)
$ErrorActionPreference = 'Stop'
$venvPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
$pythonCommand = Get-Command python,python3 -ErrorAction SilentlyContinue | Select-Object -First 1
$pythonPath = if (Test-Path -LiteralPath $venvPython) { $venvPython } elseif ($pythonCommand) { $pythonCommand.Source } else { $null }
if (-not $pythonPath) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $runtimeDependencies = Split-Path (Split-Path (Split-Path $nodeCommand.Source -Parent) -Parent) -Parent
        $bundledPython = Join-Path $runtimeDependencies 'python\python.exe'
        if (Test-Path -LiteralPath $bundledPython) { $pythonPath = $bundledPython }
    }
}
if (-not $pythonPath) { throw 'Python 3 is required. Install Python 3, then run python server.py.' }
Push-Location $PSScriptRoot
try {
    if ($Test) { & $pythonPath -m unittest discover -v -p 'test_*.py' }
    else { & $pythonPath server.py }
    $runExitCode = $LASTEXITCODE
} finally { Pop-Location }
exit $runExitCode
