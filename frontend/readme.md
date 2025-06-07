# Heartbeat - Service Monitoring Dashboard

A modern Next.js dashboard for monitoring ECS services with real-time metrics and alerts.

## Features

- 🔄 Real-time service monitoring
- 📊 CPU and Memory metrics visualization
- 🚨 Smart alerting with environment-specific thresholds
- 🌙 Dark/Light theme support
- 📱 Responsive mobile-friendly design
- 🔐 User authentication
- ⚡ Auto-refresh capabilities

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd heartbeat
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

   For production, update the URL accordingly:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   ```

## Development

### Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm run start
```

## Backend Communication

The frontend communicates with a backend API service. Make sure your backend is running and accessible at the URL specified in your environment configuration.

### API Endpoints Used
- `GET /aliases` - Fetch available environment aliases
- `GET /clusters` - Fetch cluster services data
- `GET /service-details` - Get detailed service information
- `POST /refresh` - Trigger data refresh
- `GET /refresh-status` - Check refresh status
- Authentication endpoints for user management

## Project Structure

```
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── ClusterCard.tsx   # Service cluster display
│   ├── Header.tsx        # Navigation header
│   ├── ThemeProvider.tsx # Theme management
│   └── ...
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication state
├── lib/                  # Utility functions
│   ├── api.ts           # API communication
│   └── auth.ts          # Authentication helpers
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |

### Environment-Specific Features

The application includes environment-specific alerting logic:
- **Production environments**: Alert when running tasks > 2
- **Other environments**: Alert when running tasks >= 2

## Monitoring Features

### Service Status Indicators
- 🟢 **Normal**: Service running within expected parameters
- 🟡 **Warning**: No running tasks detected
- 🔴 **Overloaded**: Task count exceeds environment threshold

### Metrics Visualization
- Real-time CPU and Memory utilization
- Historical data charts for overloaded services
- Interactive service details modal

### Auto-Refresh
- Configurable auto-refresh intervals
- Manual refresh capability
- Real-time status polling during refresh operations

## Authentication

The application includes a complete authentication system:
- User login/logout
- Session management with automatic timeout
- Protected routes and components

## Troubleshooting

### Common Issues

1. **Dependencies Installation Issues**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. **Backend Connection Issues**
   - Verify your `.env.local` file exists and contains the correct API URL
   - Ensure the backend service is running and accessible
   - Check browser console for CORS or network errors

3. **Build Issues**
   ```bash
   # Clean build cache
   npm run build -- --no-cache
   ```

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)