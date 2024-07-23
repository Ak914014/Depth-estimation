# Use the Node.js 14 image
FROM node:14

# Create and change to the /app directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install build tools
RUN apt-get update && apt-get install -y build-essential

# Rebuild TensorFlow.js node package from source
RUN npm rebuild @tensorflow/tfjs-node --build-addon-from-source

RUN npm rebuild @tensorflow/tfjs-node-gpu --build-addon-from-source

# Install JSDoc globally
# RUN npm install -g jsdoc

# Copy the rest of the application code
COPY . .

# Ensure JSDoc configuration file is copied
# COPY jsdoc.json ./

# Expose the application port
EXPOSE 3100

# Generate JSDoc documentation (optional step to generate docs during build)
# RUN npm run jsdoc

# Start the server
CMD ["node", "index.js"]