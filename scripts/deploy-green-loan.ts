import hre from "hardhat";

async function main() {
  console.log("开始部署GreenLoanContract合约...");
  
  // 使用viem风格部署
  const contract = await hre.viem.deployContract("GreenLoanContract", []);
  
  console.log("GreenLoanContract合约部署成功!");
  console.log(`合约地址: ${contract.address}`);
  console.log(`交易哈希: ${contract.deploymentTransaction.hash}`);
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });
