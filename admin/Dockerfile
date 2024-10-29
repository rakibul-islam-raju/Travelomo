# Base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --force

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 5173

# Start the Next.js development server
CMD ["yarn", "dev", "--host"]
