import ledger from 'ledgerco';
import EthereumTx from 'ethereumjs-tx';
import {timeout} from 'promise-timeout';
/**
 *  @class LedgerWallet
 *
 *
 *  Paths:
 *  Minimum Nano Ledger S accepts are:
 *
 *   * 44'/60'
 *   * 44'/61'
 *
 *  MyEtherWallet.com by default uses the range
 *
 *   * 44'/60'/0'/n
 *
 *  Note: no hardend derivation on the `n`
 *
 *  BIP44/EIP84 specificies:
 *
 *  * m / purpose' / coin_type' / account' / change / address_index
 *
 *  @see https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 *  @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 *  @see https://github.com/MetaMask/provider-engine
 *  @see https://github.com/ethereum/wiki/wiki/JavaScript-API
 *
 *  Implementations:
 *  https://github.com/MetaMask/metamask-plugin/blob/master/app/scripts/keyrings/hd.js
 *
 */
const allowed_hd_paths = ["44'/60'", "44'/61'"];

class LedgerWallet {

  constructor(path) {
    path = path || allowed_hd_paths[0];
    if (!allowed_hd_paths.some(hd_pref => path.startsWith(hd_pref)))
      throw new Error(`hd derivation path for Nano Ledger S may only start [${allowed_hd_paths}], ${path} was provided`);
    this._path = path;
    this._accounts = null;
    this.getAppConfig = this.getAppConfig.bind(this);
    this.getAccounts = this.getAccounts.bind(this);
    this.signTransaction = this.signTransaction.bind(this);
    this._getLedgerConnection = this._getLedgerConnection.bind(this);
    this.connectionOpened = false;
  }

  async _getLedgerConnection() {
    if (this.connectionOpened) {
      throw new Error("You can only have one ledger connection active at a time");
    } else {
      this.connectionOpened = true;
      return new ledger.eth(await ledger.comm_node.create_async());
    }
  }

  async _closeLedgerConnection(eth) {
    this.connectionOpened = false;
    await eth.comm.close_async();
  }

  /**
     @typedef {function} failableCallback
     @param error
     @param result
     */

  /**
   * Gets the version of installed ethereum app
   * @param {failableCallback} callback
   * @param ttl - timeout
   */
  async getAppConfig(callback, ttl) {
    let eth = await this._getLedgerConnection();
    let cleanupCallback = (error, data) => {
      this._closeLedgerConnection(eth);
      callback(error, data);
    };
    timeout(eth.getAppConfiguration_async(), ttl)
      .then(config => cleanupCallback(null, config))
      .catch(error => cleanupCallback(error))
  }

  /**
   * Gets a list of accounts from a device
   * @param {failableCallback} callback
   * @param askForOnDeviceConfirmation
   */
  async getAccounts(callback, askForOnDeviceConfirmation = true) {
    if (this._accounts !== null) {
      callback(null, this._accounts);
      return;
    }
    const chainCode = false; // Include the chain code
    let eth = await this._getLedgerConnection();
    let cleanupCallback = (error, data) => {
      this._closeLedgerConnection(eth);
      callback(error, data);
    };
    eth.getAddress_async(this._path, askForOnDeviceConfirmation, chainCode)
      .then(function (result) {
        this._accounts = [result.address.toLowerCase()];
        cleanupCallback(null, this._accounts);
      }.bind(this))
      .catch(error => cleanupCallback(error));
  }

  /**
   * Signs txData in a format that ethereumjs-tx accepts
   * @param {object} txData - transaction to sign
   * @param {failableCallback} callback - callback
   */
  async signTransaction(txData, callback) {
    // Encode using ethereumjs-tx
    let tx = new EthereumTx(txData);

    // Fetch the chain id
    web3.version.getNetwork(async function (error, chain_id) {
      if (error) callback(error);

      // Force chain_id to int
      chain_id = 0 | chain_id;

      // Set the EIP155 bits
      tx.raw[6] = Buffer.from([chain_id]); // v
      tx.raw[7] = Buffer.from([]);         // r
      tx.raw[8] = Buffer.from([]);         // s

      // Encode as hex-rlp for Ledger
      const hex = tx.serialize().toString("hex");

      let eth = await this._getLedgerConnection();
      let cleanupCallback = (error, data) => {
        this._closeLedgerConnection(eth);
        callback(error, data);
      };
      // Pass to _ledger for signing
      eth.signTransaction_async(this._path, hex)
        .then(result => {
          // Store signature in transaction
          tx.v = new Buffer(result.v, "hex");
          tx.r = new Buffer(result.r, "hex");
          tx.s = new Buffer(result.s, "hex");

          // EIP155: v should be chain_id * 2 + {35, 36}
          const signed_chain_id = Math.floor((tx.v[0] - 35) / 2);
          if (signed_chain_id !== chain_id) {
            cleanupCallback("Invalid signature received. Please update your Ledger Nano S.");
          }

          // Return the signed raw transaction
          const rawTx = "0x" + tx.serialize().toString("hex");
          cleanupCallback(undefined, rawTx);
        })
        .catch(error => cleanupCallback(error))
    }.bind(this))
  }
}

module.exports = LedgerWallet;
