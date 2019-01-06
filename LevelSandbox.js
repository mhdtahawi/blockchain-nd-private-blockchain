/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

class LevelSandbox {
    
    constructor() {
        this.db = level(chainDB);
    }
    
    // Get data from levelDB with key (Promise)
    getLevelDBData(key){
        let self = this;
        return new Promise(function(resolve, reject) {
            self.db.get(key, (err, value) => {
                if(err){
                    if (err.type == 'NotFoundError') {
                        resolve(undefined);
                    }else {
                        console.log('Block ' + key + ' get failed', err);
                        reject(err);
                    }
                }else {
                    resolve(value);
                }
            });
        });
    }

    getBlockByHash(hash) {
        let self = this;
        let block;
        return new Promise(function(resolve, reject) {
            self.db.createReadStream()
            .on('data', function (data) {
                if(JSON.parse(data.value).hash == hash){
                    block = data.value;
                }
            })
            .on('error', function (err) {
                // reject with error
                reject(err);
            })
            .on('close', function () {
                //resolve with the count value
                resolve(block);
            });
        });

    }

    getBlocksByAddress(address) {
        let self = this;
        let blocks = [];
        return new Promise(function(resolve, reject) {
            self.db.createReadStream()
            .on('data', function (data) {
                if(JSON.parse(data.value).body.address == address){
                    blocks.push(data.value)
                }
            })
            .on('error', function (err) {
                // reject with error
                reject(err);
            })
            .on('close', function () {
                //resolve with the count value
                resolve(blocks);
            });
        });

    }
    
    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.db.put(key, value, function(err) {
                if (err) {
                    console.log('Block ' + key + ' submission failed', err);
                    reject(err);
                }
                resolve(value);
            });
        });
    }
    
    // Method that return the height
    getBlocksCount() {
        let self = this;
        let i = 0;
        return new Promise(function(resolve, reject) {
            self.db.createReadStream()
            .on('data', function (data) {
                // Count each object inserted
                i++;
            })
            .on('error', function (err) {
                // reject with error
                reject(err);
            })
            .on('close', function () {
                //resolve with the count value
                resolve(i);
            });
        });   
    }      
}

module.exports.LevelSandbox = LevelSandbox;