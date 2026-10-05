# BloomCraft backend quality gate. Stops at the first failing step; exits non-zero on failure.
# Run from anywhere:  powershell -NoProfile -ExecutionPolicy Bypass -File backend/scripts/check.ps1
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
$backend = Split-Path -Parent $PSScriptRoot

$steps = @(
    @{ Name = 'ruff check';        Cmd = { uv run ruff check . } },
    @{ Name = 'ruff format';       Cmd = { uv run ruff format --check . } },
    @{ Name = 'mypy --strict';     Cmd = { uv run mypy } },
    @{ Name = 'pytest + coverage'; Cmd = { uv run pytest --cov --cov-report=json:var/coverage.json -q } },
    @{ Name = 'coverage floors';   Cmd = { uv run python scripts/coverage_gate.py var/coverage.json } },
    @{ Name = 'pip-audit';         Cmd = { uv run pip-audit --skip-editable } },
    @{ Name = 'gitleaks';          Cmd = { gitleaks dir . --config .gitleaks.toml --redact --no-banner --exit-code 1 } },
    @{ Name = 'openapi snapshot';  Cmd = { uv run bloomcraft openapi --check } }
)

$results = @()
$failed = $null
Push-Location $backend
try {
    foreach ($step in $steps) {
        Write-Host ""
        Write-Host "==> $($step.Name)" -ForegroundColor Cyan
        $started = Get-Date
        & $step.Cmd
        $code = $LASTEXITCODE
        $seconds = [math]::Round(((Get-Date) - $started).TotalSeconds, 1)
        $results += [pscustomobject]@{ Step = $step.Name; Result = $(if ($code -eq 0) { 'PASS' } else { "FAIL ($code)" }); Seconds = $seconds }
        if ($code -ne 0) {
            $failed = $step.Name
            break
        }
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "==> Summary" -ForegroundColor Cyan
$results | Format-Table -AutoSize | Out-String | Write-Host
if ($failed) {
    Write-Host "check.ps1 FAILED at: $failed" -ForegroundColor Red
    exit 1
}
Write-Host "check.ps1 passed ($($results.Count) steps)" -ForegroundColor Green
exit 0
