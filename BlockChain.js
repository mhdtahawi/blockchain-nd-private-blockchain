/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {
    
    constructor() {
        this.bd = new LevelSandbox.LevelSandbox();
        this.generateGenesisBlock();
    }
    
    // Auxiliar method to create a Genesis Block (always with height= 0)
    // You have two options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block
    generateGenesisBlock(){
        return this.getBlockHeight()
        .then(count => {
            if (count == -1) {
                const newBlock = new Block.Block("First block in the chain - Genesis block")
                // Block height
                newBlock.height = 0;
                // UTC timestamp
                newBlock.time = new Date().getTime().toString().slice(0,-3);                
                // Block hash with SHA256 using newBlock and converting to a string
                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                // Adding block object to chain
                return this.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock));
            }
        })
    }
    
    // Get block height, it is auxiliar method that return the height of the blockchain
    getBlockHeight() {
        return this.bd.getBlocksCount().then( count => count - 1); 
    }
    
    // Add new block
    addBlock(block) {
        return this.getBlockHeight()
            .then(count => {
                return this.getBlock(count)
                    .then(latestBlock => {
                        block.height = latestBlock.height + 1;
                        block.previousBlockHash = latestBlock.hash;
                        block.hash = SHA256(JSON.stringify(block)).toString();
                        return this.bd.addLevelDBData(block.height, JSON.stringify(block));
                    })
            })
    }
    
    // Get Block By Height
    getBlock(height) {
        return this.bd.getLevelDBData(height)
            .then(block => {
                return JSON.parse(block);
            });
    }

    // Get Block By hash
    getBlockByHash(hash) {
        return this.bd.getBlockByHash(hash)
            .then(block => block )
    }

    // Get Blocks By address
    getBlocskByAddress(address) {
    return this.bd.getBlocksByAddress(address);
    }
    
    // Validate if Block is being tampered by Block Height
    validateBlock(height) {
        return this.getBlock(height)
        .then (block => this._validateBLock(block));
    }

_validateBLock(block) {
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash===validBlockHash) {
        return true;
    } else {
        console.log('Block #'+block.height+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
        return false;
    }
}
    
    // Validate Blockchain
    validateChain() {
        return this.getBlockHeight()
        .then (count => {
            const accumelator = {
                errorLog: [],
                previousHash: undefined 
            };
            return [... Array(count  + 1)].map( ( _, i ) => i) // fill array with numbers from 0 to count - 1
                    .reduce( (accumleator, height) => {
                        return accumleator.then( acc => {
                            return this.getBlock(height).then(block => {
                                const previousHash = acc.previousHash;
                                acc.previousHash = block.hash;
                                const isValid = this._validateBLock(block) && (!previousHash || previousHash === block.previousBlockHash)
                                if (! isValid) {
                                    acc.errorLog.push(height);
                                } 
                                return acc;
                            })
                        })
                    }, Promise.resolve(accumelator));
        })
        .then (result =>{
            const log = result.errorLog;
            if (log.length > 0) {
                console.log('Block errors = ' + log.length);
                console.log('Blocks: '+ log);
              } else {
                console.log('No errors detected');
              }
              return log;
        })
    }
    
    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }
    
}

module.exports.Blockchain = Blockchain;
