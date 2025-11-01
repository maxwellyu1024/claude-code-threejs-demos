# 🎮 GPU 性能故障排除指南

## 问题描述

在运行 Three.js 演示时，发现浏览器只使用集成显卡（GPU 占用率很高），而独立显卡完全没有被使用，导致性能不佳和卡顿。

## 原因分析

Windows 系统默认让浏览器使用**集成显卡**来节省电量，即使系统有性能更强的独立显卡。WebGL 应用（如 Three.js）需要强大的 GPU 计算能力，使用集成显卡会导致：

- ✗ GPU 占用率过高（80-100%）
- ✗ 画面卡顿、帧率低
- ✗ 浏览器响应缓慢
- ✗ 风扇噪音大、发热严重

## 解决方案

### 方案 1: Windows 图形设置 ⭐ 推荐

这是最简单、最稳定的方法，适用于 Windows 10/11 所有显卡品牌。

#### 操作步骤：

1. **打开 Windows 图形设置**
   ```
   方法 A: Win + I → 系统 → 显示 → 图形设置
   方法 B: 搜索栏输入"图形设置"
   ```

2. **添加浏览器应用**
   - 点击"浏览"按钮
   - 找到浏览器的可执行文件：

   | 浏览器 | 默认路径 |
   |--------|---------|
   | Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
   | Edge | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |
   | Firefox | `C:\Program Files\Mozilla Firefox\firefox.exe` |
   | Brave | `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe` |

3. **设置为高性能**
   - 选择刚添加的浏览器
   - 点击"选项"
   - 选择"高性能"（使用独立显卡）
   - 点击"保存"

4. **重启浏览器**
   - 完全关闭浏览器（包括后台进程）
   - 重新打开浏览器

5. **验证设置**
   - 访问 `chrome://gpu`（Chrome/Edge）或 `about:support`（Firefox）
   - 查看 `GL_RENDERER` 是否显示独立显卡名称

---

### 方案 2: NVIDIA 控制面板

适用于 NVIDIA 独立显卡用户。

#### 操作步骤：

1. **打开 NVIDIA 控制面板**
   ```
   方法 A: 右键桌面 → NVIDIA 控制面板
   方法 B: 开始菜单搜索 "NVIDIA 控制面板"
   ```

2. **配置 3D 设置**
   - 左侧选择"管理 3D 设置"
   - 点击"程序设置"选项卡
   - 点击"添加"按钮

3. **添加浏览器**
   - 选择你的浏览器（如 chrome.exe）
   - 如果列表中没有，点击"浏览"手动添加

4. **选择显卡**
   - 在"为此程序选择首选图形处理器"下拉菜单
   - 选择"高性能 NVIDIA 处理器"
   - 点击"应用"

5. **（可选）全局设置**
   - 如果想让所有程序默认使用独立显卡
   - 在"全局设置"选项卡
   - 将"首选图形处理器"改为"高性能 NVIDIA 处理器"

---

### 方案 3: AMD Radeon 设置

适用于 AMD 独立显卡用户。

#### 操作步骤：

1. **打开 AMD Radeon 软件**
   ```
   方法 A: 右键桌面 → AMD Radeon 软件
   方法 B: 系统托盘右键 AMD 图标
   ```

2. **添加浏览器应用**
   - 点击"游戏"选项卡
   - 点击"添加" → "浏览"
   - 选择浏览器可执行文件

3. **配置图形设置**
   - 在游戏配置文件中找到浏览器
   - 点击配置图标
   - 将"图形配置文件"改为"高性能"

4. **（可选）可切换图形**
   - 点击"系统" → "可切换显卡"
   - 找到浏览器应用
   - 设置为"高性能"

---

### 方案 4: 浏览器启动参数

临时方案，适用于测试或特定场景。

#### Chrome/Edge 启动参数：

```bash
chrome.exe --use-angle=gl --use-cmd-decoder=passthrough --enable-gpu-rasterization
```

#### 创建快捷方式：

1. 右键桌面上的浏览器快捷方式
2. 选择"属性"
3. 在"目标"栏的路径后面添加参数（注意空格）
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --use-angle=gl --use-cmd-decoder=passthrough
   ```
4. 点击"确定"
5. 使用这个快捷方式启动浏览器

---

## 验证方法

### 检查浏览器使用的 GPU

#### Chrome / Edge:
1. 在地址栏输入：`chrome://gpu`
2. 查看关键信息：
   ```
   Graphics Feature Status
   ├─ Canvas: Hardware accelerated
   ├─ WebGL: Hardware accelerated
   └─ WebGL2: Hardware accelerated

   GL_RENDERER: NVIDIA GeForce RTX 3060  ✅ (应该显示独立显卡名称)
   ```

