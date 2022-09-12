# Bulk-NFToken-Transfer-XRPL
 This simple script will bulk transfer all NFTokens (xls-20 standard) from one XRPL account to another, in a secure manner.
 Due to the features within the xls-20 standard, NFTokens cannot be simply 'transfered' or 'sent' between 2 accounts. Rather a 'trade' must occur.

 ### Overview
 The script issues a "Sell Offer" from the defined account, but issuers it with the defined recipient account as the destination.
 This means that any offers can NOT be sniped or intercepted by an unintended third party. 
 The script issues all orders at 0 $XRP, meaning that no value will be transferred between the accounts other (other than transaction fees being burnt).
 The ONLY file that needs to be edited (if utlising this script as is), is the `config.json` and possibly `arrayTokenIDs.json` files.
 The script will also clear/remove any trailing/missed offers on the transferred NFTokens, to ensure excess $XRP is not reserved by either accounts.

 ### Configuring the Script
 ##### Configuration File
 *This is the details to be configured in `config.json`*
 ```
 {
    "nodes": [  "wss://xls20-sandbox.rippletest.net:51233" ],
    "senderSeed": "sEXAMPLESEED",
    "recipientSeed": "sEXAMPLESEED",
    "amountToTransfer": 200,
    "fee": "20",
    "transferAll": true
}
 ```
 1. **nodes** -> An array of websocket connections to the XRPL. The order determines the sequence in which attempts to connect are made. Public XRPL websockets can be found [here](https://xrpl.org/public-servers.html#public-servers).
 2. **senderSeed** -> This should be the family seed of the account from which NFTokens will be transferred FROM.
 3. **recipientSeed** -> This should be the family seed of the account to which NFTokens will be transferred TO.
 4. **amountToTransfer** -> A number that describes how many NFTokens to be transferred in each cycle. To prevent wasted time/errors, a number between 200 and 400 is recommended.
 5. **fee** -> A WHOLE number represented as a STRING. Determines how many drops will be burnt in each transaction (1 drop = 0.000001 $XRP).
 6. **transferAll** -> A boolean figure. If ***TRUE***, the script will transfer ALL NFTokens from the *sender* to the *recipient*. If ***FALSE***, the script will ONLY transfer the defined NFTokens in the `arrayTokenIDs.json` file.

 ##### Defined Tokens to Transfer File
 *This is the details to be configured in `arrayTokenIDs.json`*
 ```
 [
    "00080000C030302B96AF4535D488B846166EB6822BBF146E0B03651200000576",
    "00080000C030302B96AF4535D488B846166EB6822BBF146E0AE8F41A00000C7E"
 ]
 ```
 This array should contain every ID of the NFTokens that you will to transfer. 
 If **transferAll** is defined as ***FALSE*** (in `config.json`), the script will not interact in any way with NFTokens not defined in this file.
 All IDs should be seperated as an individual element.

 ### Extra
 This software was developed for free use by [OnChain Marketplace](https://onchainmarketplace.net/). 
 OCM boasts the most decentralised and open NFToken Marketplace on the XRPL, and has the lowest known fee for interacting and trading.
 Feel free to vist [OCM](https://onchainmarketplace.net/), and experience a new era of NFToken trading.

 To learn more about the XRPL visit .
 To learn specifics about NFToken trading on the XRPL, visit [here](https://xrpl.org/nftokencreateoffer.html#nftokencreateoffer).

 ### Dependencies
 This script utilises npm packages.
 [xrpl](https://www.npmjs.com/package/xrpl)