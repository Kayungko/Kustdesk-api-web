# RustDesk API 前端用户管理功能实现

## 已实现的功能

### 1. 账户时间管理功能

#### 后端支持
- `account_start_time` - 账户生效开始时间
- `account_end_time` - 账户生效结束时间
- `IsAccountActive()` - 账户有效性检查

#### 前端实现
- ✅ 用户编辑界面添加了时间选择器
- ✅ 用户列表中显示账户有效期状态
- ✅ 账户过期提醒和状态显示

### 2. 设备管理功能

#### 后端支持
- `GET /api/admin/user/devices/{id}` - 获取用户设备列表
- `POST /api/admin/user/forceLogoutDevice` - 强制下线设备
- `GetUserActiveDevices()` - 获取活跃设备
- `ForceLogoutDevice()` - 强制下线设备

#### 前端实现
- ✅ 用户管理界面添加了"查看设备"按钮
- ✅ 设备列表显示对话框
- ✅ 强制下线设备功能
- ✅ 设备状态监控（在线/离线/最近活跃）
- ✅ 设备统计信息显示

### 3. 并发设备控制

#### 后端支持
- `CanLoginNewDevice()` - 检查是否可以登录新设备
- `GetUserActiveDeviceCount()` - 获取活跃设备数量
- `MaxConcurrentDevices` - 最大并发设备配置

#### 前端实现
- ✅ 设备数量统计显示
- ✅ 设备登录状态监控
- ✅ 活跃设备数量警告

## 具体实现细节

### 用户编辑表单 (src/views/user/edit.vue)
新增字段：
- 账户生效开始时间选择器
- 账户生效结束时间选择器
- 表单提示信息

### 用户列表页面 (src/views/user/index.vue)
新增功能：
- 账户有效期状态列
- 设备管理按钮
- 设备管理对话框
- 设备状态实时显示

### API 接口 (src/api/user.js)
新增接口：
- `getUserDevices(userId)` - 获取用户设备
- `forceLogoutDevice(data)` - 强制下线设备

### 设备管理对话框功能
- 设备列表展示
- Token 预览（隐藏敏感信息）
- 设备状态标识（在线/离线/过期）
- 最后活跃时间
- 过期时间
- 强制下线功能
- 设备统计信息

### 状态判断逻辑
- 在线：5分钟内有活动
- 最近活跃：1小时内有活动
- 离线：超过1小时无活动
- 过期：Token已过期

## 新增的翻译键值

需要在国际化文件中添加以下键值：

```javascript
// 账户时间管理
'AccountStartTime': '账户生效开始时间',
'AccountEndTime': '账户生效结束时间',
'SelectStartTime': '选择开始时间',
'SelectEndTime': '选择结束时间',
'AccountStartTimeTip': '留空表示立即生效',
'AccountEndTimeTip': '留空表示永不过期',
'AccountValidity': '账户有效期',
'AccountExpired': '账户已过期',
'Start': '开始',
'End': '结束',

// 设备管理
'ViewDevices': '查看设备',
'UserDeviceManagement': '用户设备管理',
'TokenPreview': 'Token预览',
'DeviceStatus': '设备状态',
'LastActiveTime': '最后活跃时间',
'ExpirationTime': '过期时间',
'CreatedTime': '创建时间',
'ForceLogout': '强制下线',
'ConfirmLogoutDevice': '确认强制下线此设备？',
'DeviceLoggedOut': '设备已强制下线',
'FailedToLoadDevices': '加载设备列表失败',
'FailedToLogoutDevice': '设备下线失败',

// 设备状态
'Online': '在线',
'Offline': '离线',
'RecentlyActive': '最近活跃',
'Expired': '已过期',
'Unknown': '未知',

// 时间相关
'JustNow': '刚刚',
'MinutesAgo': '分钟前',
'HoursAgo': '小时前',
'DaysAgo': '天前',

// 统计信息
'TotalDevices': '总设备数',
'OnlineDevices': '在线设备',
'ExpiredDevices': '过期设备',
'RecentlyActiveDevices': '最近活跃设备',
'Refresh': '刷新',
'Close': '关闭'
```

## 使用方法

1. **创建新用户**：
   - 在用户管理页面点击"添加"按钮
   - 填写用户基本信息（用户名、邮箱、昵称、分组等）
   - **可以设置账户有效期**：
     - 账户生效开始时间：留空表示立即生效
     - 账户生效结束时间：留空表示永不过期
   - 设置管理员权限和状态
   - 点击"提交"创建用户

2. **编辑现有用户**：
   - 在用户管理页面点击"编辑"按钮
   - 修改用户信息和账户有效期
   - 保存更改

3. **管理用户设备**：
   - 在用户管理页面，点击"查看设备"按钮查看用户的所有登录设备
   - 在设备管理对话框中可以看到设备的详细信息和状态
   - 点击"强制下线"按钮可以强制用户退出指定设备

4. **查看账户状态**：
   - 用户列表中会显示账户的有效期状态和过期提醒
   - 过期账户会显示红色警告标签

## 技术特性

- 实时设备状态监控
- 响应式设计，适配不同屏幕尺寸
- 完整的错误处理和用户提示
- 国际化支持
- 安全的Token显示（部分隐藏）
- 直观的设备状态可视化

这些功能大大增强了用户管理的能力，提供了更好的安全性和管理便利性。
