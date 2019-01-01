
class Mempool {

    constructor() {
        this.REQUEST_TIMEOUT_IN_SECONDS = 0.1 * 60;
        this.mempool = {};
        this.timeoutRequests = {};
    }
    
    addValidationRequest(address) {
        const now = new Date().getTime().toString().slice(0,-3);
        if (this.mempool[address]) {
            let timeElapse = now - this.mempool[address].requestTimeStamp;
            let timeLeft = (this.REQUEST_TIMEOUT_IN_SECONDS) - timeElapse;
            this.mempool[address].validationWindow = timeLeft;
            return this.mempool[address];
        } else {
            const timestamp = now;
            const validationRequest = {
                "walletAddress": address,
                "requestTimeStamp": timestamp,
                "message": `${address}:${timestamp}:starRegistry`,
                "validationWindow": this.REQUEST_TIMEOUT_IN_SECONDS
            }
            this.mempool[address] = validationRequest;
            this.timeoutRequests[address] = setTimeout( () => this._removeValidationRequest(address), this.REQUEST_TIMEOUT_IN_SECONDS * 1000);
            return validationRequest;
        }
    }
       
    _removeValidationRequest(address) {
        delete this.mempool[address];
        delete this.timeoutRequests[address];
    }
    
}


module.exports.Mempool = Mempool;