# 预制菜企业绿色贷款智能合约

## 项目简介

基于区块链技术的预制菜企业绿色贷款管理系统，旨在通过智能合约自动化管理企业环保表现评估、绿色积分计算以及绿色优惠贷款发放流程。该系统鼓励预制菜企业提高环保表现，实现绿色生产转型。

## 核心功能

### 1. 企业管理
- 企业注册与身份验证
- 企业信息管理
- 管理员权限控制

### 2. 绿色表现数据管理
- 企业绿色表现数据上传
- 管理员数据核验
- 绿色表现记录查询

### 3. 积分系统
- 基于绿色表现自动计算积分
- 积分查询与扣减
- 绿色贷款资格判定

### 4. 贷款管理
- 正常贷款与绿色优惠贷款申请
- 自动贷款审批与发放
- 贷款利率动态调整
- 贷款记录管理

## 技术架构

- **智能合约语言**: Solidity ^0.8.0
- **区块链平台**: 兼容以太坊虚拟机(EVM)的区块链
- **开发框架**: Hardhat
- **前端技术**: HTML, CSS, JavaScript
- **Web3库**: Ethers.js
- **许可类型**: MIT License

## 合约主要功能详解

### 1. 企业注册与认证

企业通过提交基本信息进行注册，经管理员审核通过后获得完整功能权限。系统使用以太坊地址作为企业唯一标识，并安全存储企业信息。

### 2. 绿色表现评估机制

企业上传基准线数据与实际表现数据，系统计算环保改进百分比。当改进达到预设阈值（默认15%）时，企业获得绿色积分。

### 3. 绿色积分系统

- 绿色积分用于衡量企业环保表现
- 积分达到一定标准（默认100分）可申请绿色优惠贷款
- 绿色数据有有效期限制（默认90天），确保数据时效性

### 4. 差异化贷款利率

- 正常贷款利率：默认4.5%
- 绿色优惠贷款利率：默认4.3%
- 管理员可根据市场情况调整利率参数

## 合约功能操作说明

### 管理操作

- 设置贷款利率：`setLoanRates(uint256 _normalRate, uint256 _greenRate)`
- 设置积分规则：`setPointRules(uint256 _threshold, uint256 _minPoints)`
- 设置贷款参数：`setLoanParameters(uint256 _amount, uint256 _validPeriod)`
- 审核企业：`verifyEnterprise(address _enterprise, bool _isVerified)`
- 核验绿色数据：`verifyGreenData(address _enterprise, uint256 _dataId)`

### 企业操作

- 注册企业：`registerEnterprise(string calldata _name, string calldata _socialCreditCodeHash)`
- 上传绿色数据：`uploadGreenData(uint256 _baseline, uint256 _actualData, string calldata _dataType)`
- 查询贷款资格：`canApplyGreenLoan()`
- 申请贷款：`applyForLoan(bool _isGreenLoan)`

## 项目结构

```
├── contracts/             # 智能合约目录
│   └── GreenLoanContract.sol  # 主智能合约文件
├── frontend/              # 前端应用
│   ├── abis/              # 合约ABI文件
│   ├── css/               # 样式文件
│   │   ├── green-pattern.svg  # 绿色环保背景图案
│   │   └── styles.css     # 样式表
│   ├── js/                # JavaScript代码
│   │   └── app.js         # 主要交互逻辑
│   └── index.html         # 主页面
├── ignition/              # 部署配置
│   ├── deployments/       # 部署记录
│   └── modules/           # 部署模块
├── scripts/               # 部署脚本
├── test/                  # 测试文件
├── hardhat.config.ts      # Hardhat配置
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目说明文档（当前文件）
```

## 快速开始

### 从GitHub克隆项目

```bash
# 克隆项目到本地
git clone https://github.com/cpppp/GreenFintech-demo.git
cd GreenFintech-demo
```

## 本地环境搭建与运行指南

### 第一步：环境要求

在开始之前，请确保您的系统已安装以下工具：

- **Node.js**: v16 或更高版本（推荐使用 v18 或 v20）
- **npm**: v8 或更高版本（通常随 Node.js 一起安装）
- **MetaMask**: 浏览器扩展钱包（Chrome、Firefox、Edge 等浏览器可用）
- **Git**: 版本控制工具（用于克隆项目）

