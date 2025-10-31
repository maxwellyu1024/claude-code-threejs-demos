# 🌌 Claude Code Three.js Demos

这个项目包含两个令人惊叹的Three.js交互式可视化演示，直接从Claude Code官方网站提取，并完全分离为独立的HTML、CSS和JavaScript文件。

## 📁 项目文件结构

```
claude-code-threejs-demos/
├── astronomy.html              # 天文学星图HTML结构 (3.2KB)
├── astronomy.css               # 天文学星图样式文件 (6.2KB)
├── astronomy.js                # 天文学星图JavaScript代码 (25KB)
├── astronomy-demo.html         # 天文学星图单文件版本 (49KB)
├── gravity.html                # 重力演示HTML结构 (3.9KB)
├── gravity.css                 # 重力演示样式文件 (5.2KB)
├── gravity.js                  # 重力演示JavaScript代码 (23KB)
├── gravity-emoji-demo.html     # 重力演示单文件版本 (42KB)
├── data.json                   # 真实星表数据 (GeoJSON格式, 903KB)
├── claude-code.html            # 原始源文件 (1.2MB)
└── README.md                   # 项目文档
```

### 文件说明

**分离版本 (推荐使用)**
- `astronomy.html/css/js` - 天文学星图演示的模块化版本
- `gravity.html/css/js` - 重力表情符号演示的模块化版本

**单文件版本**
- `astronomy-demo.html` - 天文学星图的单文件完整版本
- `gravity-emoji-demo.html` - 重力演示的单文件完整版本

**数据文件**
- `data.json` - 包含50,000+真实恒星数据的星表文件

**源文件**
- `claude-code.html` - 从Claude Code官网提取的原始文件

---

## 🚀 快速开始

### 方式1: 直接打开 (推荐)

直接在浏览器中打开HTML文件即可运行：

```bash
# Windows
start astronomy.html
start gravity.html

# macOS
open astronomy.html
open gravity.html

# Linux
xdg-open astronomy.html
xdg-open gravity.html
```

### 方式2: 通过HTTP服务器

如果需要使用HTTP服务器：

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

然后访问：
- http://localhost:8000/astronomy.html
- http://localhost:8000/gravity.html

---

## 🌟 演示1: 天文学星图可视化

