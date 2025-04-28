FROM node:18-slim

WORKDIR /home/Xandme

COPY src /home/Xandme/src
COPY tsconfig.json /home/Xandme/
COPY drizzle.config.ts /home/Xandme/
COPY package.json /home/Xandme/
COPY yarn.lock /home/Xandme/
COPY config.toml /home/Xandme/

# Créer les dossiers nécessaires
RUN mkdir -p /home/Xandme/data
RUN mkdir -p /home/Xandme/uploads
RUN mkdir -p /home/Xandme/src/db/migrations

# S'assurer que les dossiers ont les bonnes permissions
RUN chmod -R 777 /home/Xandme/data
RUN chmod -R 777 /home/Xandme/uploads
RUN chmod -R 777 /home/Xandme/src/db/migrations

RUN yarn install --network-timeout 600000
RUN yarn build

CMD ["yarn", "start"]