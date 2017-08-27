# Hold My Beer

### Installation

Requires a recent version of `postgresql`.

```
git clone https://github.com/vampiman/Hold-My-Beer.git
cd Hold-My-Beer
npm install
```

Create a database called `hmb`, then run `users-init.sql`, `challenges-init.sql`, `videos-init.sql` and `db-user-init.sql` found in the `database` folder. Create a file named `password` in the same directory that contains the password used in `db-user-init.sql` (default is dummypassword).

Optionally create a file named `secret` in the `database` folder with a secret value.

Create a 'morgan.log' document inside a 'logs' folder.

### Usage

Start up postgres (assuming a Linux server with systemd):
```
sudo systemctl start postgresql
```
Start up the server:
```
sudo CERTPATH="path/to/it" DB=true PORT=443 HTTPPORT=80 NODE_ENV=production node bin/www
```
`CERTPATH` must be a path to a folder and it must contain `privkey.pem`, `fullchain.pem` and `chain.pem`.
