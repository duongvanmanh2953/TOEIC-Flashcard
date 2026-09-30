FROM nginx:alpine
COPY apps/landing/index.html /usr/share/nginx/html/index.html
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
