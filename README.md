# Wolkite University Institutional Research and Project Managment System
This is a research and project management software system tailored for the Research and Community Vice President's Office at Wolkite University (or generally for similar offices in Ethiopian universities).
The project was initiated by [Wolkite Univesity](https://www.wku.edu.et) in 2024.

## Required Tools
For system develoment: download and install Nodejs and MongoDB
- To start mongo db, you might use the following commands
```bash
# for linux 
sudo systemctl start mongod
# for windows open your terminal as administrator then
net start MongoDB
```

## How to clone
Install git on your windows or linux machine, and then configure your account credintials of your git and PAN, you may use these commands
```bash
git config username "yourusername" 
#or
git config --global user.name "yourusername" 
git config useremail "youremail"
#or
git config --global user.email "yourusername" 
#then clone this repo 
git clone https://github.com/amantamirat/wku_irpms_v1.git
# it will ask you to log in via browser or ask you to enter a password (PAN) for PAN use the one you recived.
```

## How to run
### Server 
Run the server which developed using NodeJS, but before running the server, make sure you create .env file inside the server_api folder, and paste or configure the associated variables (MONGO_URL, PORT,  EMAIL,..).
```bash
cd server_api
npm install
npm run dev
```
if ts-node-dev (for typescript compilation and excution) is not installed on your node enviroment install it using 
```bash
npm install -g ts-node-dev
```
### Client
The client or the frontend is developed using react, with next framework, and PrimeReact UI Library. 
```bash
cd web_app
npm install
npm run dev
# or if you want to excute the production version
npm run build
# then
npm run start
```
before running the client, make sure you create .env.local file inside the web_app folder, and paste or configure the associated variables (like NEXT_PUBLIC_API_URL).