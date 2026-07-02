FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN rm -f package-lock.json && npm install

# Copy the application source
COPY . .

EXPOSE 5173

# Expose port and run dev server allowing external connections
CMD ["npm", "run", "dev", "--", "--host"]
