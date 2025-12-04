Nexus MVP: P2P Folder Sync

Nexus is a peer-to-peer synchronization tool built on the Pear runtime. It allows you to mirror a folder from one computer to another over the internet without using central servers or cloud storage.

Prerequisites

Before running Nexus, ensure you have the following installed:

Node.js & NPM: Download here

Pear Runtime (Global):

npm install -g pear


Installation

Clone this repository or navigate to your project folder.

Install the dependencies:

npm install


Usage

Nexus runs in two modes: Host (Source) and Client (Destination).

1. Start the Host (Source)

The Host watches a local folder and makes it available to the P2P network.

pear run . -- --mode=host --dir=./my-source-folder


Output: The terminal will display a Drive Key (a long hexadecimal string). Copy this key; you will need it to connect the client.

Behavior: Any file added, modified, or deleted in ./my-source-folder will be automatically uploaded to connected peers.

2. Start the Client (Destination)

The Client connects to the Host using the Drive Key and downloads changes to a local folder.

pear run . -- --mode=client --dir=./my-dest-folder --key=<PASTE_DRIVE_KEY_HERE>


Behavior: The application will connect to the Host and immediately sync ./my-dest-folder to match the Host's folder. It keeps running to download future changes in real-time.

Command Line Arguments

Flag

Description

Default

Required

--mode

Operation mode: host or client.

host

No

--dir

The local folder path to sync.

./nexus-sync

No

--key

The P2P Drive Key (only for Client mode).

null

Yes (Client)

Example Workflow

Terminal A (Host):

mkdir files-a
pear run . -- --mode=host --dir=./files-a
# Copy the key: a1b2c3...


Terminal B (Client):

mkdir files-b
pear run . -- --mode=client --dir=./files-b --key=a1b2c3...


Test: Create a file in files-a. Watch it appear in files-b instantly.