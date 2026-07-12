# Nginx Configuration for VPS Deployment

This directory contains nginx configs for external nginx to proxy to Docker containers.

## Architecture

```
Internet → External Nginx (SSL) → Docker Containers (127.0.0.1 only)
                                    ├─ openhim-core (8080)
                                    ├─ openhim-console (9090)
                                    └─ mongo-db (27017)
```

## Setup Instructions

### 1. Update Domain Names

Edit the nginx configs and replace:
- `api.yourdomain.com` → your backend API domain
- `console.yourdomain.com` → your frontend console domain

### 2. Install SSL Certificates

Use Let's Encrypt (certbot):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d console.yourdomain.com
```

Or use your own certificates and update the paths in the configs.

### 3. Copy Nginx Configs

```bash
sudo cp backend.conf /etc/nginx/sites-available/openhim-core
sudo cp frontend.conf /etc/nginx/sites-available/openhim-console

sudo ln -s /etc/nginx/sites-available/openhim-core /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/openhim-console /etc/nginx/sites-enabled/
```

### 4. Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Start Docker Containers

From the openhim-console directory:

```bash
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d
```

### 6. Update Console Config

Update `app/config/default.json` to use your production domain:

```json
{
  "protocol": "https",
  "host": "console.yourdomain.com",
  "port": "443"
}
```

### 7. Update Backend Environment

Update `.env` file with production URLs:

```bash
STRIPE_SUCCESS_URL=https://console.yourdomain.com/#!/subscriptions?payment=success
STRIPE_CANCEL_URL=https://console.yourdomain.com/#!/subscriptions?payment=cancelled
```

## Security Notes

- Docker containers bind to `127.0.0.1` only — not publicly accessible
- All traffic goes through nginx with SSL termination
- MongoDB is not exposed externally
- Firewall should only allow ports 80 and 443

## Firewall Setup

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```
