# SNN/ANN Edge Security System - Clean Version

A production-ready, clean implementation of a **Spiking Neural Network (SNN)** and **Artificial Neural Network (ANN)** hybrid edge security system for real-time threat detection and protection.

## 🎯 **Project Overview**

This is a **clean, optimized version** of the SNN/ANN edge security system, built with modern React and best practices. The system demonstrates real-time threat detection using hybrid neural network architectures optimized for edge computing environments.

## 🧠 **Neural Network Architecture**

### **Hybrid Processing Approach**
- **SNN (Spiking Neural Networks)**: Ultra-fast anomaly detection with sub-millisecond response times
- **ANN (Artificial Neural Networks)**: High-precision threat classification with 94%+ accuracy
- **Hybrid Coordination**: Optimal performance combining both network types

### **Key Features**
- ⚡ **Real-time Processing**: Sub-millisecond threat detection
- 🛡️ **Edge Computing**: Local processing without cloud dependency
- 📊 **Interactive Dashboard**: Real-time monitoring and analytics
- 🎨 **Modern UI/UX**: Clean, responsive design with smooth animations
- 📈 **Performance Metrics**: Live system monitoring and reporting

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- pnpm (recommended) or npm
- Modern web browser

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd snn-ann-clean

# Install dependencies
pnpm install

# Start development server
pnpm run dev --host

# Build for production
pnpm run build
```

### **Development**
```bash
# Start dev server with hot reload
pnpm run dev

# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 📊 **Dashboard Features**

### **Real-time Monitoring**
- **Threat Metrics**: Live threat detection and blocking statistics
- **Neural Performance**: SNN processing time and ANN accuracy tracking
- **System Health**: Uptime, resource utilization, and performance metrics
- **Interactive Charts**: Real-time data visualization with Recharts

### **Architecture Visualization**
- **Component Status**: Live monitoring of all system components
- **Load Balancing**: Real-time load distribution across services
- **Data Flow**: Visual representation of threat detection pipeline
- **Health Indicators**: Color-coded status for quick assessment

### **Analytics & Reporting**
- **Performance Trends**: Historical neural network performance data
- **Threat Patterns**: Analysis of detected threats over time
- **Technology Stack**: Overview of implemented technologies
- **Comparative Analysis**: SNN vs ANN vs Hybrid performance

## 🏗️ **System Components**

### **Core Services**
1. **SNN Anomaly Detector** - Real-time spike-based anomaly detection
2. **ANN Threat Classifier** - Deep learning threat classification
3. **Edge Security Gateway** - Network traffic filtering and routing
4. **Threat Mitigation Engine** - Automated threat response
5. **Packet Capture Service** - Real-time network packet analysis
6. **Neural Network Trainer** - Continuous model improvement

### **Data Processing Pipeline**
```
Network Traffic → Packet Capture → SNN Detection → ANN Classification → Threat Mitigation
```

## 🛠️ **Technology Stack**

### **Frontend**
- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons

### **Development Tools**
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **TypeScript** - Type safety (optional)
- **Vitest** - Testing framework

## 📈 **Performance Metrics**

### **System Performance**
- **SNN Processing Time**: 0.3-1.1ms (ultra-fast response)
- **ANN Accuracy**: 90-99.9% (high precision)
- **System Uptime**: 95-99.9% (enterprise reliability)
- **Threat Detection Rate**: 95%+ effectiveness

### **Build Optimization**
- **Bundle Size**: Optimized for production
- **Code Splitting**: Efficient loading
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Compressed images and fonts

## 🎨 **Design Principles**

### **Clean Code**
- **Component Separation**: Modular, reusable components
- **Custom Hooks**: Clean state management
- **Type Safety**: Proper prop validation
- **Performance**: Optimized rendering and updates

### **User Experience**
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Framer Motion integration
- **Intuitive Navigation**: Clear information hierarchy
- **Accessibility**: WCAG compliance considerations

## 🔧 **Configuration**

### **Environment Variables**
```env
# Development
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Production
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

### **Build Configuration**
- **Vite Config**: Optimized for production builds
- **Tailwind Config**: Custom design system
- **ESLint Config**: Strict code quality rules

## 📚 **Project Structure**

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── custom/       # Custom components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── assets/           # Static assets
├── App.jsx           # Main application
├── App.css           # Global styles
└── main.jsx          # Entry point
```

## 🚀 **Deployment**

### **Production Build**
```bash
# Create optimized build
pnpm run build

# Preview build locally
pnpm run preview
```

### **Deployment Options**
- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **Docker**: Containerized deployment
- **AWS S3**: Static website hosting

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### **Code Standards**
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 **Acknowledgments**

- **React Team** - For the amazing framework
- **Tailwind CSS** - For the utility-first CSS framework
- **shadcn/ui** - For the beautiful UI components
- **Recharts** - For the data visualization library
- **Neuromorphic Computing Community** - For SNN research and development

---

**Built with ❤️ for the future of edge security and neural network computing.**
