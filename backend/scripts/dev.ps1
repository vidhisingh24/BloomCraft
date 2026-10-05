# Local development: Mailpit (if needed) + worker (background) + API with reload (foreground).
# Run from anywhere:  powershell -NoProfile -ExecutionPolicy Bypass -File backend/scripts/dev.ps1
# Ctrl+C stops the API and the worker. PostgreSQL is never started or stopped here.
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
$backend = Split-Path -Parent $PSScriptRoot

function Test-PortListening([int]$Port) {
    $null -ne (Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

Push-Location $backend
$worker = $null
try {
    if (Test-PortListening 1025) {
        Write-Host 'Mailpit: already listening on 127.0.0.1:1025'
    }
    else {
        $mailpit = Get-Command mailpit -ErrorAction SilentlyContinue
        if ($mailpit) {
            Start-Process -FilePath $mailpit.Source -ArgumentList '--smtp', '127.0.0.1:1025', '--listen', '127.0.0.1:8025' -WindowStyle Hidden | Out-Null
            Write-Host 'Mailpit: started (SMTP 127.0.0.1:1025, UI http://127.0.0.1:8025)'
        }
        else {
            Write-Warning 'Mailpit is not on PATH; email will fail until it runs.'
        }
    }

    $pg = Get-Service -Name 'postgresql-x64-18' -ErrorAction SilentlyContinue
    if ($null -eq $pg -or $pg.Status -ne 'Running') {
        Write-Warning 'PostgreSQL service postgresql-x64-18 is not running; /health/ready will report 503.'
    }

    # The worker shares this console, so Ctrl+C reaches it too (graceful shutdown).
    $worker = Start-Process -FilePath 'uv' -ArgumentList 'run', 'python', '-m', 'app.workers' -NoNewWindow -PassThru
    Write-Host "Worker: started (pid $($worker.Id))"

    Write-Host 'API: http://127.0.0.1:8000  (docs: /docs)'
    & uv run uvicorn app.main:app --reload --port 8000 --no-server-header --no-proxy-headers --no-access-log
}
finally {
    if ($worker -and -not $worker.HasExited) {
        if (-not $worker.WaitForExit(5000)) {
            & taskkill.exe /PID $worker.Id /T /F | Out-Null
        }
    }
    Pop-Location
}