#### Firefox:
1. 在地址栏输入：`about:support`
2. 滚动到"Graphics"部分
3. 查看：
   ```
   WEBGL_RENDERER: NVIDIA GeForce RTX 3060  ✅
   GPU Accelerated Windows: 1/1 Direct3D 11  ✅
   ```

### 实时监控 GPU 使用率

#### 方法 1: 任务管理器
1. 按 `Ctrl + Shift + Esc` 打开任务管理器
2. 切换到"性能"选项卡
3. 查看所有 GPU 的使用率
4. 运行演示时，独立显卡的"3D"使用率应该上升

#### 方法 2: GPU-Z 或 MSI Afterburner
- 下载专业 GPU 监控工具
- 实时查看 GPU 负载、温度、频率等

---

## 性能对比

| 场景 | 集成显卡 | 独立显卡 (RTX 3060) |
|------|---------|---------------------|
| **天文学星图演示** | 80-100% GPU，20-30 FPS | 15-25% GPU，60 FPS |
| **重力表情符号演示** | 60-80% GPU，30-40 FPS | 10-15% GPU，60 FPS |
| **浏览器响应** | 卡顿、延迟 | 流畅 |
| **风扇噪音** | 大 | 小 |

---

## 常见问题

### Q1: 设置后仍然使用集成显卡？

**可能原因：**
- 浏览器没有完全关闭（后台进程仍在运行）
- Windows 更新后设置被重置
- 显卡驱动需要更新

**解决方法：**
1. 打开任务管理器，结束所有浏览器进程
2. 重启浏览器
3. 更新显卡驱动到最新版本
4. 重启电脑

### Q2: 笔记本电脑没有"高性能"选项？

**可能原因：**
- 显卡驱动未正确安装
- BIOS 中禁用了独立显卡
- 笔记本只有集成显卡

**解决方法：**
1. 检查设备管理器中是否有独立显卡
2. 更新显卡驱动
3. 检查 BIOS 设置

### Q3: 使用独立显卡后电池续航变短？

这是正常现象。独立显卡性能更强但功耗更高。

**建议：**
- 使用电源时：使用独立显卡（高性能）
- 使用电池时：使用集成显卡（节能）
- 可以创建两个浏览器快捷方式，根据场景切换

---

## 推荐配置

### 最低配置（集成显卡）
- Intel UHD Graphics 630 或更高
- AMD Radeon Vega 8 或更高
- 8GB RAM
- 分辨率：1920x1080

### 推荐配置（独立显卡）
- NVIDIA GTX 1050 / RTX 2060 或更高
- AMD RX 560 / RX 5500 或更高
- 16GB RAM
- 分辨率：1920x1080 或更高

### 理想配置
- NVIDIA RTX 3060 / RTX 4060 或更高
- AMD RX 6700 XT 或更高
- 32GB RAM
- 分辨率：2560x1440 或 4K

---

## 性能优化建议

除了使用独立显卡，还可以通过以下方式提升性能：

### 浏览器优化
1. **关闭不必要的扩展**
   - 特别是广告拦截器和脚本拦截器
   - 可能干扰 WebGL 渲染

2. **启用硬件加速**
   - Chrome/Edge: 设置 → 系统 → 使用硬件加速（确保已启用）
   - Firefox: 选项 → 常规 → 性能 → 使用推荐的性能设置

3. **增加 GPU 内存限制**
   - 添加启动参数：`--max_old_space_size=4096`

### 系统优化
1. **更新显卡驱动**
   - NVIDIA: 访问 nvidia.com/drivers
   - AMD: 访问 amd.com/drivers

2. **关闭后台应用**
   - 减少 GPU 和 CPU 占用

3. **电源模式设置为"最佳性能"**
   - Windows 11: 设置 → 系统 → 电源 → 电源模式

---

## 总结

强制浏览器使用独立显卡后，你将获得：

- ✅ 更流畅的动画和交互（60 FPS）
- ✅ 更低的 GPU 占用率（< 30%）
- ✅ 更好的视觉效果（完整的后处理效果）
- ✅ 更好的浏览器响应速度
- ✅ 更低的系统温度和噪音

如果以上方法都无法解决问题，可能需要：
- 检查硬件故障
- 重装显卡驱动
- 更新 BIOS
- 联系硬件厂商支持

---

## 参考资源

- [Chrome GPU 故障排除](https://www.chromium.org/developers/design-documents/gpu-command-buffer/)
- [NVIDIA 控制面板指南](https://www.nvidia.com/en-us/geforce/guides/)
- [AMD Radeon 软件指南](https://www.amd.com/en/support)
- [WebGL 性能优化](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

---

**最后更新**: 2025-10-31
**适用系统**: Windows 10/11
**适用浏览器**: Chrome, Edge, Firefox, Brave
