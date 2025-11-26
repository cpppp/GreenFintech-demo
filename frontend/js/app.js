// 全局变量
let web3;
let contract;
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
let contractABI = [];
let currentAccount = null;

// DOM元素
const connectWalletBtn = document.getElementById('connectWallet');
const walletInfo = document.getElementById('walletInfo');
const accountAddress = document.getElementById('accountAddress');
const disconnectWalletBtn = document.getElementById('disconnectWallet');
const connectionStatus = document.getElementById('connectionStatus');
const networkName = document.getElementById('networkName');

// 功能按钮
const getAdminBtn = document.getElementById('getAdmin');
const registerEnterpriseBtn = document.getElementById('registerEnterprise');
const submitGreenDataBtn = document.getElementById('submitGreenData');
const applyLoanBtn = document.getElementById('applyLoan');
const getEnterpriseInfoBtn = document.getElementById('getEnterpriseInfo');
const getEnterpriseDataBtn = document.getElementById('getEnterpriseData');
const checkGreenLoanEligibilityBtn = document.getElementById('checkGreenLoanEligibility');
const getEnterpriseLoanBtn = document.getElementById('getEnterpriseLoan');
const verifyEnterpriseBtn = document.getElementById('verifyEnterprise');
const verifyGreenDataBtn = document.getElementById('verifyGreenData');
const getRegisteredEnterprisesBtn = document.getElementById('getRegisteredEnterprises');
const transferEthToContractBtn = document.getElementById('transferEthToContract');

// 初始化应用
async function initApp() {
    // 初始化输入验证
    initValidation();
    
    // 检查浏览器是否支持以太坊
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask已检测到');
        
        // 初始化web3实例
        web3 = new Web3(window.ethereum);
        
        // 始终从断开状态开始，不自动检查已连接账户
        updateUIForWalletState(false);
        
        // 获取当前网络信息
        try {
            const chainId = await web3.eth.getChainId();
            updateNetworkInfo(chainId);
        } catch (error) {
            console.error('获取网络信息失败:', error);
        }
        
        // 监听账户变化
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        // 监听网络变化
        window.ethereum.on('chainChanged', handleChainChanged);
    } else {
        console.warn('MetaMask未安装');
        // 显示友好提示而不是中断应用流程
        showResult('wallet-error', 'Please install MetaMask browser extension to use this application', true);
        connectionStatus.textContent = 'Connection: MetaMask not detected';
    connectionStatus.className = 'status offline';
        // 更新UI状态
        updateUIForWalletState(false);
    }
}

function updateUIForWalletState(isConnected) {
    if (isConnected) {
        connectWalletBtn.classList.add('hidden');
        walletInfo.classList.remove('hidden');
        enableFunctionButtons();
    } else {
        connectWalletBtn.classList.remove('hidden');
        walletInfo.classList.add('hidden');
        disableFunctionButtons();
    }
}

// 添加输入框验证功能
function validateInputs() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // 以太坊地址验证
            if (this.placeholder && this.placeholder.includes('地址')) {
                if (this.value && !this.value.startsWith('0x') && this.value.length !== 42) {
                    this.classList.add('invalid-input');
                } else {
                    this.classList.remove('invalid-input');
                }
            }
            // 数字验证
            if (this.type === 'number') {
                if (this.value && this.value < 0) {
                    this.classList.add('invalid-input');
                } else {
                    this.classList.remove('invalid-input');
                }
            }
        });
    });
}

// 在initApp开始时调用验证函数
function initValidation() {
    // 添加CSS用于无效输入样式
    const style = document.createElement('style');
    style.textContent = `
        .invalid-input {
            border-color: #ff3b30 !important;
            background-color: rgba(255, 59, 48, 0.05);
        }
        .input-feedback {
            font-size: 12px;
            color: #ff3b30;
            margin-top: -5px;
            margin-bottom: 10px;
            display: block;
        }
    `;
    document.head.appendChild(style);
    
    validateInputs();
}

