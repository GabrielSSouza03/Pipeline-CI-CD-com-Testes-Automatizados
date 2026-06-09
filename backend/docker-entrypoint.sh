#!/bin/sh
set -e

echo "========================================"
echo "Iniciando container do backend..."
echo "Aplicando migrações do Prisma (se existirem)..."

npx prisma generate
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Migrações aplicadas com sucesso (ou não havia migrações pendentes)."

echo "Iniciando o servidor Node.js..."

exec "$@"