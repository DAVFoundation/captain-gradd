module.exports = (process.env.BLOCKCHAIN_TYPE === 'MAINNET' ? [
    '0x2884711d6d545ced73e835f0cc0105981927172e',
    '0x26793fca7d4446ed0565c50461cdb7edaaaa624f',
    '0x316036CeA6B9222fe6fCD0a5cA8efDD0d8A05911'
] : [
    '0xabbde26d338b1b2abf5f07d41cb4f08d6a1bd637',
    '0x59Ab5eC10D8183A6A9E840897094ee8F52554fE9',
    '0x593D4f23fB7f9Fc2e22b6CC5F506b72EeF0663ca'
]).map(s => s.toLowerCase());