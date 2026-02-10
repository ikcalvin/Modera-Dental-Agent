# Deploying Modera Dental Agent to Google Cloud

This guide walks you through deploying the AI Voice Receptionist on a Google Compute Engine VM using Docker.

## Prerequisites

- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A GCP project with billing enabled
- Your `.env.local` file with all credentials configured

## 1. Create the VM

```bash
gcloud compute instances create modera-dental-agent \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server
```

> **Note:** `e2-small` (2 vCPU, 2 GB RAM) is recommended. For tighter budgets, `e2-micro` works but enable swap (see below).

## 2. SSH into the VM

```bash
gcloud compute ssh modera-dental-agent --zone=us-central1-a
```

## 3. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Apply group changes (or log out and back in)
newgrp docker
```

## 4. (Optional) Enable Swap for e2-micro

If using `e2-micro` (1 GB RAM), enable swap to avoid OOM during builds:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 5. Clone and Configure

```bash
git clone https://github.com/ikcalvin/Modera-Dental-Agent.git
cd Modera-Dental-Agent

# Create your environment file
cp .env.local.example .env.local
nano .env.local   # Fill in your credentials
```

## 6. Build and Run

```bash
docker compose up -d --build
```

## 7. Verify

```bash
# Check container is running
docker compose ps

# View logs (follow mode)
docker compose logs -f
```

## Redeployment

After pushing code changes, SSH into the VM and run the redeploy script:

```bash
cd ~/Modera-Dental-Agent
chmod +x redeploy.sh   # first time only
./redeploy.sh
```

The script pulls latest code, rebuilds the image, restarts the container, and cleans up old images.

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose ps` | Check container status |
| `docker compose logs -f` | Follow live logs |
| `docker compose restart` | Restart the agent |
| `docker compose down` | Stop and remove container |
| `docker compose up -d --build` | Rebuild and restart |
| `docker system prune -f` | Clean up old images |
