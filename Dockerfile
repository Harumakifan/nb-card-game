# CardForge · 冥刻之诗（纯静态前端容器镜像）—— 加固版 2026-11-22
# 基线镜像锁定 digest，避免 latest 漂移
FROM nginx@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
limit_req_zone $binary_remote_addr zone=bigfile:10m rate=60r/m;

server {
    listen 80;
    server_name _;
    server_tokens off;

    root /usr/share/nginx/html;
    index index.html;

    # 经 cloudflared 回源，真实客户端 IP 在 CF-Connecting-IP
    set_real_ip_from 127.0.0.1;
    real_ip_header CF-Connecting-IP;
    real_ip_recursive on;

    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob: data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:8080 ws://localhost:8080 wss://broker.emqx.io:8084 wss://broker.hivemq.com:8884; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

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
    gzip_static on;

    location = /index.html {
        expires -1;
        try_files $uri =404;
    }

    location ~* ^/cards_art_pack.*\.js$ {
        limit_req zone=bigfile burst=20 nodelay;
        gzip_static on;
        expires 1y;
        try_files $uri =404;
    }

    location ~* \.(js|css|webp|png|jpg|jpeg|svg|ico|woff2?)$ {
        expires 7d;
        try_files $uri =404;
    }

    location = /health {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location / {
        expires -1;
        try_files $uri $uri/ /index.html;
    }
}
EOF

RUN rm -rf /usr/share/nginx/html/*
COPY index.html styles.css artEngine.js game.js cards_art_pack*.js /usr/share/nginx/html/
# 预压缩 84MB 卡图包，命中 gzip_static 后传输量降到约 1/8
RUN cd /usr/share/nginx/html && gzip -9 -k cards_art_pack*.js && ls -lh cards_art_pack*.js*

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
