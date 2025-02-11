

## README: CI/CD Pipeline Setup for Campground Application

### Overview

This document provides a comprehensive guide for setting up a Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Campground application. It includes instructions for installing and configuring Jenkins, Docker, SonarQube, and Elastic Kubernetes Service (EKS), as well as detailed steps for local execution, development deployment, and the final deployment pipeline to EKS.

### Prerequisites

Before you begin, ensure you have the following:

*   An Ubuntu machine (recommended)
*   AWS account with appropriate permissions to create EKS clusters and related resources
*   Docker Hub account for container image storage
*   SonarQube instance (either local or cloud-based)
*   Basic understanding of CI/CD concepts, Docker, Kubernetes, and AWS EKS

### 1. Setting Up Jenkins

#### 1.1. Installing Jenkins on Ubuntu

Use the following script to install Jenkins on your Ubuntu machine. This script installs OpenJDK 17, adds the Jenkins repository, and installs the Jenkins package.

```bash
#!/bin/bash

# Install OpenJDK 17 JRE Headless
sudo apt install openjdk-17-jre-headless -y

# Download Jenkins GPG key
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
    https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key

# Add Jenkins repository to package manager sources
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
    https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
    /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update package manager repositories
sudo apt-get update

# Install Jenkins
sudo apt-get install jenkins -y
```

After running the script, Jenkins will be accessible on port `8080`. Follow the on-screen instructions to complete the setup, including unlocking Jenkins with the initial admin password and installing suggested plugins.

### 2. Installing Docker

#### 2.1. Installing Docker for Future Use

Docker is used for containerizing the application. Here’s the script to install Docker on Ubuntu:

```bash
#!/bin/bash

# Update package manager repositories
sudo apt-get update

# Install necessary dependencies
sudo apt-get install -y ca-certificates curl

# Create directory for Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings

# Download Docker's GPG key
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o \
    /etc/apt/keyrings/docker.asc

# Ensure proper permissions for the key
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add Docker repository to Apt sources
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package manager repositories
sudo apt-get update

# Install Docker
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo chmod 666 /var/run/docker.sock
```

This script installs Docker CE, the Docker CLI, `containerd.io`, `docker-buildx-plugin`, and `docker-compose-plugin`. After installation, the script modifies permissions for the Docker socket.

### 3. Setting Up SonarQube

#### 3.1. Running SonarQube with Docker

SonarQube is used for static code analysis. The following command sets up SonarQube using Docker:

```bash
docker run -d --name sonar -p 9000:9000 sonarqube:lts-community
```

This command pulls the latest LTS community version of SonarQube and runs it in a Docker container, exposing it on port `9000`. Access SonarQube at `http://localhost:9000` (or the appropriate IP address).

### 4. Setting Up EKS (Elastic Kubernetes Service)

#### 4.1. AWS CLI Installation

Install the AWS CLI to interact with AWS services:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install unzip
unzip awscliv2.zip
sudo ./aws/install
aws configure
```

After installation, configure the AWS CLI with your AWS access key ID, secret access key, region, and output format.

#### 4.2. kubectl Installation

`kubectl` is the Kubernetes command-line tool that allows you to run commands against Kubernetes clusters:

```bash
curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.19.6/2021-01-05/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin
kubectl version --short --client
```

#### 4.3. eksctl Installation

`eksctl` is a command-line tool for creating and managing EKS clusters:

```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
eksctl version
```

#### 4.4. Creating an EKS Cluster

Use `eksctl` to create an EKS cluster. The following commands create a cluster named `my-eks22` in the `ap-south-1` region with a managed node group:

```bash
eksctl create cluster --name=my-eks22 \
    --region=ap-south-1 \
    --zones=ap-south-1a,ap-south-1b \
    --without-nodegroup

eksctl utils associate-iam-oidc-provider \
    --region ap-south-1 \
    --cluster my-eks22 \
    --approve

eksctl create nodegroup --cluster=my-eks22 \
    --region=ap-south-1 \
    --name=node2 \
    --node-type=t3.medium \
    --nodes=3 \
    --nodes-min=2 \
    --nodes-max=4 \
    --node-volume-size=20 \
    --ssh-access \
    --ssh-public-key=Key \
    --managed \
    --asg-access \
    --external-dns-access \
    --full-ecr-access \
    --appmesh-access \
    --alb-ingress-access
