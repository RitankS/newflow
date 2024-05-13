const express = require('express');
const app = express();


const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('products api running new deploy');
});

app.get('/ping', (req, res) => {
    res.send('PONG')
});

app.listen(8080, () => {
    console.log('Server is listenin on PORT :' + PORT);
})