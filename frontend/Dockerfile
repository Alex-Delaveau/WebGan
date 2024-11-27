FROM node:18

# Installer les dépendances
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Copier le code source
COPY . .

# Construire l'application React
RUN npm run build

# Servir l'application avec un serveur web
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]

# Exposer le port
EXPOSE 3000