# 基础镜像
# FROM nginx:alpine
FROM nginx

# author
MAINTAINER Frank

# 接收启动参数
ARG envType

# 设定时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建并指定工作目录
RUN mkdir -p /home/webapp
WORKDIR /home/webapp

# 复制conf文件到路径
COPY ./deploy/nginx-${envType}.conf /etc/nginx/conf.d/default.conf

# 复制html文件到路径
COPY ./dist /home/webapp/dist
