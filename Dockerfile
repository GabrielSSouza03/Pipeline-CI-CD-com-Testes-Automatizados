# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json e lockfile primeiro (melhor cache)
COPY package*.json ./
RUN npm ci 

# Copia o resto do código
COPY . .

# Gera o Prisma Client (obrigatório no build)
RUN npx prisma generate

# Etapa final
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário da etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./
COPY --from=builder /app/docker-entrypoint.sh ./
#COPY --from=builder /app/tests ./tests

# Torna o entrypoint executável
RUN chmod +x docker-entrypoint.sh

# Expõe a porta
EXPOSE 3000

# Usa o entrypoint personalizado
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]