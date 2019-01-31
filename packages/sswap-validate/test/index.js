const { expect } = require('chai');
const valid = require('../index')

describe('valid', function () {

  const invoice = 'lnbc1500n1pwy7xnjpp50n5qyywe7469fru7865acqa8y7f75fqk75jy946j35c6mcc4uatsdpv2fjkzep6ypgxccteypxxjemgw3hxjmn8ypfkucttv5xscqzysxqr23s2g8mtaetz4czfhwxadaykz7w3z2ja38634fw3n6pghx95up97kz8vtux29xufk2h8h9h8ezfqzgufgzm94zpzczat4dylhhh6n3ecdqp28u23c'
  const redeemScript = '76a91461772452699bd09cdd7d46cb2a547180b45e777b87637521021913e8f8184b746e29e2fbb7320f808212bd10ceca759b45d6df46bd8451e9676703fa8d08b17576a914757d0725b01ce3ae5ed40a148771bd1df3adf6f68868ac'
  const swapP2SHP2WSHAddress = '39KBK7rPjMYFezbLFjcifz9WJUvmzqzMbc'
  const swapP2SHAddress = '36QtVuAfujnbkycEhrw5mA872PQ2tAZVUp'
  const swapP2WSHAddress = 'bc1qapt77evelge5yfwf6mymqul2z9hs3ffe56rhchyzr3yrjehfecgs7c9s82'
  const refundAddress = '1BiDqY6xZJUmijoAhyXXVzCM1B13CKxREJ'

  it('works', function () {
    const res = valid({
      swapAddress: swapP2SHP2WSHAddress,
      redeemScript,
      refundAddress,
      invoice,
    })
    expect(res).to.be.true;
  })

})