// 处理连接钱包
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            connectWalletBtn.disabled = true;
            connectWalletBtn.innerHTML = '<div class="loading"></div> 连接中...';
            
            // 始终使用最新的ethereum对象重新初始化web3
            web3 = new Web3(window.ethereum);
            
            // 请求账户访问权限
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            // 确保连接到正确的网络（Hardhat本地网络，chainId: 1337）
            const chainId = await web3.eth.getChainId();
            if (chainId !== 1337) {
                try {
                    await switchToLocalNetwork();
                } catch (error) {
                    console.error('网络切换失败:', error);
                    showResult('network-error', 'Please manually switch to local Hardhat network (http://localhost:8545)');
                    // 即使网络切换失败，如果有账户，也应该继续处理
                    if (accounts.length > 0) {
                        handleAccountsChanged(accounts);
                    }
                }
            }
        } catch (error) {
            console.error('连接钱包失败:', error);
            showResult('wallet-error', `Failed to connect wallet: ${error.message || 'Please try again'}`);
        } finally {
            // 延迟恢复按钮状态，确保UI平滑过渡
            setTimeout(() => {
                if (!currentAccount) { // 只有在没有成功连接时才恢复原始状态
                    connectWalletBtn.disabled = false;
                    connectWalletBtn.textContent = '连接钱包';
                }
            }, 300);
        }
    } else {
        showResult('wallet-error', 'Please install MetaMask to use this application', true);
    }
}

// 处理账户变化
function handleAccountsChanged(accounts) {
    // 添加防抖逻辑，避免短时间内多次触发
    if (this.lastAccountChange && Date.now() - this.lastAccountChange < 300) {
        return;
    }
    this.lastAccountChange = Date.now();
    
    if (accounts.length > 0) {
        const address = accounts[0];
        
        // 如果是切换了钱包账户，先显示加载状态
        if (currentAccount && currentAccount !== address) {
            connectionStatus.textContent = 'Connection: Switching account...';
            connectionStatus.className = 'status connecting';
        }
        
        currentAccount = address;
        // 显示账户地址（截断显示）
        accountAddress.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        
        // 更新UI
        connectWalletBtn.classList.add('hidden');
        walletInfo.classList.remove('hidden');
        connectionStatus.textContent = 'Connection: Connected';
        connectionStatus.className = 'status online';
        
        // 初始化合约
        initContract();
    } else {
        // 断开连接
        disconnectWallet();
    }
}

// 断开钱包连接
function disconnectWallet() {
    currentAccount = null;
    // 保留web3实例但重置contract
    contract = null;
    
    // 更新UI
    connectWalletBtn.classList.remove('hidden');
    walletInfo.classList.add('hidden');
    connectionStatus.textContent = 'Connection: Not Connected';
        connectionStatus.className = 'status offline';
    
    // 禁用功能按钮
    disableFunctionButtons();
    
    // 重置连接按钮状态
    connectWalletBtn.disabled = false;
    connectWalletBtn.textContent = '连接钱包';
}

// 处理网络变化
function handleChainChanged(chainId) {
    // 不直接刷新页面，而是更新网络信息和重新初始化
    const numericChainId = parseInt(chainId, 16); // 转换为数字
    
    // 更新网络状态为切换中
    connectionStatus.textContent = 'Connection: Switching network...';
    connectionStatus.className = 'status connecting';
    
    // 延迟一下再更新，给用户一个过渡效果
    setTimeout(() => {
        updateNetworkInfo(numericChainId);
        
        // 如果已连接账户，重新初始化合约
        if (currentAccount) {
            // 重新初始化web3以确保使用正确的网络
            web3 = new Web3(window.ethereum);
            initContract();
        }
    }, 500);
}

// 更新网络信息
function updateNetworkInfo(chainId) {
    let network;
    
    switch (chainId) {
        case 1337:
            network = 'Local Blockchain';
            break;
        case 1:
            network = 'Ethereum Mainnet';
            break;
        case 3:
            network = 'Ropsten Testnet';
            break;
        case 4:
            network = 'Rinkeby Testnet';
            break;
        case 5:
            network = 'Goerli Testnet';
            break;
        case 11155111:
            network = 'Sepolia Testnet';
            break;
        default:
            network = `Unknown Network (${chainId})`;
    }
    
    networkName.textContent = network;
    
    // 如果不是本地网络，显示警告
    if (chainId !== 1337) {
        connectionStatus.textContent = 'Connection: Please switch to local network';
        connectionStatus.className = 'status offline';
    }
}

