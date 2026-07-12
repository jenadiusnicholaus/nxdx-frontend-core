# Build Production Console in Node
FROM node:18-alpine as build

RUN apk add git

WORKDIR /app

COPY package*.json ./
COPY *.js ./

# Copy app directory but exclude config files that will be generated at runtime
COPY app ./app

# Ensure we use the clean default.json for build (not the env-var version)
# The entrypoint script will replace this at runtime
RUN if grep -q '\${' app/config/default.json; then \
      echo "Detected env vars in default.json, using default-env.json as template"; \
      cp app/config/default-env.json app/config/default-env.json.bak; \
    fi

RUN npm install

RUN npm run prepare

# Serve built project with nginx
FROM nginx:mainline-alpine

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist  ./

# Remove default.json from build (will be created by entrypoint)
RUN rm -f ./config/default.json

# Copy production config for runtime
COPY --from=build /app/app/config/production.json ./config/production.json
COPY --from=build /app/app/config/default-env.json ./config/default-env.json

COPY ./docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT [ "/bin/sh", "/usr/local/bin/docker-entrypoint.sh" ]
