# syntax=docker/dockerfile:1
# CardForge · 冥刻之诗 —— 多阶段镜像
#   build  ：Node 构建前端（拼接 / 压缩 / 内容哈希 / 卡图缩略图 / 预压缩）
#   web    ：nginx 托管 dist/，并把 /ws 反向代理到 server
#   server ：Node 权威对战服务器（不对外暴露端口，只在 compose 内网被 nginx 访问）
# 建议上线前把 NODE_IMAGE 也锁定到 digest（node:<版本>-alpine@sha256:...）
ARG NODE_IMAGE=node:26.13.1-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
# esbuild / sharp 的平台二进制通过 optionalDependencies 安装，不需要执行安装脚本
RUN npm ci --no-audit --no-fund --ignore-scripts
COPY scripts scripts
COPY src src
COPY web web
RUN npm run build

# 基线镜像锁定 digest，避免 latest 漂移（沿用原配置）
FROM nginx@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7 AS web
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/snippets/ /etc/nginx/snippets/
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1
CMD ["nginx", "-g", "daemon off;"]

FROM ${NODE_IMAGE} AS server
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 TRUST_PROXY=1
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --omit=dev --workspace server --no-audit --no-fund --ignore-scripts && npm cache clean --force
# 服务器在无头沙箱中运行与浏览器完全相同的规则代码
COPY server/src server/src
COPY src/client src/client
COPY web/index.html web/index.html
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/src/index.js"]
