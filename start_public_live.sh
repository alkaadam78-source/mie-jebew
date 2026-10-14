#!/usr/bin/env bash
# Script untuk menjalankan Public Domain Tunnel secara otomatis dan auto-restart

echo "=========================================================="
echo "🌐 MIE JEBEW - LIVE PUBLIC DOMAIN TUNNEL"
echo "=========================================================="

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai koneksi domain publik..."
  ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:localhost:3001 nokey@localhost.run
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Koneksi terputus, menghubungkan ulang dalam 3 detik..."
  sleep 3
done
