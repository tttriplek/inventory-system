# Revolutionary Inventory Management System

A modern, full-stack inventory management system built with React, Node.js, Express, and MongoDB. Features a facility-first architecture with real-time data management and professional-grade backend infrastructure.

## 🚀 Features

- **Facility-First Architecture**: Multi-tenant system supporting multiple facilities
- **Real-time Dashboard**: Live statistics and system health monitoring
- **Product Management**: Complete CRUD operations with search and filtering
- **Professional Backend**: Enterprise-grade API with comprehensive logging
- **Modern Frontend**: React with TailwindCSS and responsive design
- **Database Integration**: MongoDB with Mongoose ODM
- **Health Monitoring**: Built-in health checks and system monitoring

## 🏗️ System Architecture

```
Frontend (React + Vite)     Backend (Node.js + Express)     Database (MongoDB)
├── Dashboard               ├── Facility Management         ├── Facilities
├── Product Management      ├── Product API                 ├── Products
├── Analytics               ├── Health Monitoring           ├── Rules
├── Rule Management         ├── Feature Flags               └── Analytics
└── Responsive UI           └── Professional Logging
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **Vite 5.4** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Heroicons** - Beautiful SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Winston** - Professional logging
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd inventory-system
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup
The system will automatically connect to MongoDB at `mongodb://127.0.0.1:27017/revolutionary_inventory`

## 🔧 Configuration

### Backend Configuration
- Port: `5000` (configurable via `PORT` environment variable)
- Database: MongoDB connection string in `.env`
- Features: Facility-based feature flags

### Frontend Configuration
- Port: `3001` (auto-assigned if occupied)
- API Base URL: `http://localhost:5000`
- CORS: Configured for development

## 📊 API Endpoints

### Health Check
- `GET /health` - System health and status

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

*All API endpoints require `X-Facility-ID` header for facility-based operations*

## 🏢 Facility Management

The system uses a facility-first architecture where:
- Each facility has its own configuration
- Features can be enabled/disabled per facility
- Products are scoped to facilities
- Business rules are facility-specific

### Default Facility
- **ID**: `6886896c7ddb5f3a32522a09`
- **Name**: Main Warehouse
- **Code**: MAIN01
- **Type**: warehouse

## 🔍 Development

### Project Structure
```
inventory-system/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── core/           # Core business logic
│   │   ├── modules/        # Feature modules
│   │   ├── utils/          # Utilities and helpers
│   │   └── server.js       # Main server file
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── main.jsx        # App entry point
│   └── package.json
└── README.md
```

### Running in Development
1. Start MongoDB service
2. Run backend: `cd backend && npm run dev`
3. Run frontend: `cd frontend && npm run dev`
4. Access application at `http://localhost:3001`

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚢 Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ directory with your web server
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - API rate limiting
- **CORS** - Cross-origin protection
- **Input Validation** - Mongoose schema validation
- **Error Handling** - Comprehensive error management

## 📝 Logging

The system includes comprehensive logging:
- **Request/Response** - All HTTP traffic
- **Errors** - Detailed error tracking
- **Feature Usage** - Facility feature usage
- **Performance** - Response time monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License.

## 🛟 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the logs for debugging

## 🎯 Roadmap

- [ ] User authentication and authorization
- [ ] Advanced analytics and reporting
- [ ] Mobile responsive improvements
- [ ] Real-time notifications
- [ ] Inventory tracking and alerts
- [ ] Export/import functionality
- [ ] Advanced search and filtering
- [ ] Multi-language support

---

Built with ❤️ using modern web technologies
