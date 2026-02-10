---
description: Deploy or redeploy the Modera Dental Agent to a Google Cloud VM using Docker
---

# Deploy to Google Cloud VM

// turbo-all

## First-Time Setup

1. Create the GCE VM:
```bash
gcloud compute instances create modera-dental-agent \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server
```

2. SSH into the VM:
```bash
gcloud compute ssh modera-dental-agent --zone=us-central1-a
```

3. Install Docker on the VM:
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo apt-get install -y docker-compose-plugin
newgrp docker
```

4. Clone the repo and configure:
```bash
git clone https://github.com/ikcalvin/Modera-Dental-Agent.git
cd Modera-Dental-Agent
cp .env.local.example .env.local
nano .env.local
```

5. Build and run:
```bash
docker compose up -d --build
```

6. Verify:
```bash
docker compose ps
docker compose logs -f
```

## Redeployment (after code changes)

1. SSH into the VM:
```bash
gcloud compute ssh modera-dental-agent --zone=us-central1-a
```

2. Pull and rebuild:
```bash
cd ~/Modera-Dental-Agent && git pull origin main && docker compose up -d --build
```

3. Verify:
```bash
docker compose logs -f
```
