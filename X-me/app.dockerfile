FROM node:20.18.0-alpine

ARG NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3001
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV STRIPE_SECRET_KEY=sk_test_51QqFgrHFhbg7l1ZnpMrvO6msUXRxrXJaQrcz0Zx90eMO3OjCNxzaR1TGPvN6wYUbH2nUMfbkURGO1RD5Py6Xodky00UV9J1PUe
ENV STRIPE_WEBHOOK_SECRET=whsec_4c7c7e8b8f3f4b3f9b3f4b3f9b3f4b3f

WORKDIR /home/perplexica

# Copier d'abord package.json et yarn.lock
COPY ui/package.json ui/yarn.lock ./

# Installer les dépendances
RUN yarn install

# Copier le reste des fichiers
COPY ui/ ./

# Définir la variable d'environnement avant le build
ENV STRIPE_SECRET_KEY=sk_test_51QqFgrHFhbg7l1ZnpMrvO6msUXRxrXJaQrcz0Zx90eMO3OjCNxzaR1TGPvN6wYUbH2nUMfbkURGO1RD5Py6Xodky00UV9J1PUe
ENV STRIPE_WEBHOOK_SECRET=whsec_4c7c7e8b8f3f4b3f9b3f4b3f9b3f4b3f

RUN yarn build

CMD ["yarn", "start"]