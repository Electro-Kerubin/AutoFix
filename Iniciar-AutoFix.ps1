param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$nodePath = Join-Path $projectRoot '.tools\node_modules\node\bin\node.exe'
Push-Location $projectRoot
try {
    if (!(Test-Path -LiteralPath $nodePath)) {
        & npm.cmd install --prefix .tools node@24.15.0 --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar Node local.' }
    }
    foreach ($folder in @('Backend', 'Frontend')) {
        if (!(Test-Path -LiteralPath (Join-Path $projectRoot "$folder\node_modules"))) {
            Push-Location (Join-Path $projectRoot $folder)
            try { & npm.cmd ci --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw "Falló la instalación de $folder." } } finally { Pop-Location }
        }
    }
    $envPath = Join-Path $projectRoot 'Backend\.env'
    if (!(Test-Path -LiteralPath $envPath)) {
        $text = [IO.File]::ReadAllText((Join-Path $projectRoot 'Backend\.env.example'))
        $text = $text.Replace('JWT_SECRET=', 'JWT_SECRET=' + [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N'))
        [IO.File]::WriteAllText($envPath, $text, [Text.UTF8Encoding]::new($false))
    }
    & docker compose up -d db
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL. Comprueba Docker Desktop.' }
    function Port-InUse([int]$Port) { return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) }
    if (!(Port-InUse 3000)) {
        Push-Location (Join-Path $projectRoot 'Backend')
        try { & $nodePath node_modules/@nestjs/cli/bin/nest.js build; if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del backend.' } } finally { Pop-Location }
        $entry = Join-Path $projectRoot 'Backend\dist\main.js'
        Start-Process -FilePath $nodePath -ArgumentList ('"' + $entry + '"') -WorkingDirectory (Join-Path $projectRoot 'Backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'Backend\server.log') -RedirectStandardError (Join-Path $projectRoot 'Backend\server-error.log')
    }
    if (!(Port-InUse 4201)) {
        $entry = Join-Path $projectRoot 'Frontend\node_modules\@angular\cli\bin\ng.js'
        Start-Process -FilePath $nodePath -ArgumentList ('"' + $entry + '" serve --host localhost --port 4201 --proxy-config proxy.conf.json') -WorkingDirectory (Join-Path $projectRoot 'Frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'Frontend\server.log') -RedirectStandardError (Join-Path $projectRoot 'Frontend\server-error.log')
    }
    $ready = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        try {
            $health = Invoke-RestMethod -Uri 'http://localhost:4201/api/health' -TimeoutSec 2
            if ($health.status -eq 'ok' -and $health.db -eq 'up') { $ready = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    if (!$ready) { throw 'La aplicación no respondió a tiempo. Revisa Backend/server-error.log y Frontend/server-error.log.' }
    Write-Host 'AutoFix disponible: http://localhost:4201' -ForegroundColor Green
    if (!$NoBrowser) { Start-Process 'http://localhost:4201' }
} finally { Pop-Location }