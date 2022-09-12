let accountNftOffers = async function(client, address, ledger_index) {

    var allNFTokenOffers = []
    var marker = "begin"
    while (marker != null) {
        //console.log("Retrieving")
        if (marker == 'begin') {
            var accountObjects = await client.request({
                "command": "account_objects",
                "ledger_index": ledger_index,
                "account": address,
                "limit": 400
            })
        } else {
            var accountObjects = await client.request({
                "command": "account_objects",
                "ledger_index": ledger_index,
                "account": address,
                "marker": marker,
                "limit": 400
            })
        }

        //filter out NFTokenOffer Objects
        for (z in accountObjects.result.account_objects) {
            if (accountObjects.result.account_objects[z].LedgerEntryType != "NFTokenOffer") continue
            allNFTokenOffers.push(accountObjects.result.account_objects[z])
        }
        var marker = accountObjects.result.marker
    }
    return allNFTokenOffers
}
module.exports = {
    accountNftOffers
};