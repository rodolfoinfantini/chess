# Chess!

## Vanilla JS Chess with Stockfish and MULTIPLAYER!

[Click here to Play it!](https://chess.rodolfoi.tech/)
<br>
Made with vanilla JavaScript, using socket.io, Node JS, MySQL and [Stockfish.js](https://github.com/nmrugg/stockfish.js/).
<br>

## Summary
1. [Demo](#demo)
2. [Run locally](#run-locally)
3. [Rules](#rules)
4. [Draw](#draw)
5. [Game modes](#game-modes)
6. [Multiplayer](#multiplayer)
7. [Puzzles](#puzzles)
8. [Settings](#settings)
9. [Login and Register](#login-and-register)

### Demo:

[![Watch the video](screenshots/video.png)](https://youtu.be/3foDjZ4LCQM)

### Run locally:

- You can run it without Docker using node 16 (It **MUST** be 16) providing the environment variables in the `.env` file. But it is easier to run with the Dockerfile and docker compose:

1. Build the docker image:

```
docker build . -t chess
```

2. Create a `docker-compose.yml` file (define the correct environment variables):
* You can tweak this file to use a MySql container too, this example will use an external MySql server.

```
version: '3'

services:
    chess:
        image: chess
        network_mode: 'host'
        environment:
            PORT: 3000
            MYSQL_HOST: host #choose a valid MySql server
            MYSQL_USER: user
            MYSQL_PASSWORD: password
            MYSQL_DB: database
            DEBUG: false #print the stockfish debug logs
            EMAIL_USER: user@outlook.com #it must be an outlook email
            EMAIL_PASS: password #the outlook email password
```

3. Run the container:
    1. Keep attached:
    ```
    docker compose up
    ```

    2. Run in background:
    ```
    docker compose up -d
    ```

4. Stop the container:

```
docker compose down
```

5. Now, if you want to update the running container just do (no need to execute the last steps anymore):

```
npm run deploy
```

* It will stop the container, rebuild the image and start the container again.

### Rules:

-   Pieces movement
-   Check and checkmate
-   En passant
-   Castling
-   Pawn promotion

#### Draw:

-   By repetition
-   Fifty move
-   Stalemate

![Checkmate Screenshot](/screenshots/checkmate.png)

### Game modes:

-   Play over the board
-   Play against the [Stockfish](https://github.com/nmrugg/stockfish.js/) Engine
-   Stockfish against itself
-   Create a MULTIPLAYER room to play with your friends!
    ![Game mode Screenshot](/screenshots/gamemode.png)

### Multiplayer:

- Create and Join Multiplayer Games:

![Create Game Screenshot](/screenshots/creategame.png)
![Join Game Screenshot](/screenshots/joingame.png)

### Puzzles:

-   300,000 puzzles
-   Filter by rating and theme
    ![Puzzle Screenshot](/screenshots/puzzle.png)

### Settings:

-   Configure piece animation speed
-   Set the visibility of the moves indicators
-   Select between 26 board themes
-   Select between 22 pieces skins
    ![Settings Screenshot](/screenshots/preferences.png)

### Login and Register:

![Login Screenshot](/screenshots/signin.png)
![Register Screenshot](/screenshots/register.png)

