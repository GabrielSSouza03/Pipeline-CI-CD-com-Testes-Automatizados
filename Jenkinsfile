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
        BUILD_PROJECT  = "build_${BUILD_ID}"
        TEST_PROJECT   = "test_${BUILD_ID}"
        DEPLOY_PROJECT = "deploy_${BUILD_ID}"
        IMAGE_TAG      = "app:${BUILD_ID}"
        NOTIFY_TO      = 'time@empresa.com'
    }

    stages {

        // ─────────────────────────────────────────
        // 1. BUILD do backend
        // ─────────────────────────────────────────
        stage('Build') {
            stages {

                stage('Checkout') {
                    steps {
                        checkout scm
                    }
                }

                stage('Compilar projeto') {
                    steps {
                        withCredentials(appSecrets()) {
                            sh """
                                docker compose -p ${BUILD_PROJECT} down -v || true
                                docker compose -p ${BUILD_PROJECT} build --no-cache
                            """
                        }
                    }
                }

                stage('Empacotar artefato') {
                    steps {
                        withCredentials(appSecrets()) {
                            sh """
                                docker compose -p ${BUILD_PROJECT} run --rm --no-deps app \
                                    sh -c \'mkdir -p /app/artifacts && tar -czf /app/artifacts/dist-${BUILD_ID}.tar.gz -C /app dist\'
                                mkdir -p artifacts
                                docker cp \$(docker compose -p ${BUILD_PROJECT} ps -q app):/app/artifacts/dist-${BUILD_ID}.tar.gz artifacts/ || true
                            """
                        }
                        stash name: 'dist', includes: 'artifacts/**'
                        archiveArtifacts artifacts: 'artifacts/*.tar.gz', fingerprint: true
                    }
                }

            }
            post {
                always {
                    sh "docker compose -p ${BUILD_PROJECT} down -v || true"
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