'use strict';

module.exports = function isFunction(func) {
    if (Object.prototype.toString.call(func) !== '[object Function]') {
        return false;
    }

    return true;
};
