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
│   ├── js/                # JavaScript代码
│   └── index.html         # 主页面
├── ignition/              # 部署配置
├── scripts/               # 部署脚本
├── test/                  # 测试文件
├── hardhat.config.ts      # Hardhat配置
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目说明文档（当前文件）
```

## 本地环境搭建与运行指南

### 1. 环境要求

- **Node.js**: v16 或更高版本
- **npm**: v8 或更高版本
- **MetaMask**: 浏览器扩展钱包
- **Git**: 版本控制工具

### 2. 克隆项目

```bash
git clone <项目仓库地址>
cd GreenFintech_demo
```

### 3. 安装项目依赖

```bash
# 安装智能合约开发依赖（Hardhat等工具，用于编译、部署和测试智能合约）
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 4. 启动本地区块链节点

```bash
# 启动Hardhat本地节点
npx hardhat node
```

这个命令会启动一个本地以太坊区块链节点，并在终端显示10个测试账户，每个账户有10000个ETH。

### 5. 部署智能合约

在新的终端窗口中执行：

```bash
# 使用Hardhat Ignition部署合约到本地网络
npx hardhat ignition deploy ignition/modules/DeployGreenLoan.ts --network localhost
```

部署完成后，会在终端显示合约地址信息。在部署输出中查找 "GreenLoanContract deployed to" 或类似信息，复制显示的合约地址。

或者，您也可以在 `ignition/deployments/chain-31337/` 目录中找到最新的部署信息文件，其中包含部署的合约地址。

### 6. 更新前端合约地址

编辑 `frontend/js/app.js` 文件，找到合约初始化的部分，将合约地址更新为刚刚部署的地址：

```javascript
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

### 7. 启动前端服务

```bash
cd frontend
npm start
```

前端服务将在 http://127.0.0.1:3000 启动。

### 8. 配置MetaMask连接到本地网络

1. 打开浏览器中的MetaMask扩展
2. 点击网络选择器，选择 "添加网络" -> "添加网络手动"
3. 填写以下信息：
   - 网络名称：Localhost 8545
   - RPC URL：http://127.0.0.1:8545
   - 链ID：31337
   - 货币符号：ETH
4. 点击 "保存"
5. 导入测试账户：点击MetaMask账户图标 -> "导入账户" -> "私钥"
6. 从启动Hardhat节点的终端中复制一个私钥，粘贴到输入框中，点击"导入"

### 9. 开始使用

1. 打开 http://127.0.0.1:3000
2. 点击 "连接钱包" 按钮，连接MetaMask
3. 开始测试各项功能：
   - 企业注册
   - 上传绿色数据
   - 管理员验证企业
   - 申请贷款
   - 查询企业信息和贷款记录

### 注意事项

- 本地节点重启后，需要重新部署合约并更新前端中的合约地址
- 部署合约的账户默认为管理员账户
- 所有操作都需要支付gas费用（在本地网络中使用测试ETH）
- 确保MetaMask连接到正确的网络（Localhost 8545）

## 安全考虑

- 使用Solidity 0.8.0及以上版本，利用内置溢出保护
- 实现严格的权限控制机制
- 使用事件记录所有关键操作，便于审计
- 避免浮点数运算，使用整数比例表示百分比

## 注意事项

1. 本合约为Demo版本，进行了功能简化，实际部署前应进行全面安全审计
2. 建议在测试网络充分测试后再部署到主网
3. 企业统一社会信用代码以哈希形式存储，确保信息安全
4. 合约参数（利率、阈值等）可根据实际业务需求灵活调整

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
