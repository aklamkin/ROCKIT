# PowerShell static file server — zero dependencies, works on any Windows 10/11
# Usage: right-click → "Run with PowerShell", or: powershell -File serve.ps1

$port = 8080
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  Rockefeller Center IT Asset Manager"
Write-Host "  Running at http://localhost:$port"
Write-Host "  Press Ctrl+C to stop"
Write-Host ""

Start-Process "http://localhost:$port"

$mimeTypes = @{
    ".html" = "text/html"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".css"  = "text/css"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestUrl = $context.Request.Url.LocalPath
        if ($requestUrl -eq "/") { $requestUrl = "/index.html" }

        $filePath = Join-Path $root $requestUrl.Replace("/", "\")
        $ext = [System.IO.Path]::GetExtension($filePath)

        if (Test-Path $filePath) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $context.Response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $context.Response.ContentLength64 = $content.Length
            $context.Response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $context.Response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not found")
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
}
