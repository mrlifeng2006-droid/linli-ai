# 邻里AI后端接口测试 v2
$body = '{"shopName":"老王咖啡馆","industry":"咖啡厅","address":"深圳","types":["social"],"style":"friendly"}'

$uri = "http://localhost:3000/api/v1/ai/generate"
$headers = @{"Content-Type"="application/json; charset=utf-8"}

try {
    $params = @{
        Uri = $uri
        Method = "Post"
        ContentType = "application/json; charset=utf-8"
        Body = $body
        TimeoutSec = 30
    }
    $resp = Invoke-RestMethod @params
    Write-Host "Status: OK"
    Write-Host "Code:" $resp.code
    Write-Host "Message:" $resp.message
    if ($resp.data) {
        Write-Host "Results:" $resp.data.results.Count
        Write-Host "Preview:" $resp.data.results[0].content.Substring(0, [Math]::Min(200, $resp.data.results[0].content.Length))
    }
} catch {
    Write-Host "Error:" $_.Exception.Message
    try {
        $wresp = Invoke-WebRequest -Uri $uri -Method Post -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec 30
        Write-Host "WebResponse Status:" $wresp.StatusCode
        Write-Host "Content:" $wresp.Content.Substring(0, 500)
    } catch {
        Write-Host "WebRequest Error:" $_.Exception.Message
    }
}