```

*   Replace `Key` with your SSH public key for node access.
*   Adjust node group parameters (e.g., node type, number of nodes) according to your requirements.

#### 4.5. Steps to Create a Service Account

To allow Jenkins to interact with your Kubernetes cluster, create a service account with appropriate permissions. Apply the following Kubernetes manifests:

1.  **Create Service Account (jenkins-sa.yaml)**

    ```yaml
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: jenkins
      namespace: webapps
    ```

2.  **Create Role (app-role.yaml)**

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1
    kind: Role
    metadata:
      name: app-role
      namespace: webapps
    rules:
      - apiGroups:
          - ""
          - apps
          - autoscaling
          - batch
          - extensions
          - policy
          - rbac.authorization.k8s.io
        resources:
          - pods
          - secrets
          - componentstatuses
          - configmaps
          - daemonsets
          - deployments
          - events
          - endpoints
          - horizontalpodautoscalers
          - ingress
          - jobs
          - limitranges
          - namespaces
          - nodes
          - pods
          - persistentvolumes
          - persistentvolumeclaims
          - resourcequotas
          - replicasets
          - replicationcontrollers
          - serviceaccounts
          - services
        verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
    ```

3.  **Bind the Role to Service Account (app-rolebinding.yaml)**

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1
    kind: RoleBinding
    metadata:
      name: app-rolebinding
      namespace: webapps
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: Role
      name: app-role
    subjects:
      - kind: ServiceAccount
        name: jenkins
        namespace: webapps
    ```

4.  **Create a Secret for the Service Account (jenkins-sa-secret.yaml)**

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: jenkins-sa-secret
      namespace: webapps
      annotations:
        kubernetes.io/service-account.name: "jenkins"
    type: kubernetes.io/service-account-token
    ```

Apply these manifests using `kubectl`:

```bash
kubectl apply -f jenkins-sa.yaml
kubectl apply -f app-role.yaml
kubectl apply -f app-rolebinding.yaml
kubectl apply -f jenkins-sa-secret.yaml
```

### 5. Local Execution

Steps to run the Campground application locally:

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/bhushanmandava/YELP-FOR-CAMPING.git
    ```

2.  **Navigate to the Project Directory**

    ```bash
    cd YELP-FOR-CAMPING
    ```

3.  **Install Dependencies**

    ```bash
    npm install
    ```

4.  **Set Up Environment Variables**

    Create a `.env` file in the root directory and add the following variables (replace values with your actual credentials):

    ```
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    MAPTILER_API_KEY=your_maptile_key
    DATABASE_URL=mongodb://localhost:27017/yelp-camp
    SESSION_SECRET=your_secret_key
    ```

5.  **Start MongoDB (If running locally)**

    If you are running MongoDB locally, start the MongoDB service:

    ```bash
    mongod --dbpath=/path/to/mongodb/data
    ```

    Or, if using MongoDB Atlas, update `DATABASE_URL` in the `.env` file with your MongoDB connection string.

6.  **Run the Server**

    ```bash
    npm start
    ```

    By default, the application will run on `http://localhost:3000`.

7.  **Access the Application**

    Open your browser and go to: `http://localhost:3000`

