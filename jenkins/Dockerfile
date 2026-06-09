FROM jenkins/jenkins:lts

USER root

# Instala dependências base + Docker oficial + Node.js 20
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates lsb-release && \
    # Repositório oficial do Docker
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
        https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list && \
    # Repositório oficial do Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    # Instala tudo de uma vez
    apt-get update && \
    apt-get install -y \
        docker-ce-cli \
        docker-compose-plugin \
        nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER jenkins