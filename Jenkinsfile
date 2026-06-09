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

                stage('Instalar dependências e compilar') {
                    steps {
                        dir('backend') {
                            sh '''
                                docker run --rm \
                                    -v $(pwd):/app \
                                    -w /app \
                                    node:20-alpine \
                                    sh -c "npm ci --prefer-offline && npm run build"
                            '''
                        }
                    }
                }
                
                stage('Empacotar artefato') {
                    steps {
                        dir('backend') {
                            sh '''
                                mkdir -p artifacts
                                tar -czf artifacts/dist-${BUILD_ID}.tar.gz dist/
                            '''
                            stash name: 'dist', includes: 'dist/**,artifacts/**'
                            archiveArtifacts artifacts: 'artifacts/*.tar.gz', fingerprint: true
                        }
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