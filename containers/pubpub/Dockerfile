# ==============================================================================
# OpenScience.ph Sovereign PubPub Container Build
# Target: ghcr.io/pinoyseoul/pubpub:openscience-v1.0
# Architecture: Multi-stage build applying OpenScience.ph patches to upstream PubPub v6.1.0
# ==============================================================================

# ---- Stage 1: Base image with system dependencies ----
FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Install system packages listed in Aptfile
COPY Aptfile /tmp/Aptfile
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates gnupg git \
 && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg \
 && echo "deb http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
 && apt-get update \
 && awk '!/^\s*#/ && !/^\s*$/' /tmp/Aptfile \
      | xargs -r apt-get install -y --no-install-recommends \
 && ARCH="$(dpkg --print-architecture)" \
 && if [ "$ARCH" = "amd64" ]; then \
        PANDOC_DEB="https://github.com/jgm/pandoc/releases/download/2.19.2/pandoc-2.19.2-1-amd64.deb"; \
    elif [ "$ARCH" = "arm64" ]; then \
        PANDOC_DEB="https://github.com/jgm/pandoc/releases/download/2.19.2/pandoc-2.19.2-1-arm64.deb"; \
    else \
        echo "Unsupported architecture for pandoc: $ARCH" && exit 1; \
    fi \
 && curl -L -o /tmp/pandoc.deb "$PANDOC_DEB" \
 && dpkg -i /tmp/pandoc.deb || (apt-get -fy install && dpkg -i /tmp/pandoc.deb) \
 && rm /tmp/pandoc.deb \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

# ---- Stage 2: Upstream clone & patch application ----
FROM base AS patched-source
WORKDIR /app

# Shallow clone upstream PubPub main branch (v6.1.0)
RUN git clone --depth 1 -b main https://github.com/pubpub/pubpub.git /app

# Copy OpenScience patches into container
COPY patches/ /app/openscience-patches/

# Apply patches sequentially with whitespace tolerance
RUN git apply --ignore-whitespace /app/openscience-patches/01-landing-route.patch && \
    git apply --ignore-whitespace /app/openscience-patches/02-domain-routing.patch && \
    git apply --ignore-whitespace /app/openscience-patches/03-header-branding.patch && \
    git apply --ignore-whitespace /app/openscience-patches/04-responsive-grid.patch && \
    git apply --ignore-whitespace /app/openscience-patches/05-footer-split.patch && \
    git apply --ignore-whitespace /app/openscience-patches/06-platform-localization.patch && \
    git apply --ignore-whitespace /app/openscience-patches/07-orcid-auth.patch && \
    git apply --ignore-whitespace /app/openscience-patches/08-ark-pid.patch && \
    git apply --ignore-whitespace /app/openscience-patches/09-storage-and-preservation.patch

# Copy authentic OpenScience brand assets into static/
COPY assets/* /app/static/

# ---- Stage 3: Production dependencies ----
FROM base AS prod-deps
WORKDIR /app
COPY --from=patched-source /app/package.json /app/pnpm-lock.yaml ./
COPY --from=patched-source /app/patches/ ./patches/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ---- Stage 4: Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=patched-source /app/package.json /app/pnpm-lock.yaml ./
COPY --from=patched-source /app/patches/ ./patches/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=patched-source /app ./
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm run build-prod

# ---- Stage 5: Production runtime runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=builder /app/init.js /app/init.js
COPY --from=builder /app/client/components/Editor/styles /app/client/components/Editor/styles
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/static /app/static
COPY --from=builder /app/tools /app/tools
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY assets/* /app/static/

EXPOSE 3000

CMD ["pnpm", "run", "api-prod"]