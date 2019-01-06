const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');
const BlockChain = require('./BlockChain');
const Mempool = require('./Mempool');
const hex2ascii = require('hex2ascii');


/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize all your endpoints here
     * @param {*} app 
     */
    constructor(app) {
        this.mempool = new Mempool.Mempool();
        this.app = app;
        this.blocks = new BlockChain.Blockchain();
        this.initializeMockData();
        this.getBlockByIndex();
        this.requestValidation();
        this.validate();
        this.postNewBlock();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/api/block/:index"
     */
    getBlockByIndex() {
        this.app.get("/api/block/:index", (req, res) => {
            this.blocks.getBlock(req.params.index)
            .then(block => res.json(block))
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.app.post("/block", (req, res) => {
            const data = req.body;

            if( data.address && data.star && ! Array.isArray(data.star)) {
                if (this.mempool.isAddressValidated(data.address)) {
                    const body = {
                        address: data.address,
                        star: {
                              ra: data.star.ra,
                              dec: data.star.dec,
                              mag: data.star.mag,
                              cen: data.star.cen,
                              story: Buffer(data.star.story).toString('hex')
                              }       
                };
                this.blocks.addBlock(new BlockClass.Block(body))
                .then(addedBlock => {
                    const reply = JSON.parse(addedBlock);
                    reply.body.star.decodedStory = hex2ascii(reply.body.star.story);
                    res.json(reply);
                });
                    
                } else {
                    res.status(400).json({error: "address not validated"});
                }
            } else {
                res.status(400).json({error: "malformed request"});
            }
        });
    }

    /**
     * Implement a POST Endpoint to validate a  request, url: "/message-signature/validate"
     */
    validate() {
        this.app.post("/message-signature/validate", (req, res) => {
            const address = req.body.address;
            const signature = req.body.signature;
            
            if (address && signature) {
                const validationResult = this.mempool.validate(address, signature);    
                if(validationResult) {
                    res.json(validationResult);
                } else {
                    res.status(404).send(`No validation request found in memory pool. Please validate within ${this.mempool.getTimeOutInSeconds()} second(s) of your validation request`);
                }
            } else {
                res.status(400).send("Can't validate. Body must contain address and signature");
            }
        });
    }

    /**
     * Implement a POST Endpoint to add a new validation request, url: "/requestValidation"
     */
     requestValidation() {
        this.app.post("/requestValidation", (req, res) => {
            const address = req.body.address
            if (! address){
                res.status(400).send("Request must contain wallet address to establish your identity");
            } else {
                res.json(this.mempool.addValidationRequest(address));
            }
        });
    }

    /**
     * Helper method to initialize a Mock dataset. It adds 10 test blocks to the blocks array.
     */
    initializeMockData() {
        if(this.blocks.length === 0){
            for (let index = 0; index < 10; index++) {
                let blockAux = new BlockClass.Block(`Test Data #${index}`);
                blockAux.height = index;
                blockAux.hash = SHA256(JSON.stringify(blockAux)).toString();
                this.blocks.push(blockAux);
            }
        }
    }
}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}