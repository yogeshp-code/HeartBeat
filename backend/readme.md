# HeartBeat - AWS ECS Monitoring System

## Table of Contents
- [System Overview](#system-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## System Overview

HeartBeat is a comprehensive monitoring solution for AWS Elastic Container Service (ECS) that provides real-time insights into containerized workloads with enterprise-grade security features.

## Key Features

- **Real-time Monitoring**: Track ECS services and tasks
- **Performance Metrics**: Historical CPU/Memory utilization
- **Multi-Account Support**: Monitor across AWS accounts
- **Secure Authentication**: JWT with role-based access
- **Data Encryption**: End-to-end protection of sensitive data
- **Auto-scaling Insights**: Visualize scaling activities
- **User Management**: Admin-controlled access

## Architecture

![System Architecture Diagram]
```
Frontend → HeartBeat API → AWS ECS/CloudWatch
                     ↓
               DynamoDB (Users)
                     ↓
               Encryption Service
```

### Components
1. **API Layer**: FastAPI backend
2. **Auth Service**: JWT-based authentication
3. **Data Service**: ECS/CloudWatch integration
4. **Storage**: DynamoDB for user management
5. **Security**: Encryption and hashing services

## Installation Guide

### Prerequisites
- Python 3.8+
- AWS account with ECS access
- DynamoDB table for user storage
- Required IAM permissions

### 1. Clone Repository
```bash
git clone https://github.com/yogeshp-code/HeartBeart.git
cd backend
```

### 2. Set Up Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate    # Windows
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Database Setup
Configure DynamoDB table with:
- Partition Key: `username` (String)
- Sort Key: Not required

## Configuration

Create `.env` file:
```ini
# Required Configuration
AWS_REGION=us-west-2
DYNAMODB_USERS_TABLE=ecs-heartbeat-users
ENCRYPTION_KEY=your-strong-encryption-key
JWT_SECRET=your-jwt-secret-key
JWT_ALGORITHM=HS256

# Optional AWS Credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## API Documentation

### Authentication
All endpoints (except `/health` and `/auth/login`) require JWT authentication.

#### Login Flow:
1. POST `/auth/login` with username/password
2. Receive JWT token in response
3. Include token in `Authorization: Bearer <token>` header

### Endpoints

#### Authentication
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/login` | POST | User login | No |
| `/auth/logout` | POST | User logout | Yes |
| `/auth/create-user` | POST | Create new user | Admin only |
| `/auth/me` | GET | Current user info | Yes |

#### Monitoring
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/health` | GET | Service health | No |
| `/aliases` | GET | AWS account aliases | Yes |
| `/clusters` | GET | ECS clusters/services | Yes |
| `/service-details` | GET | Detailed metrics | Yes |
| `/refresh` | GET | Trigger refresh | Admin |

## Authentication Details

### User Roles
1. **Admin**: Full access, can create users
2. **Monitor**: Read-only access to all monitoring data
3. **User**: Basic access (configurable)

### Security
- PBKDF2 password hashing with SHA256
- Fernet encryption for sensitive data
- HttpOnly, Secure cookies for web access
- Configurable token expiration

## Security Best Practices

1. **Key Management**:
   - Rotate `ENCRYPTION_KEY` quarterly
   - Never store keys in version control
   - Use AWS Secrets Manager for production

2. **AWS Permissions**:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "ecs:Describe*",
                   "ecs:List*",
                   "cloudwatch:GetMetricStatistics"
               ],
               "Resource": "*"
           }
       ]
   }
   ```

3. **Token Configuration**:
   - Default: 12 hours for regular users
   - 30 days for "monitor" role
   - Set shorter durations for production

## Deployment

### Option 1: Docker
```dockerfile
FROM python:3.8-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Option 2: AWS ECS
1. Build Docker image
2. Configure ECS task with:
   - 2vCPU, 4GB RAM (minimum)
   - Proper environment variables
3. Set up Application Load Balancer with HTTPS

## Troubleshooting

### Common Issues

**Authentication Problems**
```bash
# Verify JWT configuration
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**AWS Connection Issues**
```python
# Test AWS connectivity
import boto3
ecs = boto3.client('ecs')
print(ecs.list_clusters())
```

**Data Refresh Failures**
1. Verify CloudWatch metrics are enabled
2. Check IAM permissions
3. Review service logs

## Support

For issues or feature requests, please open an issue in our GitHub repository.


## License

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)