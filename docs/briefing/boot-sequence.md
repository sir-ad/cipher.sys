# BOOT SEQUENCE

Initialize the daemon on your local hardware.

## PREREQUISITES

* Node.js v18+ 
* A Chromium or WebKit based terminal (Browser)
* <span class="redacted">Clearance Level 4</span>

## DEPLOYMENT

Execute the following commands in your host terminal to download and compile the assets:

```bash
git clone https://github.com/your-username/cipher-terminal.git
cd cipher-terminal
npm install
```

## IGNITION

To launch with deterministic bootstrap (stop old instance -> clean runtime -> start fresh daemon -> open browser):

```bash
cipher up
```

`cipher` with no args also maps to `cipher up`.

!!! warning "DAEMON BEHAVIOR"
    The server process detaches from your terminal window immediately. Closing your console **will not** stop the server. Use `cipher stop` to terminate and clean runtime artifacts.

## CONTROL COMMANDS

```bash
cipher status
cipher open
cipher mcp start
```

## NETWORK DISCOVERY

By default, the daemon binds to `http://localhost:4040`. 

If deploying on a secure local subnet, mDNS is broadcasted as `cipher.local`. Operatives on mobile devices connected to the same subnet can utilize the "IP OVERRIDE" protocol in the UI to sync.
