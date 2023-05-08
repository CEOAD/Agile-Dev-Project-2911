import {v4 as uuidv4} from 'https://jspm.dev/uuid';

/**
 * Houses utility functions for the front-end application.
 */
class Utils {

    /**
     * Creates a UUID string.
     * @return {string}
     */
    static createUUID() {
        return `ID-${uuidv4()}`;
    }
}

export default Utils;
