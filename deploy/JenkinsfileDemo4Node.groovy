pipeline {
    agent any
    environment {
        /*通知及构建信息*/
        DEPLOYMENT_PROJECT_NAME = "Beambox后台管理前端" // 应用名称
        PROJECT_NAME = "beambox-vue3" // 应用名称对应的pom.xml <artifactId>标签名称
        DEPLOYMENT_EVN_NAME = "生产环境" // 部署环境名称
        DEPLOYMENT_EVN = "prod" // 部署环境对应应用环境
        INSTALL_COMMAND = "pnpm install"
        BUILD_COMMAND = "pnpm run build:test" // 构建命令
        ROBOT_ID = "CICD" // 机器人ID
        /*git配置*/
        GIT_CREDENTIALSID = "gitlab-token" // 登录git凭证id，请在系统管理处配置
        GIT_BRANCHE_NAME = "main" // 分支名称
        GIT_REPO_URL = "http://120.77.252.7/DeltaMai/beambox-vue3.git"   // git地址
        /*harbor仓库配置*/
        HARBOR_HOST = "harbor.beambox.app" // harbor地址
        HARBOR_CREDENTIALSID = "jenkinsHarbor" // 登录harbor凭证id，请在系统管理处配置
        HARBOR_IMAGE_NAME = "harbor.beambox.app/prod/beambox-vue3"   // 镜像地址
        /*rancher部署配置*/
        RANCHER_REDEPLOY_ENABLE = "true" // 是否开启rancher部署
        RANCHER_CREDENTIAL = "rke2" // 登录Rancher凭证id，请在系统管理处配置
        RANCHER_REDEPLOY_WORKLOAD = "/project/local:p-ltjs9/workloads/deployment:beambox:beambox-vue3" // Rancher API部署地址
        PATH = "/usr/bin:/usr/local/bin:${env.PATH}"
    }
    stages{
        stage('拉取代码'){
            steps{
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    checkout([
                        $class: 'GitSCM',
                        branches: [
                            [
                                name: "*/${GIT_BRANCHE_NAME}"
                            ]
                        ],
                        extensions: [],
                        userRemoteConfigs: [
                            [
                                credentialsId: "${GIT_CREDENTIALSID}",
                                url: "${GIT_REPO_URL}"
                            ]
                        ]
                    ])
                }
            }
        }

        stage('编译代码') {
            steps {
                sh "${INSTALL_COMMAND}"
                sh "${BUILD_COMMAND}"
            }
        }

        stage('构建镜像'){
            steps {
                withCredentials([usernamePassword(credentialsId: "${HARBOR_CREDENTIALSID}",passwordVariable: 'password',usernameVariable: 'username')]) {
                    sh "docker build -t ${HARBOR_IMAGE_NAME}:${env.BUILD_NUMBER} -f ./deploy/Dockerfile . --build-arg envType=${DEPLOYMENT_EVN}"
                    sh "docker login -u admin -p VjkDCE6CZbvJsSMMu5 " + " ${HARBOR_HOST}"
                    sh "docker push ${HARBOR_IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker rmi -f ${HARBOR_IMAGE_NAME}:${env.BUILD_NUMBER}"
                }
            }
        }

        stage('触发部署') {
            // 判断是否执行该阶段
            when {
                environment name: 'RANCHER_REDEPLOY_ENABLE', value: "true"
            }
            steps {
                rancherRedeploy alwaysPull: true, credential: "${RANCHER_CREDENTIAL}", images: "${HARBOR_IMAGE_NAME}:${env.BUILD_NUMBER}",
                workload: "${RANCHER_REDEPLOY_WORKLOAD}"
            }
        }
    }
    post{
        always{
            echo '清理空间'
            deleteDir()
        }
        success {
            echo '部署成功，发送通知'
//             wxwork(
//                 robot: "${ROBOT_ID}",
//                 atAll: true,
//                 type: 'markdown',
//                 text: [
//                        "# <font color=warning>${DEPLOYMENT_EVN_NAME}</font>部署通知",
//                         "> 项目名称：${PROJECT_NAME}",
//                         "> 部署用户：${BUILD_USER}",
//                         "> 部署项目：${currentBuild.projectName}",
//                         "> 部署次数：第${currentBuild.number}次构建",
//                         "> 部署状态：<font color=info>**${currentBuild.currentResult}**</font>",
//                         "> 部署耗时：${currentBuild.durationString}",
//                         "> 构建日志：[点击查看详情](${BUILD_URL}console)"
//                 ]
//             )
        }
        failure {
            echo '部署失败，发送通知'
//             wxwork(
//                 robot: "${ROBOT_ID}",
//                 atAll: true,
//                 type: 'markdown',
//                 text: [
//                         "# <font color=warning>${DEPLOYMENT_EVN_NAME}</font>部署通知",
//                         "> 项目名称：${PROJECT_NAME}",
//                         "> 部署用户：${BUILD_USER}",
//                         "> 部署项目：${currentBuild.projectName}",
//                         "> 部署次数：第${currentBuild.number}次构建",
//                         "> 部署状态：<font color=red>**${currentBuild.currentResult}**</font>",
//                         "> 部署耗时：${currentBuild.durationString}",
//                         "> 构建日志：[点击查看详情](${BUILD_URL}console)"
//                 ]
//             )
        }
    }
}
