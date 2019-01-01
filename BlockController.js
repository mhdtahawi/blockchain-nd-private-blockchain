const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');
const BlockChain = require('./BlockChain');
const Mempool = require('./Mempool');


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
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
    postNewBlock() {
        this.app.post("/api/block", (req, res) => {
            const data = req.body.body;
            if (data){
                this.blocks.addBlock(new BlockClass.Block(data))
                    .then(addedBlock => res.json(JSON.parse(addedBlock)));
            } else {
                res.status(400).send("Can't create a block without data");
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