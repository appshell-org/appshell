### BASE
FROM node:20-alpine AS base
LABEL maintainer "Robert Hamilton <rh@navaris.com>"

# Set the working directory
WORKDIR /appshell

### DEPENDENCIES
FROM base AS dependencies
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

# Copy source
COPY . .

# Install dependencies
RUN npm install --pure-lockfile && npm run bootstrap

### BUILD
FROM dependencies as build
RUN npm run build

### DEVELOPMENT
FROM build AS development

# Environment
ENV APPSHELL_REGISTRY=${APPSHELL_REGISTRY:-'/appshell/appshell_registry'}
ENV CONTAINER_COMMAND=${CONTAINER_COMMAND:-'npm run serve'}

ENV SAMPLE_MFE_CONTAINER_PORT=${SAMPLE_MFE_CONTAINER_PORT:-3000}
ENV SAMPLE_MFE_PING_PORT=${SAMPLE_MFE_PING_PORT:-3001}
ENV SAMPLE_MFE_PONG_PORT=${SAMPLE_MFE_PONG_PORT:-3002}

# Expose application ports
EXPOSE ${SAMPLE_MFE_CONTAINER_PORT}
EXPOSE ${SAMPLE_MFE_PING_PORT}
EXPOSE ${SAMPLE_MFE_PONG_PORT}

CMD ${CONTAINER_COMMAND}
