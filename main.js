//DEPENDANCIES
const xrpl = require(`xrpl`)
const fs = require('fs')

//FUNCTIONS
const { accountNFTs } = require(`./functions/accountNFTs`)
const { wait } = require(`./functions/wait`)
const { accountInfo } = require(`./functions/accountInfo`)
const { currentLedger } = require(`./functions/currentLedger`)
const { accountNftOffers } = require(`./functions/accountNftOffers`)

//config
const {
    nodes,
    senderSeed,
    recipientSeed,
    amountToTransfer,
    fee,
    transferAll
} = require(`./config.json`)

//CLIENTS
 let xrplClient = new xrpl.Client(nodes[0])

//WALLETS
const senderWallet = xrpl.Wallet.fromSeed(senderSeed)
const recipientWallet = xrpl.Wallet.fromSeed(recipientSeed)

//MAIN FUNCTION
async function main(){

    console.log(`\n\nThis open-source script was developed for free use by OnChain Markeplace\n\tForging a new era of trustless and open trading with NFTokens on the XRPL.\n\tBoasting NO trading fees, and low listing fees, OCM suits both projects and individuals\nVisit https://onchainmarketplace.net/ to learn more\n\tFeel free to contact us with any queries or concerns.`)

    //initialisation
    var nftsToTransfer = JSON.parse(fs.readFileSync(`./arrayTokenIDs.json`))
    var text = `\n<< Transferring DEFINED NFTokens >>`
    if(transferAll) var text = `\n<< Transferring ALL NFTokens >>`
    text += `\nFrom: ${senderWallet.classicAddress}\nTo: ${recipientWallet.classicAddress}\n\nYou Have 20 Seconds to confirm...\n<< Press "CTRL + C" To Cancel >>`
    console.log(text)
    await wait(20)

    //connect to XRPL
    var count = 0
    while (true) {

        if (count == nodes.length) {
            console.log(`FAILED TO CONNECT TO ANY XRPL CLIENTS`)
            process.exit(1)
        }

        try {
            await xrplClient.connect()
        } catch (error) {
            console.log(`\nFailed to Connect #${count}\n${error}`)
        }

        if (xrplClient.isConnected()) break
        count += 1
        xrplClient = new xrpl.Client(nodes[count])
    }
    console.log(`\nConnected to: ${xrplClient.connection.ws._url}`)


    //retrieve all nfts in sender
    console.log(`\nRetrieving NFTokens In sender -> ${senderWallet.classicAddress}`)
    var senderNFTs = await accountNFTs(xrplClient, senderWallet.classicAddress , "validated")
    console.log(`\tHolds ${senderNFTs.length} NFTokens`)
    

    //loop until ALL nfts are emptied from the sender
    console.log(`\n\n<< BEGINNING TRANSFERS >>`)
    var cycle = 0
    while(senderNFTs.length != 0){

        cycle += 1
        console.log(`\nTransfer Cycle #${cycle}`)

        //cancel any remaining offers to begin
        console.log(`Cancelling remaining NFT Offers`)
        var wallets = [ senderWallet, recipientWallet]
        for(a in wallets){

            var nftOffers = await accountNftOffers(xrplClient, wallets[a].classicAddress, "validated")

            var offers = []
            for(b in nftOffers){
                if(!transferAll) if(!(nftsToTransfer.includes(nftOffers[b].NFTokenID))) continue
                offers.push(nftOffers[b].index)
            }

            console.log(`\tCancelling ${offers.length} Offers From ${wallets[a].classicAddress}`)

            var prepared = await xrplClient.autofill({
                "TransactionType": "NFTokenCancelOffer",
                "Account": wallets[a].classicAddress,
                "NFTokenOffers": offers
            })

            var signed = wallets[a].sign(prepared)

            var result = await xrplClient.submit(signed.tx_blob)
            console.log(`\t\tCancelled`)
        }

        //wait for current ledger to be validated before continuing (helps ensure transactions were processed)
        console.log(`Waiting for "current" Legder To Be "validated"`)
        var currentIndex = (await currentLedger(xrplClient, 'current'))[0]
        var validatedIndex = 0
        while(validatedIndex != currentIndex){
            await wait(1)
            var validatedIndex = (await currentLedger(xrplClient, "validated"))[0] - 1
        }
        console.log(`\tSuccess`)

        //get account info/sequences and list of NFTs
        console.log(`Getting Account/Ledger Details`)
        var senderInfo = await accountInfo(xrplClient, senderWallet.classicAddress, "validated")
        var senderAccountSequence = senderInfo.result.account_data.Sequence

        var recipientInfo = await accountInfo(xrplClient, recipientWallet.classicAddress, "validated")
        var recipientAccountSequence = recipientInfo.result.account_data.Sequence

        var checkedLedgerIndex = (await currentLedger(xrplClient, "validated"))[0]
        var checkedledgerTime = Date.now()

        //get NFTokenIDs of next nfts to transfer
        var senderNFTs = []
        var marker = "begin"
        while(senderNFTs.length < amountToTransfer && marker != undefined){

            if (marker == "begin") {
                var result = await xrplClient.request({
                    "command": "account_nfts",
                    "ledger_index": "validated",
                    "account": senderWallet.classicAddress,
                    "limit": 400
                })
            } else {
                var result = await xrplClient.request({
                    "command": "account_nfts",
                    "ledger_index": "validated",
                    "account": senderWallet.classicAddress,
                    "marker": marker,
                    "limit": 400
                })
            }
            var marker = result.result.marker

            for(a in result.result.account_nfts){
                if(!transferAll) if(!(nftsToTransfer.includes(result.result.account_nfts[a].NFTokenID))) continue
                if(!transferAll) if(senderNFTs.length >= nftsToTransfer.length) break
                if(senderNFTs.length >= amountToTransfer) break
                senderNFTs.push(result.result.account_nfts[a])
            }
            if(!transferAll) if(senderNFTs.length >= nftsToTransfer.length) break
        }
        console.log(`\tTransfering ${senderNFTs.length} NFTs`)
    
        //place sell offers to recipient from sender
        console.log(`Placing Sell Orders From sender -> ${senderWallet.classicAddress}`)
        for(a in senderNFTs){

            var prepared = {
                "TransactionType": "NFTokenCreateOffer",
                "Account": senderWallet.classicAddress,
                "NFTokenID": senderNFTs[a].NFTokenID,
                "Destination": recipientWallet.classicAddress,
                "LastLedgerSequence": Number((checkedLedgerIndex + ((Date.now() - checkedledgerTime) / 3000) + 20).toFixed(0)),
                "Amount": "0",
                "Flags": 1,
                "Fee": fee,
                "Sequence": senderAccountSequence
            }

            var signedBuy = senderWallet.sign(prepared)
            var result = await xrplClient.submit(signedBuy.tx_blob)
            senderAccountSequence += 1
            console.log(`\tPlaced #${Number(a) +1} of ${senderNFTs.length} -> ${senderNFTs[a].NFTokenID}`)
        }

        //wait for current ledger to be validated before continuing (helps ensure transactions were processed)
        console.log(`Waiting for "current" Legder To Be "validated"`)
        var currentIndex = (await currentLedger(xrplClient, 'current'))[0]
        var validatedIndex = 0
        while(validatedIndex != currentIndex){
            await wait(1)
            var validatedIndex = (await currentLedger(xrplClient, "validated"))[0] - 1
        }
        console.log(`\tSuccess`)


        //find offer index and accept it from recipient 
        console.log(`Accepting Sell Offers From ${recipientWallet.classicAddress}`)
        for(a in senderNFTs){

            //find offer index
            try {
                var offersResult = await xrplClient.request({
                    "command": "nft_sell_offers",
                    "ledger_index": "validated",
                    "nft_id": senderNFTs[a].NFTokenID,
                    "limit": 400
                })
                var offers = offersResult.result.offers
            } catch (error) {
                var offers = []
            }

            var offerIndex = undefined
            for(b in offers){
                if(offers[b].destination != recipientWallet.classicAddress) continue
                if(offers[b].amount != '0') continue
                if(offers[b].owner != senderWallet.classicAddress) continue
                var offerIndex = offers[b].nft_offer_index
            }

            if(offerIndex == undefined) continue

            //set accept offer transaction
            var prepared = {
                "TransactionType": "NFTokenAcceptOffer",
                "Account": recipientWallet.classicAddress,
                "NFTokenSellOffer": offerIndex,
                "LastLedgerSequence": Number((checkedLedgerIndex + ((Date.now() - checkedledgerTime) / 3000) + 20).toFixed(0)),
                "Fee": fee,
                "Sequence": recipientAccountSequence
            }

            var signedBuy = recipientWallet.sign(prepared)
            var result = await xrplClient.submit(signedBuy.tx_blob)
            recipientAccountSequence += 1
            console.log(`\tAccepted #${Number(a) +1} of ${senderNFTs.length} -> ${senderNFTs[a].NFTokenID}`)
        }

        //wait for current ledger to be validated before continuing (helps ensure transactions were processed)
        console.log(`Waiting for "current" Legder To Be "validated"`)
        var currentIndex = (await currentLedger(xrplClient, 'current'))[0]
        var validatedIndex = 0
        while(validatedIndex != currentIndex){
            await wait(1)
            var validatedIndex = (await currentLedger(xrplClient, "validated"))[0] - 1
        }
        console.log(`\tSuccess`)
    }

    //PRINT FINAL RESULTS
    console.log(`\n\n<< FINALISING RESULTS >>`)
    var senderNFTs = await accountNFTs(xrplClient, senderWallet.classicAddress , "validated")
    console.log(`\n${senderWallet.classicAddress}\n\tRole: Sender\n\tHolds: ${senderNFTs.length} NFTokens`)
    var recipientNFTs = await accountNFTs(xrplClient, recipientWallet.classicAddress , "validated")
    console.log(`\n${recipientWallet.classicAddress}\n\tRole: Recipient\n\tHolds: ${recipientNFTs.length} NFTokens`)

    await xrplClient.disconnect()
    console.log(`\n\nThis open-source script was developed for free use by OnChain Markeplace\n\tForging a new era of trustless and open trading with NFTokens on the XRPL.\n\tBoasting NO trading fees, and low listing fees, OCM suits both projects and individuals\nVisit https://onchainmarketplace.net/ to learn more\n\tFeel free to contact us with any queries or concerns.`)
    console.log(`\n\nApplication Closing`)
}

main()