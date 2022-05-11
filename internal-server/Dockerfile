FROM node:16-alpine

WORKDIR /usr/src/server

COPY . /usr/src/server

RUN ls -la
RUN npm install
CMD [ "node", "server.js" ]
EXPOSE 3000