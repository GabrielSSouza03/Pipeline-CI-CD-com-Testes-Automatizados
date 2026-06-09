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
        IMAGE_NAME     = "c14-np2"
        IMAGE_TAG      = "c14-np2:${GIT_COMMIT}"
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
 
                stage('Instalar dependências') {
                    steps {
                        dir('backend') {
                            sh 'npm ci --prefer-offline'
                        }
                    }
                }
 
                stage('Build da imagem Docker') {
                    steps {
                        dir('backend') {
                            sh "docker build -t ${IMAGE_TAG} ."
                        }
                    }
                }
 
                stage('Salvar imagem como artefato') {
                    steps {
                        sh "docker save ${IMAGE_TAG} -o tcc-backend-image.tar"
                        archiveArtifacts artifacts: 'tcc-backend-image.tar',
                                         fingerprint: true
                    }
                }
 
            }
            post {
                always {
                    sh "docker image rm ${IMAGE_TAG} || true"
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