/**
 * @title 预制菜企业绿色贷款智能合约
 * @dev 基于区块链的预制菜企业绿色贷款管理系统
 * 该合约实现了企业注册、绿色表现数据管理、积分计算、贷款申请与发放等功能
 * 本Demo版本进行了功能简化，聚焦于核心业务流程
 */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GreenLoanContract {
    /**
     * @dev 管理员地址
     * 合约部署者自动成为管理员，拥有最高权限
     */
    address public admin;
    
    /**
     * @dev 角色常量定义
     * 用于权限管理和身份识别
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ENTERPRISE_ROLE = keccak256("ENTERPRISE_ROLE");
    
    /**
     * @dev 贷款参数配置
     * 所有利率均以万分之几为单位存储，避免浮点数精度问题
     */
    uint256 public normalLoanRate; // 正常贷款利率（万分之几）
    uint256 public greenLoanRate;  // 绿色优惠贷款利率（万分之几）
    uint256 public fixedLoanAmount; // 固定贷款额度
    
    /**
     * @dev 积分参数配置
     * 用于控制绿色表现评估和贷款资格判定
     */
    uint256 public greenThreshold; // 绿色达标阈值（百分比，如15表示15%）
    uint256 public minPointsForGreenLoan; // 绿色贷款所需最低积分
    uint256 public dataValidPeriod; // 数据有效期限（秒）
    
    /**
     * @dev 企业信息结构体
     * 存储企业的基本信息、认证状态和积分数据
     */
    struct Enterprise {
        string name; // 企业名称
        string socialCreditCodeHash; // 统一社会信用代码哈希值
        bool isVerified; // 是否已通过管理员认证
        uint256 totalPoints; // 企业累计绿色积分
        uint256 lastDataUploadTime; // 最后一次上传数据的时间戳
    }
    
    /**
     * @dev 绿色表现数据结构体
     * 记录企业的绿色表现数据、核验状态和积分情况
     */
    struct GreenData {
        uint256 baseline; // 基准线数据（如原能耗）
        uint256 actualData; // 实际表现数据（如当前能耗）
        string dataType; // 数据类型（如"能耗"、"包装排放"等）
        uint256 timestamp; // 数据上传时间戳
        bool isValid; // 是否已通过管理员核验
        uint256 pointsEarned; // 该数据获得的积分
    }
    
    /**
     * @dev 贷款记录结构体
     * 存储贷款的详细信息和状态
     */
    struct Loan {
        uint256 id; // 贷款唯一标识
        address enterprise; // 申请贷款的企业地址
        bool isGreenLoan; // 是否为绿色优惠贷款
        uint256 rate; // 贷款利率（万分之几）
        uint256 amount; // 贷款金额
        uint256 timestamp; // 贷款申请时间戳
        string status; // 贷款状态（"pending", "approved", "paid"）
    }
    
    /**
     * @dev 映射：企业地址 => 企业信息
     * 用于快速查找和访问企业信息
     */
    mapping(address => Enterprise) public enterprises;
    
    /**
     * @dev 映射：企业地址 => 数据记录数组
     * 存储每个企业的所有绿色表现数据
     */
    mapping(address => GreenData[]) public enterpriseData;
    
    /**
     * @dev 映射：企业地址 => 贷款记录数组
     * 存储每个企业的所有贷款申请记录
     */
    mapping(address => Loan[]) public enterpriseLoans;
    
    /**
     * @dev 全局贷款ID计数器
     * 用于生成唯一的贷款ID
     */
    uint256 public loanIdCounter;
    
    /**
     * @dev 已注册企业地址列表
     * 存储所有提交注册申请的企业地址
     */
    address[] public registeredEnterprises;
    
    /**
     * @dev 事件定义
     * 用于记录合约关键操作，便于链下监听和审计
     */
    event EnterpriseRegistered(address indexed enterprise, string name); // 企业注册事件
    event EnterpriseVerified(address indexed enterprise); // 企业认证事件
    event GreenDataUploaded(address indexed enterprise, uint256 dataId); // 绿色数据上传事件
    event GreenDataVerified(address indexed enterprise, uint256 dataId, uint256 pointsEarned); // 数据核验事件
    event PointsDeducted(address indexed enterprise, uint256 amount, string reason); // 积分扣减事件
    event LoanApplied(address indexed enterprise, uint256 loanId, bool isGreenLoan); // 贷款申请事件
    event LoanApproved(address indexed enterprise, uint256 loanId, uint256 amount, uint256 rate); // 贷款批准事件
    event ParametersUpdated(string parameterType, uint256 newValue, address updatedBy); // 参数更新事件
    
    /**
     * @dev 修饰器：检查调用者是否为管理员
     * 用于限制只有管理员可以执行的操作
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not admin");
        _;
    }
    
    /**
     * @dev 修饰器：检查企业是否已注册且已认证
     * 用于限制只有已认证企业可以执行的操作
     */
    modifier onlyVerifiedEnterprise() {
        require(enterprises[msg.sender].isVerified, "Enterprise not verified");
        _;
    }
    
    /**
     * @dev 构造函数
     * 初始化合约参数和管理员权限
     */
    constructor() {
        admin = msg.sender;
        
        // 设置默认参数
        normalLoanRate = 450; // 4.5%
        greenLoanRate = 430;  // 4.3%
        fixedLoanAmount = 1000000; // 100万
        greenThreshold = 15; // 15%
        minPointsForGreenLoan = 100; // 100分
        dataValidPeriod = 90 * 24 * 60 * 60; // 90天
    }
    
    /**
     * @dev 设置贷款利率
     * @param _normalRate 正常贷款利率（万分之几）
     * @param _greenRate 绿色优惠贷款利率（万分之几）
     * 仅管理员可调用此函数
     */
    function setLoanRates(uint256 _normalRate, uint256 _greenRate) external onlyAdmin {
        require(_normalRate > 0 && _greenRate > 0, "Rates must be greater than 0");
        normalLoanRate = _normalRate;
        greenLoanRate = _greenRate;
        emit ParametersUpdated("LoanRates", _normalRate, msg.sender);
    }
    
    /**
     * @dev 设置积分规则
     * @param _threshold 绿色达标阈值（百分比）
     * @param _minPoints 申请绿色贷款所需的最低积分
     * 仅管理员可调用此函数
     */
    function setPointRules(uint256 _threshold, uint256 _minPoints) external onlyAdmin {
        require(_threshold <= 100, "Threshold cannot exceed 100%");
        require(_minPoints > 0, "Minimum points must be greater than 0");
        greenThreshold = _threshold;
        minPointsForGreenLoan = _minPoints;
        emit ParametersUpdated("PointRules", _threshold, msg.sender);
    }
    
    /**
     * @dev 设置贷款基础参数
     * @param _amount 固定贷款额度
     * @param _validPeriod 数据有效期限（秒）
     * 仅管理员可调用此函数
     */
    function setLoanParameters(uint256 _amount, uint256 _validPeriod) external onlyAdmin {
        require(_amount > 0, "Loan amount must be greater than 0");
        require(_validPeriod > 0, "Valid period must be greater than 0");
        fixedLoanAmount = _amount;
        dataValidPeriod = _validPeriod;
        emit ParametersUpdated("LoanParameters", _amount, msg.sender);
    }
    
    /**
     * @dev 企业注册
     * @param _name 企业名称
     * @param _socialCreditCodeHash 统一社会信用代码的哈希值
     * 任意地址均可调用此函数提交注册申请
     */
    function registerEnterprise(string calldata _name, string calldata _socialCreditCodeHash) external {
        require(bytes(_name).length > 0, "Enterprise name cannot be empty");
        require(bytes(_socialCreditCodeHash).length > 0, "Social credit code hash cannot be empty");
        require(!enterprises[msg.sender].isVerified, "Enterprise already registered");
        
        enterprises[msg.sender] = Enterprise({
            name: _name,
            socialCreditCodeHash: _socialCreditCodeHash,
            isVerified: false,
            totalPoints: 0,
            lastDataUploadTime: 0
        });
        
        registeredEnterprises.push(msg.sender);
        
        emit EnterpriseRegistered(msg.sender, _name);
    }
    
    /**
     * @dev 管理员审核企业
     * @param _enterprise 待审核的企业地址
     * 仅管理员可调用此函数，审核通过后企业才能进行后续操作
     */
    function verifyEnterprise(address _enterprise) external onlyAdmin {
        require(bytes(enterprises[_enterprise].name).length > 0, "Enterprise not registered");
        require(!enterprises[_enterprise].isVerified, "Enterprise already verified");
        
        enterprises[_enterprise].isVerified = true;
        
        emit EnterpriseVerified(_enterprise);
    }
    
    /**
     * @dev 查询企业自身信息
     * @return name 企业名称
     * @return socialCreditCodeHash 统一社会信用代码哈希
     * @return isVerified 是否已认证
     * @return totalPoints 累计积分
     * 企业可查询自身信息
     */
    function getEnterpriseInfo() external view returns (
        string memory name,
        string memory socialCreditCodeHash,
        bool isVerified,
        uint256 totalPoints
    ) {
        Enterprise memory enterprise = enterprises[msg.sender];
        return (
            enterprise.name,
            enterprise.socialCreditCodeHash,
            enterprise.isVerified,
            enterprise.totalPoints
        );
    }
    
    /**
     * @dev 查询指定企业信息
     * @param _enterprise 企业地址
     * @return name 企业名称
     * @return socialCreditCodeHash 统一社会信用代码哈希
     * @return isVerified 是否已认证
     * @return totalPoints 累计积分
     * 仅管理员可查询任意企业信息
     */
    function getEnterpriseInfoByAddress(address _enterprise) external view onlyAdmin returns (
        string memory name,
        string memory socialCreditCodeHash,
        bool isVerified,
        uint256 totalPoints
    ) {
        Enterprise memory enterprise = enterprises[_enterprise];
        return (
            enterprise.name,
            enterprise.socialCreditCodeHash,
            enterprise.isVerified,
            enterprise.totalPoints
        );
    }
    
    /**
     * @dev 获取已注册企业列表
     * @return 已注册企业地址数组
     * 仅管理员可调用此函数
     */
    function getRegisteredEnterprises() external view onlyAdmin returns (address[] memory) {
        return registeredEnterprises;
    }
    
    /**
     * @dev 获取已注册企业数量
     * @return 企业数量
     * 公开函数，任何人可查询
     */
    function getRegisteredEnterprisesCount() external view returns (uint256) {
        return registeredEnterprises.length;
    }
    
    /**
     * @dev 上传绿色表现数据
     * @param _baseline 基准线数据
     * @param _actualData 实际表现数据
     * @param _dataType 数据类型
     * 仅已认证企业可调用此函数
     */
    function uploadGreenData(uint256 _baseline, uint256 _actualData, string calldata _dataType) external onlyVerifiedEnterprise {
        require(_baseline > 0, "Baseline must be greater than 0");
        require(_actualData <= _baseline, "Actual data must be less than or equal to baseline");
        require(bytes(_dataType).length > 0, "Data type cannot be empty");
        
        GreenData memory newData = GreenData({
            baseline: _baseline,
            actualData: _actualData,
            dataType: _dataType,
            timestamp: block.timestamp,
            isValid: false,
            pointsEarned: 0
        });
        
        enterpriseData[msg.sender].push(newData);
        enterprises[msg.sender].lastDataUploadTime = block.timestamp;
        
        uint256 dataId = enterpriseData[msg.sender].length - 1;
        emit GreenDataUploaded(msg.sender, dataId);
    }
    
    /**
     * @dev 管理员核验绿色表现数据
     * @param _enterprise 企业地址
     * @param _dataId 数据ID
     * 仅管理员可调用此函数，核验通过后自动计算积分
     */
    function verifyGreenData(address _enterprise, uint256 _dataId) external onlyAdmin {
        require(_dataId < enterpriseData[_enterprise].length, "Invalid data ID");
        require(!enterpriseData[_enterprise][_dataId].isValid, "Data already verified");
        
        GreenData storage data = enterpriseData[_enterprise][_dataId];
        data.isValid = true;
        
        // 计算积分
        uint256 points = 0;
        if (_dataId < enterpriseData[_enterprise].length) {
            uint256 reduction = data.baseline - data.actualData;
            uint256 reductionPercentage = (reduction * 100) / data.baseline;
            
            if (reductionPercentage >= greenThreshold) {
                points = 100; // 达标授予100分
                enterprises[_enterprise].totalPoints += points;
                data.pointsEarned = points;
            }
        }
        
        emit GreenDataVerified(_enterprise, _dataId, points);
    }
    
    /**
     * @dev 查询企业数据记录数量
     * @return 数据记录数量
     * 企业可查询自身数据记录数量
     */
    function getEnterpriseDataCount() external view returns (uint256) {
        return enterpriseData[msg.sender].length;
    }
    
    /**
     * @dev 查询指定企业数据记录数量
     * @param _enterprise 企业地址
     * @return 数据记录数量
     * 仅管理员可调用此函数
     */
    function getEnterpriseDataCountByAddress(address _enterprise) external view onlyAdmin returns (uint256) {
        return enterpriseData[_enterprise].length;
    }
    
    /**
     * @dev 查询企业自身数据记录
     * @param _dataId 数据ID
     * @return baseline 基准线数据
     * @return actualData 实际表现数据
     * @return dataType 数据类型
     * @return timestamp 上传时间戳
     * @return isValid 是否已核验
     * @return pointsEarned 获得的积分
     * 企业可查询自身数据记录详情
     */
    function getEnterpriseData(uint256 _dataId) external view returns (
        uint256 baseline,
        uint256 actualData,
        string memory dataType,
        uint256 timestamp,
        bool isValid,
        uint256 pointsEarned
    ) {
        require(_dataId < enterpriseData[msg.sender].length, "Invalid data ID");
        GreenData memory data = enterpriseData[msg.sender][_dataId];
        return (
            data.baseline,
            data.actualData,
            data.dataType,
            data.timestamp,
            data.isValid,
            data.pointsEarned
        );
    }
    
    /**
     * @dev 查询指定企业数据记录
     * @param _enterprise 企业地址
     * @param _dataId 数据ID
     * @return baseline 基准线数据
     * @return actualData 实际表现数据
     * @return dataType 数据类型
     * @return timestamp 上传时间戳
     * @return isValid 是否已核验
     * @return pointsEarned 获得的积分
     * 仅管理员可调用此函数
     */
    function getEnterpriseDataByAddress(address _enterprise, uint256 _dataId) external view onlyAdmin returns (
        uint256 baseline,
        uint256 actualData,
        string memory dataType,
        uint256 timestamp,
        bool isValid,
        uint256 pointsEarned
    ) {
        require(_dataId < enterpriseData[_enterprise].length, "Invalid data ID");
        GreenData memory data = enterpriseData[_enterprise][_dataId];
        return (
            data.baseline,
            data.actualData,
            data.dataType,
            data.timestamp,
            data.isValid,
            data.pointsEarned
        );
    }
    
    /**
     * @dev 查询企业当前积分
     * @return 当前累计积分
     * 企业可查询自身积分
     */
    function getEnterprisePoints() external view returns (uint256) {
        return enterprises[msg.sender].totalPoints;
    }
    
    /**
     * @dev 查询指定企业积分
     * @param _enterprise 企业地址
     * @return 当前累计积分
     * 仅管理员可调用此函数
     */
    function getEnterprisePointsByAddress(address _enterprise) external view onlyAdmin returns (uint256) {
        return enterprises[_enterprise].totalPoints;
    }
    
    /**
     * @dev 检查企业是否有资格申请绿色贷款
     * @return 是否符合绿色贷款条件
     * 检查积分是否足够且数据在有效期内
     */
    function canApplyGreenLoan() external view returns (bool) {
        return enterprises[msg.sender].totalPoints >= minPointsForGreenLoan && 
               (block.timestamp - enterprises[msg.sender].lastDataUploadTime <= dataValidPeriod);
    }
    
    /**
     * @dev 检查指定企业是否有资格申请绿色贷款
     * @param _enterprise 企业地址
     * @return 是否符合绿色贷款条件
     * 仅管理员可调用此函数
     */
    function canApplyGreenLoanByAddress(address _enterprise) external view onlyAdmin returns (bool) {
        return enterprises[_enterprise].totalPoints >= minPointsForGreenLoan && 
               (block.timestamp - enterprises[_enterprise].lastDataUploadTime <= dataValidPeriod);
    }
    
    /**
     * @dev 扣减企业积分（内部函数）
     * @param _enterprise 企业地址
     * @param _amount 扣减的积分数量
     * 用于贷款申请等场景，自动扣减相应积分
     */
    function deductPoints(address _enterprise, uint256 _amount) internal {
        require(enterprises[_enterprise].totalPoints >= _amount, "Insufficient points");
        enterprises[_enterprise].totalPoints -= _amount;
        emit PointsDeducted(_enterprise, _amount, "Green loan application");
    }
    
    /**
     * @dev 查询贷款类型信息
     * @return normalRate 正常贷款利率
     * @return greenRate 绿色优惠贷款利率
     * @return minGreenPoints 申请绿色贷款所需最低积分
     * @return loanAmount 固定贷款额度
     * @return eligibleForGreen 当前企业是否有资格申请绿色贷款
     * 企业可查询当前贷款相关参数和自身资格
     */
    function getLoanTypesInfo() external view returns (
        uint256 normalRate,
        uint256 greenRate,
        uint256 minGreenPoints,
        uint256 loanAmount,
        bool eligibleForGreen
    ) {
        // 直接实现资格检查逻辑，避免函数调用顺序问题
        bool eligible = enterprises[msg.sender].totalPoints >= minPointsForGreenLoan && 
                       (block.timestamp - enterprises[msg.sender].lastDataUploadTime <= dataValidPeriod);
        return (
            normalLoanRate,
            greenLoanRate,
            minPointsForGreenLoan,
            fixedLoanAmount,
            eligible
        );
    }
    
    /**
     * @dev 提交贷款申请
     * @param _isGreenLoan 是否申请绿色贷款
     * @return loanId 生成的贷款ID
     * 仅已认证企业可调用此函数，符合条件的申请自动审批通过
     */
    function applyForLoan(bool _isGreenLoan) external onlyVerifiedEnterprise returns (uint256) {
        // 验证申请条件
        if (_isGreenLoan) {
            require(enterprises[msg.sender].totalPoints >= minPointsForGreenLoan, "Insufficient green points");
            require(block.timestamp - enterprises[msg.sender].lastDataUploadTime <= dataValidPeriod, "Green data expired");
        }
        
        // 创建贷款记录
        uint256 loanId = loanIdCounter++;
        uint256 rate = _isGreenLoan ? greenLoanRate : normalLoanRate;
        
        Loan memory newLoan = Loan({
            id: loanId,
            enterprise: msg.sender,
            isGreenLoan: _isGreenLoan,
            rate: rate,
            amount: fixedLoanAmount,
            timestamp: block.timestamp,
            status: "approved" // 简化为自动审批通过
        });
        
        enterpriseLoans[msg.sender].push(newLoan);
        
        // 如果是绿色贷款，扣减积分
        if (_isGreenLoan) {
            deductPoints(msg.sender, minPointsForGreenLoan);
        }
        
        emit LoanApplied(msg.sender, loanId, _isGreenLoan);
        emit LoanApproved(msg.sender, loanId, fixedLoanAmount, rate);
        
        return loanId;
    }
    
    /**
     * @dev 查询企业贷款记录数量
     * @return 贷款记录数量
     * 企业可查询自身贷款记录数量
     */
    function getEnterpriseLoanCount() external view returns (uint256) {
        return enterpriseLoans[msg.sender].length;
    }
    
    /**
     * @dev 查询指定企业贷款记录数量
     * @param _enterprise 企业地址
     * @return 贷款记录数量
     * 仅管理员可调用此函数
     */
    function getEnterpriseLoanCountByAddress(address _enterprise) external view onlyAdmin returns (uint256) {
        return enterpriseLoans[_enterprise].length;
    }
    
    /**
     * @dev 查询企业自身贷款记录
     * @param _loanId 贷款索引
     * @return id 贷款ID
     * @return isGreenLoan 是否为绿色贷款
     * @return rate 贷款利率
     * @return amount 贷款金额
     * @return timestamp 申请时间戳
     * @return status 贷款状态
     * 企业可查询自身贷款记录详情
     */
    function getEnterpriseLoan(uint256 _loanId) external view returns (
        uint256 id,
        bool isGreenLoan,
        uint256 rate,
        uint256 amount,
        uint256 timestamp,
        string memory status
    ) {
        require(_loanId < enterpriseLoans[msg.sender].length, "Invalid loan ID");
        Loan memory loan = enterpriseLoans[msg.sender][_loanId];
        return (
            loan.id,
            loan.isGreenLoan,
            loan.rate,
            loan.amount,
            loan.timestamp,
            loan.status
        );
    }
    
    /**
     * @dev 查询指定企业贷款记录
     * @param _enterprise 企业地址
     * @param _loanId 贷款索引
     * @return id 贷款ID
     * @return isGreenLoan 是否为绿色贷款
     * @return rate 贷款利率
     * @return amount 贷款金额
     * @return timestamp 申请时间戳
     * @return status 贷款状态
     * 仅管理员可调用此函数
     */
    function getEnterpriseLoanByAddress(address _enterprise, uint256 _loanId) external view onlyAdmin returns (
        uint256 id,
        bool isGreenLoan,
        uint256 rate,
        uint256 amount,
        uint256 timestamp,
        string memory status
    ) {
        require(_loanId < enterpriseLoans[_enterprise].length, "Invalid loan ID");
        Loan memory loan = enterpriseLoans[_enterprise][_loanId];
        return (
            loan.id,
            loan.isGreenLoan,
            loan.rate,
            loan.amount,
            loan.timestamp,
            loan.status
        );
    }
}