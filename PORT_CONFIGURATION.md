# 🔧 KustDesk API Web 端口配置说明

## 📋 端口映射表

| 原始端口 | 替代端口 | 服务 | 说明 |
|----------|----------|------|------|
| 21114 | 8014 | API服务 | REST API + Web管理界面 |
| 21115 | 8015 | TCP打洞 | TCP hole punching |
| 21116 | 8016 | ID服务器 | 设备ID注册和查询 |
| 21117 | 8017 | 中继服务器 | 数据中继服务 |
| 21118 | 8018 | Web客户端 | Web客户端连接 |
| 21119 | 8019 | Web客户端HTTPS | Web客户端安全连接 |

## 🔄 修改的文件

### 1. `src/utils/webclient.js`
- 修改WebSocket连接端口从21118到8018
- 修改WebSocket连接端口从21119到8019

### 2. `src/views/rustdesk/options.js`
- 修改ID_TARGET从21115到8015
- 修改RELAY_TARGET从21117到8017

## 🚀 部署说明

### 环境变量配置
```bash
# API服务端口
RUSTDESK_API_RUSTDESK_API_SERVER=http://192.168.1.66:8014

# ID服务器端口
RUSTDESK_API_RUSTDESK_ID_SERVER=192.168.1.66:8016

# 中继服务器端口
RUSTDESK_API_RUSTDESK_RELAY_SERVER=192.168.1.66:8017
```

### Docker Compose配置
```yaml
services:
  kustdesk-api:
    ports:
      - "8014:21114"  # API服务
    environment:
      - RUSTDESK_API_RUSTDESK_API_SERVER=http://192.168.1.66:8014
      - RUSTDESK_API_RUSTDESK_ID_SERVER=192.168.1.66:8016
      - RUSTDESK_API_RUSTDESK_RELAY_SERVER=192.168.1.66:8017

  kustdesk-server:
    ports:
      - "8015:21115"  # TCP打洞
      - "8016:21116"  # ID服务器
      - "8016:21116/udp"  # ID服务器UDP
      - "8017:21117"  # 中继服务器
      - "8018:21118"  # Web客户端
      - "8019:21119"  # Web客户端HTTPS
```

## 🔧 客户端配置

### RustDesk客户端设置
1. 打开RustDesk客户端
2. 点击"设置" → "网络"
3. 输入ID服务器地址: `192.168.1.66:8016`
4. 输入中继服务器地址: `192.168.1.66:8017`
5. 输入公钥: `your_public_key_here`
6. 点击"应用"

### Web客户端访问
- Web管理界面: `http://192.168.1.66:8014`
- Web客户端: `http://192.168.1.66:8018`
- Web客户端HTTPS: `https://192.168.1.66:8019`

## 🔒 防火墙配置

```bash
# 开放替代端口
sudo ufw allow 8014/tcp  # API服务
sudo ufw allow 8015/tcp  # TCP打洞
sudo ufw allow 8016/tcp  # ID服务器
sudo ufw allow 8016/udp  # ID服务器UDP
sudo ufw allow 8017/tcp  # 中继服务器
sudo ufw allow 8018/tcp  # Web客户端
sudo ufw allow 8019/tcp  # Web客户端HTTPS
```

## 📝 注意事项

1. **端口冲突**: 确保8014-8019端口没有被其他服务占用
2. **防火墙**: 需要在防火墙中开放新的端口
3. **负载均衡**: 如果使用负载均衡器，需要更新端口配置
4. **监控**: 更新监控系统的端口配置
5. **文档**: 更新相关文档中的端口信息

## 🔄 回滚方案

如果需要回滚到原始端口，可以：

1. 恢复原始端口配置
2. 重新构建和部署服务
3. 更新客户端配置
4. 更新防火墙规则

## 📞 支持

如有问题，请查看：
- [GitHub Issues](https://github.com/Kayungko/kustdesk-api-web/issues)
- [项目文档](https://github.com/Kayungko/kustdesk-api-web)
