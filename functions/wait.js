
let wait = async function(seconds) {
var time = Number(seconds) * 1000
await new Promise(resolve => setTimeout(resolve, time));
}
module.exports = { wait };
