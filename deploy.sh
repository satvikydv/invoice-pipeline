#!/bin/bash

echo "======================================"
echo "ZAMP OCR LEDGER - EC2 DEPLOYMENT SETUP"
echo "======================================"

echo "1. Updating packages..."
sudo apt-get update -y

echo "2. Installing Docker and Docker Compose..."
sudo apt-get install -y docker.io docker-compose

echo "3. Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "4. Adding current user to docker group (requires logout/login to take effect)..."
sudo usermod -aG docker $USER

echo "======================================"
echo "INSTALLATION COMPLETE!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Close your SSH terminal and reconnect (to apply Docker permissions)."
echo "2. Create a .env file in the same directory as docker-compose.yml:"
echo "   echo \"GEMINI_API_KEY=your_key_here\" > .env"
echo "3. Run the application:"
echo "   docker compose up -d --build"
echo ""
echo "Your application will be available on port 80!"
