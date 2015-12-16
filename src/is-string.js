'use strict';

module.exports = function isString(str) {
    if (Object.prototype.toString.call(str) !== '[object String]') {
        return false;
    }

    return true;
};
