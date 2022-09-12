let accountNFTs = async function(client, address, ledger_index) {

    var allNFTs = []
    var marker = "begin"
    while (marker != null) {
        if (marker == 'begin') {
            var accountNFTs = await client.request({
                "command": "account_nfts",
                "ledger_index": ledger_index,
                "account": address,
                "limit": 400
            })
        } else {
            var accountNFTs = await client.request({
                "command": "account_nfts",
                "ledger_index": ledger_index,
                "account": address,
                "marker": marker,
                "limit": 400
            })
        }
        var allNFTs = allNFTs.concat(accountNFTs.result.account_nfts)
        var marker = accountNFTs.result.marker
    }

    return allNFTs
}
module.exports = {
    accountNFTs
};