**检查环境：**
```bash
node --version  # 应显示 v16.x.x 或更高
npm --version   # 应显示 8.x.x 或更高
git --version   # 检查 Git 是否安装
```

### 第二步：安装项目依赖

项目包含两个部分，需要分别安装依赖：

```bash
# 1. 安装智能合约开发依赖（根目录）
# 这将安装 Hardhat、TypeScript 等开发工具
npm install

# 2. 安装前端依赖
cd frontend
npm install
cd ..
```

**注意：** 如果安装过程中遇到网络问题，可以使用国内镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

### 第三步：启动本地区块链节点

打开**第一个终端窗口**，在项目根目录执行：

```bash
npx hardhat node
```

**说明：**
- 这个命令会启动一个本地以太坊区块链节点
- 节点运行在 `http://127.0.0.1:8545`
- 终端会显示 10 个测试账户，每个账户有 10000 个测试 ETH
- **请保持这个终端窗口运行**，不要关闭

**重要提示：** 您会看到类似以下的输出，请保存这些账户信息（特别是私钥）：
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 第四步：部署智能合约

打开**第二个终端窗口**（保持第一个终端运行），在项目根目录执行：

```bash
npx hardhat ignition deploy ignition/modules/DeployGreenLoan.ts --network localhost
```

**说明：**
- 这会部署智能合约到本地网络
- 部署完成后，终端会显示合约地址
- 查找输出中的 "GreenLoanContract deployed to" 或类似信息

**示例输出：**
```
GreenLoanContract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**或者查看部署记录：**
您也可以在 `ignition/deployments/chain-31337/deployed_addresses.json` 文件中找到部署的合约地址。

### 第五步：更新前端合约地址

编辑 `frontend/js/app.js` 文件，找到第 4 行，更新合约地址：

```javascript
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // 替换为您的合约地址
```

**注意：** 每次重新部署合约后，都需要更新这个地址。

### 第六步：启动前端服务

打开**第三个终端窗口**，执行：

```bash
cd frontend
npm start
```

或者使用：

```bash
cd frontend
npx http-server -p 8080
```

**说明：**
- 前端服务将在 `http://127.0.0.1:8080` 启动
- 在浏览器中打开该地址即可访问应用

### 第七步：配置 MetaMask

#### 7.1 添加本地网络

1. 打开浏览器中的 MetaMask 扩展
2. 点击网络选择器（顶部显示当前网络的地方）
3. 选择 "添加网络" -> "添加网络手动"
4. 填写以下信息：
   - **网络名称**：`Localhost 8545`
   - **RPC URL**：`http://127.0.0.1:8545`
   - **链ID**：`31337`
   - **货币符号**：`ETH`
   - **区块浏览器URL**：（留空）
5. 点击 "保存"

#### 7.2 导入测试账户

1. 在 MetaMask 中，点击账户图标（右上角圆形图标）
2. 选择 "导入账户"
3. 选择 "私钥" 选项
4. 从启动 Hardhat 节点的终端（第一个终端）中复制一个私钥
5. 粘贴到输入框中，点击 "导入"

**安全提示：** 这些是测试账户，仅用于开发测试，不要在主网使用这些私钥。

### 第八步：开始使用

1. 在浏览器中打开 `http://127.0.0.1:8080`
2. 点击页面右上角的 "连接钱包" 按钮
3. 在 MetaMask 弹窗中确认连接
4. 连接成功后，可以开始测试各项功能：
   - **企业功能**：注册企业、上传绿色数据、查询信息、申请贷款
   - **管理员功能**：验证企业、核验绿色数据、查看已注册企业列表

## 每次重新打开项目的启动步骤

如果您已经完成了初始设置，每次重新打开项目时，只需要执行以下步骤：

### 快速启动（3个终端窗口）

**终端 1 - 启动区块链节点：**
```bash
npx hardhat node
```

**终端 2 - 部署合约（如果需要）：**
```bash
# 如果合约地址已更新到前端代码，可跳过此步骤
npx hardhat ignition deploy ignition/modules/DeployGreenLoan.ts --network localhost
# 部署后记得更新 frontend/js/app.js 中的 CONTRACT_ADDRESS
```

