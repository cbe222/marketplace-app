
interface ContractAddressesProps{
  lineOfCreditAddress: string;
  spigotedLineAddress: string;
  escrowAddress: string;
}

export function borrower(props: ContractAddressesProps) {
  // use CreditLineService, ....
  return {
    addCredit,
    close,
    setRates,
    increaseCredit,
    depositAndRepay,
    depositAndClose,
    claimAndTrade,
    claimAndRepay,
    addCollateral,
    removeCollateral,
    addSpigot
  };
}

function addCredit() {
  
}

function close() {
}

function setRates() {
}

function increaseCredit() {
}

function depositAndRepay() {
}

function depositAndClose() {
}

function claimAndTrade() {
}

function claimAndRepay() {
}

function addCollateral() {
}

function removeCollateral() {
}

function addSpigot() {
}