![文件: 3个](https://img.shields.io/badge/文件-3个-blue)
![大小: 34KB](https://img.shields.io/badge/大小-34KB-green)
![依赖: Three.js](https://img.shields.io/badge/依赖-Three.js-orange)

### 📦 文件组成

- **astronomy.html** (3.2KB) - HTML结构
  - 引用 `astronomy.css` 样式文件
  - 引用 `astronomy.js` 脚本文件
  - 包含Three.js的importmap配置

- **astronomy.css** (6.2KB) - 样式文件
  - 全局样式和CSS变量
  - 容器和布局样式
  - 天文学演示特定样式

- **astronomy.js** (25KB) - JavaScript代码
  - Three.js和后处理插件导入
  - 自定义着色器 (色差、胶片颗粒)
  - StarConverter数据转换工具
  - StarField主类实现

### ✨ 功能特性

- **50,000+真实恒星数据**: 基于真实天文星表 (data.json)
- **物理准确的颜色**: 根据B-V色指数映射星星真实颜色
  - 蓝色星 (高温) → 白色星 → 黄色星 → 橙色星 → 红色星 (低温)
- **亮度映射**: 根据星等动态调整星星大小
- **交互式控制**:
  - 🖱️ 鼠标拖拽旋转视角
  - 🔍 滚轮缩放 (或双指缩放)
  - ⌨️ 键盘方向键控制
  - 📱 移动端触摸支持
- **高级视觉效果**:
  - ✨ 星星闪烁动画
  - 🌈 色差后处理效果
  - 🎬 胶片颗粒效果
  - 💫 辉光效果 (Bloom)

### 🎨 技术实现

**核心技术栈:**
- Three.js (v0.179.1) - 3D渲染引擎
- WebGL自定义着色器
- BufferGeometry - 高效粒子系统
- 后处理效果管线:
  - EffectComposer - 后处理合成器
  - UnrealBloomPass - 辉光效果
  - ChromaticAberration - 色差效果
  - FilmGrain - 胶片颗粒

**数据处理:**
- GeoJSON格式星表数据
- B-V色指数到RGB颜色映射
- 视星等到粒子大小映射

---

## 😀 演示2: 重力表情符号物理演示

![文件: 3个](https://img.shields.io/badge/文件-3个-blue)
![大小: 32KB](https://img.shields.io/badge/大小-32KB-green)
![依赖: Three.js + Cannon.js](https://img.shields.io/badge/依赖-Three.js%20%2B%20Cannon.js-orange)

### 📦 文件组成

- **gravity.html** (3.9KB) - HTML结构
  - 引用 `gravity.css` 样式文件
  - 引用 `gravity.js` 脚本文件
  - 引用Cannon.js物理引擎 (CDN)
  - 引用GSAP动画库 (CDN)
  - 包含Three.js的importmap配置

- **gravity.css** (5.2KB) - 样式文件
  - 全局样式和CSS变量
  - 容器和布局样式
  - 重力演示特定样式

- **gravity.js** (23KB) - JavaScript代码
  - Three.js导入
  - EmojiPhysicsDemo主类实现
  - Cannon.js物理引擎集成
  - 表情符号纹理生成

### ✨ 功能特性

- **真实物理模拟**: 使用Cannon.js物理引擎
  - ⬇️ 重力效果
  - 💥 碰撞检测
  - 🔄 旋转和反弹
  - 🎯 摩擦力和弹性
- **交互式创建**:
  - 🖱️ 点击创建表情符号
  - ✋ 按住鼠标创建喷泉效果
  - 📱 触摸屏支持
- **性能优化**:
  - 使用InstancedMesh实例化渲染
  - 最多500个表情符号
  - 自动清理最旧的表情
- **7种表情符号**: 😀😎🤩🥳😍🤗😜

### 🎨 技术实现

**核心技术栈:**
- Three.js (v0.179.1) - 3D渲染
- Cannon.js (v0.6.2) - 物理引擎
- GSAP (v3.12.5) - 动画库
- InstancedMesh - 高性能实例化渲染
- Canvas 2D - 表情符号纹理生成

**物理参数:**
- 重力: -9.82 m/s²
- 碰撞材料系统 (摩擦力、弹性)
- 随机初始速度和角速度

---

## 📊 文件依赖关系

### 天文学演示

```
astronomy.html
├── astronomy.css (样式)
├── astronomy.js (逻辑)
├── data.json (星表数据)
├── Three.js (CDN)
└── Three.js addons (CDN)
    ├── EffectComposer
    ├── RenderPass
    ├── OutputPass
    ├── UnrealBloomPass
    ├── ShaderPass
    └── FilmPass
```

### 重力演示

```
gravity.html
├── gravity.css (样式)
├── gravity.js (逻辑)
├── GSAP (CDN - 动画库)
├── Cannon.js (CDN - 物理引擎)
└── Three.js (CDN)
```

---

## 📱 浏览器兼容性

**支持的浏览器:**
- ✅ Chrome 90+ (推荐)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**要求:**
- WebGL 2.0支持
- ES6模块支持
- 现代JavaScript特性 (async/await, class, arrow functions)

---

## 🎯 性能建议

### 天文学演示
- 推荐显卡: 支持WebGL 2.0的独立显卡
- 内存占用: 约200-300MB
- 最佳分辨率: 1920x1080或更高
- 文件总大小: 34KB (3个文件) + 903KB (数据文件)

### 重力演示
- 推荐显卡: 集成显卡即可
- 内存占用: 约100-150MB
- 表情符号上限: 500个 (可在代码中配置)
- 文件总大小: 32KB (3个文件)

---

## 📝 代码结构

### astronomy.js 主要组件

```javascript
// 导入Three.js模块
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
// ... 其他导入

// 自定义着色器
const chromaticAberrationShader = { ... };
const filmGrainShader = { ... };

// 数据转换工具
const StarConverter = {
  ultraCompactToGeoJSON(compactData) { ... }
};

// 主类
class StarField {
  constructor() { ... }
  async init() { ... }
  async loadStarData() { ... }
  createStarSystem(stars) { ... }
  setupPostProcessing() { ... }
  animate() { ... }
  // ... 其他方法
}

// 初始化
window.addEventListener("DOMContentLoaded", () => {
  new StarField();
});
```

### gravity.js 主要组件

```javascript
// 导入Three.js
import * as THREE from "three";

// 常量定义
const textureSize = 256;
const emojis = ["😀", "😎", "🤩", "🥳", "😍", "🤗", "😜"];

// 主类
class EmojiPhysicsDemo {
  constructor() { ... }
  init() { ... }
  setupPhysicsWorld() { ... }
  createWalls() { ... }
  generateEmojiTexture(emoji) { ... }
  createEmoji(x, y) { ... }
  animate() { ... }
  // ... 其他方法
}

// 初始化
window.addEventListener("DOMContentLoaded", () => {
  if (typeof CANNON === "undefined") {
    console.error("Cannon.js not loaded!");
    return;
  }
  new EmojiPhysicsDemo();
});
```

---

## 🌟 未来扩展想法

### 天文学演示
- [ ] 添加星座连线
- [ ] 星星点击显示详细信息 (名称、距离、光谱类型)
- [ ] 时间模拟功能 (星空随时间变化)
- [ ] 搜索特定星星
- [ ] VR/AR支持
- [ ] 导出高分辨率截图

### 重力演示
- [ ] 更多表情符号类型
- [ ] 自定义重力方向和强度
- [ ] 表情符号之间的吸引力/排斥力
- [ ] 音效反馈
- [ ] 保存和回放功能
- [ ] 导出为GIF/视频

---

## 💡 技术亮点

### 文件分离的优势

✅ **模块化**: HTML、CSS、JS完全分离，易于维护
✅ **可读性**: 每个文件职责单一，代码清晰
✅ **可复用**: CSS和JS可以在其他项目中复用
✅ **易调试**: 独立文件便于定位和修复问题
✅ **协作友好**: 不同开发者可以并行修改不同文件

### 性能优化

🚀 **文件大小**: 分离版本总计66KB (不含数据文件)
🚀 **加载速度**: 独立文件支持浏览器并行下载
🚀 **缓存友好**: CSS和JS可以被浏览器缓存
🚀 **CDN加速**: 第三方库使用CDN加速
🚀 **实例化渲染**: 使用InstancedMesh和BufferGeometry优化性能

---

## 📄 许可证

MIT License

这些演示代码来自Claude Code官方示例，仅供学习和参考使用。

---

## 🙏 致谢

- **Three.js** - 强大的3D JavaScript库
- **Cannon.js** - 轻量级物理引擎
- **GSAP** - 专业级动画库
- **Claude Code** - 原始示例来源
- **Anthropic** - Claude AI开发团队

---

**享受探索宇宙和创造表情符号喷泉的乐趣!** ✨🚀🌠😀
