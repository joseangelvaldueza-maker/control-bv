Write-Host "Iniciando Base de Datos..."
docker-compose up -d

Write-Host "Esperando a que la base de datos este lista..."
Start-Sleep -Seconds 5

Write-Host "Iniciando Aplicacion..."
Start-Process "http://localhost:3000"
npm run dev
