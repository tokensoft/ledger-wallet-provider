"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _hookedWallet = require("web3-provider-engine/subproviders/hooked-wallet.js");

var _hookedWallet2 = _interopRequireDefault(_hookedWallet);

var _LedgerWallet = require("./LedgerWallet");

var _LedgerWallet2 = _interopRequireDefault(_LedgerWallet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
    var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(path_override) {
        var ledger, LedgerWalletSubprovider;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        ledger = new _LedgerWallet2.default(path_override);
                        LedgerWalletSubprovider = new _hookedWallet2.default(ledger);


                        LedgerWalletSubprovider.ledger = ledger;

                        return _context.abrupt("return", LedgerWalletSubprovider);

                    case 4:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x) {
        return _ref.apply(this, arguments);
    };
}();