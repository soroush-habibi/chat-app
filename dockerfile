FROM node

ENV PORT 3000

ENV MONGODB_URL "mongodb://mongodb"

RUN mkdir -p /home/chatApp

COPY . /home/chatApp

CMD [ "node" , "/home/chatApp/build/index.js" ]