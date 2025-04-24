FROM node:20.18.0-alpine

ARG NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3001
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bWFpbi1ibHVlYmlyZC02NC5jbGVyay5hY2NvdW50cy5kZXYk

ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}

WORKDIR /home/Xandme

# Copier d'abord package.json et yarn.lock
COPY ui/package.json ui/yarn.lock ./

# Installer les dépendances
RUN yarn install

# Installer les dépendances supplémentaires nécessaires
RUN yarn add @radix-ui/react-switch @clerk/nextjs @clerk/themes next-themes react-hot-toast lucide-react --legacy-peer-deps

# Copier le reste des fichiers
COPY ui/ ./

RUN yarn build

CMD ["yarn", "start"]