*   GitHub Repository Link: [GitHub Repo](https://github.com/bhushanmandava/Yelpcamp-CICD)

### 6. Development Deployment Pipeline (Jenkinsfile)

This Jenkins pipeline automates the build, test, and deployment process for the development environment.

```groovy
pipeline {
    agent any
    tools {
        nodejs 'node23'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
    }
    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/bhushanmandava/Yelpcamp-CICD'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh "npm install"
            }
        }
        stage('Unit Test') {
            steps {
                sh "npm test"
            }
        }
        stage('Trivy Fs Scan') {
            steps {
                sh "trivy fs --format table -o fs-report.html ."
            }
        }
        stage('SonarQube') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh """
                            $scannerHome/bin/sonar-scanner \
                            -Dsonar.projectKey=Campgorund \
                            -Dsonar.projectName=Campground \
                            -Dsonar.login=$SONAR_TOKEN
                        """
                    }
                }
            }
        }
        stage('Docker Build & Tag') {
            steps {
                withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                    sh "docker build -t bhushanmandava02/camp:latest ."
                }
            }
        }
        stage('Trivy Image Scan') {
            steps {
                sh "trivy image --format table -o image-report.html bhushanmandava02/camp:latest"
            }
        }
        stage('Docker Push Image') {
            steps {
                withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                    sh "docker push bhushanmandava02/camp:latest"
                }
            }
        }
        stage('Docker Deploy to Dev') {
            steps {
                withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                    sh "docker run -d -p 3000:3000 bhushanmandava02/camp:latest"
                }
            }
        }
    }
}
```

*   **Git Checkout**: Clones the repository.
*   **Install Dependencies**: Installs Node.js dependencies using `npm install`.
*   **Unit Test**: Runs unit tests using `npm test`.
*   **Trivy Fs Scan**: Performs a file system scan for vulnerabilities using Trivy.
*   **SonarQube**: Executes SonarQube analysis. Requires setting up a SonarQube token credential in Jenkins.
*   **Docker Build & Tag**: Builds and tags a Docker image.
*   **Trivy Image Scan**: Scans the Docker image for vulnerabilities using Trivy.
*   **Docker Push Image**: Pushes the Docker image to Docker Hub. Requires Docker Hub credentials in Jenkins.
*   **Docker Deploy to Dev**: Deploys the Docker image to the development environment using `docker run`.

### 7. Deployment Pipeline (Jenkinsfile)

This Jenkins pipeline deploys the application to the EKS cluster.

```groovy
pipeline {
    agent any
    tools {
        nodejs 'node23'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
    }
    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/bhushanmandava/Yelpcamp-CICD'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh "npm install"
            }
        }
        stage('Unit Test') {
            steps {
                sh "npm test"
            }
        }
        stage('Trivy Fs Scan') {
            steps {
                sh "trivy fs --format table -o fs-report.html ."
            }
        }
        stage('SonarQube') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh """
                            $scannerHome/bin/sonar-scanner \
                            -Dsonar.projectKey=Campgorund \
                            -Dsonar.projectName=Campground \
                            -Dsonar.login=$SONAR_TOKEN
                        """
                    }
                }
            }
        }
        stage('Docker Build & Tag') {
            steps {
                withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                    sh "docker build -t bhushanmandava02/camp:latest ."
                }
            }
        }
        stage('Trivy Image Scan') {
            steps {
                sh "trivy image --format table -o fs-report.html bhushanmandava02/camp:latest"
            }
        }
        stage('Docker Push Image') {
            steps {
                withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                    sh "docker push bhushanmandava02/camp:latest"
                }
            }
        }
        stage('Deploy To EKS') {
            steps {
                withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'eks2', contextName: '', credentialsId: 'k8-token', namespace: 'webapps', serverUrl: 'https://54DFF3062820D3D90C291FD65F8B6284.sk1.us-east-1.eks.amazonaws.com']]) {
                    sh "kubectl apply -f manifests/"
                }
                sleep 60
            }
        }
        stage('Verify the Deployment') {
            steps {
                withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'eks2', contextName: '', credentialsId: 'k8-token', namespace: 'webapps', serverUrl: 'https://54DFF3062820D3D90C291FD65F8B6284.sk1.us-east-1.eks.amazonaws.com']]) {
                    sh "kubectl get pods -n webapps"
                    sh "kubectl get svc -n webapps"
                }
            }
        }
    }
}
```

*   **Git Checkout**: Clones the repository.
*   **Install Dependencies**: Installs Node.js dependencies using `npm install`.
*   **Unit Test**: Runs unit tests using `npm test`.
*   **Trivy Fs Scan**: Performs a file system scan for vulnerabilities using Trivy.
*   **SonarQube**: Executes SonarQube analysis. Requires setting up a SonarQube token credential in Jenkins.
*   **Docker Build & Tag**: Builds and tags a Docker image.
*   **Trivy Image Scan**: Scans the Docker image for vulnerabilities using Trivy.
*   **Docker Push Image**: Pushes the Docker image to Docker Hub. Requires Docker Hub credentials in Jenkins.
*   **Deploy to EKS**: Applies Kubernetes manifests to deploy the application to the EKS cluster. Requires setting up Kubernetes credentials in Jenkins.
*   **Verify the Deployment**: Verifies the deployment by checking the status of pods and services.

### Configuration

*   **Jenkins Credentials**:
    *   `sonar-token`: SonarQube token for authentication.
    *   `docker-cred`: Docker Hub credentials for pushing images.
    *   `k8-token`: Kubernetes credentials for deploying to EKS.
*   **Kubernetes Manifests**: Ensure you have the necessary Kubernetes manifests in the `manifests/` directory for deploying your application.
*   **EKS Cluster**: Replace the cluster name, region, and other configurations with your actual EKS cluster settings.

### Conclusion

Following this guide will enable you to set up a robust CI/CD pipeline for the Campground application, from local development to deployment on AWS EKS. Ensure you replace all placeholder values with your actual configuration details. This README provides a solid foundation for automating your deployment processes and improving the reliability and efficiency of your application lifecycle.

