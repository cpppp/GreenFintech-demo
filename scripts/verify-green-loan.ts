import { ethers } from "hardhat";

// 已部署的合约地址
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  console.log("开始验证GreenLoanContract合约功能...");
  console.log(`合约地址: ${CONTRACT_ADDRESS}`);
  
  try {
    // 使用ethers直接连接合约
    const provider = ethers.provider;
    
    // 检查合约代码是否存在（非空）
    const code = await provider.getCode(CONTRACT_ADDRESS);
    
    if (code === "0x") {
      console.error("错误：合约地址不存在或未部署合约");
      return;
    }
    
    console.log("✓ 合约代码存在，部署成功");
    
    // 获取合约实例
    const contract = await ethers.getContractAt("GreenLoanContract", CONTRACT_ADDRESS);
    
    // 尝试读取管理员地址
    const admin = await contract.admin();
    console.log(`✓ 成功读取合约数据：管理员地址 = ${admin}`);
    
    console.log("\n验证完成！合约部署成功且能够正常交互。");
    
  } catch (error) {
    console.error("验证失败:", error);
  }
}

// 执行验证
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("验证脚本执行失败:", error);
    process.exit(1);
  });