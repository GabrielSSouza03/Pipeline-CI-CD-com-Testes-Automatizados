// Secrets reutilizados em múltiplos stages — definidos uma única vez aqui.
// Para adicionar ou remover um secret, edite somente esta lista.
def appSecrets() {
    return [
        string(credentialsId: 'DB_USER',        variable: 'DB_USER'),
        string(credentialsId: 'DB_PASSWORD',    variable: 'DB_PASSWORD'),
        string(credentialsId: 'DB_NAME',        variable: 'DB_NAME'),
        string(credentialsId: 'JWT_SECRET',     variable: 'JWT_SECRET'),
        string(credentialsId: 'JWT_EXPIRES_IN', variable: 'JWT_EXPIRES_IN')
    ]
}

pipeline {
    agent any

    options {
        timeout(time: 40, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        TEST_PROJECT   = "test_${BUILD_ID}"
        DEPLOY_PROJECT = "deploy_${BUILD_ID}"
        IMAGE_TAG      = "${GIT_COMMIT}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ─────────────────────────────
        // BUILD + PUSH GHCR
        // ─────────────────────────────
        stage('Build & Push') {
            steps {
                    dir('backend') {
                        withCredentials([usernamePassword(
                            credentialsId: 'ghcr-credentials',
                            usernameVariable: 'GHCR_USER',
                            passwordVariable: 'GHCR_TOKEN'
                        )]) {

                            sh """
                                echo \$GHCR_TOKEN | docker login ghcr.io -u \$GHCR_USER --password-stdin
                            """

                            sh """
                                docker build -t ghcr.io/\$GHCR_USER/pipeline-ci-cd-com-testes-automatizados:${IMAGE_TAG} .
                            """

                            sh """
                                docker push ghcr.io/\$GHCR_USER/pipeline-ci-cd-com-testes-automatizados:${IMAGE_TAG}
                            """
                        }
                    }
            }
        }

        // ─────────────────────────────────────────
        // 2. TESTES
        // ─────────────────────────────────────────

        stage('Test') {
            steps {
                withCredentials([
                    string(credentialsId: 'DB_USER', variable: 'DB_USER'),
                    string(credentialsId: 'DB_PASSWORD', variable: 'DB_PASSWORD'),
                    string(credentialsId: 'DB_NAME', variable: 'DB_NAME'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'JWT_EXPIRES_IN', variable: 'JWT_EXPIRES_IN')
                ]) {
                    dir('backend') {
                        sh '''
                            docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} down -v || true
                            docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} build --no-cache
                            docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} up -d

                            timeout 60s bash -c 'until docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} exec -T postgres pg_isready -U '"$DB_USER"'; do sleep 2; done'

                            docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} exec -T app npx prisma generate
                            docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} exec -T app npm test
                        '''
                    }
                }
            }
            post {
                always {
                    echo 'Publicando artifacts...'

                    archiveArtifacts artifacts: 'artifacts/**', fingerprint: true, allowEmptyArchive: true
                    junit testResults: 'artifacts/test-results.xml', allowEmptyResults: true

                    dir('backend') {
                        sh '''
                            docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} logs --tail 100 || true
                            docker compose -f ../docker-compose.yml -p ${TEST_PROJECT} down -v || true
                        '''
                    }
                }
            }
        }

    }

    // ─────────────────────────────────────────
    // POST GLOBAL
    // ─────────────────────────────────────────
    post {
        success {
            echo "Pipeline concluído com sucesso — Build #${BUILD_NUMBER}."
        }
        failure {
            echo "Pipeline falhou — Build #${BUILD_NUMBER}. Verifique os logs acima."
        }
        always {
            cleanWs()
        }
    }
}