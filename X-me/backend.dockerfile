FROM node:18-slim

WORKDIR /home/Xandme

COPY src /home/Xandme/src
COPY tsconfig.json /home/Xandme/
COPY drizzle.config.ts /home/Xandme/
COPY package.json /home/Xandme/
COPY yarn.lock /home/Xandme/
COPY config.toml /home/Xandme/

RUN mkdir /home/Xandme/data
RUN mkdir /home/Xandme/uploads

RUN yarn install --network-timeout 600000
RUN yarn build

CMD ["yarn", "start"]