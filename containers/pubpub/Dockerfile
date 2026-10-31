# ==============================================================================
# OpenScience.ph Sovereign PubPub Container Build
# Target: ghcr.io/pinoyseoul/pubpub:openscience-v3.0
# Architecture: Direct File Overlay (Dataverse parity, Zero patch math)
# Upstream Commit Pin: 768c69cd7625f0f2da99d5ab5446bfcb368f173b
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

# ---- Stage 2: Upstream clone & direct file overlay ----
FROM base AS patched-source
WORKDIR /app

# Deterministic clone pinned to upstream commit 768c69cd7625f0f2da99d5ab5446bfcb368f173b
RUN git clone https://github.com/pubpub/pubpub.git /app \
 && cd /app \
 && git checkout 768c69cd7625f0f2da99d5ab5446bfcb368f173b

# Apply direct sovereign overlay (Zero patch math, Dataverse-parity direct file replacement)
COPY overlay/ /app/

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
