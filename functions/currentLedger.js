
let currentLedger = async function(client, ledger_index){
    var ledgerindex = await client.request({
        "command": "ledger",
        "ledger_index": ledger_index
    })

    var current = ledgerindex.result.ledger_index

    if(current == undefined){
        var current = ledgerindex.result.ledger_current_index
    }
    var ledgertime = ledgerindex.result.ledger.close_time
    return [current, ledgertime]
}
module.exports = { currentLedger };
