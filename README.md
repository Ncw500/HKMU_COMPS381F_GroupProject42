# COMP S381F Group Project
Project Topic : Music Playlist Management System  
Group No : 42  
Group Member ：  
- Lo Po Ming (13629178)
- Ng Chin Wa (13595298)
- Mok Tsz Lam (13557386)
- Yu Ho Ching Washington(13712631)


## 1. File and Folder Information
- server.js : As the main entry point of the application, it is responsible for managing routes and handling requests, returning the corresponding JSON format data objects based on user requests. This file integrates the core logic of the application, ensuring that different API requests are correctly routed to the appropriate handling functions and providing the necessary data responses to support dynamic interactions on the front-end interface.

- package.json : Include dependencises (7) :
    - nodeman
    - express
    - ejs
    - mongoose
    - express-session
    - express-formidable
    - fluent-ffmpeg
- public/* : ...
- views/* : ...
- models/* : 
    - audioModel.js : This file is used to generate an audio model, in which various attributes of the audio set are defined, including audio format, bit rate, duration, and volume parameters.
- lib/* : 
    - mongodbHandler.js : Used to define a series of methods for processing database query logic, aiming to simplify the process of data operations. These methods include functions for inserting, updating, deleting, and querying data, enabling developers to interact with the database efficiently.

## 2. Run Program Guidance
1. Install all dependencises :
```
npm install
```
2. Run the program :
```
npm run dev // run with nodeman
npm start // run normally
```

## 3. The Cloud-based Server
The program is deployed through the AWS Cloud Server Service (EC2), which makes the application highly scalable and flexible. By utilizing the virtual servers of EC2, the development team can quickly adjust computing resources according to demand, easily handling changes in traffic, whether by increasing or decreasing server instances. In addition, the security and reliability provided by AWS ensure that the application can run in a stable environment and guarantees the security and availability of data. Such a deployment method not only improves system performance but also reduces operating costs, providing greater flexibility for enterprises to respond to changes in market demand.

Project URL :

```
https://
```

## 4. Operation guides
Log in to the server, then create a new music file. Everyone will be able to see the music you have uploaded




