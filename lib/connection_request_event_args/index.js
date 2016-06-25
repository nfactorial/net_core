'use strict';

const Connection = require('../connection');


/**
 * Contains the properties and methods that represents a connection attempt to the title.
 * Objects listening for the SessionServer.Events.CONNECTION_REQUEST event to be raised, will receive
 * an instance of this object describing the connection attempt.
 *
 * By default all connection attempts will be denied with a 'server full' error.
 *
 * For a connection attempt to complete successfully a system object must respond to this event by
 * invoking the allow() method explicitly.
 *
 * A connection may also be denied with an error other than 'server full' by calling the deny() method
 * and supplying the appropriate error.
 *
 * If a listener of connection event has no specific concern over whether the connection attempt succeeds
 * or fails, it should not call either of the allow() or deny() methods (at which point, consider whether
 * the object needs to listen to the connection event at all).
 *
 * When the connection event has finished processing, the framework will discard the connection
 * if no listener has explicitly allowed the connection to succeed or if the connection was explicitly
 * denied.
 */
class ConnectionRequestEventArgs {
    constructor() {
        this._isAllowed = false;
        this._isDenied = false;

        this.connection = null;
        this.error = {
            id: Connection.Errors.SERVER_FULL.id,
            msg: Connection.Errors.SERVER_FULL.msg
        };
    }

    /**
     * Prepares the ConnectEventArgs object for use by the title.
     * @param {Connection} connection - The Connection object representing the connection being broadcast.
     */
    initialize(connection) {
        if (!connection) {
            throw new Error('ConnectEventArgs.initialize - Connection object was null.');
        }

        this._isAllowed = false;
        this._isDenied = false;

        this.error.id = Connection.Errors.SERVER_FULL.id;
        this.error.msg = Connection.Errors.SERVER_FULL.msg;

        this.connection = connection;
    }

    /**
     * When called, marks the connection attempt as 'denied', the connection attempt will be closed
     * and removed from the session.
     *
     * @param {Object} err - The error associated with the reason for the denial.
     */
    deny(err) {
        if (!err) {
            throw new Error('ConnectEventArgs.deny - Invalid error code specified during connection attempt.');
        }

        this.error.id = err.id;
        this.error.msg = err.msg;
        this._isDenied = true;
    }

    /**
     * When called, marks the connection attempt as 'allowed', the connection attempt will be allowed
     * to progress past the initial validation stages into the game as long as no other system denies
     * the progress.
     */
    allow() {
        this._isAllowed = true;
    }

    /**
     * Determines whether or not the connection has been denied.
     * @returns {boolean} True if the connection has been explicitly denied otherwise false.
     */
    get isDenied() {
        return this._isDenied || !this._isAllowed;
    }

    /**
     * Determines whether or not the connection has been explicitly allowed.
     * @returns {boolean} True if the connection has been explicitly allowed otherwise false.
     */
    get isAllowed() {
        return this._isAllowed;
    }
}

module.exports = ConnectionRequestEventArgs;
