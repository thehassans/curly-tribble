#!/bin/sh
cat > .env << 'EOF'
# ============================================
# BuySial Commerce Backend - Environment Configuration
# ============================================

# Database Configuration
MONGO_URI=mongodb+srv://mixduniya206_db_user:DzaoHVEFbUPmvkdP@buysialcommerce.vp4a5r8.mongodb.net/?retryWrites=true&w=majority&appName=Buysialcommerce
DB_NAME=Buysialcommerce
USE_MEMORY_DB=false

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=*

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# Google Maps API (Optional)
GOOGLE_MAPS_API_KEY=

# Gemini AI API (Optional)
GEMINI_API_KEY=

# WhatsApp Integration (Optional)
ENABLE_WA=false

# File Upload Limits
MAX_FILE_SIZE=5mb

# Logging
LOG_LEVEL=info
EOF

echo ".env file created successfully!"
echo "MongoDB: buysialcommerce.vp4a5r8.mongodb.net"
