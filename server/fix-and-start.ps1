# fix-and-start.ps1
# 邻里AI后端修复与启动脚本（一步执行，避免自动中止）
Write-Host "1. 检查端口3000..."
$port = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($port) {
    $processId = ($port -split '\s+')[-1]
    Write-Host "  发现进程 $processId，结束中..."
    taskkill /F /PID $processId 2>$null
    Start-Sleep -Seconds 2
}
Write-Host "2. 编译后端..."
cd "D:\桌面\邻里Ai代码\server"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ 编译失败"; exit 1 }
Write-Host "3. 启动编译版本 (使用Start-Process)..."
Start-Process -FilePath "node" -ArgumentList "dist/app.js" -WorkingDirectory "D:\桌面\邻里Ai代码\server" -WindowStyle Hidden
Write-Host "4. 等待3秒，让服务启动..."
Start-Sleep -Seconds 3
Write-Host "5. 验证端口监听状态..."
$listening = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($listening) {
    $actualPid = ($listening -split '\s+')[-1]
    Write-Host "✅ 成功！端口3000正在监听 (进程ID: $actualPid)"
    Write-Host "✅ 后端服务已启动，可访问 http://localhost:3000/api/v1/health"
} else {
    Write-Host "❌ 失败！端口3000未监听"
    Write-Host "   检查相关进程："
    tasklist | findstr "node" | ForEach-Object { Write-Host "      $_" }
}
Write-Host "6. 脚本执行完毕。"