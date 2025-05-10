FROM node:20.18.0-alpine

ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}

# Installer les dépendances nécessaires pour canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /home/Xandme

# Copier d'abord package.json et yarn.lock
COPY ui/package.json ui/yarn.lock ./

# Installer les dépendances avec un timeout augmenté
RUN yarn install --network-timeout 600000

# Installer les dépendances supplémentaires nécessaires
RUN yarn add @radix-ui/react-switch @clerk/nextjs @clerk/themes next-themes react-hot-toast lucide-react critters --legacy-peer-deps

# Copier le reste des fichiers
COPY ui/ ./

# Mise à jour de browserslist
RUN npx update-browserslist-db@latest --legacy-peer-deps

# Build avec la gestion des erreurs
RUN yarn build

CMD ["yarn", "start"]
