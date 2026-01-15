$user = "mosros"
$pass = "Myrost4012!!mmm"
$baseUrl = "ftp://myfavoritemalshin.space/myfavoritemalshin.space/chess-tutor/"

$files = @(
    "index.html",
    "main.js",
    "style.css",
    "ai-tutor-service.js",
    "stockfish-engine.js"
)

$publicFiles = @(
    "public/stockfish-asm.js",
    "public/stockfish-17.1-lite-51f59da.js",
    "public/stockfish-17.1-lite-51f59da.wasm",
    "public/stockfish.js",
    "public/stockfish.wasm"
)

foreach ($file in $files) {
    Write-Host "Uploading $file..."
    curl.exe -v -u "$($user):$($pass)" -T $file "$($baseUrl)$($file)"
}

foreach ($file in $publicFiles) {
    Write-Host "Uploading $file..."
    $fileName = Split-Path $file -Leaf
    curl.exe -v -u "$($user):$($pass)" -T $file "$($baseUrl)public/$($fileName)"
}

Write-Host "Upload complete."
