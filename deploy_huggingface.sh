#!/usr/bin/env bash
set -e

# ==============================================================================
# SCRIPT DEPLOY 100% GRATIS TANPA KARTU (HUGGING FACE SPACES DOCKER)
# Web Mie Jebew CMS & Public Portal
# ==============================================================================

echo "========================================================"
echo "🚀 MIE JEBEW - DEPLOY KE HUGGING FACE SPACES (100% FREE)"
echo "   RAM 16 GB · 2 vCPU · Bebas Biaya · Tanpa Kartu Kredit"
echo "========================================================"

HF_USER="${1:-alkaadam78-source}"
HF_TOKEN="$2"

if [ -z "$HF_TOKEN" ]; then
  echo ""
  echo "Untuk deploy otomatis tanpa kartu kredit, Anda hanya butuh HF Token gratis:"
  echo "1. Buka https://huggingface.co/settings/tokens (Sign in with GitHub)"
  echo "2. Klik '+ Create new token' -> Pilih Type 'Write' -> Copy tokennya (awalan: hf_...)"
  echo ""
  read -r -p "👉 Paste Hugging Face Token Anda di sini (hf_...): " HF_TOKEN
fi

if [ -z "$HF_TOKEN" ]; then
  echo "❌ Error: Token tidak boleh kosong!"
  exit 1
fi

SPACE_NAME="mie-jebew"

echo ""
echo "📦 1. Memeriksa / Membuat Space di Hugging Face ($SPACE_NAME)..."
CREATE_RES=$(curl -s -X POST https://huggingface.co/api/repos/create \
  -H "Authorization: Bearer $HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$SPACE_NAME\", \"type\": \"space\", \"sdk\": \"docker\", \"private\": false}")

if echo "$CREATE_RES" | grep -q "already exists"; then
  echo "ℹ️  Space $SPACE_NAME sudah ada, melanjutkan sinkronisasi file..."
elif echo "$CREATE_RES" | grep -q "error"; then
  echo "⚠️  Catatan API: $CREATE_RES"
else
  echo "✅ Space baru berhasil dibuat di Hugging Face!"
fi

echo ""
echo "🔨 2. Menyiapkan Git Remote Hugging Face..."
cd "$(dirname "$0")"

git remote remove hf 2>/dev/null || true
git remote add hf "https://$HF_USER:$HF_TOKEN@huggingface.co/spaces/$HF_USER/$SPACE_NAME"

echo ""
echo "🚀 3. Mengunggah Kode & Dockerfile ke Cloud Hugging Face..."
git push hf main --force

echo ""
echo "========================================================"
echo "🎉 DEPLOY BERHASIL DIKIRIM KE CLOUD!"
echo "========================================================"
echo ""
echo "🌐 URL Space Anda: https://huggingface.co/spaces/$HF_USER/$SPACE_NAME"
echo "🔗 Domain Langsung: https://$HF_USER-$SPACE_NAME.hf.space"
echo ""
echo "ℹ️  Cloud sedang membangun Docker container (estimasi 2-3 menit)."
echo "    Setelah status 'Running', website Anda langsung aktif 24 jam!"
echo "========================================================"