// 切换到本地网络
async function switchToLocalNetwork() {
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }] // 1337的十六进制表示
    });
}

// Generic result display function
function showResult(elementId, message, isError = false) {
    const element = document.getElementById(elementId) || document.createElement('div');
    if (element) {
        // 替换换行符为<br>
        const formattedMessage = message.replace(/\n/g, '<br>');
        element.innerHTML = `<p class="${isError ? 'error' : 'success'}">${formattedMessage}</p>`;
        
        // 5秒后清除结果
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
}

// 向合约转账ETH（管理员功能）
async function transferEthToContract() {
    if (!currentAccount || !contract) {
        showResult('transferEthResult', '请先连接钱包', true);
        return;
    }
    
    try {
        // 获取ETH金额
        const ethAmount = parseFloat(document.getElementById('ethAmount').value);
        if (isNaN(ethAmount) || ethAmount <= 0) {
            showResult('transferEthResult', 'Please enter a valid ETH amount', true);
            return;
        }
        
        // 检查是否为管理员
        const admin = await contract.methods.admin().call();
        if (admin.toLowerCase() !== currentAccount.toLowerCase()) {
            showResult('transferEthResult', '只有管理员可以执行此操作', true);
            return;
        }
        
        // 禁用按钮
        transferEthToContractBtn.disabled = true;
        transferEthToContractBtn.innerHTML = '<div class="loading"></div> 转账中...';
        
        // 转换为wei
        const weiAmount = web3.utils.toWei(ethAmount.toString(), 'ether');
        
        // 调用合约的adminDeposit函数
        const tx = await contract.methods.adminDeposit()
            .send({ 
                from: currentAccount,
                value: weiAmount 
            });
        
        showResult('transferEthResult', `Transfer successful!<br>Transaction Hash: ${tx.transactionHash}<br>Amount: ${ethAmount} ETH`);
        
        // 清空输入框
        document.getElementById('ethAmount').value = '';
        
    } catch (error) {
        console.error('转账失败:', error);
        showResult('transferEthResult', `转账失败: ${error.message}`, true);
    } finally {
        // 启用按钮
        transferEthToContractBtn.disabled = false;
        transferEthToContractBtn.textContent = '转账';
    }
}

// 事件监听
connectWalletBtn.addEventListener('click', connectWallet);
disconnectWalletBtn.addEventListener('click', disconnectWallet);

// 初始化合约
async function initContract() {
    if (!web3) {
        console.error('Web3未初始化');
        return;
    }
    
    try {
        // 加载ABI
        const response = await fetch('abis/GreenLoanContract.json');
        contractABI = await response.json();
        
        // 创建合约实例
        contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        console.log('合约初始化成功');
        
        // 启用功能按钮
        enableFunctionButtons();
    } catch (error) {
        console.error('合约初始化失败:', error);
        showResult('wallet-error', 'Failed to load contract, please refresh the page and try again');
    }
}

// 启用功能按钮
function enableFunctionButtons() {
    getAdminBtn.disabled = false;
    registerEnterpriseBtn.disabled = false;
    submitGreenDataBtn.disabled = false;
    applyLoanBtn.disabled = false;
    getEnterpriseInfoBtn.disabled = false;
    getEnterpriseDataBtn.disabled = false;
    checkGreenLoanEligibilityBtn.disabled = false;
    getEnterpriseLoanBtn.disabled = false;
    verifyEnterpriseBtn.disabled = false;
    verifyGreenDataBtn.disabled = false;
    getRegisteredEnterprisesBtn.disabled = false;
}

// 禁用功能按钮
function disableFunctionButtons() {
    getAdminBtn.disabled = true;
    registerEnterpriseBtn.disabled = true;
    submitGreenDataBtn.disabled = true;
    applyLoanBtn.disabled = true;
    getEnterpriseInfoBtn.disabled = true;
    getEnterpriseDataBtn.disabled = true;
    checkGreenLoanEligibilityBtn.disabled = true;
    getEnterpriseLoanBtn.disabled = true;
    verifyEnterpriseBtn.disabled = true;
    verifyGreenDataBtn.disabled = true;
    getRegisteredEnterprisesBtn.disabled = true;
}

// 获取管理员地址
async function getAdminAddress() {
    if (!contract) {
        showResult('adminResult', '合约未初始化', true);
        return;
    }
    
    try {
        getAdminBtn.disabled = true;
        const adminAddress = await contract.methods.admin().call();
        showResult('adminResult', `Admin Address: ${adminAddress}`);
    } catch (error) {
        console.error('获取管理员地址失败:', error);
        showResult('adminResult', '获取管理员地址失败', true);
    } finally {
        getAdminBtn.disabled = false;
    }
}

// 注册企业
async function registerEnterprise() {
    if (!contract || !web3) {
        showResult('registerResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    const enterpriseName = document.getElementById('enterpriseName').value;
    const socialCreditCode = document.getElementById('socialCreditCode').value;
    
    if (!enterpriseName || !socialCreditCode) {
        showResult('registerResult', 'Please enter enterprise name and social credit code', true);
        return;
    }
    
    try {
        registerEnterpriseBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 调用合约方法进行企业注册
        const tx = await contract.methods.registerEnterprise(enterpriseName, socialCreditCode, 'industry', 'description', 'contact')
            .send({ from: accounts[0] });
        
        showResult('registerResult', `Enterprise registered successfully! Transaction Hash: ${tx.transactionHash.substring(0, 10)}...`);
        
        // 清空输入
        document.getElementById('enterpriseName').value = '';
        document.getElementById('socialCreditCode').value = '';
    } catch (error) {
        console.error('注册企业失败:', error);
        showResult('registerResult', `注册企业失败: ${error.message}`, true);
    } finally {
        registerEnterpriseBtn.disabled = false;
    }
}

// 提交绿色数据
async function submitGreenData() {
    if (!contract || !web3) {
        showResult('dataResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    const baseline = document.getElementById('baseline').value;
    const actualData = document.getElementById('actualData').value;
    const dataType = document.getElementById('dataType').value;
    
    if (!baseline || !actualData || !dataType) {
        showResult('dataResult', 'Please enter all required data', true);
        return;
    }
    
    try {
        submitGreenDataBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 发送交易，使用正确的函数名submitGreenData
        // 获取相关参数
        const carbonReduction = document.getElementById('carbonReduction').value;
        const energyConsumption = document.getElementById('energyConsumption').value;
        const emissionReduction = document.getElementById('emissionReduction').value;
        
        const tx = await contract.methods.submitGreenData(
            dataType, parseFloat(carbonReduction), parseFloat(energyConsumption), parseFloat(emissionReduction), 'detail'
        ).send({ from: accounts[0] });
        
        showResult('dataResult', `Green data submitted successfully! Transaction Hash: ${tx.transactionHash.substring(0, 10)}...`);
        
        // 清空输入
        document.getElementById('baseline').value = '';
        document.getElementById('actualData').value = '';
        document.getElementById('dataType').value = '';
    } catch (error) {
        console.error('提交绿色数据失败:', error);
        showResult('dataResult', `提交绿色数据失败: ${error.message}`, true);
    } finally {
        submitGreenDataBtn.disabled = false;
    }
}

// 查询企业信息
async function getEnterpriseInfo() {
    if (!contract || !web3) {
        showResult('enterpriseInfoResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    try {
        getEnterpriseInfoBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 调用合约方法获取企业信息
        const info = await contract.methods.getEnterpriseInfo().call({ from: accounts[0] });
        
        // 处理返回结果
        let name = info[0];
        let socialCreditCode = info[1];
        let industry = info[2];
        let isVerified = info[3];
        let totalPoints = info[4];
        
        let status = isVerified ? '已认证' : '待认证';
        
        showResult('enterpriseInfoResult', 
            `Enterprise Name: ${name}<br>` +
            `Social Credit Code Hash: ${socialCreditCode}<br>` +
            `Industry: ${industry}<br>` +
            `Verification Status: ${status}<br>` +
            `Total Points: ${totalPoints}`
        );
    } catch (error) {
        console.error('查询企业信息失败:', error);
        showResult('enterpriseInfoResult', `查询企业信息失败: ${error.message}`, true);
    } finally {
        getEnterpriseInfoBtn.disabled = false;
    }
}

// 查询绿色数据
async function getEnterpriseData() {
    if (!contract || !web3) {
        showResult('enterpriseDataResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    const dataIdInput = document.getElementById('dataId').value;
    
    try {
        getEnterpriseDataBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        if (dataIdInput === '') {
            // 获取数据总数，将当前账户地址作为参数
            const count = await contract.methods.getEnterpriseDataCount(accounts[0]).call({ from: accounts[0] });
            showResult('enterpriseDataResult', `You have ${count} green data records`);
        } else {
            // 查询指定绿色数据
            const data = await contract.methods.getEnterpriseData(parseInt(dataIdInput)).call({ from: accounts[0] });
            
            let status = data[4] ? '已核验' : '待核验';
            let date = new Date(data[3] * 1000).toLocaleString();
            
            showResult('enterpriseDataResult', 
                `Data ID: ${dataIdInput}<br>` +
                `Data Type: ${data[2]}<br>` +
                `Baseline Value: ${data[0]}<br>` +
                `Actual Data: ${data[1]}<br>` +
                `Upload Time: ${date}<br>` +
                `Status: ${status}<br>` +
                `Points Earned: ${data[5]}`
            );
        }
    } catch (error) {
        console.error('查询绿色数据失败:', error);
        showResult('enterpriseDataResult', `查询绿色数据失败: ${error.message}`, true);
    } finally {
        getEnterpriseDataBtn.disabled = false;
    }
}

// 检查绿色贷款资格
async function checkGreenLoanEligibility() {
    if (!contract || !web3) {
        showResult('eligibilityResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    try {
        checkGreenLoanEligibilityBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 检查企业是否有资格申请绿色贷款和获取贷款利率信息
        const [normalRate, greenRate, minGreenPoints, loanAmount, eligible] = await contract.methods.getLoanTypesInfo().call({ from: accounts[0] });
        // 使用合约返回的实际值
        
        let eligibleText = eligible ? 'Eligible for green loan' : 'Not eligible for green loan';
        const normalRatePercent = (normalRate / 10000 * 100).toFixed(2) + '%';
        const greenRatePercent = (greenRate / 10000 * 100).toFixed(2) + '%';
        
        // 将贷款金额转换为ETH
        const amountInEth = web3.utils.fromWei(loanAmount.toString(), 'ether');
        
        showResult('eligibilityResult', 
            `${eligibleText}<br>` +
            `Normal Loan Rate: ${normalRatePercent}<br>` +
            `Green Loan Rate: ${greenRatePercent}<br>` +
            `Minimum Green Points Required: ${minGreenPoints}<br>` +
            `Fixed Loan Amount: ${amountInEth} ETH`
        );
    } catch (error) {
        console.error('检查绿色贷款资格失败:', error);
        showResult('eligibilityResult', `检查绿色贷款资格失败: ${error.message}`, true);
    } finally {
        checkGreenLoanEligibilityBtn.disabled = false;
    }
}

// 查询贷款记录
async function getEnterpriseLoan() {
    if (!contract || !web3) {
        showResult('loanRecordResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    const loanIdInput = document.getElementById('loanId').value;
    
    try {
        getEnterpriseLoanBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        if (loanIdInput === '') {
            // 获取贷款总数，将当前账户地址作为参数
            const count = await contract.methods.getEnterpriseLoanCount(accounts[0]).call({ from: accounts[0] });
            
            if (count === 0) {
                showResult('loanRecordResult', '您没有贷款记录');
            } else {
                let resultHtml = `You have ${count} loan records:<br><br>`;
                
                // 循环获取每一条贷款记录的详细信息
                for (let i = 0; i < count; i++) {
                    const [id, isGreenLoan, rate, amount, timestamp, status] = await contract.methods.getEnterpriseLoan(i).call({ from: accounts[0] });
                    
                    let loanType = isGreenLoan ? 'Green Loan' : 'Normal Loan';
                    let interestRate = (rate / 10000 * 100).toFixed(2) + '%';
                    let ethAmount = web3.utils.fromWei(amount, 'ether');
                    let date = new Date(timestamp * 1000).toLocaleString();
                    
                    resultHtml += `Loan ${i+1}:<br>` +
                        `Loan ID: ${id}<br>` +
                        `Loan Type: ${loanType}<br>` +
                        `Interest Rate: ${interestRate}<br>` +
                        `Loan Amount: ${ethAmount} ETH<br>` +
                        `Application Time: ${date}<br>` +
                        `Status: ${status}<br><br>`;
                }
                
                showResult('loanRecordResult', resultHtml);
            }
        } else {
            // 查询指定贷款
            const [id, isGreenLoan, rate, amount, timestamp, status] = await contract.methods.getEnterpriseLoan(loanIdInput).call({ from: accounts[0] });
            
            let loanType = isGreenLoan ? '绿色贷款' : '普通贷款';
            let interestRate = (rate / 10000 * 100).toFixed(2) + '%';
            let ethAmount = web3.utils.fromWei(amount, 'ether');
            let date = new Date(timestamp * 1000).toLocaleString();
            
            showResult('loanRecordResult', 
                `Loan ID: ${id}<br>` +
                `Loan Type: ${loanType}<br>` +
                `Interest Rate: ${interestRate}<br>` +
                `Loan Amount: ${ethAmount} ETH<br>` +
                `Application Time: ${date}<br>` +
                `Status: ${status}`
            );
        }
    } catch (error) {
        console.error('查询贷款记录失败:', error);
        showResult('loanRecordResult', `查询贷款记录失败: ${error.message}`, true);
    } finally {
        getEnterpriseLoanBtn.disabled = false;
    }
}

// 管理员认证企业
async function verifyEnterprise() {
    if (!contract || !web3) {
        showResult('verifyEnterpriseResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    const enterpriseAddress = document.getElementById('verifyEnterpriseAddress').value;
    
    if (!enterpriseAddress) {
        showResult('verifyEnterpriseResult', 'Please enter enterprise address', true);
        return;
    }
    
    try {
        verifyEnterpriseBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 发送交易
        const tx = await contract.methods.verifyEnterprise(enterpriseAddress)
            .send({ from: accounts[0] });
        
        showResult('verifyEnterpriseResult', `Enterprise verified successfully! Transaction Hash: ${tx.transactionHash.substring(0, 10)}...`);
        
        // 清空输入
        document.getElementById('verifyEnterpriseAddress').value = '';
    } catch (error) {
        console.error('认证企业失败:', error);
        showResult('verifyEnterpriseResult', `认证企业失败: ${error.message}`, true);
    } finally {
        verifyEnterpriseBtn.disabled = false;
    }
}

// 管理员核验绿色数据
async function verifyGreenDataAction() {
    if (!contract || !web3) {
        showResult('verifyDataResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    const enterpriseAddress = document.getElementById('verifyDataEnterpriseAddress').value;
    const dataId = document.getElementById('verifyDataId').value;
    
    if (!enterpriseAddress || !dataId) {
        showResult('verifyDataResult', 'Please enter enterprise address and data ID', true);
        return;
    }
    
    try {
        verifyGreenDataBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 调用合约方法进行绿色数据核验
        const tx = await contract.methods.verifyGreenData(enterpriseAddress, parseInt(dataId))
            .send({ from: accounts[0] });
        
        showResult('verifyDataResult', `Data verified successfully! Transaction Hash: ${tx.transactionHash.substring(0, 10)}...`);
        
        // 清空输入
        document.getElementById('verifyDataEnterpriseAddress').value = '';
        document.getElementById('verifyDataId').value = '';
    } catch (error) {
        console.error('核验绿色数据失败:', error);
        showResult('verifyDataResult', `核验绿色数据失败: ${error.message}`, true);
    } finally {
        verifyGreenDataBtn.disabled = false;
    }
}

// 管理员获取已注册企业列表
async function getRegisteredEnterprises() {
    if (!contract || !web3) {
        showResult('registeredEnterprisesResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    try {
        getRegisteredEnterprisesBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 调用合约方法获取已注册企业列表
        const enterprises = await contract.methods.getRegisteredEnterprises().call({ from: accounts[0] });
        
        let result = `Number of Registered Enterprises: ${enterprises.length}<br>`;
        result += 'Enterprise Address List:<br>';
        
        for (let i = 0; i < enterprises.length; i++) {
            result += `${i + 1}. ${enterprises[i]}<br>`;
        }
        
        showResult('registeredEnterprisesResult', result);
    } catch (error) {
        console.error('获取已注册企业列表失败:', error);
        showResult('registeredEnterprisesResult', `获取已注册企业列表失败: ${error.message}`, true);
    } finally {
        getRegisteredEnterprisesBtn.disabled = false;
    }
}

// 申请贷款
async function applyLoan() {
    if (!contract || !web3) {
        showResult('loanResult', '合约未初始化或钱包未连接', true);
        return;
    }
    
    const loanType = document.getElementById('loanType').value;
    const isGreenLoan = loanType === 'green';
    
    try {
        applyLoanBtn.disabled = true;
        const accounts = await web3.eth.getAccounts();
        
        // 调用合约方法申请贷款
        const tx = await contract.methods.applyForLoan(isGreenLoan)
            .send({ from: accounts[0] });
        
        // 获取贷款信息
        const loanId = tx.events[0].returnValues.loanId;
        const amount = tx.events[0].returnValues.amount;
        const interestRate = tx.events[0].returnValues.interestRate;
        
        showResult('loanResult', 
            `Loan application successful!\n` +
            `Loan ID: ${loanId}\n` +
            `Loan Amount: ${web3.utils.fromWei(amount)} ETH\n` +
            `Interest Rate: ${web3.utils.fromWei(interestRate)}%`
        );
    } catch (error) {
        console.error('申请贷款失败:', error);
        showResult('loanResult', `申请贷款失败: ${error.message}`, true);
    } finally {
        applyLoanBtn.disabled = false;
    }
}

// 页面切换和侧边栏交互功能
function setupPageNavigation() {
    // 侧边栏导航按钮
    const menuToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // 页面导航元素
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    
    // 侧边栏切换
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('sidebar-active');
        });
    }
    
    // 页面切换功能
    if (navLinks.length > 0 && pageSections.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 获取目标页面ID
                const targetId = link.getAttribute('href').substring(1);
                
                // 切换活动导航项
                navLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');
                
                // 切换显示页面
                pageSections.forEach(section => {
                    if (section.id === targetId) {
                        section.classList.add('active');
                        section.classList.remove('hidden');
                    } else {
                        section.classList.remove('active');
                        section.classList.add('hidden');
                    }
                });
                
                // 在移动设备上点击导航后关闭侧边栏
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    mainContent.classList.remove('sidebar-active');
                }
            });
        });
    }
}

// 添加功能按钮事件监听
getAdminBtn.addEventListener('click', getAdminAddress);
registerEnterpriseBtn.addEventListener('click', registerEnterprise);
submitGreenDataBtn.addEventListener('click', submitGreenData);
applyLoanBtn.addEventListener('click', applyLoan);
getEnterpriseInfoBtn.addEventListener('click', getEnterpriseInfo);
getEnterpriseDataBtn.addEventListener('click', getEnterpriseData);
checkGreenLoanEligibilityBtn.addEventListener('click', checkGreenLoanEligibility);
getEnterpriseLoanBtn.addEventListener('click', getEnterpriseLoan);
verifyEnterpriseBtn.addEventListener('click', verifyEnterprise);
verifyGreenDataBtn.addEventListener('click', verifyGreenDataAction);
getRegisteredEnterprisesBtn.addEventListener('click', getRegisteredEnterprises);
transferEthToContractBtn.addEventListener('click', transferEthToContract);

// 扩展initApp函数以包含页面导航设置
const originalInitApp = initApp;
initApp = async function() {
    await originalInitApp();
    setupPageNavigation();
    
    // 默认显示控制面板页面
    const dashboardPage = document.getElementById('dashboard');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
        dashboardPage.classList.remove('hidden');
    }
    
    // 隐藏其他页面
    const otherPages = document.querySelectorAll('.page-section:not(#dashboard)');
    otherPages.forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    
    // 设置默认活动导航项
    const defaultNavItem = document.querySelector('.nav-link[href="#dashboard"]');
    if (defaultNavItem) {
        defaultNavItem.classList.add('active');
    }
};

// 初始化应用
window.addEventListener('load', initApp);