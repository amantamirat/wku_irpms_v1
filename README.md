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

## Mongo 4.4 Database Setup

### 1. MongoDB Replica Set Setup (Manual)
The system requires a Replica Set to handle Transactions. Since this setup uses the standalone binaries:

1.  **Create Data Directory:**
    ```powershell
    mkdir C:\data\db
    ```
2.  **Start the Database:**
    Navigate to your MongoDB `bin` folder and run:
    ```powershell
    mongod.exe --replSet "rs0" --dbpath "C:\data\db"
    ```
    *(Keep this terminal open while using the system)*

3.  **Initialize (First time only):**
    In a new terminal, run `mongo.exe` and execute:
    ```javascript
    rs.initiate()
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

## Project Components
Components belong to a project and can be reused across any of its phases. Component contributors are selected from project collaborators; the PI is excluded. Phase activities are assigned to a project component, so one component may have activities in several phases.

For databases created by an earlier component-workflow version, back up the database and run the non-destructive migration from `server_api`:
```bash
PROJECT_COMPONENT_MIGRATION_CONFIRM=YES npx ts-node src/scripts/migrate-phase-components-to-project-components.ts
```
The script copies legacy `phasecomponents` records into `projectcomponents`, derives each component's project through its old phase reference, preserves component IDs used by activities, and leaves the original collection unchanged. Test on a staging restore before migrating a live database.