const bitcoinMessage = require('bitcoinjs-message'); 

class Mempool {

    constructor() {
        this.REQUEST_TIMEOUT_IN_SECONDS = 5 * 60;
        this.mempool = {};
        this.timeoutRequests = {};
        this.mempoolValid = {};
    }

    isAddressValidated(address) {
        return this.mempoolValid.hasOwnProperty(address);
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

    _containsAddress(address) {
        return this.mempool[address] != undefined;
    }

    _getValidationRequestForAddress(address){
        return this.mempool[address];
    }

    validate(address, signature) {
        if (this._containsAddress(address)) {
            const validationRequest =  this._getValidationRequestForAddress(address);
            if (bitcoinMessage.verify(validationRequest.message, address, signature)) {
                this._removeTimeoutForAddress(address);
                const now = new Date().getTime().toString().slice(0,-3);
                const timeElapse = now - this.mempool[address].requestTimeStamp;
                const timeLeft = (this.REQUEST_TIMEOUT_IN_SECONDS) - timeElapse;
                this.mempoolValid[address] = {
                    "registerStar": true,
                    "status": {
                        "address": address,
                        "requestTimeStamp": validationRequest.requestTimeStamp,
                        "message": `${address}:${validationRequest.requestTimeStamp}:starRegistry`, 
                        "validationWindow": timeLeft,
                        "messageSignature": true
                    }
                };
                return this.mempoolValid[address]; 
            } else {
                return false
            }
        } else {
            return false;
        }
    }   

    getTimeOutInSeconds() {
        return this.REQUEST_TIMEOUT_IN_SECONDS;
    }
       
    _removeValidationRequest(address) {
        delete this.mempool[address];
        this._removeTimeoutForAddress(address);
    }

    _removeTimeoutForAddress(address) {
        clearTimeout(this.timeoutRequests[address])
    }
    
}


module.exports.Mempool = Mempool;