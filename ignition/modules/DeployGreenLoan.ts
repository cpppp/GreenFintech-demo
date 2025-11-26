import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployGreenLoanModule = buildModule("DeployGreenLoanModule", (m) => {
  // 部署GreenLoanContract合约，不需要传入参数
  const greenLoanContract = m.contract("GreenLoanContract");

  return {
    greenLoanContract,
  };
});

export default DeployGreenLoanModule;