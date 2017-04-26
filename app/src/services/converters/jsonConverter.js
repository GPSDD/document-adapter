const logger = require('logger');
const JSONStream = require('JSONStream');
const fs = require('fs');
const randomstring = require('randomstring');
const DownloadService = require('services/downloadService');
const FileNotFound = require('errors/fileNotFound');

class JSONConverter {
    constructor(url, dataPath) {
        logger.debug(`Creating jsonConverter with url ${url} and dataPath ${dataPath}`);
        this.dataPath = dataPath ? dataPath + '.*' : '*';
        this.checkURL = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i');
        this.url = url;
    }

    * init() {
        if (this.checkURL.test(this.url))  {
            logger.debug('Is a url. Downloading file in url ', this.url);
            this.filePath = yield DownloadService.downloadFile(this.url, randomstring.generate() + '.json');
            logger.debug('Temporal path ', this.filePath);
        } else {
            this.filePath = this.url;
        }
    }

    serialize() {
        if (!fs.existsSync(this.filePath)) {
            throw new FileNotFound(`File ${this.filePath} does not exist`);
        }
        const readStream = fs.createReadStream(this.filePath)
            .pipe(JSONStream.parse(this.dataPath));
        readStream.on('end', () => {
            if (fs.existsSync(this.filePath)) {
                logger.info('Removing file');
                fs.unlinkSync(this.filePath);
            }
        });

        return readStream;
    }
}

module.exports = JSONConverter;
