import HookedWalletSubprovider from "web3-provider-engine/subproviders/hooked-wallet.js";
import LedgerWallet from "./LedgerWallet";

export default async function (getNetworkId, path_override, askForOnDeviceConfirmation) {
    const ledger = new LedgerWallet(getNetworkId, path_override, askForOnDeviceConfirmation);
    await ledger.init();
    const LedgerWalletSubprovider = new HookedWalletSubprovider(ledger);

    // This convenience method lets you handle the case where your users browser doesn't support U2F
    // before adding the LedgerWalletSubprovider to a providerEngine instance.
    LedgerWalletSubprovider.isSupported = ledger.isU2FSupported;
    LedgerWalletSubprovider.ledger = ledger;

    return LedgerWalletSubprovider;
};
