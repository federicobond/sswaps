const bolt11 = require('bolt11');
const { address, script, crypto, payments, networks } = require('bitcoinjs-lib');
const {
  OP_0, OP_DUP, OP_HASH160, OP_EQUAL, OP_IF, OP_DROP, OP_ELSE,
  OP_CHECKLOCKTIMEVERIFY, OP_EQUALVERIFY, OP_ENDIF, OP_CHECKSIG 
} = require('bitcoin-ops');

function equalIgnorePushes(script, template) {
  if (script.length != template.length) {
    return false;
  }

  for (var i = 0; i < script.length; i++) {
    if (template[i] == null) {
      if (typeof script[i] === 'number') {
        return false;
      }
    } else if (script[i] !== template[i]) {
      return false;
    }
  }

  return true;
}

function witnessScriptHash(witnessScript) {
  return script.compile([OP_0, crypto.sha256(witnessScript)])
}

function parseSwapScript(swapScriptBuf) {
  const asm = script.decompile(swapScriptBuf)

  if (asm.length === 17) {
    const template = [
      OP_DUP, OP_HASH160, null, OP_EQUAL, OP_IF, OP_DROP, null, OP_ELSE, null,
      OP_CHECKLOCKTIMEVERIFY, OP_DROP, OP_DUP, OP_HASH160, null, OP_EQUALVERIFY,
      OP_ENDIF, OP_CHECKSIG
    ]
    if (equalIgnorePushes(asm, template)) {
      return { type: 'pkh', paymentHash: asm[2], pubkeyHash: asm[13] }
    }
  } else if (asm.length === 12) {
    const template = [
      OP_HASH160, null, OP_EQUAL, OP_IF, null, OP_ELSE, null,
      OP_CHECKLOCKTIMEVERIFY, OP_DROP, null, OP_ENDIF, OP_CHECKSIG
    ]
    if (equalIgnorePushes(asm, template)) {
      return { type: 'pk', paymentHash: asm[2], pubkey: asm[9] }
    }
  }

  throw new Error("unrecognized swap script")
}

module.exports = function ({ swapAddress, redeemScript, refundAddress, invoice }) {
  // parse invoice
  const decoded = bolt11.decode(invoice)

  // look for payment hash
  var paymentHash = null
  for (var i = 0; i < decoded.tags.length; i++) {
    if (decoded.tags[i].tagName === 'payment_hash') {
      paymentHash = Buffer.from(decoded.tags[i].data, 'hex');
      break;
    }
  }

  if (!paymentHash) {
    throw new Error('missing payment hash in invoice')
  }

  const swapScriptBuf = Buffer.from(redeemScript, 'hex')

  // parse and check that script matches template
  const parsed = parseSwapScript(swapScriptBuf)

  // check that invoice hash in script is correct
  if (!parsed.paymentHash.equals(crypto.ripemd160(paymentHash))) {
    return false;
  }

  // check that refund address in script is correct
  if (parsed.type == 'pk') {
    throw new Error("refund script not supported: p2pk")
  }

  const addressPublicKeyHash = address.fromBase58Check(refundAddress).hash
  if (!parsed.pubkeyHash.equals(addressPublicKeyHash)) {
    return false;
  }

  // check that swap script hashes to a valid address
  // TODO: verify locktime makes sense too

  p2shAddress = payments.p2sh({
    hash: crypto.hash160(swapScriptBuf),
    networks: networks.bitcoin
  }).address

  p2wshAddress = payments.p2wsh({
    hash: crypto.sha256(swapScriptBuf),
    networks: networks.bitcoin
  }).address

  p2shp2wshAddress = payments.p2sh({
    hash: crypto.hash160(witnessScriptHash(swapScriptBuf)),
    networks: networks.bitcoin
  }).address

  if (![p2shAddress, p2wshAddress, p2shp2wshAddress].includes(swapAddress)) {
    return false;
  }

  return true;
}

