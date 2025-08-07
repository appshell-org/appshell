### BASE
FROM node:20-alpine AS base
LABEL maintainer "Robert Hamilton <rh@navaris.com>"
# Set the working directory
WORKDIR /appshell

# Install global dependencies
RUN npm install -g dotenv-cli serve npm-run-all

# Setup environment variables
ENV APPSHELL_PORT=${APPSHELL_PORT:-3030}
ENV APPSHELL_REGISTRY=${APPSHELL_REGISTRY:-'/appshell/appshell_registry'}
ENV APPSHELL_BASE_REGISTRY=${APPSHELL_BASE_REGISTRY}
ENV APPSHELL_ROOT=${APPSHELL_ROOT:-'Appshell/Root'}
ENV APPSHELL_PUBLIC_URL=${APPSHELL_PUBLIC_URL:-''}
ENV APPSHELL_ENV_PREFIX=${APPSHELL_ENV_PREFIX}
ENV APPSHELL_ROOT_PROPS=${APPSHELL_ROOT_PROPS:-'{}'}
ENV APPSHELL_CONFIG_URL=${APPSHELL_PUBLIC_URL}'/appshell.config.json'
ENV APPSHELL_PRIMARY_COLOR=${APPSHELL_PRIMARY_COLOR:-'#8ed6fb'}
ENV APPSHELL_THEME_COLOR=${APPSHELL_THEME_COLOR:-'#282c34'}
ENV APPSHELL_API_KEY=${APPSHELL_API_KEY}
ENV APPSHELL_API_KEY_HEADER=${APPSHELL_API_KEY_HEADER:-'x-api-key'}
ENV APPSHELL_PROXY_URL=${APPSHELL_PROXY_URL}
ENV APPSHELL_SERVICE_WORKER_URL=${APPSHELL_SERVICE_WORKER_URL:-'/appshell-service-worker.js'}

# Expose application port
EXPOSE ${APPSHELL_PORT}

CMD ln -sf /appshell/${ENV_TARGET}.env .env && [ -e ./appshell_registry ] || ln -sf /appshell/appshell_registry . && ${APPSHELL_CONTAINER_COMMAND}

### DEPENDENCIES
FROM base AS dependencies
# Copy source
COPY . .
# Install dependencies
RUN npm install --pure-lockfile

### BUILD
FROM dependencies as build
# Validate the build
RUN npm run lint && npm run test:ci && npm run build

### RELEASE
FROM base AS production
ARG SOURCE_DIR
ENV SOURCE_DIR=${SOURCE_DIR}
ENV APPSHELL_CONTAINER_COMMAND=${APPSHELL_CONTAINER_COMMAND:-'npm run serve'}

# Install global dependencies
RUN npm install -g dotenv-cli

WORKDIR /appshell/${SOURCE_DIR}

COPY --from=build /appshell/${SOURCE_DIR}/package.json .
COPY --from=build /appshell/${SOURCE_DIR}/dist ./dist
COPY --from=build /appshell/node_modules /appshell/node_modules

COPY --from=build /appshell/packages/cli /appshell/packages/cli
RUN npm install -g file:/appshell/packages/cli
RUN npm install --pure-lockfile --production


### DEVELOPMENT
FROM base AS developer
ARG SOURCE_DIR

# Environment
ENV SOURCE_DIR=${SOURCE_DIR}
ENV APPSHELL_CONTAINER_COMMAND=${APPSHELL_CONTAINER_COMMAND:-'npm run serve:developer'}

WORKDIR /appshell/${SOURCE_DIR}

# Copy dependencies
COPY --from=build /appshell/package.json /appshell/package.json
COPY --from=build /appshell/tsconfig.json /appshell/tsconfig.json
COPY --from=build /appshell/lerna.json /appshell/lerna.json
COPY --from=build /appshell/packages /appshell/packages
COPY --from=build /appshell/node_modules /appshell/node_modules

RUN npm install -g file:/appshell/packages/cli

# Overwrite production build with development build
RUN npm run build:development
