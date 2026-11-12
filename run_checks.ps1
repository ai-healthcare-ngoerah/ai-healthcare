# ==============================================================================
# 🧪 LOCAL CI/CD CHECK RUNNER (PowerShell - Windows)
# Healthcare Automation Frontend Suite (Vite + React)
# ==============================================================================

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "🌐 RUNNING LOCAL CI/CD PIPELINE - FRONTEND (ternak-automation-project)" -ForegroundColor Cyan
Write-Host "Branch Target: main" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Cyan

# Step 1: ESLint Check
Write-Host "`n▶️  [1/2] Checking ESLint code quality..." -ForegroundColor Magenta
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Lint warnings detected (non-blocking)." -ForegroundColor Yellow
} else {
    Write-Host "✅ ESLint: Clean!" -ForegroundColor Green
}

# Step 2: Vite Production Build
Write-Host "`n▶️  [2/2] Compiling production build (npm run build)..." -ForegroundColor Magenta
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Production build failed! Fix compilation errors before pushing to main." -ForegroundColor Red
    exit 1
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "🎉 FRONTEND BUILD SUCCEEDED (100%)! Ready to git push to origin main." -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
