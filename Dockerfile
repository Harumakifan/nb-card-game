# CardForge · 冥刻之诗（纯静态前端容器镜像）
# 国内服务器若拉取官方源慢，可替换为：
# FROM docker.m.daocloud.io/library/nginx:alpine
FROM nginx:alpine

# 写入优化后的 Nginx 配置（Gzip 压缩代码 + 80MB 卡图包直传与强缓存 + HTML 不缓存）
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

    location = /index.html {
        add_header Cache-Control "no-cache, must-revalidate";
        try_files $uri =404;
    }

    location ~* ^/cards_art_pack.*\.js$ {
        gzip off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location ~* \.(js|css|webp|png|jpg|jpeg|svg|ico|woff2?)$ {
        add_header Cache-Control "public, max-age=604800";
        try_files $uri =404;
    }

    location = /health {
        access_log off;
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 仅拷入游戏前端运行所需文件，不暴露 .git、Dockerfile 或 Python 脚本
RUN rm -rf /usr/share/nginx/html/*
COPY index.html styles.css artEngine.js game.js cards_art_pack*.js /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