**终端 3 - 启动前端：**
```bash
cd frontend
npm start
```

### 重要提示

- **如果本地节点重启**：需要重新部署合约并更新前端中的合约地址
- **部署合约的账户**：第一个账户（Account #0）默认为管理员账户
- **Gas 费用**：所有操作都需要支付 gas 费用（在本地网络中使用测试 ETH，完全免费）
- **网络连接**：确保 MetaMask 连接到正确的网络（Localhost 8545，链ID: 31337）
- **钱包切换**：如果需要测试不同账户，可以在 MetaMask 中切换账户，或断开连接后重新连接选择新账户

## 界面风格说明

本项目采用绿色环保主题设计，具有以下特点：
- 绿色渐变背景与环保图案结合，体现可持续发展理念
- 清晰的内容区域布局，第一行仅显示标题，功能按钮从第二行开始
- 响应式设计，适配不同设备屏幕尺寸
- 增强的内容容器背景不透明度和模糊效果，确保在复杂背景下内容依然清晰可读

## 常见问题

### Q1: 启动 `npx hardhat node` 时出错

**问题：** 提示找不到 hardhat 或命令不存在

**解决方案：**
```bash
# 确保在项目根目录，且已安装依赖
npm install
```

### Q2: 前端无法连接到钱包

**检查清单：**
1. 确保 MetaMask 已安装并解锁
2. 确保 MetaMask 连接到 "Localhost 8545" 网络
3. 确保本地节点正在运行（终端 1）
4. 检查浏览器控制台是否有错误信息

### Q3: 合约调用失败

**可能原因：**
1. 合约地址未更新或错误
2. 账户余额不足（本地网络应该有很多测试 ETH）
3. 网络不匹配（确保 MetaMask 连接到本地网络）

### Q4: 如何重置本地节点

**步骤：**
1. 停止 `npx hardhat node`（Ctrl+C）
2. 删除 `ignition/deployments/chain-31337/` 目录（可选）
3. 重新启动节点和部署合约

### Q5: 如何切换测试账户

**方法：**
1. 在 MetaMask 中点击账户图标
2. 选择 "创建账户" 或 "导入账户"
3. 或者在前端页面点击 "断开连接"，然后重新连接选择账户

### Q6: 前端页面显示空白

**检查：**
1. 确保前端服务正在运行（终端 3）
2. 检查浏览器控制台是否有 JavaScript 错误
3. 尝试清除浏览器缓存后刷新

## 安全考虑

- 使用Solidity 0.8.0及以上版本，利用内置溢出保护
- 实现严格的权限控制机制
- 使用事件记录所有关键操作，便于审计
- 避免浮点数运算，使用整数比例表示百分比

## 注意事项

1. **本合约为Demo版本**：进行了功能简化，实际部署前应进行全面安全审计
2. **测试网络优先**：建议在测试网络充分测试后再部署到主网
3. **信息安全**：企业统一社会信用代码以哈希形式存储，确保信息安全
4. **参数调整**：合约参数（利率、阈值等）可根据实际业务需求灵活调整
5. **私钥安全**：本地测试账户的私钥仅用于开发，不要在主网使用
6. **数据持久性**：本地节点重启后，所有数据会丢失，需要重新部署合约

## 许可证

本项目采用MIT许可证 - 详情请参阅LICENSE文件

## 项目架构说明

本项目是一个基于区块链的应用，主要由以下两部分组成：

1. **智能合约层**：使用Solidity编写，部署在以太坊或兼容EVM的区块链上
   - 负责核心业务逻辑实现
   - 使用Hardhat作为开发框架
   - 通过智能合约实现企业管理、绿色数据评估、积分计算和贷款管理等功能

2. **前端应用层**：HTML、CSS、JavaScript开发的Web应用
   - 提供用户交互界面
   - 通过Web3库与智能合约进行交互
   - 负责展示数据和接收用户操作

注意：本项目没有传统意义上的后端服务器，业务逻辑主要由区块链上的智能合约执行，前端直接与区块链交互。
