import HookedWalletSubprovider from "web3-provider-engine/subproviders/hooked-wallet.js";
import LedgerWallet from "./LedgerWallet";

export default async function (path_override) {
    const ledger = new LedgerWallet(path_override);
    const LedgerWalletSubprovider = new HookedWalletSubprovider(ledger);

    LedgerWalletSubprovider.ledger = ledger;

    return LedgerWalletSubprovider;
};
