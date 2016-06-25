'use strict';

const CONNECTION_TIMEOUT = 1000 * 5;

/**
 * Represents a connection between the client and server.
 */
class Connection {

    /**
     * Prepares the Connection object for use by the server.
     * @param {SessionServer} sessionServer - The session server we belong to.
     * @param {Socket} socket - The socket we are to communicate with.
     */
    constructor(sessionServer, socket) {
        if (!sessionServer) {
            throw new Error('Cannot create connection without a valid session server object.');
        }

        if (!socket) {
            throw new Error('Cannot create connection without a valid socket.');
        }

        this.sessionServer = sessionServer;
        this.credentials = null;
        this.socket = socket;
        this.player = null;
        this.keepAlive = Date.now();

        socket.on('close', this._onSocketClosed.bind(this));
        socket.on('data', this._onReceiveData.bind(this));
    }

    /**
     * Disconnects from the client machine.
     * @param {Number} err - Error number specifying why the disconnect is happening.
     * @param {String} reason - Reason why the disconnect occurred.
     */
    disconnect(err) {
        // TODO: What if disconnect call comes from somewhere other than the session server, can we handle that?
        if (this.socket) {
            this.socket.close(err.id, err.msg);

            this.sessionServer = null;
            this.socket = null;
        }
    }

    /**
     * Sends a data packet to the client using this connection object.
     * @param {Object} data - The data representing the message to be sent.
     */
    send(data) {
        if (this.socket) {
            this.socket.write(data);
        }
    }

    /**
     * Determines whether or not the connection should be considered alive.
     * @returns {boolean} True if the connection should be considered alive, otherwise false.
     */
    isAlive() {
        return (this.socket && (Date.now() - this.keepAlive) < CONNECTION_TIMEOUT );
    }

    /**
     * Internal method invoked when we receive data from the client connection.
     * @param {Object} msg - The data that was received from the client.
     * @private
     */
    _onReceiveData(/* msg */) {
        console.log('received message from client.');
    }

    /**
     * Internal method invoked when our socket connection has been closed.
     * @private
     */
    _onSocketClosed() {
        this.socket = null;

        if (this.sessionServer) {
            this.sessionServer.removeConnection(this);
        }
    }
}

Connection.Errors = {
    SERVER_FULL: { id: 100, msg: 'Server Full' },
    SESSION_TERMINATED: {id: 101, msg: 'Session Terminated'}
};


module.exports = Connection;
